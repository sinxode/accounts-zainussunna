import { useEffect } from 'react';
import { useUIStore } from '../store/useUIStore';
import { useOperationsDrawer } from '../components/operations/drawers/OperationsDrawerContext';

export const useKeyboardShortcuts = () => {
  const { 
    setCommandPaletteOpen, 
    setSearchOpen, 
    setActiveModal, 
    closeAll,
    isCommandPaletteOpen,
    isSearchOpen,
    activeModal
  } = useUIStore();
  const { openDrawer } = useOperationsDrawer();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName);
      
      if (e.key === 'Escape') {
        closeAll();
        return;
      }

      if (isInput && e.key !== 'Escape') return;

      // Command Palette: Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!isCommandPaletteOpen);
      }

      // Search: /
      if (e.key === '/') {
        e.preventDefault();
        setSearchOpen(!isSearchOpen);
      }

      // Quick Actions
      if (e.key.toLowerCase() === 'n') {
        openDrawer('deposit');
      }
      if (e.key.toLowerCase() === 'w') {
        openDrawer('withdrawal');
      }
      if (e.key.toLowerCase() === 'b') {
        setActiveModal('storeBill');
      }
      if (e.key.toLowerCase() === 'd') {
        setActiveModal('distribution');
      }
      if (e.key.toLowerCase() === 'c') {
        setActiveModal('collection');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, isSearchOpen, activeModal, setCommandPaletteOpen, setSearchOpen, setActiveModal, closeAll, openDrawer]);
};
