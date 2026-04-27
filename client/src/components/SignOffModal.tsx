import React, { useState } from 'react';
import { ShieldCheck, X, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { cn } from '../lib/utils';

interface SignOffModalProps {
  title: string;
  description: string;
  onConfirm: (metadata: any) => void;
  onClose: () => void;
  isLoading?: boolean;
}

const SignOffModal: React.FC<SignOffModalProps> = ({ title, description, onConfirm, onClose, isLoading }) => {
  const [agreed, setAgreed] = useState(false);
  const [notes, setNotes] = useState('');

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
      <Card className="w-full max-w-[500px] border-primary/20 shadow-2xl relative animate-in zoom-in-95 duration-200">
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
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 text-primary">
              <ShieldCheck size={32} />
            </div>
            <h2 className="text-2xl font-black tracking-tight mb-2 uppercase">{title}</h2>
            <p className="text-sm text-muted-foreground font-medium italic">{description}</p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Final Observations</p>
              <textarea 
                rows={3} 
                value={notes} 
                onChange={e => setNotes(e.target.value)}
                placeholder="Optional notes for the audit trail..."
                className="flex min-h-[80px] w-full rounded-md border border-border/60 bg-muted/5 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all font-medium"
              />
            </div>

            <label className="flex gap-4 p-4 bg-muted/20 rounded-xl border border-border/40 cursor-pointer group active:scale-[0.99] transition-all">
              <input 
                type="checkbox" 
                checked={agreed} 
                onChange={e => setAgreed(e.target.checked)} 
                className="mt-1 h-4 w-4 rounded border-border/60 text-primary focus:ring-primary"
              />
              <span className="text-[11px] font-bold leading-relaxed text-muted-foreground group-hover:text-foreground transition-colors uppercase tracking-tight">
                I confirm that I have reviewed the non-conformance and the corrective actions taken. This electronic signature is the legal equivalent of my handwritten signature.
              </span>
            </label>
          </div>

          <div className="flex gap-4 mt-10">
            <Button variant="outline" onClick={onClose} className="flex-1 font-black text-xs uppercase tracking-widest h-12 shadow-none" disabled={isLoading}>
              Discard
            </Button>
            <Button 
              disabled={!agreed || isLoading} 
              onClick={() => onConfirm({ notes, timestamp: new Date().toISOString() })}
              className="flex-[2] font-black text-xs uppercase tracking-widest h-12 shadow-none"
            >
              {isLoading ? 'Processing...' : 'Sign & Confirm'}
            </Button>
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">
            <AlertCircle size={14} />
            Logged in immutable audit trail
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignOffModal;
