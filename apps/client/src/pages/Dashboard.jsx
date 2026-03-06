import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LayoutDashboard, 
  Smartphone, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp 
} from 'lucide-react';

const Dashboard = () => {
  // Demo data for stats
  const stats = [
    {
      title: 'Total Repairs',
      value: '248',
      change: '+12%',
      icon: Smartphone,
      color: 'bg-blue-500',
    },
    {
      title: 'Revenue',
      value: '$15,248',
      change: '+8%',
      icon: DollarSign,
      color: 'bg-green-500',
    },
    {
      title: 'Pending',
      value: '12',
      change: '+2',
      icon: Clock,
      color: 'bg-yellow-500',
    },
    {
      title: 'Completed',
      value: '215',
      change: '+18',
      icon: CheckCircle,
      color: 'bg-purple-500',
    },
  ];

  // Demo data for recent repairs
  const recentRepairs = [
    {
      id: 1,
      device: 'iPhone 15 Pro',
      issue: 'Screen Replacement',
      customer: 'Sarah Johnson',
      status: 'In Progress',
      date: '2024-03-05',
    },
    {
      id: 2,
      device: 'Samsung Galaxy S24',
      issue: 'Battery Replacement',
      customer: 'Mike Smith',
      status: 'Completed',
      date: '2024-03-04',
    },
    {
      id: 3,
      device: 'Google Pixel 8',
      issue: 'Camera Repair',
      customer: 'Emily Davis',
      status: 'Pending',
      date: '2024-03-05',
    },
    {
      id: 4,
      device: 'iPhone 14',
      issue: 'Water Damage',
      customer: 'Tom Wilson',
      status: 'Completed',
      date: '2024-03-03',
    },
    {
      id: 5,
      device: 'OnePlus 12',
      issue: 'Software Issue',
      customer: 'Lisa Brown',
      status: 'In Progress',
      date: '2024-03-05',
    },
  ];

  // Demo data for weekly trends
  const weeklyTrends = [
    { day: 'Mon', repairs: 12, revenue: 850 },
    { day: 'Tue', repairs: 18, revenue: 1200 },
    { day: 'Wed', repairs: 15, revenue: 950 },
    { day: 'Thu', repairs: 22, revenue: 1500 },
    { day: 'Fri', repairs: 28, revenue: 1900 },
    { day: 'Sat', repairs: 35, revenue: 2200 },
    { day: 'Sun', repairs: 10, revenue: 700 },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's your repair service overview.</p>
        </div>
        <div className="mt-4 md:mt-0">
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
            New Repair Request
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">{stat.title}</CardTitle>
              <div className={`${stat.color} p-2 rounded-lg`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <p className="text-xs text-green-600 mt-1 flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" />
                {stat.change} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Repairs & Weekly Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Repairs */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle>Recent Repairs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Device</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Issue</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Customer</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRepairs.map((repair) => (
                    <tr key={repair.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm font-medium">{repair.device}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{repair.issue}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{repair.customer}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          repair.status === 'Completed' ? 'bg-green-100 text-green-700' :
                          repair.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {repair.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{repair.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Trend */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Weekly Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {weeklyTrends.map((trend, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{trend.day}</span>
                    <span className="font-medium">{trend.repairs} repairs</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${(trend.repairs / 35) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-sm">API Service</h4>
                <p className="text-xs text-green-600">Operational</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Database</h4>
                <p className="text-xs text-green-600">Connected</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-yellow-50 rounded-lg">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Backup System</h4>
                <p className="text-xs text-yellow-600">Scheduled</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
