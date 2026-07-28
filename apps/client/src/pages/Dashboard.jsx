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

// ─── Hero Tile ────────────────────────────────────────────────────────────────
// The 4 numbers that matter most at a glance. Navy left-border is the one
// visual accent on the page — everything else stays quiet.

const HeroTile = ({ icon: Icon, label, value, sub, onClick }) => {
  const clickable = typeof onClick === 'function';
  return (
    <div
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? onClick : undefined}
      onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
      className={`relative rounded-xl border border-border bg-card p-4 pl-5 overflow-hidden ${
        clickable ? 'cursor-pointer hover:bg-muted/40 active:scale-[0.98] transition-all' : ''
      }`}
    >
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#0F305C]" />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">{label}</p>
          <p className="text-2xl font-bold mt-1 text-foreground">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
        <Icon className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
      </div>
    </div>
  );
};

// ─── Status Chip Strip ────────────────────────────────────────────────────────
// Compact, clickable, replaces a wall of near-identical cards with a single
// scannable row. Each chip carries its own status color as the accent.

const StatusChip = ({ icon: Icon, label, value, color, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-2 pl-2.5 pr-3 py-2 rounded-lg border border-border bg-card hover:bg-muted/40 active:scale-[0.98] transition-all text-left shrink-0"
  >
    <Icon className={`w-3.5 h-3.5 ${color}`} />
    <span className="text-sm font-semibold text-foreground">{value}</span>
    <span className="text-xs text-muted-foreground">{label}</span>
  </button>
);

// ─── Sidebar mini stat (label/value row, no card chrome) ──────────────────────

const MiniStat = ({ label, value, color = 'text-foreground', onClick }) => {
  const clickable = typeof onClick === 'function';
  return (
    <div
      onClick={onClick}
      className={`flex items-center justify-between py-2 px-1 rounded-md ${
        clickable ? 'cursor-pointer hover:bg-muted/40' : ''
      }`}
    >
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm font-semibold ${color}`}>{value}</span>
    </div>
  );
};

// ─── Section Header ───────────────────────────────────────────────────────────

const SectionTitle = ({ children, action }) => (
  <div className="flex items-center justify-between px-1">
    <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
      {children}
    </h2>
    {action}
  </div>
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

// ─── Plain card wrapper ────────────────────────────────────────────────────────

const PlainCard = ({ className = '', children }) => (
  <div className={`rounded-xl border border-border bg-card text-card-foreground ${className}`}>
    {children}
  </div>
);

const ViewAll = ({ onClick }) => (
  <button onClick={onClick} className="text-xs text-primary hover:underline">
    View all
  </button>
);

// ─── Repairs table (shared by Admin/Manager/Staff) ────────────────────────────

const RepairsTable = ({ repairs, navigate, showCustomerCol = true, showChargeCol = true, emptyText = 'No repairs yet' }) => (
  <PlainCard>
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            {['Repair ID', 'Device', ...(showCustomerCol ? ['Customer'] : []), 'Status', ...(showChargeCol ? ['Charge'] : []), 'Date'].map((h) => (
              <th key={h} className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {repairs.length === 0 ? (
            <tr><td colSpan={6} className="text-center py-8 text-sm text-muted-foreground">{emptyText}</td></tr>
          ) : repairs.map((r) => (
            <tr key={r._id}
              className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
              onClick={() => navigate(`/app/repairs/${r._id}`)}
            >
              <td className="py-2.5 px-4 text-sm font-medium text-foreground">{r.repairId}</td>
              <td className="py-2.5 px-4 text-sm text-muted-foreground">{r.deviceModel}</td>
              {showCustomerCol && <td className="py-2.5 px-4 text-sm text-muted-foreground">{r.customer?.name || '—'}</td>}
              <td className="py-2.5 px-4"><StatusBadge status={r.status} /></td>
              {showChargeCol && <td className="py-2.5 px-4 text-sm text-foreground">{formatCurrency(r.serviceCharge)}</td>}
              <td className="py-2.5 px-4 text-sm text-muted-foreground whitespace-nowrap">{formatDate(r.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <div className="md:hidden divide-y divide-border">
      {repairs.length === 0 ? (
        <p className="text-center py-8 text-sm text-muted-foreground">{emptyText}</p>
      ) : repairs.map((r) => (
        <div key={r._id}
          className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-muted/30 cursor-pointer"
          onClick={() => navigate(`/app/repairs/${r._id}`)}
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">{r.repairId}</p>
            <p className="text-xs text-muted-foreground truncate">{r.deviceModel}{showCustomerCol && r.customer?.name ? ` · ${r.customer.name}` : ''}</p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <StatusBadge status={r.status} />
            {showChargeCol && <p className="text-xs font-medium text-foreground">{formatCurrency(r.serviceCharge)}</p>}
          </div>
        </div>
      ))}
    </div>
  </PlainCard>
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
  const goRepairs = (status) => () => navigate(status ? `/app/repairs?status=${status}` : '/app/repairs');

  const statusChips = [
    { icon: Clock,         label: 'Received',       value: repairStats?.received ?? 0,      color: 'text-yellow-500', status: 'received' },
    { icon: Wrench,        label: 'In Progress',    value: repairStats?.inProgress ?? 0,     color: 'text-blue-500',   status: 'in-progress' },
    { icon: PackageCheck,  label: 'Ready',          value: repairStats?.ready ?? 0,          color: 'text-purple-500', status: 'ready' },
    { icon: CheckCircle,   label: 'Completed',      value: repairStats?.completed ?? 0,      color: 'text-green-500',  status: 'completed' },
    { icon: XCircle,       label: 'Cancelled',      value: repairStats?.cancelled ?? 0,      color: 'text-red-500',    status: 'cancelled' },
    { icon: AlertCircle,   label: 'Not Repairable', value: repairStats?.notRepairable ?? 0,  color: 'text-orange-500', status: 'not-repairable' },
  ];

  return (
    <div className="space-y-6 p-4 pb-24 md:pb-6">

      {/* ── Hero ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <HeroTile icon={ClipboardList} label="Total Repairs" value={repairStats?.total ?? 0} onClick={goRepairs()} />
        <HeroTile icon={Wrench} label="In Progress" value={repairStats?.inProgress ?? 0} onClick={goRepairs('in-progress')} />
        <HeroTile icon={TrendingUp} label="Net Revenue" value={formatCurrency(net)} sub="Received minus paid out" />
        <HeroTile icon={Users} label="Customers" value={customerStats?.total ?? 0} sub={`${customerStats?.active ?? 0} active`} onClick={() => navigate('/app/customers')} />
      </div>

      {/* ── Body: main + sidebar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Main column */}
        <div className="lg:col-span-8 space-y-6">
          <div className="space-y-3">
            <SectionTitle>Repair Status</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {statusChips.map((c) => (
                <StatusChip key={c.status} icon={c.icon} label={c.label} value={c.value} color={c.color} onClick={goRepairs(c.status)} />
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <SectionTitle action={<ViewAll onClick={() => navigate('/app/repairs')} />}>Recent Repairs</SectionTitle>
            <RepairsTable repairs={recentRepairs} navigate={navigate} />
          </div>

          <div className="space-y-3">
            <SectionTitle action={<ViewAll onClick={() => navigate('/app/payments')} />}>Recent Payments</SectionTitle>
            <PlainCard>
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

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="space-y-3">
            <SectionTitle>Payments</SectionTitle>
            <PlainCard className="p-3 divide-y divide-border">
              <MiniStat label="Total Received" value={formatCurrency(paymentStats?.totalReceivable)} color="text-green-500" onClick={() => navigate('/app/payments?type=receivable')} />
              <MiniStat label="Total Paid Out" value={formatCurrency(paymentStats?.totalPayable)} color="text-orange-500" onClick={() => navigate('/app/payments?type=payable')} />
              <MiniStat label="Net" value={formatCurrency(net)} color={net >= 0 ? 'text-green-500' : 'text-red-500'} />
            </PlainCard>
          </div>

          <div className="space-y-3">
            <SectionTitle>Pickup</SectionTitle>
            <PlainCard className="p-3 divide-y divide-border">
              <MiniStat label="Picked Up" value={repairStats?.pickedUp ?? 0} color="text-green-500" onClick={() => navigate('/app/repairs?isPickedUp=true')} />
              <MiniStat label="Not Picked Up" value={repairStats?.notPickedUp ?? 0} onClick={() => navigate('/app/repairs?isPickedUp=false&status=ready,not-repairable')} />
            </PlainCard>
          </div>

          <div className="space-y-3">
            <SectionTitle>Customers</SectionTitle>
            <PlainCard className="p-3 divide-y divide-border">
              <MiniStat label="Business" value={customerStats?.business ?? 0} color="text-blue-500" onClick={() => navigate('/app/customers?type=business')} />
              <MiniStat label="Individual" value={customerStats?.individual ?? 0} onClick={() => navigate('/app/customers?type=individual')} />
            </PlainCard>
          </div>
        </div>

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

  const goRepairs = (status) => () => navigate(status ? `/app/repairs?status=${status}` : '/app/repairs');

  const statusChips = [
    { icon: Clock,         label: 'Received',       value: repairStats?.received ?? 0,      color: 'text-yellow-500', status: 'received' },
    { icon: Wrench,        label: 'In Progress',    value: repairStats?.inProgress ?? 0,     color: 'text-blue-500',   status: 'in-progress' },
    { icon: PackageCheck,  label: 'Ready',          value: repairStats?.ready ?? 0,          color: 'text-purple-500', status: 'ready' },
    { icon: CheckCircle,   label: 'Completed',      value: repairStats?.completed ?? 0,      color: 'text-green-500',  status: 'completed' },
    { icon: XCircle,       label: 'Cancelled',      value: repairStats?.cancelled ?? 0,      color: 'text-red-500',    status: 'cancelled' },
    { icon: AlertCircle,   label: 'Not Repairable', value: repairStats?.notRepairable ?? 0,  color: 'text-orange-500', status: 'not-repairable' },
  ];

  return (
    <div className="space-y-6 p-4 pb-24 md:pb-6">

      {/* ── Hero ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <HeroTile icon={ClipboardList} label="Total Repairs" value={repairStats?.total ?? 0} onClick={goRepairs()} />
        <HeroTile icon={Wrench} label="In Progress" value={repairStats?.inProgress ?? 0} onClick={goRepairs('in-progress')} />
        <HeroTile icon={ArrowDownLeft} label="Received" value={formatCurrency(paymentStats?.totalReceivable)} sub={`${paymentStats?.receivableCount ?? 0} payments`} onClick={() => navigate('/app/payments?type=receivable')} />
        <HeroTile icon={ArrowUpRight} label="Paid Out" value={formatCurrency(paymentStats?.totalPayable)} sub={`${paymentStats?.payableCount ?? 0} payments`} onClick={() => navigate('/app/payments?type=payable')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <div className="space-y-3">
            <SectionTitle>Repair Status</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {statusChips.map((c) => (
                <StatusChip key={c.status} icon={c.icon} label={c.label} value={c.value} color={c.color} onClick={goRepairs(c.status)} />
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <SectionTitle action={<ViewAll onClick={() => navigate('/app/repairs')} />}>Recent Repairs</SectionTitle>
            <RepairsTable repairs={recentRepairs} navigate={navigate} />
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="space-y-3">
            <SectionTitle>Pickup</SectionTitle>
            <PlainCard className="p-3 divide-y divide-border">
              <MiniStat label="Picked Up" value={repairStats?.pickedUp ?? 0} color="text-green-500" onClick={() => navigate('/app/repairs?isPickedUp=true')} />
              <MiniStat label="Not Picked Up" value={repairStats?.notPickedUp ?? 0} onClick={() => navigate('/app/repairs?isPickedUp=false&status=ready,not-repairable')} />
            </PlainCard>
          </div>
        </div>
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
      <div className="grid grid-cols-3 gap-3">
        <HeroTile icon={ClipboardList} label="Assigned" value={counts.total} onClick={goRepairs()} />
        <HeroTile icon={Wrench} label="In Progress" value={counts.inProgress} onClick={goRepairs('in-progress')} />
        <HeroTile icon={PackageCheck} label="Ready" value={counts.ready} onClick={goRepairs('ready')} />
      </div>

      <div className="space-y-3">
        <SectionTitle action={<ViewAll onClick={() => navigate('/app/repairs')} />}>Assigned to Me</SectionTitle>
        <RepairsTable repairs={myRepairs} navigate={navigate} showChargeCol={false} emptyText="No repairs assigned to you" />
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