import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ncrService } from '../services/ncr.service';
import type { NCR } from '../services/ncr.service';
import { 
  AlertTriangle, 
  Clock, 
  FileText,
  TrendingUp,
  ArrowRight,
  Plus,
  CalendarDays
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

const StatsCard = ({ title, value, icon: Icon, description, trend, status }: any) => (
  <Card className="border-border/40 hover:bg-muted/5 transition-all duration-300">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">{title}</CardTitle>
      <Icon className={cn("h-4 w-4", status === 'urgent' ? "text-primary" : "text-muted-foreground/60")} />
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-black tracking-tighter mb-1">{value}</div>
      <div className="flex items-center gap-2">
        <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1", trend > 0 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
          {trend > 0 ? <TrendingUp size={10} /> : null}
          {trend > 0 ? `+${trend}` : 'stable'}
        </span>
        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">{description}</p>
      </div>
    </CardContent>
  </Card>
);

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ncrs, setNcrs] = useState<NCR[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ncrService.getAll().then(data => {
      setNcrs(Array.isArray(data) ? data : []);
      setLoading(false);
    }).catch(err => {
      console.error('Dashboard data fetch failed:', err);
      setLoading(false);
    });
  }, []);

  const stats = {
    total: ncrs.length,
    open: ncrs.filter(n => n.status !== 'CLOSED' && n.status !== 'CANCELLED').length,
    critical: ncrs.filter(n => n.severity === 'CRITICAL' && n.status !== 'CLOSED').length,
    overdue: ncrs.filter(n => n.status !== 'CLOSED' && n.status !== 'CANCELLED').length // Mock logic
  };

  const trendData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    const nextDay = new Date(d);
    nextDay.setDate(nextDay.getDate() + 1);
    return {
      name: d.toLocaleDateString('en-US', { weekday: 'short' }),
      count: ncrs.filter(ncr => {
        const ncrDate = new Date(ncr.createdAt);
        return ncrDate >= d && ncrDate < nextDay;
      }).length
    };
  });

  const severityData = [
    { name: 'Critical', value: stats.critical > 0 ? stats.critical : 0, full: 10, color: '#2b95ff' },
    { name: 'Major', value: ncrs.filter(n => n.severity === 'MAJOR').length, full: 10, color: '#2b95ff' },
    { name: 'Minor', value: ncrs.filter(n => n.severity === 'MINOR').length, full: 10, color: '#2b95ff' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tighter mb-2">Registry Overview</h1>
          <p className="text-lg text-muted-foreground font-medium italic">Performance and compliance health metrics.</p>
        </div>
        <Button onClick={() => navigate('/ncrs/new')} size="lg" className="font-black px-8">
          <Plus size={20} className="mr-2" />
          Issue New NCR
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="Active Reports" 
          value={stats.open} 
          icon={FileText} 
          description="Awaiting processing" 
          trend={2}
          status="normal"
        />
        <StatsCard 
          title="Critical Cases" 
          value={stats.critical} 
          icon={AlertTriangle} 
          description="Requiring attention" 
          trend={1}
          status="urgent"
        />
        <StatsCard 
          title="Awaiting Approval" 
          value={ncrs.filter(n => n.status === 'AWAITING_APPROVAL').length} 
          icon={Clock} 
          description="Pending review" 
          trend={0}
          status="normal"
        />
        <StatsCard 
          title="Overdue Items" 
          value={stats.overdue} 
          icon={CalendarDays} 
          description="Past target date" 
          trend={3}
          status="urgent"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        <Card className="border-border/40 flex flex-col h-full">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Registration Trend</CardTitle>
            <CardDescription>Daily volume of quality occurrences</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" opacity={0.5} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4, fill: 'hsl(var(--primary))' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/40 flex flex-col h-full">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Risk Profile</CardTitle>
            <CardDescription>Distribution across severity levels</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] mt-auto flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={severityData} layout="vertical" margin={{ left: 10, right: 30 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} fontSize={12} fontWeight="bold" />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }} />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={4} barSize={24} background={{ fill: 'hsl(var(--muted))', radius: 4 }} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/40 overflow-hidden">
        <CardHeader className="bg-muted/20 border-b flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold">Activity Feed</CardTitle>
            <CardDescription>Latest quality records and status changes</CardDescription>
          </div>
          <Link to="/ncrs">
            <Button variant="ghost" size="sm" className="font-bold text-primary">Full Registry</Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b bg-muted/5">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">NCR ID</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Details</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Severity</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Date</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {ncrs.slice(0, 5).map(ncr => (
                  <tr key={ncr.id} className="hover:bg-muted/10 transition-colors group">
                    <td className="px-6 py-4">
                      <div className={cn("inline-flex items-center px-2 py-1 rounded border text-[10px] font-bold uppercase tracking-tighter",
                        ncr.status === 'DRAFT' ? 'bg-gray-200 text-gray-800' :
                        ncr.status === 'ASSIGNED' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                        ncr.status === 'AWAITING_APPROVAL' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                        ncr.status === 'APPROVED' ? 'bg-green-100 text-green-800 border-green-200' :
                        ncr.status === 'REJECTED' ? 'bg-red-100 text-red-800 border-red-200 font-bold' :
                        ncr.status === 'CLOSED' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                        'bg-slate-200 text-slate-800'
                      )}>
                        {ncr.status.replace('_', ' ')}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-black text-[10px] tracking-widest text-muted-foreground">{ncr.autoId}</td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold group-hover:text-primary transition-colors">{ncr.title}</p>
                      <p className="text-[10px] text-muted-foreground font-bold tracking-tight uppercase">{ncr.projectId} • {ncr.location}</p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={cn("text-[9px] font-black border-border/60", ncr.severity === 'CRITICAL' ? "text-destructive border-destructive/20" : "")}>
                        {ncr.severity}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-muted-foreground">
                      {new Date(ncr.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link to={`/ncrs/${ncr.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 px-2 group-hover:bg-primary/5 transition-colors">
                          <ArrowRight size={14} className="text-muted-foreground group-hover:text-primary" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;
