import React from 'react';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';

export type Role = 'ADMIN' | 'QA_MANAGER' | 'HANDLER' | 'VIEWER';

interface RoleBadgeProps {
  role: Role;
  className?: string;
}

const RoleBadge: React.FC<RoleBadgeProps> = ({ role, className }) => {
  const getRoleStyles = (role: Role) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'QA_MANAGER':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'HANDLER':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'VIEWER':
        return 'bg-slate-50 text-slate-700 border-slate-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const formatRole = (role: string) => {
    return role.replace('_', ' ');
  };

  return (
    <div className={cn(
      "inline-flex items-center px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-widest",
      getRoleStyles(role),
      className
    )}>
      {formatRole(role)}
    </div>
  );
};

export default RoleBadge;
