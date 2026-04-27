import React, { useState } from 'react';
import { AlertCircle, X, MessageSquare } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

interface ReasonModalProps {
  title: string;
  description: string;
  onConfirm: (reason: string) => void;
  onClose: () => void;
  isLoading?: boolean;
}

const ReasonModal: React.FC<ReasonModalProps> = ({ title, description, onConfirm, onClose, isLoading }) => {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    if (!reason.trim()) {
      alert('A reason is required.');
      return;
    }
    onConfirm(reason);
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
      <Card className="w-full max-w-[450px] border-destructive/20 shadow-2xl relative animate-in zoom-in-95 duration-200">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onClose} 
          className="absolute top-4 right-4 h-8 w-8"
        >
          <X size={18} />
        </Button>

        <CardContent className="p-8 pt-10">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6 text-destructive">
              <MessageSquare size={32} />
            </div>
            <h2 className="text-2xl font-black tracking-tight mb-2 uppercase">{title}</h2>
            <p className="text-sm text-muted-foreground font-medium italic">{description}</p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Justification Reason</p>
              <textarea 
                required
                rows={4} 
                value={reason} 
                onChange={e => setReason(e.target.value)}
                placeholder="Enter formal justification here..."
                className="flex min-h-[120px] w-full rounded-md border-2 border-input bg-muted/5 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all font-medium"
              />
            </div>
          </div>

          <div className="flex gap-4 mt-10">
            <Button variant="outline" onClick={onClose} className="flex-1 font-black text-xs uppercase tracking-widest h-12" disabled={isLoading}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              disabled={!reason.trim() || isLoading} 
              onClick={handleConfirm}
              className="flex-[2] font-black text-xs uppercase tracking-widest h-12"
            >
              {isLoading ? 'Processing...' : 'Confirm Action'}
            </Button>
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">
            <AlertCircle size={14} />
            This action will be logged in the audit trail
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReasonModal;
