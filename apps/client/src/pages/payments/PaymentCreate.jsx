import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { AsyncCombobox } from '@/components/common/AsyncComboBox';
import customerService from '@/api/customerService';
import supplierService from '@/api/supplierService';
import paymentService from '@/api/paymentService';
import toast from 'react-hot-toast';
import DateTimePicker from '@/components/common/DateTimePicker';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

// ─── Constants ────────────────────────────────────────────────────────────────

const METHOD_OPTIONS = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'card', label: 'Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })
    .format(amount ?? 0);

const FieldError = ({ message }) =>
  message ? <p className="text-xs text-red-500 mt-1">{message}</p> : null;

const fetchCustomers = async (search) => {
  const res = await customerService.getCustomers({ search, limit: 5 });
  return (res.data || []).map((c) => ({
    value: c._id,
    label: `${c.name} — ${c.phone || c.email || ''}`,
  }));
};

const fetchSuppliers = async (search) => {
  const res = await supplierService.getSuppliers({ search, limit: 5 });
  return (res.data || []).map((s) => ({
    value: s._id,
    label: `${s.name} — ${s.phone || ''}`,
  }));
};

// ─── PaymentCreate ────────────────────────────────────────────────────────────

const PaymentCreate = () => {
  useDocumentTitle('Create payment');
  const navigate = useNavigate();

  // Step 1 — type + party
  const [type, setType] = useState('');
  const [partyId, setPartyId] = useState('');

  // Step 2 — unpaid items
  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState({}); // { id: amountPaid }

  // Step 3 — payment details
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paidAt, setPaidAt] = useState(() => new Date());
  const [notes, setNotes] = useState('');
  const [fnfSummary, setFnfSummary] = useState(null); // { count, total } | null
  const [fnfLoading, setFnfLoading] = useState(false);
  const [isFullAndFinal, setIsFullAndFinal] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // ── Fetch unpaid items when party is selected ─────────────────────────────

  const fetchUnpaidItems = async (selectedPartyId) => {
    if (!selectedPartyId || !type) return;
    try {
      setItemsLoading(true);
      setItems([]);
      setSelectedItems({});

      const res = await paymentService.getOutstandingItems({
        type,
        ...(type === 'receivable' ? { customer: selectedPartyId } : { supplier: selectedPartyId }),
      });
      setItems(res.data || []);
    } catch (err) {
      toast.error('Failed to fetch outstanding items');
    } finally {
      setItemsLoading(false);
    }
  };

  const fetchFnfSummary = async (selectedPartyId, selectedType) => {
    if (!selectedPartyId || !selectedType) return;
    try {
      setFnfLoading(true);
      const res = await paymentService.getOutstandingSummary({
        type: selectedType,
        ...(selectedType === 'receivable' ? { customer: selectedPartyId } : { supplier: selectedPartyId }),
      });
      setFnfSummary(res.data);
    } catch (err) {
      setFnfSummary(null);
    } finally {
      setFnfLoading(false);
    }
  };

  const handlePartyChange = (id) => {
    setPartyId(id);
    setItems([]);
    setSelectedItems({});
    setFnfSummary(null);
    if (id) {
      fetchUnpaidItems(id);
      fetchFnfSummary(id, type);
    }
  };

  const handleTypeChange = (val) => {
    setType(val);
    setPartyId('');
    setItems([]);
    setSelectedItems({});
    setFnfSummary(null);
    setIsFullAndFinal(false);
  };

  // ── Item selection ────────────────────────────────────────────────────────

  // Mirrors utils/repair.calculations.js#getRepairRemaining on the backend — keep both in sync if either changes.
  const getItemRemaining = (item) => {
    if (type === 'receivable') {
      if (['paid', 'waived'].includes(item.paymentStatus)) return 0;
      const total = (item.serviceCharge ?? 0) - (item.discount ?? 0);
      return total - (item.amountPaid ?? 0);
    } else {
      const total = (item.unitCost ?? 0) * (item.quantity ?? 1);
      return total - (item.amountPaid ?? 0);
    }
  };

  const toggleItem = (item) => {
    const id = item._id;
    if (selectedItems[id] !== undefined) {
      const next = { ...selectedItems };
      delete next[id];
      setSelectedItems(next);
    } else {
      setSelectedItems((prev) => ({
        ...prev,
        [id]: getItemRemaining(item),
      }));
    }
  };

  const handleAmountChange = (id, val) => {
    setSelectedItems((prev) => ({ ...prev, [id]: val === '' ? '' : Number(val) }));
  };

  const selectAll = () => {
    const all = {};
    items.forEach((item) => { all[item._id] = getItemRemaining(item); });
    setSelectedItems(all);
  };

  const clearAll = () => setSelectedItems({});

  // ── Total ─────────────────────────────────────────────────────────────────

  const totalSelected = Object.values(selectedItems)
    .reduce((sum, v) => sum + (Number(v) || 0), 0);

  // ── Submit ────────────────────────────────────────────────────────────────

  const validate = () => {
    const e = {};
    if (!type) e.type = 'Required';
    if (!partyId) e.party = 'Required';
    if (!paymentMethod) e.method = 'Required';
    if (!isFullAndFinal && Object.keys(selectedItems).length === 0)
      e.items = 'Select at least one item';
    if (!isFullAndFinal && Object.values(selectedItems).some((v) => !v || Number(v) <= 0))
      e.items = 'All selected items must have an amount greater than 0';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      setSubmitting(true);

      if (isFullAndFinal) {
        const payload = {
          type,
          paymentMethod,
          ...(type === 'receivable' ? { customer: partyId } : { supplier: partyId }),
          ...(notes ? { notes } : {}),
          ...(paidAt ? { paidAt } : {}),
        };
        await paymentService.createFullAndFinal(payload);
      } else {
        const lineItems = Object.entries(selectedItems).map(([id, amountPaid]) => {
          if (type === 'receivable') return { repair: id, amountPaid: Number(amountPaid) };
          else return { sparePartUsage: id, amountPaid: Number(amountPaid) };
        });

        const payload = {
          type,
          paymentMethod,
          lineItems,
          ...(type === 'receivable' ? { customer: partyId } : { supplier: partyId }),
          ...(notes ? { notes } : {}),
          ...(paidAt ? { paidAt } : {}),
        };
        await paymentService.createPayment(payload);
      }

      toast.success('Payment recorded successfully');
      navigate('/app/payments');
    } catch (err) {
      const errorData = err.response?.data;

      if (errorData?.errors && Array.isArray(errorData.errors)) {
        toast.error(errorData.errors[0].message);
      } else {
        toast.error(errorData?.message || 'Failed to record payment');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4 p-4 pb-20 md:pb-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate('/app/payments')}
          className="gap-1.5 text-muted-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> Payments
        </Button>
        <h1 className="text-base font-semibold text-foreground">New Payment</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ── Step 1: Type + Party + Method ── */}
        <Card className="border-border shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Payment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* Type */}
            <div>
              <Label className="text-xs">Payment Type <span className="text-red-500">*</span></Label>
              <div className="flex gap-2 mt-1">
                {[
                  { value: 'receivable', label: 'Receivable', icon: ArrowDownLeft, color: 'text-green-500 border-green-500 bg-green-500/10' },
                  { value: 'payable', label: 'Payable', icon: ArrowUpRight, color: 'text-orange-500 border-orange-500 bg-orange-500/10' },
                ].map(({ value, label, icon: Icon, color }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleTypeChange(value)}
                    className={`flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md border text-xs font-medium transition-colors ${type === value ? color : 'border-border text-muted-foreground hover:bg-muted/50'
                      }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>
              <FieldError message={errors.type} />
            </div>

            {/* Party */}
            {type && (
              <div>
                <Label className="text-xs">
                  {type === 'receivable' ? 'Customer' : 'Supplier'}
                  <span className="text-red-500"> *</span>
                </Label>
                <div className="mt-1">
                  <AsyncCombobox
                    value={partyId}
                    onChange={handlePartyChange}
                    fetchOptions={type === 'receivable' ? fetchCustomers : fetchSuppliers}
                    placeholder={type === 'receivable' ? 'Search customers...' : 'Search suppliers...'}
                    error={!!errors.party}
                  />
                </div>
                <FieldError message={errors.party} />
              </div>
            )}

            {/* Payment Method */}
            <div>
              <Label className="text-xs">Payment Method <span className="text-red-500">*</span></Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className={`mt-1 h-8 text-sm ${errors.method ? 'border-red-500' : ''}`}>
                  <SelectValue placeholder="Select method..." />
                </SelectTrigger>
                <SelectContent>
                  {METHOD_OPTIONS.map((m) => (
                    <SelectItem key={m.value} value={m.value} className="text-sm">{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError message={errors.method} />
            </div>

            {/* Paid At */}
            <div>
              <DateTimePicker
                label="Payment Date"
                value={paidAt}
                onChange={setPaidAt}
                placeholder="Select payment date & time"
              />
            </div>

            {/* Full & Final toggle */}
            {type && partyId && fnfSummary?.count > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => { setIsFullAndFinal((p) => !p); setSelectedItems({}); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition-colors ${isFullAndFinal
                    ? 'border-purple-500 bg-purple-500/10 text-purple-500'
                    : 'border-border text-muted-foreground hover:bg-muted/50'
                    }`}
                >
                  <span className="font-medium">Full & Final Settlement</span>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isFullAndFinal ? 'border-purple-500 bg-purple-500' : 'border-muted-foreground'
                    }`}>
                    {isFullAndFinal && <CheckCircle className="w-3 h-3 text-white" />}
                  </div>
                </button>
                <p className="text-xs text-muted-foreground mt-1">
                  Clears all outstanding dues in one payment
                </p>
              </div>
            )}

            {/* Notes */}
            <div>
              <Label className="text-xs">Notes</Label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes..."
                rows={3}
                className="mt-1 flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </div>

          </CardContent>
        </Card>

        {/* ── Step 2: Items ── */}
        <Card className="border-border shadow-none lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">
                {type === 'receivable' ? 'Outstanding Repairs' : type === 'payable' ? 'Outstanding Spare Parts' : 'Outstanding Items'}
              </CardTitle>
              {items.length > 0 && !isFullAndFinal && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={selectAll}>
                    Select All
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearAll}>
                    Clear
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!type ? (
              <p className="text-sm text-muted-foreground text-center py-10">
                Select a payment type to get started
              </p>
            ) : !partyId ? (
              <p className="text-sm text-muted-foreground text-center py-10">
                Select a {type === 'receivable' ? 'customer' : 'supplier'} to see outstanding items
              </p>
            ) : isFullAndFinal ? (
              fnfLoading ? (
                <p className="text-sm text-muted-foreground text-center py-10">
                  Calculating outstanding total...
                </p>
              ) : !fnfSummary || fnfSummary.count === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">
                  No outstanding {type === 'receivable' ? 'repairs' : 'spare parts'} found
                </p>
              ) : (
                <div className="text-center py-10 space-y-1">
                  <p className="text-sm text-muted-foreground">
                    {fnfSummary.count} outstanding item{fnfSummary.count !== 1 ? 's' : ''} will be cleared
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(fnfSummary.total)}
                  </p>
                </div>
              )
            ) : itemsLoading ? (
              <p className="text-sm text-muted-foreground text-center py-10">
                Loading outstanding items...
              </p>
            ) : items.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">
                No outstanding {type === 'receivable' ? 'repairs' : 'spare parts'} found
              </p>
            ) : (
              // Normal — selectable items with amount input
              <div className="space-y-2">
                {items.map((item) => {
                  const remaining = getItemRemaining(item);
                  const isSelected = selectedItems[item._id] !== undefined;
                  const label = type === 'receivable'
                    ? `${item.repairId} — ${item.deviceModel}`
                    : item.sparePart;
                  const sub = type === 'receivable'
                    ? `Total: ${formatCurrency((item.serviceCharge ?? 0) - (item.discount ?? 0))} · Paid: ${formatCurrency(item.amountPaid)}`
                    : `${item.quantity ?? 1} × ${formatCurrency(item.unitCost)} · Paid: ${formatCurrency(item.amountPaid)}`;

                  return (
                    <div key={item._id}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors ${isSelected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/30'
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleItem(item)}
                        className="w-3.5 h-3.5 rounded border-border shrink-0"
                      />
                      <div className="flex-1 min-w-0" onClick={() => toggleItem(item)}>
                        <p className="text-sm font-medium text-foreground truncate cursor-pointer">{label}</p>
                        <p className="text-xs text-muted-foreground">{sub}</p>
                        <p className="text-xs text-muted-foreground">
                          Remaining: <span className="font-medium text-foreground">{formatCurrency(remaining)}</span>
                        </p>
                      </div>
                      {isSelected && (
                        <div className="shrink-0 w-28" onClick={(e) => e.stopPropagation()}>
                          <Input
                            type="number"
                            min="0.01"
                            max={remaining}
                            step="0.01"
                            value={selectedItems[item._id]}
                            onChange={(e) => handleAmountChange(item._id, e.target.value)}
                            className="h-7 text-xs text-right"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Total */}
                {Object.keys(selectedItems).length > 0 && (
                  <div className="flex justify-between items-center pt-2 border-t border-border px-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      {Object.keys(selectedItems).length} item{Object.keys(selectedItems).length !== 1 ? 's' : ''} selected
                    </p>
                    <p className="text-sm font-bold text-foreground">{formatCurrency(totalSelected)}</p>
                  </div>
                )}

                <FieldError message={errors.items} />
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* ── Actions ── */}
      <div className="flex justify-end gap-2 mt-4">
        <Button type="button" variant="outline" size="sm" onClick={() => navigate('/app/payments')}>
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={
            submitting || !type || !partyId || !paymentMethod ||
            (isFullAndFinal && (!fnfSummary || fnfSummary.count === 0))
          }
        >
          {submitting
            ? 'Recording...'
            : `Record Payment${isFullAndFinal
              ? (fnfSummary?.total > 0 ? ` · ${formatCurrency(fnfSummary.total)}` : '')
              : (totalSelected > 0 ? ` · ${formatCurrency(totalSelected)}` : '')
            }`}
        </Button>
      </div>

    </div>
  );
};

export default PaymentCreate;