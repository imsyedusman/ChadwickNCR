import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Shield, Bell, Palette, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import ThemeToggle from '../components/ThemeToggle';
import { cn } from '../lib/utils';
import { Badge } from '../components/ui/badge';

const SettingsPage = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account preferences and system configuration.</p>
      </header>

      <div className="grid gap-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <User size={18} className="text-primary" />
              <CardTitle className="text-lg font-bold">Profile Information</CardTitle>
            </div>
            <CardDescription>Update your personal details and contact information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Full Name</p>
                <Input defaultValue={user?.name} readOnly className="bg-muted/30" />
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Email Address</p>
                <Input defaultValue={(user as any)?.email} readOnly className="bg-muted/30" />
              </div>
            </div>
            <div className="pt-2">
              <Button size="sm" variant="secondary" disabled>Edit Profile (Locked by Admin)</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Shield size={18} className="text-primary" />
              <CardTitle className="text-lg font-bold">Security & Permissions</CardTitle>
            </div>
            <CardDescription>Review your system role and access level.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border">
              <div>
                <p className="text-sm font-bold">System Role</p>
                <p className="text-xs text-muted-foreground">Your assigned role determines your permissions across the platform.</p>
              </div>
              <Badge variant="outline" className="px-4 py-1 font-bold tracking-widest">{user?.role}</Badge>
            </div>
            <Button size="sm" variant="outline">Change Password</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Palette size={18} className="text-primary" />
              <CardTitle className="text-lg font-bold">Preferences</CardTitle>
            </div>
            <CardDescription>Configure how you interact with the platform.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold">Visual Theme</p>
                <p className="text-xs text-muted-foreground">Switch between light and dark mode preferences.</p>
              </div>
              <ThemeToggle />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
