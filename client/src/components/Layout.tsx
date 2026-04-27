import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  FileText,
  Settings,
  LogOut,
  CheckSquare,
  History,
  X,
  Users,
  UserCircle,
  Search as SearchIcon
} from 'lucide-react';
import { cn } from '../lib/utils';

const TaperedMenu = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
    <line x1="2" y1="5" x2="18" y2="5" />
    <line x1="2" y1="10" x2="13" y2="10" />
    <line x1="2" y1="15" x2="8" y2="15" />
  </svg>
);
import ThemeToggle from './ThemeToggle';
import { Button } from './ui/button';
import CommandMenu from './CommandMenu';
import RoleBadge from './RoleBadge';

const NavItem = ({ to, icon, label, active, onClick }: { to: string, icon: React.ReactNode, label: string, active: boolean, onClick?: () => void }) => (
  <Link
    to={to}
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
      active
        ? "bg-secondary text-secondary-foreground shadow-sm"
        : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
    )}
  >
    {icon}
    {label}
  </Link>
);

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex min-h-screen bg-background font-sans">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar — fixed overlay on mobile, sticky in-flow on desktop */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-30 w-64 border-r bg-card/95 backdrop-blur-xl flex flex-col p-4 transition-transform duration-300 ease-in-out",
        "lg:sticky lg:top-0 lg:h-screen lg:z-auto lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between mb-8 px-2">
          <img src="/logo.svg" alt="Logo" className="h-8" />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              className="lg:hidden p-1 rounded-md hover:bg-muted text-muted-foreground"
              onClick={closeSidebar}
              aria-label="Close navigation"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full justify-start text-muted-foreground h-9 mb-6 border-dashed"
          onClick={() => {
            closeSidebar();
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
          }}
        >
          <SearchIcon size={14} className="mr-2" />
          <span className="flex-1 text-left">Search...</span>
          <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>

        <nav className="flex-1 space-y-1">
          <div className="px-2 mb-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Overview</p>
          </div>
          <NavItem to="/" icon={<LayoutDashboard size={18} />} label="Dashboard" active={location.pathname === '/'} onClick={closeSidebar} />
          <NavItem to="/ncrs" icon={<FileText size={18} />} label="All NCRs" active={location.pathname.startsWith('/ncrs')} onClick={closeSidebar} />

          <div className="px-2 mt-6 mb-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Management</p>
          </div>
          <NavItem to="/capa" icon={<CheckSquare size={18} />} label="My Actions" active={location.pathname === '/capa'} onClick={closeSidebar} />
          <NavItem to="/reports" icon={<History size={18} />} label="Audit Trail" active={location.pathname === '/reports'} onClick={closeSidebar} />
          
          {user?.role === 'ADMIN' && (
            <>
              <div className="px-2 mt-6 mb-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Admin</p>
              </div>
              <NavItem to="/admin/users" icon={<Users size={18} />} label="User Management" active={location.pathname.startsWith('/admin')} onClick={closeSidebar} />
            </>
          )}

          <div className="px-2 mt-6 mb-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Account</p>
          </div>
          <NavItem to="/profile" icon={<UserCircle size={18} />} label="My Profile" active={location.pathname === '/profile'} onClick={closeSidebar} />
          <NavItem to="/settings" icon={<Settings size={18} />} label="Settings" active={location.pathname === '/settings'} onClick={closeSidebar} />
        </nav>

        <div className="mt-auto pt-4 border-t">
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground shadow-inner shrink-0">
              {user?.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-semibold truncate text-foreground">{user?.name}</p>
              <RoleBadge role={user?.role as any} className="mt-0.5 scale-[0.8] origin-left" />
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={logout}
          >
            <LogOut size={16} className="mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Right side: mobile top bar + main content */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-10 flex items-center justify-between px-4 h-14 border-b bg-card/95 backdrop-blur-xl shrink-0">
          <img src="/logo.svg" alt="Logo" className="h-7" />
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md hover:bg-muted text-muted-foreground"
              aria-label="Open navigation"
            >
              <TaperedMenu />
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
            {children}
          </div>
        </main>
      </div>

      <CommandMenu />
    </div>
  );
};

export default Layout;
