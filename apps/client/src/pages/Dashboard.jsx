import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Smartphone, TrendingUp, Clock, CheckCircle, AlertCircle, ArrowUpRight, Plus, Phone, Mail } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const stats = [
  { title: 'Total Repairs', value: '248', change: '+12%', icon: Smartphone, accent: 'text-blue-500', bg: 'bg-blue-500/10' },
  { title: 'Revenue', value: '₹15,248', change: '+8%', icon: TrendingUp, accent: 'text-green-500', bg: 'bg-green-500/10' },
  { title: 'In Progress', value: '12', change: '+2', icon: Clock, accent: 'text-amber-500', bg: 'bg-amber-500/10' },
  { title: 'Completed', value: '215', change: '+18', icon: CheckCircle, accent: 'text-indigo-500', bg: 'bg-indigo-500/10' },
];

const recentRepairs = [
  { id: 1, device: 'iPhone 15 Pro', issue: 'Screen Replacement', customer: 'Sarah Johnson', status: 'in-progress', date: '2024-03-05' },
  { id: 2, device: 'Samsung Galaxy S24', issue: 'Battery Replacement', customer: 'Mike Smith', status: 'completed', date: '2024-03-04' },
  { id: 3, device: 'Google Pixel 8', issue: 'Camera Repair', customer: 'Emily Davis', status: 'received', date: '2024-03-05' },
  { id: 4, device: 'iPhone 14', issue: 'Water Damage', customer: 'Tom Wilson', status: 'completed', date: '2024-03-03' },
  { id: 5, device: 'OnePlus 12', issue: 'Software Issue', customer: 'Lisa Brown', status: 'in-progress', date: '2024-03-05' },
];

const weeklyTrends = [
  { day: 'Mon', repairs: 12 },
  { day: 'Tue', repairs: 18 },
  { day: 'Wed', repairs: 15 },
  { day: 'Thu', repairs: 22 },
  { day: 'Fri', repairs: 28 },
  { day: 'Sat', repairs: 35 },
  { day: 'Sun', repairs: 10 },
];

const statusConfig = {
  'in-progress': { label: 'In Progress', class: 'bg-blue-500/10 text-blue-500' },
  'completed': { label: 'Completed', class: 'bg-green-500/10 text-green-500' },
  'received': { label: 'Received', class: 'bg-amber-500/10 text-amber-500' },
  'ready': { label: 'Ready', class: 'bg-indigo-500/10 text-indigo-500' },
  'cancelled': { label: 'Cancelled', class: 'bg-red-500/10 text-red-500' },
};

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const maxRepairs = Math.max(...weeklyTrends.map(t => t.repairs));

  return (
    <>
      {/* Header */}
      <div className="relative overflow-hidden border-b border-border bg-gradient-to-r from-background via-muted/20 to-background p-6">

        {/* Tech Blueprint Pattern Overlay */}
        <div className="absolute inset-0 opacity-25 dark:opacity-20 pointer-events-none"
          style={{
            backgroundImage: `url("/dashboard-pattern.svg")`,
            backgroundSize: '100px 100px'
          }}
        />

        {/* Ambient Glows */}
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

        {/* Header Content */}
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              Good morning, {user?.name?.split(' ')[0]}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Here's what's happening today.
            </p>
          </div>

          {/* Optional Action Button */}
          {/* <button
            onClick={() => navigate('/repairs/new')}
            className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Repair
          </button> */}
          <div className="flex flex-col items-end text-right text-xs sm:text-sm bg-muted/40 sm:bg-transparent p-2 sm:p-0 rounded-lg border border-border/40 sm:border-none">
            <span className="font-medium text-muted-foreground mb-1 text-[11px] uppercase tracking-wider">
              Need Support?
            </span>
            <div className="flex flex-col gap-1 text-foreground/80">
              <Link
                to="mailto:support@yourdomain.com"
                className="flex items-center gap-1.5 hover:text-primary transition-colors justify-end"
              >
                <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                support@yourdomain.com
              </Link>
              <Link
                to="tel:+1234567890"
                className="flex items-center gap-1.5 hover:text-primary transition-colors justify-end"
              >
                <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                +1 (234) 567-890
              </Link>
              <p>Mon - Fri • 9:00 AM - 7:00 PM</p>
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-6 p-4">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <Card key={i} className="border-border shadow-none">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-semibold text-foreground mt-1">{stat.value}</p>
                    <p className={`text-xs mt-1 flex items-center gap-1 ${stat.accent}`}>
                      <ArrowUpRight className="w-3 h-3" />
                      {stat.change}
                    </p>
                  </div>
                  <div className={`p-2 rounded-lg ${stat.bg}`}>
                    <stat.icon className={`w-4 h-4 ${stat.accent}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Repairs + Weekly Trend */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Recent Repairs */}
          <Card className="lg:col-span-2 border-border shadow-none">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Recent Repairs</CardTitle>
                <button
                  onClick={() => navigate('/repairs')}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  View all <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground">Device</th>
                      <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground">Customer</th>
                      <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentRepairs.map((repair) => {
                      const s = statusConfig[repair.status] || statusConfig['received'];
                      return (
                        <tr
                          key={repair.id}
                          onClick={() => navigate(`/repairs/${repair.id}`)}
                          className="border-b border-border last:border-0 hover:bg-muted/50 cursor-pointer transition-colors"
                        >
                          <td className="py-3 px-4">
                            <p className="text-sm font-medium text-foreground">{repair.device}</p>
                            <p className="text-xs text-muted-foreground">{repair.issue}</p>
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">{repair.customer}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 text-xs rounded-md font-medium ${s.class}`}>
                              {s.label}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs text-muted-foreground">{repair.date}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Trend */}
          <Card className="border-border shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Weekly Repairs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {weeklyTrends.map((trend, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-7">{trend.day}</span>
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${(trend.repairs / maxRepairs) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-foreground w-6 text-right">{trend.repairs}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Dashboard;