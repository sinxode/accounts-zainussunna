import React, { useState } from 'react';
import { Plus, ArrowDownCircle, ArrowUpCircle, Copy, ArrowLeftRight } from 'lucide-react';
import { clsx } from 'clsx';
import { useOperationsDrawer } from './drawers/OperationsDrawerContext';
import type { DrawerType } from './drawers/OperationsDrawerContext';

export const OperationsFAB: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { openDrawer } = useOperationsDrawer();

  const actions: { id: DrawerType; label: string; icon: any }[] = [
    { id: 'deposit', label: 'Quick Deposit', icon: ArrowDownCircle },
    { id: 'withdrawal', label: 'Quick Withdrawal', icon: ArrowUpCircle },
    { id: 'internal', label: 'Internal Transfer', icon: ArrowLeftRight },
    { id: 'bulk', label: 'Bulk Operation', icon: Copy },
  ];

  // We are reusing the .fabContainer, .fabMenu, .fabItem classes from the previous global FAB styles we injected
  // To keep it perfectly clean, let's just use inline Tailwind that maps to the same principles or recreate the classes if they were scoped.
  // Actually, we can use Tailwind here for the FAB to avoid cross-module pollution since the previous one was in batches/styles.
  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4">
      <div className={clsx(
        "flex flex-col items-end gap-3 transition-all duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]",
        isOpen ? "opacity-100 pointer-events-auto translate-y-0" : "opacity-0 pointer-events-none translate-y-5"
      )}>
        {actions.map(action => {
          const Icon = action.icon;
          return (
            <button 
              key={action.id} 
              className="group flex items-center gap-3 bg-transparent border-none cursor-pointer p-0"
              onClick={() => {
                openDrawer(action.id);
                setIsOpen(false);
              }}
            >
              <span className="bg-primary text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-md opacity-0 translate-x-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0">
                {action.label}
              </span>
              <div className="w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center shadow-md transition-all duration-200 group-hover:scale-110 group-hover:bg-primary-dark">
                <Icon size={18} />
              </div>
            </button>
          );
        })}
      </div>
      
      <button 
        className={clsx(
          "w-14 h-14 rounded-full flex items-center justify-center shadow-lg cursor-pointer border-none transition-all duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]",
          isOpen ? "bg-danger text-white rotate-45" : "bg-primary text-white hover:scale-105 hover:bg-primary-dark"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Plus size={24} />
      </button>
    </div>
  );
};
