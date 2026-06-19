import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronUp, ChevronDown, ArrowDownLeft, ArrowUpRight, } from 'lucide-react';
import { Input } from '@/components/ui/input';
import paymentService from '@/api/paymentService';

import PageHeader from '@/components/common/PageHeader';
import TableFooter from '@/components/common/TableFooter';
import FilterPopover from '@/components/common/FilterPopover';
import toast from 'react-hot-toast';
import FilterSelect from '@/components/common/FilterSelect'
import DateRangePicker from '@/components/common/DateRangePicker';
// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_OPTIONS = [
  { value: 'receivable', label: 'Receivable' },
  { value: 'payable', label: 'Payable' },
];

const METHOD_OPTIONS = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'card', label: 'Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
];

const FNF_OPTIONS = [
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
];

const columns = [
  { label: 'Date', col: 'paidAt' },
  { label: 'Party', col: null },
  { label: 'Type', col: 'type' },
  { label: 'Method', col: null },
  { label: 'Items', col: null },
  { label: 'Amount', col: 'totalAmount' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })
    .format(amount ?? 0);

const formatMethod = (method) => ({
  cash: 'Cash',
  upi: 'UPI',
  card: 'Card',
  bank_transfer: 'Bank Transfer',
}[method] ?? method);

// ─── PaymentList ──────────────────────────────────────────────────────────────

const PaymentList = () => {
  const navigate = useNavigate();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [typeFilter, setTypeFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [fnfFilter, setFnfFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [typeOpen, setTypeOpen] = useState(false);
  const [methodOpen, setMethodOpen] = useState(false);

  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page: pagination.page, limit: pagination.limit, sortBy, sortOrder };
      if (typeFilter) params.type = typeFilter;
      if (methodFilter) params.paymentMethod = methodFilter;
      if (fnfFilter) params.isFullAndFinal = fnfFilter === 'true';
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;

      const response = await paymentService.getPayments(params);
      setPayments(response.data);
      setPagination((prev) => ({
        ...prev,
        total: response.pagination.total,
        pages: response.pagination.pages,
      }));
    } catch (err) {
      const errorData = err.response?.data;

      if (errorData?.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
        toast.error(errorData.errors[0].message);
      } else {
        toast.error(errorData?.message || 'Failed to fetch payments');
      }
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, sortBy, sortOrder, typeFilter, methodFilter, fnfFilter, fromDate, toDate]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  // ── Sort ───────────────────────────────────────────────────────────────────

  const handleSort = (col) => {
    if (!col) return;
    if (sortBy === col) setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(col); setSortOrder('asc'); }
  };

  const renderSortIcon = (col) => {
    if (!col || sortBy !== col) return null;
    return sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
  };

  // ── Filters ────────────────────────────────────────────────────────────────

  const clearFilters = () => {
    setTypeFilter('');
    setMethodFilter('');
    setFnfFilter('');
    setFromDate('');
    setToDate('');
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const filterCount = [typeFilter, methodFilter, fnfFilter, fromDate, toDate].filter(Boolean).length;

  const filterPanel = (
    <FilterPopover
      open={showFilters}
      onClose={() => setShowFilters(false)}
      onClear={clearFilters}
      hasFilters={filterCount > 0}
    >
      <FilterSelect label="Type" value={typeFilter} onChange={setTypeFilter} options={TYPE_OPTIONS} allLabel="All Types" />
      <FilterSelect label="Method" value={methodFilter} onChange={setMethodFilter} options={METHOD_OPTIONS} allLabel="All Methods" />
      <FilterSelect label="Full & Final" value={fnfFilter} onChange={setFnfFilter} options={FNF_OPTIONS} allLabel="All" />

      {/* Date Range */}
      <p className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Date Range</p>
      <DateRangePicker
        fromDate={fromDate}
        toDate={toDate}
        onFromChange={setFromDate}
        onToChange={setToDate}
        stacked
      />
    </FilterPopover>
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 48px)' }}>

      {/* ── Header ── */}
      <PageHeader
        title="Payments"
        searchOpen={searchOpen}
        searchQuery={searchQuery}
        onSearchToggle={() => { setSearchOpen((p) => !p); if (searchOpen) setSearchQuery(''); }}
        onSearchChange={(val) => setSearchQuery(val)}
        onAddNew={() => navigate('/app/payments/new')}
        addLabel="New Payment"
        filterCount={filterCount}
        onFilterToggle={() => setShowFilters((p) => !p)}
      >
        {filterPanel}
      </PageHeader>

      {/* ── Desktop Table ── */}
      <div className="hidden md:block flex-1 overflow-y-auto">
        <table className="w-full">
          <thead className="sticky top-0 z-10 bg-muted/60 backdrop-blur-sm">
            <tr className="border-b border-border">
              {columns.map(({ label, col }) => (
                <th key={label}
                  className={`text-left py-2.5 px-4 text-xs font-medium text-muted-foreground whitespace-nowrap ${col ? 'cursor-pointer hover:text-foreground transition-colors' : ''}`}
                  onClick={() => handleSort(col)}
                >
                  <div className="flex items-center gap-1">{label}{renderSortIcon(col)}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="text-center py-16 text-sm text-muted-foreground">Loading payments...</td></tr>
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-16 text-sm text-muted-foreground">
                  {filterCount > 0 ? 'No payments match your filters' : 'No payments yet'}
                </td>
              </tr>
            ) : (
              payments.map((payment) => (
                <tr key={payment._id}
                  className="border-b border-border last:border-0 hover:bg-muted/40 cursor-pointer transition-colors"
                  onClick={() => navigate(`/app/payments/${payment._id}`)}
                >
                  {/* Date */}
                  <td className="py-1 px-4 text-sm text-muted-foreground whitespace-nowrap">
                    {formatDate(payment.paidAt)}
                  </td>

                  {/* Party */}
                  <td className="py-1 px-4">
                    <p className="text-sm font-medium text-foreground">
                      {payment.type === 'receivable'
                        ? (payment.customer?.name || '—')
                        : (payment.supplier?.name || '—')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {payment.type === 'receivable'
                        ? payment.customer?.phone
                        : payment.supplier?.phone}
                    </p>
                  </td>

                  {/* Type */}
                  <td className="py-1 px-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${payment.type === 'receivable'
                      ? 'bg-green-500/10 text-green-500'
                      : 'bg-orange-500/10 text-orange-500'
                      }`}>
                      {payment.type === 'receivable'
                        ? <ArrowDownLeft className="w-3 h-3" />
                        : <ArrowUpRight className="w-3 h-3" />}
                      {payment.type === 'receivable' ? 'Receivable' : 'Payable'}
                    </span>
                    {payment.isFullAndFinal && (
                      <span className="ml-1.5 px-1.5 py-0.5 rounded text-xs bg-purple-500/10 text-purple-500 font-medium">
                        F&F
                      </span>
                    )}
                  </td>

                  {/* Method */}
                  <td className="py-1 px-4 text-sm text-muted-foreground">
                    {formatMethod(payment.paymentMethod)}
                  </td>

                  {/* Items */}
                  <td className="py-1 px-4 text-sm text-muted-foreground">
                    {payment.lineItems?.length ?? 0} item{payment.lineItems?.length !== 1 ? 's' : ''}
                  </td>

                  {/* Amount */}
                  <td className="py-1 px-4">
                    <p className={`text-sm font-semibold ${payment.type === 'receivable' ? 'text-green-500' : 'text-orange-500'
                      }`}>
                      {payment.type === 'receivable' ? '+' : '-'}{formatCurrency(payment.totalAmount)}
                    </p>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Mobile Cards ── */}
      <div className="md:hidden flex-1 overflow-y-auto divide-y divide-border">
        {loading ? (
          <p className="text-center py-16 text-sm text-muted-foreground">Loading payments...</p>
        ) : payments.length === 0 ? (
          <p className="text-center py-16 text-sm text-muted-foreground">
            {filterCount > 0 ? 'No payments match your filters' : 'No payments yet'}
          </p>
        ) : (
          payments.map((payment) => (
            <div key={payment._id}
              onClick={() => navigate(`/app/payments/${payment._id}`)}
              className="px-4 py-3 hover:bg-muted/40 cursor-pointer transition-colors flex items-center justify-between gap-3"
            >
              {/* Left */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {payment.type === 'receivable'
                    ? (payment.customer?.name || '—')
                    : (payment.supplier?.name || '—')}
                </p>
                <p className="text-xs text-muted-foreground">{formatMethod(payment.paymentMethod)}</p>
                <p className="text-xs text-muted-foreground">{formatDate(payment.paidAt)}</p>
              </div>

              {/* Right */}
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${payment.type === 'receivable'
                  ? 'bg-green-500/10 text-green-500'
                  : 'bg-orange-500/10 text-orange-500'
                  }`}>
                  {payment.type === 'receivable'
                    ? <ArrowDownLeft className="w-3 h-3" />
                    : <ArrowUpRight className="w-3 h-3" />}
                  {payment.type === 'receivable' ? 'Receivable' : 'Payable'}
                </span>
                {payment.isFullAndFinal && (
                  <span className="px-1.5 py-0.5 rounded text-xs bg-purple-500/10 text-purple-500 font-medium">F&F</span>
                )}
                <p className={`text-sm font-semibold ${payment.type === 'receivable' ? 'text-green-500' : 'text-orange-500'
                  }`}>
                  {payment.type === 'receivable' ? '+' : '-'}{formatCurrency(payment.totalAmount)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Footer ── */}
      <TableFooter
        pagination={pagination}
        onPageChange={(page) => setPagination((p) => ({ ...p, page }))}
        onLimitChange={(limit) => setPagination((p) => ({ ...p, limit, page: 1 }))}
      />
    </div>
  );
};

export default PaymentList;