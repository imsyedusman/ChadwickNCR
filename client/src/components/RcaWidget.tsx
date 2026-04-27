import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Save } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { cn } from '../lib/utils';

interface RcaWidgetProps {
  initialData?: string[];
  onSave: (whys: string[]) => void;
}

const RcaWidget: React.FC<RcaWidgetProps> = ({ initialData, onSave }) => {
  const [whys, setWhys] = useState<string[]>(initialData && initialData.length > 0 ? initialData : ['', '', '', '', '']);
  const [isExpanded, setIsExpanded] = useState(true);

  const handleWhyChange = (index: number, value: string) => {
    const newWhys = [...whys];
    newWhys[index] = value;
    setWhys(newWhys);
  };

  return (
    <Card className="border-border/40 bg-muted/5 overflow-hidden shadow-none">
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/10 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <HelpCircle size={18} className="text-primary" />
          <h3 className="text-sm font-black uppercase tracking-widest">Root Cause Analysis (5-Why)</h3>
        </div>
        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </div>

      {isExpanded && (
        <CardContent className="p-6 pt-0 space-y-6">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight italic">
            Iteratively ask "Why?" to drill down to the fundamental cause of the occurrence.
          </p>
          
          <div className="space-y-4">
            {whys.map((why, index) => (
              <div key={index} className="flex gap-4 items-start group">
                <div className="flex-none h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black group-hover:bg-primary group-hover:text-white transition-all">
                  {index + 1}
                </div>
                <div className="flex-1 space-y-1.5">
                  <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">
                    {index === 0 ? 'Initial Deviation' : `Contributing Factor ${index}`}
                  </label>
                  <textarea 
                    rows={2} 
                    value={why} 
                    onChange={(e) => handleWhyChange(index, e.target.value)}
                    placeholder="Enter causal factor..."
                    className="flex min-h-[60px] w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all font-medium"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t border-border/20">
            <Button 
              size="sm"
              onClick={() => onSave(whys)}
              className="font-black text-[10px] uppercase tracking-widest shadow-none h-9 px-6"
            >
              <Save size={14} className="mr-2" />
              Persist Analysis
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default RcaWidget;
