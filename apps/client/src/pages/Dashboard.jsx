import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wrench, Users, Clock, CheckCircle,
  XCircle, AlertCircle, PackageCheck, ArrowDownLeft,
  ArrowUpRight, TrendingUp, ClipboardList,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import repairService from '@/api/repairService';
import paymentService from '@/api/paymentService';
import customerService from '@/api/customerService';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 2,
  }).format(amount ?? 0);

const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

// ─── Stat Card ────────────────────────────────────────────────────────────────
// NOTE: plain <div>, no shadcn <Card> wrapper — removes any possibility of
// Card/CardContent swallowing pointer events or props not forwarding.

const StatCard = ({ icon: Icon, label, value, sub, color = 'text-foreground', iconBg = 'bg-muted', onClick }) => {
  const clickable = typeof onClick === 'function';

  return (
    <div
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? onClick : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') onClick();
            }
          : undefined
      }
      className={`rounded-xl border border-border bg-card text-card-foreground p-4 ${
        clickable ? 'cursor-pointer hover:bg-muted/50 active:scale-[0.98] transition-all' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className={`text-xl font-bold mt-0.5 ${color}`}>{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
};

// ─── Section Header ───────────────────────────────────────────────────────────

const SectionTitle = ({ children }) => (
  <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
    {children}
  </h2>
);

// ─── Status Badge ─────────────────────────────────────────────────────────────

const STATUS_META = {
  'received':       { label: 'Received',       color: 'bg-yellow-500/10 text-yellow-500',  icon: Clock        },
  'in-progress':    { label: 'In Progress',     color: 'bg-blue-500/10 text-blue-500',      icon: Wrench       },
  'ready':          { label: 'Ready',           color: 'bg-purple-500/10 text-purple-500',  icon: PackageCheck },
  'not-repairable': { label: 'Not Repairable',  color: 'bg-orange-500/10 text-orange-500',  icon: AlertCircle  },
  'completed':      { label: 'Completed',       color: 'bg-green-500/10 text-green-500',    icon: CheckCircle  },
  'cancelled':      { label: 'Cancelled',       color: 'bg-red-500/10 text-red-500',        icon: XCircle      },
};

const StatusBadge = ({ status }) => {
  const meta = STATUS_META[status] ?? { label: status, color: 'bg-muted text-muted-foreground', icon: AlertCircle };
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${meta.color}`}>
      <Icon className="w-3 h-3" />{meta.label}
    </span>
  );
};

// ─── Plain card wrapper for non-stat sections (tables etc.) ──────────────────

const PlainCard = ({ className = '', children }) => (
  <div className={`rounded-xl border border-border bg-card text-card-foreground ${className}`}>
    {children}
  </div>
);

// ─── Admin Dashboard ──────────────────────────────────────────────────────────

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [repairStats, setRepairStats]   = useState(null);
  const [paymentStats, setPaymentStats] = useState(null);
  const [customerStats, setCustomerStats] = useState(null);
  const [recentRepairs, setRecentRepairs]   = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [rs, ps, cs, rr, rp] = await Promise.all([
          repairService.getRepairStats(),
          paymentService.getPaymentStats(),
          customerService.getCustomerStats(),
          repairService.getRepairs({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' }),
          paymentService.getPayments({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' }),
        ]);
        setRepairStats(rs.data);
        setPaymentStats(ps.data);
        setCustomerStats(cs.data);
        setRecentRepairs(rr.data || []);
        setRecentPayments(rp.data || []);
      } catch (err) {
        console.error('Dashboard fetch error', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
      Loading dashboard...
    </div>
  );

  const net = (paymentStats?.totalReceivable ?? 0) - (paymentStats?.totalPayable ?? 0);

  const goRepairs = (status) => () =>
    navigate(status ? `/app/repairs?status=${status}` : '/app/repairs');

  return (
    <div className="space-y-6 p-4 pb-24 md:pb-6">

      {/* ── Repairs ── */}
      <div className="space-y-3">
        <SectionTitle>Repairs</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard icon={ClipboardList} label="Total"       value={repairStats?.total ?? 0}      iconBg="bg-muted" onClick={goRepairs()} />
          <StatCard icon={Clock}         label="Received"    value={repairStats?.received ?? 0}   iconBg="bg-yellow-500/10" color="text-yellow-500" onClick={goRepairs('received')} />
          <StatCard icon={Wrench}        label="In Progress" value={repairStats?.inProgress ?? 0} iconBg="bg-blue-500/10"   color="text-blue-500" onClick={goRepairs('in-progress')} />
          <StatCard icon={PackageCheck}  label="Ready"       value={repairStats?.ready ?? 0}      iconBg="bg-purple-500/10" color="text-purple-500" onClick={goRepairs('ready')} />
          <StatCard icon={CheckCircle}   label="Completed"      value={repairStats?.completed ?? 0}      iconBg="bg-green-500/10"  color="text-green-500" onClick={goRepairs('completed')} />
          <StatCard icon={XCircle}       label="Cancelled"      value={repairStats?.cancelled ?? 0}      iconBg="bg-red-500/10"    color="text-red-500" onClick={goRepairs('cancelled')} />
          <StatCard icon={AlertCircle}   label="Not Repairable" value={repairStats?.notRepairable ?? 0}  iconBg="bg-orange-500/10" color="text-orange-500" onClick={goRepairs('not-repairable')} />
        </div>
      </div>

      {/* ── Pickup ── */}
      <div className="space-y-3">
        <SectionTitle>Pickup</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={PackageCheck}
            label="Picked Up"
            value={repairStats?.pickedUp ?? 0}
            iconBg="bg-green-500/10"
            color="text-green-500"
            onClick={() => navigate('/app/repairs?isPickedUp=true')}
          />
          <StatCard
            icon={ClipboardList}
            label="Not Picked Up"
            value={repairStats?.notPickedUp ?? 0}
            iconBg="bg-muted"
            onClick={() => navigate('/app/repairs?isPickedUp=false')}
          />
        </div>
      </div>

      {/* ── Payments ── */}
      <div className="space-y-3">
        <SectionTitle>Payments</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <StatCard
            icon={ArrowDownLeft}
            label="Total Received"
            value={formatCurrency(paymentStats?.totalReceivable)}
            sub={`${paymentStats?.receivableCount ?? 0} payments`}
            color="text-green-500"
            iconBg="bg-green-500/10"
            onClick={() => navigate('/app/payments?type=receivable')}
          />
          <StatCard
            icon={ArrowUpRight}
            label="Total Paid Out"
            value={formatCurrency(paymentStats?.totalPayable)}
            sub={`${paymentStats?.payableCount ?? 0} payments`}
            color="text-orange-500"
            iconBg="bg-orange-500/10"
            onClick={() => navigate('/app/payments?type=payable')}
          />
          <StatCard
            icon={TrendingUp}
            label="Net"
            value={formatCurrency(net)}
            sub="Received minus paid out"
            color={net >= 0 ? 'text-green-500' : 'text-red-500'}
            iconBg={net >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}
          />
        </div>
      </div>

      {/* ── Customers ── */}
      <div className="space-y-3">
        <SectionTitle>Customers</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={Users} label="Total"      value={customerStats?.total ?? 0}      iconBg="bg-muted" onClick={() => navigate('/app/customers')} />
          <StatCard icon={Users} label="Active"     value={customerStats?.active ?? 0}     iconBg="bg-green-500/10"  color="text-green-500" onClick={() => navigate('/app/customers?status=active')} />
          <StatCard icon={Users} label="Business"   value={customerStats?.business ?? 0}   iconBg="bg-blue-500/10"   color="text-blue-500" onClick={() => navigate('/app/customers?type=business')} />
          <StatCard icon={Users} label="Individual" value={customerStats?.individual ?? 0} iconBg="bg-muted" onClick={() => navigate('/app/customers?type=individual')} />
        </div>
      </div>

      {/* ── Recent Repairs ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <SectionTitle>Recent Repairs</SectionTitle>
          <button onClick={() => navigate('/app/repairs')} className="text-xs text-primary hover:underline">
            View all
          </button>
        </div>
        <PlainCard>
          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  {['Repair ID', 'Device', 'Customer', 'Status', 'Charge', 'Date'].map((h) => (
                    <th key={h} className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentRepairs.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-8 text-sm text-muted-foreground">No repairs yet</td></tr>
                ) : recentRepairs.map((r) => (
                  <tr key={r._id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => navigate(`/app/repairs/${r._id}`)}
                  >
                    <td className="py-2.5 px-4 text-sm font-medium text-foreground">{r.repairId}</td>
                    <td className="py-2.5 px-4 text-sm text-muted-foreground">{r.deviceModel}</td>
                    <td className="py-2.5 px-4 text-sm text-muted-foreground">{r.customer?.name || '—'}</td>
                    <td className="py-2.5 px-4"><StatusBadge status={r.status} /></td>
                    <td className="py-2.5 px-4 text-sm text-foreground">{formatCurrency(r.serviceCharge)}</td>
                    <td className="py-2.5 px-4 text-sm text-muted-foreground whitespace-nowrap">{formatDate(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile */}
          <div className="md:hidden divide-y divide-border">
            {recentRepairs.length === 0 ? (
              <p className="text-center py-8 text-sm text-muted-foreground">No repairs yet</p>
            ) : recentRepairs.map((r) => (
              <div key={r._id}
                className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-muted/30 cursor-pointer"
                onClick={() => navigate(`/app/repairs/${r._id}`)}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{r.repairId}</p>
                  <p className="text-xs text-muted-foreground truncate">{r.deviceModel} · {r.customer?.name}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <StatusBadge status={r.status} />
                  <p className="text-xs font-medium text-foreground">{formatCurrency(r.serviceCharge)}</p>
                </div>
              </div>
            ))}
          </div>
        </PlainCard>
      </div>

      {/* ── Recent Payments ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <SectionTitle>Recent Payments</SectionTitle>
          <button onClick={() => navigate('/app/payments')} className="text-xs text-primary hover:underline">
            View all
          </button>
        </div>
        <PlainCard>
          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  {['Party', 'Type', 'Method', 'Amount', 'Date'].map((h) => (
                    <th key={h} className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentPayments.length === 0 ? (
                  <tr><td colSpan="5" className="text-center py-8 text-sm text-muted-foreground">No payments yet</td></tr>
                ) : recentPayments.map((p) => (
                  <tr key={p._id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => navigate(`/app/payments/${p._id}`)}
                  >
                    <td className="py-2.5 px-4 text-sm text-foreground">
                      {p.type === 'receivable' ? p.customer?.name : p.supplier?.name || '—'}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${
                        p.type === 'receivable' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'
                      }`}>
                        {p.type === 'receivable' ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                        {p.type === 'receivable' ? 'Receivable' : 'Payable'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-sm text-muted-foreground capitalize">{p.paymentMethod?.replace('_', ' ')}</td>
                    <td className="py-2.5 px-4">
                      <span className={`text-sm font-semibold ${p.type === 'receivable' ? 'text-green-500' : 'text-orange-500'}`}>
                        {p.type === 'receivable' ? '+' : '-'}{formatCurrency(p.totalAmount)}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-sm text-muted-foreground whitespace-nowrap">{formatDate(p.paidAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile */}
          <div className="md:hidden divide-y divide-border">
            {recentPayments.length === 0 ? (
              <p className="text-center py-8 text-sm text-muted-foreground">No payments yet</p>
            ) : recentPayments.map((p) => (
              <div key={p._id}
                className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-muted/30 cursor-pointer"
                onClick={() => navigate(`/app/payments/${p._id}`)}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {p.type === 'receivable' ? p.customer?.name : p.supplier?.name || '—'}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">{p.paymentMethod?.replace('_', ' ')}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`text-sm font-semibold ${p.type === 'receivable' ? 'text-green-500' : 'text-orange-500'}`}>
                    {p.type === 'receivable' ? '+' : '-'}{formatCurrency(p.totalAmount)}
                  </span>
                  <p className="text-xs text-muted-foreground">{formatDate(p.paidAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </PlainCard>
      </div>

    </div>
  );
};

// ─── Manager Dashboard ────────────────────────────────────────────────────────

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const [repairStats, setRepairStats]   = useState(null);
  const [paymentStats, setPaymentStats] = useState(null);
  const [recentRepairs, setRecentRepairs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [rs, ps, rr] = await Promise.all([
          repairService.getRepairStats(),
          paymentService.getPaymentStats(),
          repairService.getRepairs({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' }),
        ]);
        setRepairStats(rs.data);
        setPaymentStats(ps.data);
        setRecentRepairs(rr.data || []);
      } catch (err) {
        console.error('Dashboard fetch error', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
      Loading dashboard...
    </div>
  );

  const goRepairs = (status) => () =>
    navigate(status ? `/app/repairs?status=${status}` : '/app/repairs');

  return (
    <div className="space-y-6 p-4 pb-24 md:pb-6">

      {/* ── Repairs ── */}
      <div className="space-y-3">
        <SectionTitle>Repairs</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard icon={ClipboardList} label="Total"       value={repairStats?.total ?? 0}      iconBg="bg-muted" onClick={goRepairs()} />
          <StatCard icon={Clock}         label="Received"    value={repairStats?.received ?? 0}   iconBg="bg-yellow-500/10" color="text-yellow-500" onClick={goRepairs('received')} />
          <StatCard icon={Wrench}        label="In Progress" value={repairStats?.inProgress ?? 0} iconBg="bg-blue-500/10"   color="text-blue-500" onClick={goRepairs('in-progress')} />
          <StatCard icon={PackageCheck}  label="Ready"       value={repairStats?.ready ?? 0}      iconBg="bg-purple-500/10" color="text-purple-500" onClick={goRepairs('ready')} />
          <StatCard icon={CheckCircle}   label="Completed"      value={repairStats?.completed ?? 0}      iconBg="bg-green-500/10"  color="text-green-500" onClick={goRepairs('completed')} />
          <StatCard icon={XCircle}       label="Cancelled"      value={repairStats?.cancelled ?? 0}      iconBg="bg-red-500/10"    color="text-red-500" onClick={goRepairs('cancelled')} />
          <StatCard icon={AlertCircle}   label="Not Repairable" value={repairStats?.notRepairable ?? 0}  iconBg="bg-orange-500/10" color="text-orange-500" onClick={goRepairs('not-repairable')} />
        </div>
      </div>

      {/* ── Pickup ── */}
      <div className="space-y-3">
        <SectionTitle>Pickup</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={PackageCheck}
            label="Picked Up"
            value={repairStats?.pickedUp ?? 0}
            iconBg="bg-green-500/10"
            color="text-green-500"
            onClick={() => navigate('/app/repairs?isPickedUp=true')}
          />
          <StatCard
            icon={ClipboardList}
            label="Not Picked Up"
            value={repairStats?.notPickedUp ?? 0}
            iconBg="bg-muted"
            onClick={() => navigate('/app/repairs?isPickedUp=false')}
          />
        </div>
      </div>

      {/* ── Payments ── */}
      <div className="space-y-3">
        <SectionTitle>Payments</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <StatCard
            icon={ArrowDownLeft}
            label="Total Received"
            value={formatCurrency(paymentStats?.totalReceivable)}
            sub={`${paymentStats?.receivableCount ?? 0} payments`}
            color="text-green-500"
            iconBg="bg-green-500/10"
            onClick={() => navigate('/app/payments?type=receivable')}
          />
          <StatCard
            icon={ArrowUpRight}
            label="Total Paid Out"
            value={formatCurrency(paymentStats?.totalPayable)}
            sub={`${paymentStats?.payableCount ?? 0} payments`}
            color="text-orange-500"
            iconBg="bg-orange-500/10"
            onClick={() => navigate('/app/payments?type=payable')}
          />
        </div>
      </div>

      {/* ── Recent Repairs ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <SectionTitle>Recent Repairs</SectionTitle>
          <button onClick={() => navigate('/app/repairs')} className="text-xs text-primary hover:underline">
            View all
          </button>
        </div>
        <PlainCard>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  {['Repair ID', 'Device', 'Customer', 'Status', 'Charge', 'Date'].map((h) => (
                    <th key={h} className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentRepairs.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-8 text-sm text-muted-foreground">No repairs yet</td></tr>
                ) : recentRepairs.map((r) => (
                  <tr key={r._id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => navigate(`/app/repairs/${r._id}`)}
                  >
                    <td className="py-2.5 px-4 text-sm font-medium text-foreground">{r.repairId}</td>
                    <td className="py-2.5 px-4 text-sm text-muted-foreground">{r.deviceModel}</td>
                    <td className="py-2.5 px-4 text-sm text-muted-foreground">{r.customer?.name || '—'}</td>
                    <td className="py-2.5 px-4"><StatusBadge status={r.status} /></td>
                    <td className="py-2.5 px-4 text-sm text-foreground">{formatCurrency(r.serviceCharge)}</td>
                    <td className="py-2.5 px-4 text-sm text-muted-foreground whitespace-nowrap">{formatDate(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="md:hidden divide-y divide-border">
            {recentRepairs.map((r) => (
              <div key={r._id}
                className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-muted/30 cursor-pointer"
                onClick={() => navigate(`/app/repairs/${r._id}`)}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{r.repairId}</p>
                  <p className="text-xs text-muted-foreground truncate">{r.deviceModel} · {r.customer?.name}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <StatusBadge status={r.status} />
                  <p className="text-xs font-medium text-foreground">{formatCurrency(r.serviceCharge)}</p>
                </div>
              </div>
            ))}
          </div>
        </PlainCard>
      </div>

    </div>
  );
};

// ─── Staff Dashboard ──────────────────────────────────────────────────────────

const StaffDashboard = ({ userId }) => {
  const navigate = useNavigate();
  const [myRepairs, setMyRepairs] = useState([]);
  const [counts, setCounts]       = useState({ inProgress: 0, ready: 0, total: 0 });
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const response = await repairService.getRepairs({
          technician: userId,
          limit: 50,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        });
        const repairs = response.data || [];
        setMyRepairs(repairs.slice(0, 10));
        setCounts({
          total:      repairs.length,
          inProgress: repairs.filter((r) => r.status === 'in-progress').length,
          ready:      repairs.filter((r) => r.status === 'ready').length,
        });
      } catch (err) {
        console.error('Staff dashboard error', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [userId]);

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
      Loading dashboard...
    </div>
  );

  const goRepairs = (status) => () =>
    navigate(status ? `/app/repairs?status=${status}&technician=${userId}` : `/app/repairs?technician=${userId}`);

  return (
    <div className="space-y-6 p-4 pb-24 md:pb-6">

      {/* ── My Stats ── */}
      <div className="space-y-3">
        <SectionTitle>My Repairs</SectionTitle>
        <div className="grid grid-cols-3 gap-3">
          <StatCard icon={ClipboardList} label="Assigned"    value={counts.total}      iconBg="bg-muted" onClick={goRepairs()} />
          <StatCard icon={Wrench}        label="In Progress" value={counts.inProgress}  iconBg="bg-blue-500/10"   color="text-blue-500" onClick={goRepairs('in-progress')} />
          <StatCard icon={PackageCheck}  label="Ready"       value={counts.ready}       iconBg="bg-purple-500/10" color="text-purple-500" onClick={goRepairs('ready')} />
        </div>
      </div>

      {/* ── My Repair List ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <SectionTitle>Assigned to Me</SectionTitle>
          <button onClick={() => navigate('/app/repairs')} className="text-xs text-primary hover:underline">
            View all
          </button>
        </div>
        <PlainCard>
          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  {['Repair ID', 'Device', 'Customer', 'Status', 'Date'].map((h) => (
                    <th key={h} className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {myRepairs.length === 0 ? (
                  <tr><td colSpan="5" className="text-center py-8 text-sm text-muted-foreground">No repairs assigned to you</td></tr>
                ) : myRepairs.map((r) => (
                  <tr key={r._id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => navigate(`/app/repairs/${r._id}`)}
                  >
                    <td className="py-2.5 px-4 text-sm font-medium text-foreground">{r.repairId}</td>
                    <td className="py-2.5 px-4 text-sm text-muted-foreground">{r.deviceModel}</td>
                    <td className="py-2.5 px-4 text-sm text-muted-foreground">{r.customer?.name || '—'}</td>
                    <td className="py-2.5 px-4"><StatusBadge status={r.status} /></td>
                    <td className="py-2.5 px-4 text-sm text-muted-foreground whitespace-nowrap">{formatDate(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile */}
          <div className="md:hidden divide-y divide-border">
            {myRepairs.length === 0 ? (
              <p className="text-center py-8 text-sm text-muted-foreground">No repairs assigned to you</p>
            ) : myRepairs.map((r) => (
              <div key={r._id}
                className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-muted/30 cursor-pointer"
                onClick={() => navigate(`/app/repairs/${r._id}`)}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{r.repairId}</p>
                  <p className="text-xs text-muted-foreground truncate">{r.deviceModel} · {r.customer?.name}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</p>
                </div>
                <StatusBadge status={r.status} />
              </div>
            ))}
          </div>
        </PlainCard>
      </div>

    </div>
  );
};

// ─── Dashboard (role switcher) ────────────────────────────────────────────────

const Dashboard = () => {
  const { user } = useAuth();
  useDocumentTitle("Dashboard");

  if (!user) return null;

  if (user.role === 'staff') return <StaffDashboard userId={user._id} />;
  if (user.role === 'manager') return <ManagerDashboard />;
  return <AdminDashboard />; // admin + superadmin
};

export default Dashboard;