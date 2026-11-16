import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useUIStore } from '../store/useUIStore';
import { useOperationsDrawer } from '../components/operations/drawers/OperationsDrawerContext';
import { useAuth } from '../contexts/AuthContext';
import { ShortcutRegistry } from '../lib/shortcuts/shortcutRegistry';
import toast from 'react-hot-toast';

export const useKeyboardShortcuts = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  const { 
    isCommandPaletteOpen,
    setCommandPaletteOpen,
    isShortcutReferenceOpen,
    setShortcutReferenceOpen,
    isNotificationDrawerOpen,
    setNotificationDrawerOpen,
    pendingSequence,
    setPendingSequence,
    activeModal,
    closeConfirmation,
    confirmationConfig,
    closeAll
  } = useUIStore();

  const { activeDrawer, openDrawer, closeDrawer } = useOperationsDrawer();

  // Timer reference for sequence timeout (1200ms)
  const sequenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 0. Check if shortcuts are enabled in user preferences
      if (!ShortcutRegistry.isEnabled()) return;

      const target = e.target as HTMLElement;
      const isInput = 
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
        target.isContentEditable;

      const hasMeta = e.metaKey || e.ctrlKey;
      const hasShift = e.shiftKey;
      const hasAlt = e.altKey;
      const key = e.key.toLowerCase();

      // ========================================================
      // 1. ESCAPE KEY HANDLING (Topmost Overlay Hierarchy)
      // ========================================================
      if (e.key === 'Escape') {
        // If pending sequence is active, cancel it
        if (pendingSequence) {
          e.preventDefault();
          setPendingSequence(null);
          if (sequenceTimerRef.current) clearTimeout(sequenceTimerRef.current);
          return;
        }

        // If inside an input without open modals, blur it first
        if (isInput && !confirmationConfig && !isShortcutReferenceOpen && !isCommandPaletteOpen && !isNotificationDrawerOpen && !activeDrawer && !activeModal) {
          target.blur();
          return;
        }

        e.preventDefault();

        // Strict priority dismissal
        if (confirmationConfig) {
          closeConfirmation();
          return;
        }
        if (isShortcutReferenceOpen) {
          setShortcutReferenceOpen(false);
          return;
        }
        if (isCommandPaletteOpen) {
          setCommandPaletteOpen(false);
          return;
        }
        if (isNotificationDrawerOpen) {
          setNotificationDrawerOpen(false);
          return;
        }
        if (activeDrawer) {
          closeDrawer();
          return;
        }
        if (activeModal) {
          closeAll();
          return;
        }
        return;
      }

      // ========================================================
      // 2. INPUT CONTEXT SUPPRESSION
      // If user is actively typing, ignore single-letter & sequences
      // ========================================================
      if (isInput) {
        // Only allow Command Palette (Cmd+K) and Shortcuts Reference (Cmd+/) from inputs
        if (hasMeta && !hasShift && !hasAlt && key === 'k') {
          e.preventDefault();
          setCommandPaletteOpen(!isCommandPaletteOpen);
          return;
        }
        if (hasMeta && !hasShift && !hasAlt && (key === '/' || key === '?')) {
          e.preventDefault();
          setShortcutReferenceOpen(!isShortcutReferenceOpen);
          return;
        }
        // Suppress all other shortcuts while editing inputs
        return;
      }

      // ========================================================
      // 3. NAVIGATION SEQUENCES (e.g. G then Key)
      // ========================================================
      if (pendingSequence === 'g') {
        e.preventDefault();
        if (sequenceTimerRef.current) clearTimeout(sequenceTimerRef.current);
        setPendingSequence(null);

        const canManageMoney = ['super_admin', 'admin', 'owner', 'manager'].includes(profile?.role || '');
        const isStaffOrAdmin = ['super_admin', 'admin', 'faculty', 'owner', 'manager', 'staff'].includes(profile?.role || '');

        switch (key) {
          case 'd':
            navigate('/');
            return;
          case 's':
            navigate('/students');
            return;
          case 't':
            navigate('/transactions');
            return;
          case 'r':
            if (isStaffOrAdmin) {
              navigate('/reports');
            } else {
              toast.error('Reports require faculty or staff privileges');
            }
            return;
          case 'o':
            if (canManageMoney) {
              navigate('/operations');
            } else {
              toast.error('Operations Center requires financial manager role');
            }
            return;
          case 'a':
            if (['super_admin', 'owner', 'admin'].includes(profile?.role || '')) {
              navigate('/administration/audit');
            } else {
              toast.error('Audit Center requires administrator role');
            }
            return;
          default:
            // Non-matching key cancels sequence
            return;
        }
      }

      // Start sequence when 'g' is pressed without modifiers
      if (!hasMeta && !hasShift && !hasAlt && key === 'g') {
        e.preventDefault();
        setPendingSequence('g');
        if (sequenceTimerRef.current) clearTimeout(sequenceTimerRef.current);
        sequenceTimerRef.current = setTimeout(() => {
          setPendingSequence(null);
        }, 1200);
        return;
      }

      // ========================================================
      // 4. GLOBAL SHORTCUTS
      // ========================================================
      // Cmd/Ctrl + K -> Command Palette
      if (hasMeta && !hasShift && !hasAlt && key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!isCommandPaletteOpen);
        return;
      }

      // Cmd/Ctrl + / -> Shortcut Reference Dialog
      if (hasMeta && !hasShift && !hasAlt && (key === '/' || key === '?')) {
        e.preventDefault();
        setShortcutReferenceOpen(!isShortcutReferenceOpen);
        return;
      }

      // Cmd/Ctrl + , -> Settings
      if (hasMeta && !hasShift && !hasAlt && (key === ',' || key === '<')) {
        e.preventDefault();
        navigate('/settings');
        return;
      }

      // ========================================================
      // 5. FINANCIAL WORKFLOW LAUNCHERS (Strictly opens drawers)
      // ========================================================
      const canManageMoney = ['super_admin', 'admin', 'owner', 'manager'].includes(profile?.role || '');

      // Cmd/Ctrl + Shift + D -> Deposit Drawer
      if (hasMeta && hasShift && !hasAlt && key === 'd') {
        e.preventDefault();
        if (canManageMoney) {
          openDrawer('deposit');
        } else {
          toast.error('Deposit workflow requires financial manager role');
        }
        return;
      }

      // Cmd/Ctrl + Shift + W -> Withdrawal Drawer
      if (hasMeta && hasShift && !hasAlt && key === 'w') {
        e.preventDefault();
        if (canManageMoney) {
          openDrawer('withdrawal');
        } else {
          toast.error('Withdrawal workflow requires financial manager role');
        }
        return;
      }

      // Cmd/Ctrl + Shift + T -> Transfer Drawer
      if (hasMeta && hasShift && !hasAlt && key === 't') {
        e.preventDefault();
        if (canManageMoney) {
          openDrawer('internal');
        } else {
          toast.error('Transfer workflow requires financial manager role');
        }
        return;
      }

      // ========================================================
      // 6. LISTS & PAGE FOCUS
      // ========================================================
      // Cmd/Ctrl + Shift + F -> Focus current page search field
      if (hasMeta && hasShift && !hasAlt && key === 'f') {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>(
          'input[type="search"], input[placeholder*="Search"], input[placeholder*="search"]'
        );
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        } else {
          setCommandPaletteOpen(true);
        }
        return;
      }

      // Cmd/Ctrl + Shift + R -> Refresh active queries
      if (hasMeta && hasShift && !hasAlt && key === 'r') {
        e.preventDefault();
        queryClient.invalidateQueries();
        toast.success('Ledger records refreshed');
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (sequenceTimerRef.current) clearTimeout(sequenceTimerRef.current);
    };
  }, [
    isCommandPaletteOpen,
    isShortcutReferenceOpen,
    isNotificationDrawerOpen,
    pendingSequence,
    activeDrawer,
    activeModal,
    confirmationConfig,
    profile?.role,
    navigate,
    queryClient,
    setCommandPaletteOpen,
    setShortcutReferenceOpen,
    setNotificationDrawerOpen,
    setPendingSequence,
    openDrawer,
    closeDrawer,
    closeConfirmation,
    closeAll
  ]);
};
