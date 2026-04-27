import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { userService } from '../services/user.service';
import type { User } from '../services/user.service';
import { departmentService } from '../services/department.service';
import type { Department } from '../services/department.service';
import { Copy, Check, ShieldAlert } from 'lucide-react';
import { cn } from '../lib/utils';

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
  onSuccess: () => void;
  initialTempPassword?: string | null;
}

const UserDialog: React.FC<UserDialogProps> = ({ open, onOpenChange, user, onSuccess, initialTempPassword }) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'HANDLER' as User['role'],
    departmentId: '',
  });
  const [loading, setLoading] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    departmentService.getAll().then(setDepartments).catch(console.error);
  }, []);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        departmentId: user.departmentId,
      });
    } else {
      setFormData({
        name: '',
        email: '',
        role: 'HANDLER',
        departmentId: '',
      });
    }
    setTempPassword(initialTempPassword || null);
  }, [user, open, initialTempPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (user) {
        await userService.update(user.id, {
          name: formData.name,
          role: formData.role,
          departmentId: formData.departmentId,
        });
        onSuccess();
        onOpenChange(false);
      } else {
        const result = await userService.create(formData);
        if (result.tempPassword) {
          setTempPassword(result.tempPassword);
        } else {
          onSuccess();
          onOpenChange(false);
        }
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (tempPassword) {
      navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{user ? 'Edit User' : 'Invite New User'}</DialogTitle>
        </DialogHeader>

        {tempPassword ? (
          <div className="space-y-6 py-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 items-start">
              <ShieldAlert className="text-amber-600 shrink-0 mt-0.5" size={20} />
              <div className="space-y-1">
                <p className="text-sm font-black text-amber-900 uppercase tracking-tight">Security Notice</p>
                <p className="text-xs text-amber-800 leading-relaxed font-medium">
                  This temporary password will <span className="font-black underline">only be shown once</span>. 
                  Please copy it now and share it manually with the user.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Temporary Password</Label>
              <div className="relative group">
                <div className="bg-slate-900 text-slate-50 font-mono text-lg p-4 rounded-lg border border-slate-800 shadow-inner flex items-center justify-center tracking-[0.2em] font-black">
                  {tempPassword}
                </div>
                <Button
                  onClick={copyToClipboard}
                  variant="secondary"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-3 bg-slate-800 hover:bg-slate-700 text-white border-slate-700"
                >
                  {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span className="ml-2 text-[10px] font-black uppercase tracking-widest">{copied ? 'Copied' : 'Copy'}</span>
                </Button>
              </div>
            </div>

            <Button 
              className="w-full font-black uppercase tracking-widest py-6" 
              onClick={() => {
                onSuccess();
                onOpenChange(false);
              }}
            >
              I've noted the password
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@chadwick.com"
                required
                disabled={!!user}
              />
              {user && <p className="text-[10px] text-muted-foreground italic ml-1">Email cannot be changed after creation.</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: any) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="QA_MANAGER">QA Manager</SelectItem>
                    <SelectItem value="HANDLER">Handler</SelectItem>
                    <SelectItem value="VIEWER">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select
                  value={formData.departmentId}
                  onValueChange={(value) => setFormData({ ...formData, departmentId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select dept" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Processing...' : user ? 'Save Changes' : 'Create User'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UserDialog;
