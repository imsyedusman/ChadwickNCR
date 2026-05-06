import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, ArrowUpDown, Eye } from 'lucide-react';
import { ncrService } from '../services/ncr.service';
import type { NCR } from '../services/ncr.service';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger } from '../components/ui/select';
import { cn, formatSydneyDate, formatDuration } from '../lib/utils';

const NcrListPage = () => {
  const [ncrs, setNcrs] = useState<NCR[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [sortBy, setSortBy] = useState('DATE_DESC');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ncrService.getAll().then(data => {
      setNcrs(Array.isArray(data) ? data : []);
      setLoading(false);
    }).catch(err => {
      console.error('NCR list fetch failed:', err);
      setLoading(false);
    });
  }, []);

  const filteredNcrs = ncrs.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.autoId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.projectId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = filterSeverity === 'ALL' || n.severity === filterSeverity;
    const matchesStatus = filterStatus === 'ALL' || n.status === filterStatus;
    return matchesSearch && matchesSeverity && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === 'DATE_DESC') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortBy === 'DATE_ASC') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else if (sortBy === 'SEVERITY') {
      const severityOrder: Record<string, number> = { CRITICAL: 0, MAJOR: 1, MINOR: 2 };
      const aOrder = severityOrder[a.severity] ?? 3;
      const bOrder = severityOrder[b.severity] ?? 3;
      return aOrder - bOrder;
    }
    return 0;
  });

  const getSeverityClasses = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-50 text-red-700 border-red-200';
      case 'MAJOR': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'MINOR': return 'bg-sky-50 text-sky-700 border-sky-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const getStatusClasses = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'ASSIGNED': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'AWAITING_APPROVAL': return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'VERIFICATION': return 'bg-purple-50 text-purple-600 border-purple-200';
      case 'APPROVED': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'REJECTED': return 'bg-red-50 text-red-600 border-red-200';
      case 'CLOSED': return 'bg-slate-500 text-white border-transparent';
      case 'CANCELLED': return 'bg-red-100 text-red-700 border-red-200 opacity-70';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const statuses = ['ALL', 'DRAFT', 'ASSIGNED', 'AWAITING_APPROVAL', 'VERIFICATION', 'APPROVED', 'REJECTED', 'CLOSED', 'CANCELLED'];

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Non-Conformances</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage and track all quality issues across projects.</p>
        </div>
        <Link to="/ncrs/new">
          <Button className="shadow-lg shadow-primary/20 shrink-0 font-bold">
            <Plus size={18} className="mr-2" />
            New Report
          </Button>
        </Link>
      </header>

      <Card className="border-border/40 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 p-4 bg-muted/20 border-b">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by ID, Title, or Project..."
                className="pl-9 w-full h-10 border-border/60 focus-visible:ring-primary/20"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px] h-10 border-border/60 px-3">
                  <div className="flex items-center">
                    <div className="h-2 w-2 rounded-full mr-2 bg-primary/40" />
                    <span className="text-xs font-bold uppercase tracking-tight whitespace-nowrap">{filterStatus === 'ALL' ? 'All Statuses' : filterStatus.replace('_', ' ')}</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {statuses.map(s => (
                    <SelectItem key={s} value={s} className="text-xs font-bold uppercase tracking-tight">
                      {s === 'ALL' ? 'All Statuses' : s.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                <SelectTrigger className="w-[160px] h-10 border-border/60 px-3">
                  <div className="flex items-center">
                    <Filter size={14} className="mr-2 text-muted-foreground shrink-0" />
                    <span className="text-xs font-bold uppercase tracking-tight whitespace-nowrap">{filterSeverity === 'ALL' ? 'All Severity' : filterSeverity}</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-xs font-bold uppercase tracking-tight">All Severity</SelectItem>
                  <SelectItem value="CRITICAL" className="text-xs font-bold uppercase tracking-tight">Critical</SelectItem>
                  <SelectItem value="MAJOR" className="text-xs font-bold uppercase tracking-tight">Major</SelectItem>
                  <SelectItem value="MINOR" className="text-xs font-bold uppercase tracking-tight">Minor</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[170px] h-10 border-border/60 px-3">
                  <div className="flex items-center">
                    <ArrowUpDown size={14} className="mr-2 text-muted-foreground shrink-0" />
                    <span className="text-xs font-bold uppercase tracking-tight whitespace-nowrap">{sortBy === 'DATE_DESC' ? 'Newest First' : sortBy === 'DATE_ASC' ? 'Oldest First' : 'Severity'}</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DATE_DESC" className="text-xs font-bold uppercase tracking-tight">Newest First</SelectItem>
                  <SelectItem value="DATE_ASC" className="text-xs font-bold uppercase tracking-tight">Oldest First</SelectItem>
                  <SelectItem value="SEVERITY" className="text-xs font-bold uppercase tracking-tight">Severity</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] border-b bg-muted/5">
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Details</th>
                  <th className="px-6 py-4">Project</th>
                  <th className="px-6 py-4">Severity</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date Issued</th>
                  <th className="px-6 py-4">Date Closed</th>
                  <th className="px-6 py-4">Ageing</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredNcrs.map(ncr => (
                  <tr key={ncr.id} className="group hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-5">
                      <span className="text-[11px] font-black font-mono text-primary bg-primary/5 px-2 py-1 rounded">{ncr.autoId}</span>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-black tracking-tight">{ncr.title}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">{ncr.category} • {ncr.location}</p>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black">{ncr.projectId}</span>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase truncate max-w-[120px]">{ncr.projectName || 'Main Project'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className={cn("inline-flex items-center px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-widest", getSeverityClasses(ncr.severity))}>
                        {ncr.severity}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className={cn("inline-flex items-center px-2 py-1 rounded border text-[9px] font-black uppercase tracking-widest", getStatusClasses(ncr.status))}>
                        {ncr.status.replace('_', ' ')}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[11px] font-bold text-muted-foreground">{formatSydneyDate(ncr.createdAt)}</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[11px] font-bold text-muted-foreground">
                        {ncr.status === 'CLOSED' ? formatSydneyDate(ncr.dateClosed) : <span className="opacity-30">—</span>}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[11px] font-bold text-muted-foreground">
                        {formatDuration((ncr.dateClosed ? new Date(ncr.dateClosed).getTime() : Date.now()) - new Date(ncr.createdAt).getTime())}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <Link to={`/ncrs/${ncr.id}`}>
                        <Button variant="outline" size="sm" className="h-8 px-4 text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all">
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredNcrs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground bg-muted/5">
              <div className="p-4 bg-muted rounded-full mb-4 opacity-40">
                <Search size={32} />
              </div>
              <p className="text-sm font-bold uppercase tracking-widest opacity-50">No matching reports found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NcrListPage;
