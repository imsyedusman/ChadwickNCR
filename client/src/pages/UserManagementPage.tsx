import React, { useState, useEffect } from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { userService } from '../services/user.service';
import type { User } from '../services/user.service';
import { departmentService } from '../services/department.service';
import type { Department } from '../services/department.service';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  UserPlus, 
  Building2, 
  UserX,
  UserCheck, 
  Key, 
  Filter,
  Trash2,
  Edit2
} from 'lucide-react';
import UserDialog from '../components/UserDialog';
import RoleBadge from '../components/RoleBadge';
import { cn } from '../lib/utils';

const UserManagementPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  // Department management state
  const [newDeptName, setNewDeptName] = useState('');
  const [editingDept, setEditingDept] = useState<string | null>(null);
  const [editDeptName, setEditDeptName] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, deptsData] = await Promise.all([
        userService.getAll(),
        departmentService.getAll()
      ]);
      setUsers(usersData);
      setDepartments(deptsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
    const matchesDept = deptFilter === 'ALL' || user.departmentId === deptFilter;
    return matchesSearch && matchesRole && matchesDept;
  });

  const handleToggleStatus = async (user: User) => {
    try {
      await userService.setStatus(user.id, !user.isActive);
      loadData();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleResetPassword = async (user: User) => {
    if (window.confirm(`Reset password for ${user.name}? This will generate a new temporary password.`)) {
      try {
        const { tempPassword: newTemp } = await userService.resetPassword(user.id);
        setSelectedUser(user);
        setTempPassword(newTemp);
        setUserDialogOpen(true);
      } catch (error: any) {
        alert(error.message);
      }
    }
  };

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    try {
      await departmentService.create(newDeptName);
      setNewDeptName('');
      loadData();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDeleteDept = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      try {
        await departmentService.delete(id);
        loadData();
      } catch (error: any) {
        alert(error.message);
      }
    }
  };

  const handleUpdateDept = async (id: string) => {
    try {
      await departmentService.update(id, { name: editDeptName });
      setEditingDept(null);
      loadData();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleAssignPrimaryHandler = async (deptId: string, handlerId: string | null) => {
    try {
      await departmentService.update(deptId, { primaryHandlerId: handlerId });
      loadData();
    } catch (error: any) {
      alert(error.message);
    }
  };

  if (loading && users.length === 0) {
    return <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">User Management</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage team members, roles, and organizational structure.</p>
        </div>
        <Button onClick={() => { setSelectedUser(null); setUserDialogOpen(true); }} className="shadow-lg shadow-primary/20 shrink-0 font-bold">
          <UserPlus size={18} className="mr-2" />
          Invite User
        </Button>
      </header>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="bg-muted/50 p-1 mb-4">
          <TabsTrigger value="users" className="px-6 font-bold uppercase tracking-widest text-[10px]">Team Members</TabsTrigger>
          <TabsTrigger value="departments" className="px-6 font-bold uppercase tracking-widest text-[10px]">Departments</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card className="border-border/40 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 p-4 bg-muted/20 border-b">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    className="pl-9 w-full h-10 border-border/60 focus-visible:ring-primary/20"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-10 px-3 border-border/60">
                        <Filter size={14} className="mr-2 text-muted-foreground" />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                          {roleFilter === 'ALL' ? 'All Roles' : roleFilter.replace('_', ' ')}
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest opacity-50">Filter by Role</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => setRoleFilter('ALL')}>All Roles</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setRoleFilter('ADMIN')}>Admin</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setRoleFilter('QA_MANAGER')}>QA Manager</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setRoleFilter('HANDLER')}>Handler</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setRoleFilter('VIEWER')}>Viewer</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-10 px-3 border-border/60">
                        <Building2 size={14} className="mr-2 text-muted-foreground" />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                          {deptFilter === 'ALL' ? 'All Depts' : departments.find(d => d.id === deptFilter)?.name}
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="max-h-[300px] overflow-y-auto">
                      <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest opacity-50">Filter by Dept</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => setDeptFilter('ALL')}>All Departments</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {departments.map(dept => (
                        <DropdownMenuItem key={dept.id} onClick={() => setDeptFilter(dept.id)}>
                          {dept.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/5">
                      <TableHead className="text-[10px] font-black uppercase tracking-[0.2em]">Name</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-[0.2em]">Email</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-[0.2em]">Role</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-[0.2em]">Department</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-[0.2em]">Status</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-[0.2em]">Joined</TableHead>
                      <TableHead className="text-right text-[10px] font-black uppercase tracking-[0.2em]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow 
                        key={user.id} 
                        className={cn(
                          "group transition-colors",
                          !user.isActive && "bg-slate-50/50 opacity-70"
                        )}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-inner shrink-0",
                              user.isActive ? "bg-primary" : "bg-slate-300"
                            )}>
                              {user.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <span className={cn("text-sm font-black tracking-tight", !user.isActive && "text-muted-foreground")}>
                              {user.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-medium text-muted-foreground">{user.email}</TableCell>
                        <TableCell><RoleBadge role={user.role} /></TableCell>
                        <TableCell className="text-xs font-bold">{user.department?.name || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant={user.isActive ? "secondary" : "outline"} className={cn(
                            "text-[9px] font-black uppercase tracking-widest",
                            user.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-slate-100 text-slate-500 border-slate-200"
                          )}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-[11px] font-bold text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal size={16} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest opacity-50">Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => { setSelectedUser(user); setUserDialogOpen(true); }}>
                                <Edit2 size={14} className="mr-2" /> Edit Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleResetPassword(user)}>
                                <Key size={14} className="mr-2" /> Reset Password
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleToggleStatus(user)}
                                className={user.isActive ? "text-destructive" : "text-emerald-600"}
                              >
                                {user.isActive ? (
                                  <><UserX size={14} className="mr-2" /> Deactivate</>
                                ) : (
                                  <><UserCheck size={14} className="mr-2" /> Reactivate</>
                                )}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {filteredUsers.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 text-muted-foreground bg-muted/5">
                  <div className="p-4 bg-muted rounded-full mb-4 opacity-40">
                    <UserPlus size={32} />
                  </div>
                  <p className="text-sm font-bold uppercase tracking-widest opacity-50">No team members found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 border-border/40 shadow-sm h-fit">
              <CardHeader>
                <CardTitle className="text-lg font-black tracking-tight uppercase">Add Department</CardTitle>
                <CardDescription>Create a new functional area for Chadwick Switchboards.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateDept} className="space-y-4">
                  <div className="space-y-2">
                    <Input 
                      placeholder="e.g. Wiring, Site Works" 
                      value={newDeptName}
                      onChange={e => setNewDeptName(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full font-black uppercase tracking-widest">
                    <Plus size={16} className="mr-2" /> Add Dept
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 border-border/40 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-black tracking-tight uppercase">Existing Departments</CardTitle>
                <CardDescription>Manage and configure primary handlers for each department.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/5">
                      <TableHead className="text-[10px] font-black uppercase tracking-[0.2em]">Name</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-[0.2em]">Primary Handler</TableHead>
                      <TableHead className="text-right text-[10px] font-black uppercase tracking-[0.2em]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {departments.map((dept) => (
                      <TableRow key={dept.id}>
                        <TableCell className="py-4">
                          {editingDept === dept.id ? (
                            <div className="flex items-center gap-2">
                              <Input 
                                value={editDeptName} 
                                onChange={e => setEditDeptName(e.target.value)}
                                className="h-8 text-xs font-black"
                              />
                              <Button size="sm" onClick={() => handleUpdateDept(dept.id)} className="h-8">Save</Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingDept(null)} className="h-8">Cancel</Button>
                            </div>
                          ) : (
                            <span className="text-sm font-black tracking-tight">{dept.name}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={dept.primaryHandlerId || 'none'} 
                            onValueChange={(val) => handleAssignPrimaryHandler(dept.id, val === 'none' ? null : val)}
                          >
                            <SelectTrigger className="h-8 text-[10px] font-bold border-dashed">
                              <SelectValue placeholder="No primary handler" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none" className="text-[10px] font-bold">Unassigned</SelectItem>
                              {users.filter(u => u.departmentId === dept.id && u.isActive).map(u => (
                                <SelectItem key={u.id} value={u.id} className="text-[10px] font-bold">
                                  {u.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0"
                              onClick={() => { setEditingDept(dept.id); setEditDeptName(dept.name); }}
                            >
                              <Edit2 size={14} className="text-muted-foreground" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteDept(dept.id)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <UserDialog 
        open={userDialogOpen} 
        onOpenChange={(open) => {
          setUserDialogOpen(open);
          if (!open) setTempPassword(null);
        }} 
        user={selectedUser}
        initialTempPassword={tempPassword}
        onSuccess={loadData}
      />
    </div>
  );
};

export default UserManagementPage;
