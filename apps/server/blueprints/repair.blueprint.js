import { ALLOWED_TRANSITIONS } from "@repo/validators";

const transitionHandlers = {
    'received->in-progress': {
        before: async (repair) => {
            if (!repair.technician) {
                throw { status: 400, message: 'Technician must be assigned before starting repair' };
            }
        },
        during: async (repair) => {},
        after:  async (repair) => { /* notify technician */ }
    },
    'received->cancelled': {
        before: async (repair) => {},
        during: async (repair) => {
            repair.paymentStatus = 'waived';
        },
        after:  async (repair) => { /* notify customer */ }
    },
    'in-progress->ready': {
        before: async (repair) => {},
        during: async (repair) => {},
        after:  async (repair) => { /* notify customer device is ready */ }
    },
    'in-progress->not-repairable': {
        before: async (repair) => {},
        during: async (repair) => {
            repair.serviceCharge = 0;
            repair.paymentStatus = 'waived';
        },
        after:  async (repair) => { /* notify customer */ }
    },
    'in-progress->cancelled': {
        before: async (repair) => {},
        during: async (repair) => {
            repair.paymentStatus = 'waived';
        },
        after:  async (repair) => { /* notify customer */ }
    },
};

export const transitionRepairStatus = async (repair, newStatus) => {
    if (!ALLOWED_TRANSITIONS[repair.status].includes(newStatus)) {
        throw createError(400, `Cannot transition from '${repair.status}' to '${newStatus}'`);
    }

    const handler = transitionHandlers[`${repair.status}->${newStatus}`];

    if (handler?.before) await handler.before(repair);
    repair.status = newStatus;
    if (handler?.during) await handler.during(repair);
    await repair.save();
    if (handler?.after) await handler.after(repair);

    return repair;
};