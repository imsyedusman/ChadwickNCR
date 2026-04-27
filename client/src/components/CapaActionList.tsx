import React, { useState } from 'react';
import { ncrService } from '../services/ncr.service';
import { 
  Plus, 
  CheckCircle2, 
  Clock, 
  User, 
  Calendar,
  AlertCircle,
  MoreVertical,
  Trash2
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

interface CapaActionListProps {
  ncrId: string;
  actions: any[];
  onUpdate: () => void;
  canEdit: boolean;
}

const CapaActionList: React.FC<CapaActionListProps> = ({ ncrId, actions = [], onUpdate, canEdit }) => {
  const { user } = useAuth();
  const [showAdd, setShowAdd] = useState(false);
  const [newAction, setNewAction] = useState({
    description: '',
    ownerId: user?.id || '',
    dueDate: ''
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAction.ownerId) {
      alert('User session not found. Please log in again.');
      return;
    }
    try {
      await ncrService.addCapaAction(ncrId, newAction);
      setNewAction({ description: '', ownerId: user?.id || '', dueDate: '' });
      setShowAdd(false);
      onUpdate();
    } catch (err) {
      alert('Failed to add action');
    }
  };

  const handleToggleComplete = async (actionId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
      await ncrService.updateCapaAction(actionId, { status: newStatus });
      onUpdate();
    } catch (err) {
      alert('Failed to update action');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground/60">Action Registry</h3>
        {canEdit && !showAdd && (
          <Button onClick={() => setShowAdd(true)} size="sm" variant="outline" className="font-black text-[10px] uppercase tracking-widest px-4 h-8 border-primary/20 text-primary hover:bg-primary/5">
            <Plus size={14} className="mr-2" />
            Add Action Item
          </Button>
        )}
      </div>

      {showAdd && (
        <Card className="border-primary/20 bg-primary/5 shadow-none animate-in slide-in-from-top-4 duration-300">
          <CardContent className="pt-6">
            <form onSubmit={handleAdd} className="space-y-4">
              <Input 
                placeholder="Describe the corrective or preventive action..." 
                value={newAction.description}
                onChange={e => setNewAction({...newAction, description: e.target.value})}
                required
                className="bg-background border-2 font-bold"
              />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-muted-foreground uppercase ml-1">Target Date</p>
                  <Input 
                    type="date" 
                    value={newAction.dueDate}
                    onChange={e => setNewAction({...newAction, dueDate: e.target.value})}
                    required
                    className="bg-background border-2 font-bold"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button type="submit" className="flex-1 font-black uppercase tracking-widest text-[11px] h-10 shadow-none">Save Action</Button>
                  <Button type="button" variant="ghost" onClick={() => setShowAdd(false)} className="h-10 text-[11px] font-black uppercase">Cancel</Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {actions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 bg-muted/5 rounded-2xl border border-dashed border-border/60">
            <div className="h-20 w-20 bg-background rounded-full flex items-center justify-center shadow-sm border border-border/40">
              <CheckCircle2 size={32} className="text-muted-foreground/20" />
            </div>
            <div className="max-w-[280px] space-y-2">
              <p className="text-sm font-bold tracking-tight">No Action Items Recorded</p>
              <p className="text-xs text-muted-foreground leading-relaxed">Establish corrective measures to prevent recurrence and finalize this record.</p>
            </div>
            {canEdit && (
               <Button onClick={() => setShowAdd(true)} variant="outline" className="font-black text-[10px] uppercase tracking-widest h-9 px-6">
                 Initiate First Action
               </Button>
            )}
          </div>
        ) : (
          actions.map(action => (
            <div 
              key={action.id} 
              className={cn(
                "group flex items-start gap-4 p-5 rounded-xl border transition-all duration-300",
                action.status === 'COMPLETED' 
                  ? "bg-muted/10 border-border/40 opacity-70" 
                  : "bg-background border-border/60 hover:border-primary/40 shadow-sm"
              )}
            >
              <button 
                onClick={() => handleToggleComplete(action.id, action.status)}
                className={cn(
                  "mt-0.5 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all duration-300",
                  action.status === 'COMPLETED' 
                    ? "bg-green-500 border-green-500 text-white" 
                    : "border-muted-foreground/30 hover:border-primary text-transparent"
                )}
              >
                <CheckCircle2 size={14} strokeWidth={3} />
              </button>

              <div className="flex-1 space-y-3">
                <p className={cn(
                  "text-sm font-bold leading-relaxed",
                  action.status === 'COMPLETED' ? "line-through text-muted-foreground" : ""
                )}>
                  {action.description}
                </p>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <User size={12} className="text-muted-foreground/40" />
                    <span className="text-[10px] font-black text-muted-foreground uppercase">{action.owner?.name || 'Assigned'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={12} className="text-muted-foreground/40" />
                    <span className="text-[10px] font-black text-muted-foreground uppercase">{new Date(action.dueDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {canEdit && (
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical size={14} className="text-muted-foreground" />
                </Button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CapaActionList;
