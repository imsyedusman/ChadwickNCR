import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { AlertCircle, CheckCircle2, Lock, ShieldCheck, ArrowRight, Eye, EyeOff } from 'lucide-react';

const ChangePasswordPage = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const validatePassword = (pass: string) => {
    const hasMinLength = pass.length >= 8;
    const hasUppercase = /[A-Z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    return { hasMinLength, hasUppercase, hasNumber };
  };

  const validation = validatePassword(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validation.hasMinLength || !validation.hasUppercase || !validation.hasNumber) {
      setError('Password does not meet requirements');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await axios.patch('http://localhost:3001/api/auth/change-password-enforced', { newPassword });
      
      // Update local user state
      if (user) {
        const updatedUser = { ...user, mustChangePassword: false };
        const token = localStorage.getItem('token') || '';
        login(token, updatedUser);
      }
      
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12">
      <div className="w-full max-w-[420px] space-y-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="bg-primary/10 p-4 rounded-full mb-1">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Set New Password</h1>
          <p className="text-sm text-muted-foreground font-medium max-w-[320px] leading-relaxed">
            Please set a new secure password to continue accessing the platform.
          </p>
        </div>

        <Card className="shadow-2xl border-none overflow-hidden">
          <CardHeader className="bg-muted/30 pb-5 pt-7 px-8">
            <CardTitle className="text-lg">Security Requirements</CardTitle>
            <CardDescription className="text-xs">
              Satisfy all criteria to enable password update.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 pb-8 px-8 grid gap-5">
            {error && (
              <div className="bg-destructive/10 p-3 rounded-md flex items-center gap-3 text-destructive text-xs font-semibold animate-in slide-in-from-top-2">
                <AlertCircle size={16} />
                {error}
              </div>
            )}
            
            <div className="grid gap-3">
              <div className="flex items-center gap-3 text-sm font-medium transition-colors">
                {validation.hasMinLength ? <CheckCircle2 className="text-green-500 h-4 w-4" /> : <ShieldCheck className="text-muted-foreground/40 h-4 w-4" />}
                <span className={validation.hasMinLength ? "text-green-600 font-semibold" : "text-muted-foreground"}>Minimum 8 characters</span>
              </div>
              <div className="flex items-center gap-3 text-sm font-medium transition-colors">
                {validation.hasUppercase ? <CheckCircle2 className="text-green-500 h-4 w-4" /> : <ShieldCheck className="text-muted-foreground/40 h-4 w-4" />}
                <span className={validation.hasUppercase ? "text-green-600 font-semibold" : "text-muted-foreground"}>At least one uppercase letter</span>
              </div>
              <div className="flex items-center gap-3 text-sm font-medium transition-colors">
                {validation.hasNumber ? <CheckCircle2 className="text-green-500 h-4 w-4" /> : <ShieldCheck className="text-muted-foreground/40 h-4 w-4" />}
                <span className={validation.hasNumber ? "text-green-600 font-semibold" : "text-muted-foreground"}>At least one number</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 pt-6 border-t border-muted">
              <div className="space-y-2">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">New Password</p>
                <div className="relative">
                  <Input 
                    type={showNewPassword ? "text" : "password"} 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    required 
                    placeholder="••••••••"
                    className="bg-muted/30 focus-visible:ring-primary/20 h-12 pr-12 text-base shadow-sm"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Confirm New Password</p>
                <div className="relative">
                  <Input 
                    type={showConfirmPassword ? "text" : "password"} 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    required 
                    placeholder="••••••••"
                    className="bg-muted/30 focus-visible:ring-primary/20 h-12 pr-12 text-base shadow-sm"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full mt-3 font-bold py-7 shadow-lg shadow-primary/15 group h-auto" disabled={loading}>
                {loading ? "Updating..." : (
                  <span className="flex items-center gap-2 text-base">
                    Set Password & Continue
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <p className="text-center text-[10px] text-muted-foreground font-medium uppercase tracking-wider opacity-60">
          Security policy enforced by system administrator
        </p>
      </div>
    </div>
  );
};

export default ChangePasswordPage;
