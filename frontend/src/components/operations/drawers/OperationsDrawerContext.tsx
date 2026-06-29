import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

export type DrawerType = 
  | 'deposit' 
  | 'withdrawal' 
  | 'bulk' 
  | 'internal' 
  | 'external' 
  | 'recovery' 
  | 'batch' 
  | 'preset' 
  | 'presetPreview'
  | null;

export interface DrawerData {
  studentId?: string;
  [key: string]: any;
}

interface OperationsDrawerContextType {
  activeDrawer: DrawerType;
  drawerData?: DrawerData;
  openDrawer: (type: DrawerType, data?: DrawerData) => void;
  closeDrawer: () => void;
}

const OperationsDrawerContext = createContext<OperationsDrawerContextType | undefined>(undefined);

export const OperationsDrawerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeDrawer, setActiveDrawer] = useState<DrawerType>(null);
  const [drawerData, setDrawerData] = useState<DrawerData | undefined>();

  const openDrawer = (type: DrawerType, data?: DrawerData) => {
    setDrawerData(data);
    setActiveDrawer(type);
  };
  const closeDrawer = () => {
    setActiveDrawer(null);
    setDrawerData(undefined);
  };

  return (
    <OperationsDrawerContext.Provider value={{ activeDrawer, drawerData, openDrawer, closeDrawer }}>
      {children}
    </OperationsDrawerContext.Provider>
  );
};

export const useOperationsDrawer = () => {
  const context = useContext(OperationsDrawerContext);
  if (context === undefined) {
    throw new Error('useOperationsDrawer must be used within an OperationsDrawerProvider');
  }
  return context;
};
