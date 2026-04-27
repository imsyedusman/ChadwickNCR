import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('http://localhost:3001/api/auth/login', { email, password });
      login(res.data.token, res.data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm space-y-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="flex flex-col items-center gap-2 text-center">
          <img src="/logo.svg" alt="Chadwick Logo" className="h-12 mb-2" />
          <h1 className="text-2xl font-bold tracking-tight">NCR Management</h1>
          <p className="text-sm text-muted-foreground font-medium">Quality & Compliance Platform</p>
        </div>

        <Card className="shadow-2xl border-none">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-center">Welcome Back</CardTitle>
            <CardDescription className="text-center text-xs">
              Enter your credentials to access the platform
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {error && (
              <div className="bg-destructive/10 p-3 rounded-md flex items-center gap-3 text-destructive text-xs font-semibold animate-in slide-in-from-top-2">
                <AlertCircle size={16} />
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Email Address</p>
                <Input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  placeholder="admin@chadwickswitchboards.com.au"
                  className="bg-muted/30 focus-visible:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Password</p>
                  <button type="button" className="text-[10px] text-primary hover:underline font-bold">Forgot?</button>
                </div>
                <div className="relative">
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                    placeholder="••••••••"
                    className="bg-muted/30 focus-visible:ring-primary/20 pr-10"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full mt-2 font-bold py-6 shadow-lg shadow-primary/20" disabled={loading}>
                {loading ? "Authenticating..." : "Sign In to Platform"}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <p className="text-center text-[10px] text-muted-foreground font-medium">
          Protected by enterprise-grade encryption.
          <br />© 2026 Chadwick Switchboards
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
