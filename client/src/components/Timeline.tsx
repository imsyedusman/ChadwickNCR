import React from 'react';
import { User, Activity, ChevronRight } from 'lucide-react';

interface TimelineProps {
  logs: any[];
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const day = date.getDate();
  const month = date.toLocaleString('en-GB', { month: 'short' });
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

const Timeline: React.FC<TimelineProps> = ({ logs = [] }) => {
  if (!logs || !Array.isArray(logs)) return null;
  if (!logs || logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-3 opacity-30">
        <Activity size={32} />
        <p className="text-xs font-bold uppercase tracking-tight">No activity recorded</p>
      </div>
    );
  }

  const renderDetails = (log: any) => {
    const { action, details, user } = log;
    const userName = user?.name || 'Unknown User';
    
    switch (action) {
      case 'CREATE':
        return `Record created by ${userName}.`;
      case 'STATUS_CHANGE':
        const reasonStr = details.reason ? ` Reason: "${details.reason}"` : '';
        return `Status changed from ${details.from.replace(/_/g, ' ')} to ${details.to.replace(/_/g, ' ')} by ${userName}.${reasonStr}`;
      case 'RCA_UPDATE':
        return `Root Cause Analysis updated by ${userName}.`;
      case 'SIGN_OFF':
        return `Stage "${details.stage.replace(/_/g, ' ')}" signed off by ${userName}.`;
      case 'CAPA_ADDED':
        return `New CAPA action assigned by ${userName}.`;
      case 'DEPARTMENT_UPDATE':
        return `Assigned department updated by ${userName}.`;
      default:
        if (typeof details === 'string') return details;
        if (details && details.message) return details.message;
        return `${action.replace(/_/g, ' ')} by ${userName}`;
    }
  };

  return (
    <div className="relative space-y-6">
      {/* Vertical line */}
      <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border/40" />

      {logs.map((log, index) => (
        <div key={index} className="relative flex gap-4 pl-8 group">
          {/* Dot */}
          <div className="absolute left-0 top-1.5 h-[23px] w-[23px] rounded-full border border-border bg-background flex items-center justify-center z-10 group-hover:border-primary transition-colors">
            <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground group-hover:bg-primary transition-colors" />
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-[11px] text-foreground/80 font-medium leading-relaxed max-w-[80%]">
                {renderDetails(log)}
              </div>
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest shrink-0">
                {formatDate(log.timestamp)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Timeline;
