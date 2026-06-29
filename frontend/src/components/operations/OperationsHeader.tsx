import React from 'react';
import { Search, Command, Bell, Plus } from 'lucide-react';
import { Button } from '../ui/Button';

export const OperationsHeader: React.FC = () => {
  return (
    <div className="flex justify-between items-center w-full mb-2">
      <div>
        <h1 className="text-3xl font-bold text-primary mb-1 tracking-tight">Operations Center</h1>
        <p className="text-secondary text-sm font-medium tracking-wide">Financial Operations Hub</p>
      </div>

      <div className="flex gap-4 items-center">
        <div className="flex items-center gap-2 bg-secondary border border-border rounded-xl px-4 py-2 cursor-pointer hover:border-primary transition-colors">
          <Search size={16} className="text-muted" />
          <span className="text-sm text-muted mr-4">Search...</span>
          <div className="flex items-center gap-1 bg-tertiary px-2 py-0.5 rounded text-xs font-bold text-muted border border-border">
            <Command size={12} /> K
          </div>
        </div>

        <Button variant="ghost" icon={<Bell size={20} className="text-primary" />} className="relative">
          <div className="absolute top-2 right-2 w-2 h-2 bg-danger rounded-full border border-white"></div>
        </Button>

        <Button variant="primary" icon={<Plus size={16} />}>New Action</Button>
      </div>
    </div>
  );
};
