import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Bell, Shield, Info, CheckCircle2, Save, AlertCircle, Settings2, CalendarClock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';
import { cn } from '../lib/utils';

interface Settings {
  globalEnabled: boolean;
  ncrCreatedEnabled: boolean;
  ncrAssignedEnabled: boolean;
  statusChangeEnabled: boolean;
  overdueEnabled: boolean;
  verificationRequiredEnabled: boolean;
  verificationRejectedEnabled: boolean;
  ncrClosedEnabled: boolean;
  ncrCancelledEnabled: boolean;
  overdueFirstFollowUpDays: number;
  overdueRecurringDays: number;
}

const NotificationSettingsPage = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingToggles, setSavingToggles] = useState<Record<string, boolean>>({});
  const [savedIndicator, setSavedIndicator] = useState<string | null>(null);
  const [overdueSaving, setOverdueSaving] = useState(false);
  const [overdueSaved, setOverdueSaved] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/notification-settings');
      setSettings(res.data);
    } catch (err) {
      console.error('Failed to fetch notification settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateToggle = async (key: keyof Settings, value: boolean) => {
    if (!settings) return;
    setSavingToggles(prev => ({ ...prev, [key]: true }));
    try {
      const res = await api.patch('/notification-settings', { [key]: value });
      setSettings(res.data);
      setSavedIndicator(key);
      setTimeout(() => setSavedIndicator(null), 2000);
    } catch (err) {
      console.error(`Failed to update ${key}:`, err);
    } finally {
      setSavingToggles(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleOverdueSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setOverdueSaving(true);
    try {
      const res = await api.patch('/notification-settings', {
        overdueFirstFollowUpDays: settings.overdueFirstFollowUpDays,
        overdueRecurringDays: settings.overdueRecurringDays,
      });
      setSettings(res.data);
      setOverdueSaved(true);
      setTimeout(() => setOverdueSaved(false), 3000);
    } catch (err) {
      console.error('Failed to update overdue settings:', err);
    } finally {
      setOverdueSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );

  if (!settings) return <div>Failed to load settings.</div>;

  const isDisabled = !settings.globalEnabled;

  const NotificationToggle = ({ id, label, description, checked, onChange }: { id: string, label: string, description: string, checked: boolean, onChange: (val: boolean) => void }) => (
    <div className={cn(
      "flex items-center justify-between p-4 rounded-xl border transition-all duration-300",
      isDisabled && id !== 'globalEnabled' ? "opacity-40 grayscale pointer-events-none" : "bg-card hover:border-primary/30"
    )}>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Label htmlFor={id} className="text-sm font-black uppercase tracking-tight">{label}</Label>
          <AnimatePresence>
            {savedIndicator === id && (
              <motion.span
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="text-[10px] font-black text-emerald-600 uppercase tracking-widest"
              >
                Saved
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-md">{description}</p>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        disabled={savingToggles[id] || (isDisabled && id !== 'globalEnabled')}
      />
    </div>
  );

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-700">
      <header>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-primary border-primary/20 bg-primary/5">Admin Only</Badge>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Notification Settings</h1>
        <p className="text-muted-foreground mt-1">Configure global email notification triggers and system alerts.</p>
      </header>

      {/* Global Master Toggle */}
      <Card className="border-primary/20 shadow-lg shadow-primary/5 bg-primary/5 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Settings2 size={20} className="text-primary" />
                <h3 className="text-lg font-black uppercase tracking-tight text-primary">Global Email System</h3>
              </div>
              <p className="text-sm text-primary/70 font-medium">Master switch to enable or disable all outgoing email notifications across the platform.</p>
            </div>
            <Switch
              checked={settings.globalEnabled}
              onCheckedChange={(val) => updateToggle('globalEnabled', val)}
              className="scale-125 data-[state=checked]:bg-primary"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-8">
        {/* General Notifications */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <Bell size={18} className="text-primary" />
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground">General Notifications</h2>
          </div>
          <div className="grid gap-3">
            <NotificationToggle
              id="ncrCreatedEnabled"
              label="NCR Created / Issued"
              description="Sent to the assigned department handler and NCR owner when an NCR is moved from Draft to Issued."
              checked={settings.ncrCreatedEnabled}
              onChange={(val) => updateToggle('ncrCreatedEnabled', val)}
            />
            <NotificationToggle
              id="ncrAssignedEnabled"
              label="NCR Assigned to Owner"
              description="Sent to the newly assigned owner when they are given responsibility for an NCR."
              checked={settings.ncrAssignedEnabled}
              onChange={(val) => updateToggle('ncrAssignedEnabled', val)}
            />
            <NotificationToggle
              id="statusChangeEnabled"
              label="Status Changes"
              description="Sent to the owner, department handler, and issuer whenever an NCR status is updated."
              checked={settings.statusChangeEnabled}
              onChange={(val) => updateToggle('statusChangeEnabled', val)}
            />
            <NotificationToggle
              id="verificationRequiredEnabled"
              label="Verification Required"
              description="Sent to department QA managers or admins when an NCR enters the verification stage."
              checked={settings.verificationRequiredEnabled}
              onChange={(val) => updateToggle('verificationRequiredEnabled', val)}
            />
            <NotificationToggle
              id="verificationRejectedEnabled"
              label="Verification Rejected"
              description="Sent to the owner and handler if a verifier rejects the corrective actions."
              checked={settings.verificationRejectedEnabled}
              onChange={(val) => updateToggle('verificationRejectedEnabled', val)}
            />
            <NotificationToggle
              id="ncrClosedEnabled"
              label="NCR Closed"
              description="Sent to all stakeholders when an NCR is formally closed."
              checked={settings.ncrClosedEnabled}
              onChange={(val) => updateToggle('ncrClosedEnabled', val)}
            />
            <NotificationToggle
              id="ncrCancelledEnabled"
              label="NCR Cancelled"
              description="Sent to all stakeholders if an NCR is cancelled with a justification."
              checked={settings.ncrCancelledEnabled}
              onChange={(val) => updateToggle('ncrCancelledEnabled', val)}
            />
          </div>
        </section>

        {/* Overdue Reminder Settings */}
        <Card className={cn("border-border/40 transition-opacity duration-300", isDisabled && "opacity-40 grayscale pointer-events-none")}>
          <CardHeader>
            <div className="flex items-center gap-2 mb-1">
              <CalendarClock size={18} className="text-primary" />
              <CardTitle className="text-lg font-black uppercase tracking-tight">Overdue Reminder Schedule</CardTitle>
            </div>
            <CardDescription>Configure how frequently users receive reminders for overdue corrective actions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6">
              <NotificationToggle
                id="overdueEnabled"
                label="Overdue Action Notifications"
                description="Enable automated daily checks for corrective actions past their due date."
                checked={settings.overdueEnabled}
                onChange={(val) => updateToggle('overdueEnabled', val)}
              />
              
              <form onSubmit={handleOverdueSave} className={cn("space-y-6 pt-2", !settings.overdueEnabled && "opacity-40 pointer-events-none")}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      First Follow-up Reminder
                      <Info size={12} className="opacity-50" />
                    </Label>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        value={settings.overdueFirstFollowUpDays}
                        onChange={(e) => setSettings({ ...settings, overdueFirstFollowUpDays: parseInt(e.target.value) || 0 })}
                        className="w-24 font-black"
                        min={1}
                      />
                      <span className="text-sm font-bold text-muted-foreground">days after due date</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      Recurring Frequency
                      <Info size={12} className="opacity-50" />
                    </Label>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        value={settings.overdueRecurringDays}
                        onChange={(e) => setSettings({ ...settings, overdueRecurringDays: parseInt(e.target.value) || 0 })}
                        className="w-24 font-black"
                        min={1}
                      />
                      <span className="text-sm font-bold text-muted-foreground">days thereafter</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-2">
                  <Button type="submit" disabled={overdueSaving} className="font-black uppercase tracking-widest px-8">
                    {overdueSaving ? "Saving..." : <><Save size={16} className="mr-2" /> Save Schedule</>}
                  </Button>
                  <AnimatePresence>
                    {overdueSaved && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2 text-emerald-600"
                      >
                        <CheckCircle2 size={16} />
                        <span className="text-xs font-black uppercase tracking-widest">Changes Saved Successfully</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer Info */}
      <div className="bg-muted/30 p-4 rounded-xl border border-dashed flex items-start gap-3">
        <Info size={18} className="text-muted-foreground shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">About Email System</p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            All notifications are sent from <code className="bg-muted px-1.5 py-0.5 rounded font-bold">noreply@chadwickswitchboards.tech</code>. 
            The system runs an automated check daily at 8:00 AM (Sydney Time) to process overdue reminders based on the schedule above.
          </p>
        </div>
      </div>
    </div>
  );
};

const Badge = ({ children, variant, className }: any) => (
  <span className={cn(
    "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border",
    variant === 'outline' ? "border-primary/20 bg-primary/5 text-primary" : "bg-primary text-white",
    className
  )}>
    {children}
  </span>
);

export default NotificationSettingsPage;
