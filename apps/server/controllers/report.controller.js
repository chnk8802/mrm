import Repair from '../models/repair.model.js';
import Payment from '../models/payment.model.js';
import { reportQuerySchema } from '@repo/validators';

const TECHNICIAN_SPLIT_RATE = 0.5; // 50/50 — revisit when per-technician rates are needed
const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

/**
 * @desc    "Owed to Me" report — finished (picked-up) repairs in a date range,
 *          regardless of payment status. Tells you total expected earnings.
 * @route   GET /api/reports/owed
 * @access  Private (Manager and above)
 */
export const getOwedReport = async (req, res, next) => {
    try {
        const { fromDate, toDate, technician } = reportQuerySchema.parse(req.query);

        const match = { isDeleted: false, isPickedUp: true };
        if (fromDate || toDate) {
            match.pickedUpAt = {};
            if (fromDate) match.pickedUpAt.$gte = fromDate;
            if (toDate) {
                const endOfDay = new Date(toDate);
                endOfDay.setHours(23, 59, 59, 999);
                match.pickedUpAt.$lte = endOfDay;
            }
        }
        if (technician) match.technician = technician;

        const repairs = await Repair.find(match)
            .populate('technician', 'name')
            .populate('sparePartUsage')
            .lean();

        const rows = repairs.map((repair) => {
            const netAmount = (repair.serviceCharge || 0) - (repair.discount || 0);
            const partCost = (repair.sparePartUsage || []).reduce(
                (sum, p) => sum + (p.unitCost || 0) * (p.quantity || 1),
                0
            );
            const grossMargin = netAmount - partCost;
            const technicianSplit = grossMargin * TECHNICIAN_SPLIT_RATE;
            const yourShare = grossMargin - technicianSplit;

            return {
                repairId: repair.repairId,
                technician: repair.technician ? { id: repair.technician._id, name: repair.technician.name } : null,
                pickedUpAt: repair.pickedUpAt,
                serviceCharge: round2(repair.serviceCharge || 0),
                discount: round2(repair.discount || 0),
                netAmount: round2(netAmount),
                partCost: round2(partCost),
                grossMargin: round2(grossMargin),
                technicianSplit: round2(technicianSplit),
                yourShare: round2(yourShare),
            };
        });

        // Group by technician
        const byTechnician = {};
        for (const row of rows) {
            const key = row.technician?.id?.toString() || 'unassigned';
            const label = row.technician?.name || 'Unassigned';
            if (!byTechnician[key]) {
                byTechnician[key] = {
                    technician: label,
                    netAmount: 0,
                    partCost: 0,
                    grossMargin: 0,
                    technicianSplit: 0,
                    yourShare: 0,
                    count: 0,
                };
            }
            byTechnician[key].netAmount += row.netAmount;
            byTechnician[key].partCost += row.partCost;
            byTechnician[key].grossMargin += row.grossMargin;
            byTechnician[key].technicianSplit += row.technicianSplit;
            byTechnician[key].yourShare += row.yourShare;
            byTechnician[key].count += 1;
        }
        for (const group of Object.values(byTechnician)) {
            group.netAmount = round2(group.netAmount);
            group.partCost = round2(group.partCost);
            group.grossMargin = round2(group.grossMargin);
            group.technicianSplit = round2(group.technicianSplit);
            group.yourShare = round2(group.yourShare);
        }

        const totals = rows.reduce((acc, row) => {
            acc.netAmount += row.netAmount;
            acc.partCost += row.partCost;
            acc.grossMargin += row.grossMargin;
            acc.technicianSplit += row.technicianSplit;
            acc.yourShare += row.yourShare;
            return acc;
        }, { netAmount: 0, partCost: 0, grossMargin: 0, technicianSplit: 0, yourShare: 0 });

        totals.netAmount = round2(totals.netAmount);
        totals.partCost = round2(totals.partCost);
        totals.grossMargin = round2(totals.grossMargin);
        totals.technicianSplit = round2(totals.technicianSplit);
        totals.yourShare = round2(totals.yourShare);

        res.json({
            success: true,
            data: {
                rows,
                byTechnician: Object.values(byTechnician),
                totals,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    "Actually Collected" report — every receivable payment line item
 *          paid within a date range. Tells you real cash in hand and what's
 *          due to technicians for that cash, proportional to what was paid.
 * @route   GET /api/reports/collected
 * @access  Private (Manager and above)
 */
export const getCollectedReport = async (req, res, next) => {
    try {
        const { fromDate, toDate, technician } = reportQuerySchema.parse(req.query);

        const match = { isDeleted: false, type: 'receivable' };
        if (fromDate || toDate) {
            match.paidAt = {};
            if (fromDate) match.paidAt.$gte = fromDate;
            if (toDate) {
                const endOfDay = new Date(toDate);
                endOfDay.setHours(23, 59, 59, 999);
                match.paidAt.$lte = endOfDay;
            }
        }

        const payments = await Payment.find(match)
            .populate({
                path: 'lineItems.repair',
                select: 'repairId technician serviceCharge discount sparePartUsage',
                populate: [
                    { path: 'technician', select: 'name' },
                    { path: 'sparePartUsage' },
                ],
            })
            .lean();

        const rows = [];

        for (const payment of payments) {
            for (const item of payment.lineItems) {
                const repair = item.repair;
                if (!repair) continue; // payable-only safety, shouldn't happen given match.type

                if (technician && repair.technician?._id?.toString() !== technician) continue;

                const netAmount = (repair.serviceCharge || 0) - (repair.discount || 0);
                const partCost = (repair.sparePartUsage || []).reduce(
                    (sum, p) => sum + (p.unitCost || 0) * (p.quantity || 1),
                    0
                );

                const proportion = netAmount > 0 ? item.amountPaid / netAmount : 0;
                const slicePartCost = partCost * proportion;
                const sliceGrossMargin = item.amountPaid - slicePartCost;
                const technicianSplit = sliceGrossMargin * TECHNICIAN_SPLIT_RATE;
                const yourShare = sliceGrossMargin - technicianSplit;

                rows.push({
                    repairId: repair.repairId,
                    technician: repair.technician ? { id: repair.technician._id, name: repair.technician.name } : null,
                    paidAt: payment.paidAt,
                    amountPaid: round2(item.amountPaid),
                    partCost: round2(slicePartCost),
                    grossMargin: round2(sliceGrossMargin),
                    technicianSplit: round2(technicianSplit),
                    yourShare: round2(yourShare),
                });
            }
        }

        const byTechnician = {};
        for (const row of rows) {
            const key = row.technician?.id?.toString() || 'unassigned';
            const label = row.technician?.name || 'Unassigned';
            if (!byTechnician[key]) {
                byTechnician[key] = {
                    technician: label,
                    amountPaid: 0,
                    partCost: 0,
                    grossMargin: 0,
                    technicianSplit: 0,
                    yourShare: 0,
                    count: 0,
                };
            }
            byTechnician[key].amountPaid += row.amountPaid;
            byTechnician[key].partCost += row.partCost;
            byTechnician[key].grossMargin += row.grossMargin;
            byTechnician[key].technicianSplit += row.technicianSplit;
            byTechnician[key].yourShare += row.yourShare;
            byTechnician[key].count += 1;
        }
        for (const group of Object.values(byTechnician)) {
            group.amountPaid = round2(group.amountPaid);
            group.partCost = round2(group.partCost);
            group.grossMargin = round2(group.grossMargin);
            group.technicianSplit = round2(group.technicianSplit);
            group.yourShare = round2(group.yourShare);
        }

        const totals = rows.reduce((acc, row) => {
            acc.amountPaid += row.amountPaid;
            acc.partCost += row.partCost;
            acc.grossMargin += row.grossMargin;
            acc.technicianSplit += row.technicianSplit;
            acc.yourShare += row.yourShare;
            return acc;
        }, { amountPaid: 0, partCost: 0, grossMargin: 0, technicianSplit: 0, yourShare: 0 });

        totals.amountPaid = round2(totals.amountPaid);
        totals.partCost = round2(totals.partCost);
        totals.grossMargin = round2(totals.grossMargin);
        totals.technicianSplit = round2(totals.technicianSplit);
        totals.yourShare = round2(totals.yourShare);

        res.json({
            success: true,
            data: {
                rows,
                byTechnician: Object.values(byTechnician),
                totals,
            },
        });
    } catch (error) {
        next(error);
    }
};