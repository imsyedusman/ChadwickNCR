import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/user.service';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import RoleBadge from '../components/RoleBadge';
import { Key, Mail, Building2 } from 'lucide-react';
import { cn } from '../lib/utils';

const UserProfilePage = () => {
  const { user } = useAuth();
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      await userService.changePassword(passwords.current, passwords.new);
      setMessage({ type: 'success', text: 'Password updated successfully' });
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground mt-1 text-sm">Manage your account settings and security.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Info */}
        <Card className="md:col-span-1 border-border/40 shadow-sm h-fit">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto h-20 w-20 rounded-full bg-primary flex items-center justify-center text-2xl font-black text-white shadow-inner mb-4">
              {user.name.split(' ').map(n => n[0]).join('')}
            </div>
            <CardTitle className="text-xl font-black tracking-tight">{user.name}</CardTitle>
            <div className="mt-2 flex justify-center">
              <RoleBadge role={user.role as any} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4 border-t">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Email Address</span>
              </div>
              <p className="text-sm font-bold truncate">{user.email}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Department</span>
              </div>
              <p className="text-sm font-bold">{user.departmentName || 'Not Assigned'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="md:col-span-2 border-border/40 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key size={18} className="text-primary" />
              <CardTitle className="text-lg font-black tracking-tight uppercase">Security</CardTitle>
            </div>
            <CardDescription>Update your password to keep your account secure.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-6">
              {message && (
                <div className={cn(
                  "p-4 rounded-md text-sm font-bold uppercase tracking-tight",
                  message.type === 'success' ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-700 border border-red-100"
                )}>
                  {message.text}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="current">Current Password</Label>
                <Input
                  id="current"
                  type="password"
                  value={passwords.current}
                  onChange={e => setPasswords({ ...passwords, current: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new">New Password</Label>
                  <Input
                    id="new"
                    type="password"
                    value={passwords.new}
                    onChange={e => setPasswords({ ...passwords, new: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirm New Password</Label>
                  <Input
                    id="confirm"
                    type="password"
                    value={passwords.confirm}
                    onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                    required
                  />
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full sm:w-auto font-black uppercase tracking-widest px-8">
                {loading ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserProfilePage;
