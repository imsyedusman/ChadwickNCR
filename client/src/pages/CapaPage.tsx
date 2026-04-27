import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ncrService } from '../services/ncr.service';
import { CheckCircle, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

const CapaPage = () => {
  const { user } = useAuth();
  const [actions, setActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ncrService.getMyCapaActions().then(data => {
      const myActions = (Array.isArray(data) ? data : []).map((a: any) => ({
        ...a,
        ncrAutoId: a.ncr?.autoId,
        ncrTitle: a.ncr?.title
      }));
      setActions(myActions);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mt-20"></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight">My Action Items</h1>
        <p className="text-muted-foreground mt-1">Corrective and preventive actions assigned to you.</p>
      </header>

      <div className="grid gap-4">
        {actions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <CheckCircle size={48} className="mx-auto mb-4 opacity-20" />
              <p>You have no pending action items. Great job!</p>
            </CardContent>
          </Card>
        ) : (
          actions.map(action => (
            <Card key={action.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-primary uppercase">{action.ncrAutoId}</span>
                    <Badge variant={action.status === 'COMPLETED' ? 'success' : 'outline'} className="text-[10px]">
                      {action.status}
                    </Badge>
                  </div>
                  <h3 className="text-sm font-bold">{action.description}</h3>
                  <p className="text-xs text-muted-foreground italic">Related to: {action.ncrTitle}</p>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Due Date</p>
                    <p className={cn(
                      "text-xs font-bold",
                      new Date(action.dueDate) < new Date() && action.status !== 'COMPLETED' ? "text-destructive" : ""
                    )}>
                      {new Date(action.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <Link to={`/ncrs/${action.ncrId}`}>
                    <Button size="sm" variant="outline">
                      View NCR
                      <ExternalLink size={14} className="ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};


export default CapaPage;
