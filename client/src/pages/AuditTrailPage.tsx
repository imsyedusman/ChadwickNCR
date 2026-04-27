import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Search } from 'lucide-react';
import { ncrService } from '../services/ncr.service';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return `${date.getDate()}-${date.toLocaleString('en-GB', { month: 'short' })}-${date.getFullYear()}`;
};

const AuditTrailPage = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ncrService.getAuditLogs().then(data => {
      const logsData = (Array.isArray(data) ? data : []).map((l: any) => ({
        ...l,
        ncrAutoId: l.ncr?.autoId || 'N/A',
        ncrTitle: l.ncr?.title || 'N/A'
      }));
      setLogs(logsData);
      setLoading(false);
    }).catch(err => {
      console.error('Audit trail fetch failed:', err);
      setLoading(false);
    });
  }, []);

  const filteredLogs = logs.filter(l => 
    l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.ncrAutoId || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mt-20"></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Global Audit Trail</h1>
        <p className="text-muted-foreground mt-1">Immutable record of all system events and status transitions.</p>
      </header>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Filter by action, user, or NCR ID..." 
            className="pl-9"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b bg-muted/30">
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">NCR</th>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredLogs.map((log, i) => (
                  <tr key={i} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 text-xs font-medium whitespace-nowrap">
                      {formatDate(log.timestamp)}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-primary">{log.ncrAutoId}</p>
                      <p className="text-[10px] text-muted-foreground line-clamp-1">{log.ncrTitle}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center text-[8px] font-bold">
                          {log.user?.name?.charAt(0) || '?'}
                        </div>
                        <span className="text-xs font-medium">{log.user?.name || 'System'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-tight">
                        {log.action.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {typeof log.details === 'object' ? JSON.stringify(log.details) : (log.details || "-")}
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

export default AuditTrailPage;
