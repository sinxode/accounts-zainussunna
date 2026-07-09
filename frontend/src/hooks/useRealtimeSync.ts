import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export const useRealtimeSync = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('public-db-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public'
        },
        (payload) => {
          console.log('Realtime DB change detected:', payload.table, payload.eventType);
          // Invalidate queries so TanStack Query instantly updates visible UI elements
          queryClient.invalidateQueries();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};
