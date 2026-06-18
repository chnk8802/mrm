import { useState, useEffect, useCallback } from 'react';
import { ArrowDownLeft, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';
import reportService from '@/api/reportService';
import userService from '@/api/userService';
import { AsyncCombobox } from '@/components/AsyncComboBox';
import DateRangePicker from '@/components/common/DateRangePicker';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })
    .format(amount ?? 0);

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

const startOfMonth = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
};

const fetchTechnicians = async (search) => {
  const res = await userService.getUsers({ role: 'staff', search, limit: 5, isActive: true });
  return (res.data || []).map((t) => ({ value: t._id, label: t.name }));
};

const REPORT_TYPES = [
  { value: 'owed', label: 'Owed to Me', icon: ArrowDownLeft },
  { value: 'collected', label: 'Actually Collected', icon: Wallet },
];

// ─── SummaryCard ──────────────────────────────────────────────────────────────

const SummaryCard = ({ label, value, emphasis = false }) => (
  <div className={`rounded-lg p-3.5 ${emphasis ? 'bg-primary/10' : 'bg-muted/40'}`}>
    <p className="text-xs text-muted-foreground mb-1.5">{label}</p>
    <p className={`text-lg font-semibold ${emphasis ? 'text-primary' : 'text-foreground'}`}>
      {formatCurrency(value)}
    </p>
  </div>
);

// ─── Reports ──────────────────────────────────────────────────────────────────

const Reports = () => {
  const [reportType, setReportType] = useState('owed');
  const [fromDate, setFromDate] = useState(startOfMonth());
  const [toDate, setToDate] = useState(new Date());
  const [technicianId, setTechnicianId] = useState('');

  const [data, setData] = useState({ rows: [], byTechnician: [], totals: {} });
  const [loading, setLoading] = useState(true);

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        fromDate: fromDate.toISOString().split('T')[0],
        toDate: toDate.toISOString().split('T')[0],
        ...(technicianId ? { technician: technicianId } : {}),
      };
      const response = reportType === 'owed'
        ? await reportService.getOwedReport(params)
        : await reportService.getCollectedReport(params);
      setData(response.data);
    } catch (err) {
      const errorData = err.response?.data;
      if (errorData?.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
        toast.error(errorData.errors[0].message);
      } else {
        toast.error(errorData?.message || 'Failed to fetch report');
      }
    } finally {
      setLoading(false);
    }
  }, [reportType, fromDate, toDate, technicianId]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const isOwed = reportType === 'owed';
  const { rows = [], byTechnician = [], totals = {} } = data;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4 p-4 pb-20 md:pb-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold text-foreground">Reports</h1>
      </div>

      {/* ── Type toggle ── */}
      <div className="flex gap-2">
        {REPORT_TYPES.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => setReportType(value)}
            className={`flex items-center justify-center gap-1.5 h-9 px-4 rounded-md border text-sm font-medium transition-colors ${reportType === value
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:bg-muted/50'
              }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Filters ── */}
      <Card className="border-border shadow-none">
        <CardContent className="p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Filters
          </p>
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <DateRangePicker
              fromDate={fromDate}
              toDate={toDate}
              onFromChange={setFromDate}
              onToChange={setToDate}
            />

            <div className="flex flex-col gap-1.5 w-full sm:w-56">
              <Label className="text-xs font-medium text-muted-foreground">Technician</Label>
              <AsyncCombobox
                value={technicianId}
                onChange={setTechnicianId}
                fetchOptions={fetchTechnicians}
                placeholder="All technicians"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Summary ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <SummaryCard
          label={isOwed ? 'Net amount' : 'Amount collected'}
          value={isOwed ? totals.netAmount : totals.amountPaid}
        />
        <SummaryCard label="Owed to suppliers" value={totals.partCost} />
        <SummaryCard label="Gross margin" value={totals.grossMargin} />
        <SummaryCard label="Technician split" value={totals.technicianSplit} />
        <SummaryCard label="Your share" value={totals.yourShare} emphasis />
      </div>

      {/* ── By Technician ── */}
      <Card className="border-border shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">By technician</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground whitespace-nowrap">Technician</th>
                  <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground whitespace-nowrap">Jobs</th>
                  <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground whitespace-nowrap">Gross margin</th>
                  <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground whitespace-nowrap">Tech split</th>
                  <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground whitespace-nowrap">Your share</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" className="text-center py-10 text-sm text-muted-foreground">Loading...</td></tr>
                ) : byTechnician.length === 0 ? (
                  <tr><td colSpan="5" className="text-center py-10 text-sm text-muted-foreground">No data for this range</td></tr>
                ) : (
                  byTechnician.map((t) => (
                    <tr key={t.technician} className="border-b border-border last:border-0">
                      <td className="py-2.5 px-4 text-sm font-medium text-foreground whitespace-nowrap">{t.technician}</td>
                      <td className="py-2.5 px-4 text-sm text-muted-foreground">{t.count}</td>
                      <td className="py-2.5 px-4 text-sm text-foreground whitespace-nowrap">{formatCurrency(t.grossMargin)}</td>
                      <td className="py-2.5 px-4 text-sm text-foreground whitespace-nowrap">{formatCurrency(t.technicianSplit)}</td>
                      <td className="py-2.5 px-4 text-sm font-medium text-foreground whitespace-nowrap">{formatCurrency(t.yourShare)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── Detail rows ── */}
      <Card className="border-border shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">
            {isOwed ? 'Repairs' : 'Payments'} ({rows.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground whitespace-nowrap">Repair ID</th>
                  <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground whitespace-nowrap">Technician</th>
                  <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground whitespace-nowrap">
                    {isOwed ? 'Picked up' : 'Paid'}
                  </th>
                  <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground whitespace-nowrap">
                    {isOwed ? 'Net amount' : 'Amount paid'}
                  </th>
                  <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground whitespace-nowrap">Part cost</th>
                  <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground whitespace-nowrap">Gross margin</th>
                  <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground whitespace-nowrap">Tech split</th>
                  <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground whitespace-nowrap">Your share</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="8" className="text-center py-10 text-sm text-muted-foreground">Loading...</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan="8" className="text-center py-10 text-sm text-muted-foreground">No data for this range</td></tr>
                ) : (
                  rows.map((row, i) => (
                    <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="py-2.5 px-4 text-sm font-medium text-foreground whitespace-nowrap">{row.repairId}</td>
                      <td className="py-2.5 px-4 text-sm text-muted-foreground whitespace-nowrap">{row.technician?.name || '—'}</td>
                      <td className="py-2.5 px-4 text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(isOwed ? row.pickedUpAt : row.paidAt)}
                      </td>
                      <td className="py-2.5 px-4 text-sm text-foreground whitespace-nowrap">
                        {formatCurrency(isOwed ? row.netAmount : row.amountPaid)}
                      </td>
                      <td className="py-2.5 px-4 text-sm text-muted-foreground whitespace-nowrap">{formatCurrency(row.partCost)}</td>
                      <td className="py-2.5 px-4 text-sm text-foreground whitespace-nowrap">{formatCurrency(row.grossMargin)}</td>
                      <td className="py-2.5 px-4 text-sm text-muted-foreground whitespace-nowrap">{formatCurrency(row.technicianSplit)}</td>
                      <td className="py-2.5 px-4 text-sm font-medium text-foreground whitespace-nowrap">{formatCurrency(row.yourShare)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};

export default Reports;