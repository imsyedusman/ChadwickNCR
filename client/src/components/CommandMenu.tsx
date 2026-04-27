import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  FileText, 
  LayoutDashboard, 
  CheckSquare, 
  History,
  Settings
} from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';

const CommandMenu = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[1001]" />
        <Dialog.Content className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-full max-w-[640px] z-[1002]">
          <Command className="bg-card border rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <Command.Input 
                placeholder="Search commands or records..." 
                className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2">
              <Command.Empty className="py-6 text-center text-sm">No results found.</Command.Empty>
              
              <Command.Group heading="Navigation" className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                <Command.Item onSelect={() => runCommand(() => navigate('/'))} className="flex items-center gap-2 px-2 py-3 rounded-md cursor-pointer hover:bg-accent text-sm aria-selected:bg-accent">
                  <LayoutDashboard size={16} />
                  <span>Dashboard</span>
                </Command.Item>
                <Command.Item onSelect={() => runCommand(() => navigate('/ncrs'))} className="flex items-center gap-2 px-2 py-3 rounded-md cursor-pointer hover:bg-accent text-sm aria-selected:bg-accent">
                  <FileText size={16} />
                  <span>All NCRs</span>
                </Command.Item>
                <Command.Item onSelect={() => runCommand(() => navigate('/capa'))} className="flex items-center gap-2 px-2 py-3 rounded-md cursor-pointer hover:bg-accent text-sm aria-selected:bg-accent">
                  <CheckSquare size={16} />
                  <span>My Actions</span>
                </Command.Item>
              </Command.Group>

              <Command.Group heading="Actions" className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2 border-t">
                <Command.Item onSelect={() => runCommand(() => navigate('/ncrs/new'))} className="flex items-center gap-2 px-2 py-3 rounded-md cursor-pointer hover:bg-accent text-sm aria-selected:bg-accent">
                  <Plus size={16} />
                  <span>Issue New NCR</span>
                </Command.Item>
                <Command.Item onSelect={() => runCommand(() => navigate('/reports'))} className="flex items-center gap-2 px-2 py-3 rounded-md cursor-pointer hover:bg-accent text-sm aria-selected:bg-accent">
                  <History size={16} />
                  <span>View Audit Trail</span>
                </Command.Item>
                <Command.Item onSelect={() => runCommand(() => navigate('/settings'))} className="flex items-center gap-2 px-2 py-3 rounded-md cursor-pointer hover:bg-accent text-sm aria-selected:bg-accent">
                  <Settings size={16} />
                  <span>Settings</span>
                </Command.Item>
              </Command.Group>
            </Command.List>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default CommandMenu;
