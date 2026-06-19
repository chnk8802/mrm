import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowDownLeft, ArrowUpRight,
  Calendar, IndianRupee, User, Wrench,
  FileText, Package, CreditCard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import paymentService from '@/api/paymentService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3">
    <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value || '—'}</p>
    </div>
  </div>
);

const formatDate = (d) =>
  d ? format(new Date(d), 'dd MMM yyyy, hh:mm a') : '—';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 2,
  }).format(amount ?? 0);

const formatMethod = (method) => ({
  cash: 'Cash',
  upi: 'UPI',
  card: 'Card',
  bank_transfer: 'Bank Transfer',
}[method] ?? method);

// ─── PaymentDetails ───────────────────────────────────────────────────────────

const PaymentDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayment = async () => {
      try {
        setLoading(true);
        const response = await paymentService.getPaymentById(id);
        setPayment(response.data);
      } catch (err) {
        const errorData = err.response?.data;
        if (errorData?.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
          toast.error(errorData.errors[0].message);
        } else {
          toast.error(errorData?.message || 'Failed to fetch payments');
        }
        navigate('/app/payments');
      } finally {
        setLoading(false);
      }
    };
    fetchPayment();
  }, [id]);

  // ── States ────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
      Loading payment details...
    </div>
  );

  const isReceivable = payment.type === 'receivable';
  const party = isReceivable ? payment.customer : payment.supplier;

  return (
    <div className="space-y-4 p-4 pb-24 md:pb-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate('/app/payments')}
          className="gap-1.5 text-muted-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> Payments
        </Button>
      </div>

      {/* ── Profile Card ── */}
      <Card className="border-border shadow-none">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${isReceivable ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'
              }`}>
              {isReceivable
                ? <ArrowDownLeft className="w-5 h-5" />
                : <ArrowUpRight className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold text-foreground truncate">
                {party?.name || '—'}
              </h2>
              <p className="text-sm text-muted-foreground">{party?.phone || ''}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${isReceivable
                    ? 'bg-green-500/10 text-green-500'
                    : 'bg-orange-500/10 text-orange-500'
                  }`}>
                  {isReceivable
                    ? <ArrowDownLeft className="w-3 h-3" />
                    : <ArrowUpRight className="w-3 h-3" />}
                  {isReceivable ? 'Receivable' : 'Payable'}
                </span>
                {payment.isFullAndFinal && (
                  <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-purple-500/10 text-purple-500">
                    Full & Final
                  </span>
                )}
                <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-muted text-muted-foreground">
                  {formatMethod(payment.paymentMethod)}
                </span>
              </div>
            </div>
            {/* Total amount prominent */}
            <div className="text-right shrink-0">
              <p className="text-xs text-muted-foreground mb-0.5">Total</p>
              <p className={`text-lg font-bold ${isReceivable ? 'text-green-500' : 'text-orange-500'}`}>
                {isReceivable ? '+' : '-'}{formatCurrency(payment.totalAmount)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* ── Payment Info ── */}
        <Card className="border-border shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Payment Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow
              icon={CreditCard}
              label="Payment Method"
              value={formatMethod(payment.paymentMethod)}
            />
            <InfoRow
              icon={Calendar}
              label="Paid At"
              value={formatDate(payment.paidAt)}
            />
            <InfoRow
              icon={User}
              label="Recorded By"
              value={payment.recordedBy?.name}
            />
            <InfoRow
              icon={Calendar}
              label="Created"
              value={formatDate(payment.createdAt)}
            />
            <div className="flex items-start gap-3">
              <IndianRupee className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Total Amount</p>
                <p className={`text-sm font-bold ${isReceivable ? 'text-green-500' : 'text-orange-500'}`}>
                  {formatCurrency(payment.totalAmount)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Line Items ── */}
        <Card className="border-border shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              {isReceivable
                ? <Wrench className="w-4 h-4 text-muted-foreground" />
                : <Package className="w-4 h-4 text-muted-foreground" />}
              {isReceivable ? 'Repairs' : 'Spare Parts'}
              <span className="text-xs text-muted-foreground font-normal">
                ({payment.lineItems?.length ?? 0} item{payment.lineItems?.length !== 1 ? 's' : ''})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {payment.lineItems?.length > 0 ? (
              <div className="space-y-2">
                {payment.lineItems.map((item, i) => {
                  const ref = isReceivable ? item.repair : item.sparePartUsage;
                  const label = isReceivable
                    ? `${ref?.repairId || '—'} — ${ref?.deviceModel || ''}`
                    : (ref?.sparePart || '—');
                  const sub = isReceivable
                    ? `Charge: ${formatCurrency(ref?.serviceCharge)} · Paid so far: ${formatCurrency(ref?.amountPaid)}`
                    : `${ref?.quantity ?? 1} × ${formatCurrency(ref?.unitCost)}`;

                  return (
                    <div key={i}
                      className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/40 text-sm"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground truncate">{label}</p>
                        <p className="text-xs text-muted-foreground">{sub}</p>
                      </div>
                      <p className="text-sm font-semibold text-foreground shrink-0 ml-3">
                        {formatCurrency(item.amountPaid)}
                      </p>
                    </div>
                  );
                })}

                {/* Total row */}
                <div className="flex justify-between items-center pt-2 border-t border-border px-1">
                  <p className="text-xs font-medium text-muted-foreground">Total Paid</p>
                  <p className={`text-sm font-bold ${isReceivable ? 'text-green-500' : 'text-orange-500'}`}>
                    {formatCurrency(payment.totalAmount)}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No line items</p>
            )}
          </CardContent>
        </Card>

        {/* ── Notes ── */}
        {payment.notes && (
          <Card className="border-border shadow-none lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {payment.notes}
              </p>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
};

export default PaymentDetails;