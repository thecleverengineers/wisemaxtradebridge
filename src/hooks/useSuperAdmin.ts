import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useSuperAdmin = () => {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSuperAdminRole = async (userId: string | null) => {
      try {
        if (!userId) {
          setIsSuperAdmin(false);
          setLoading(false);
          return;
        }

        // Fetch and validate user role from user_roles table
        const { data: roleData, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .in('role', ['superadmin', 'super-admin'])
          .limit(1)
          .single();

        if (error) {
          console.error('Error fetching super admin role:', error);
          setIsSuperAdmin(false);
        } else {
          const hasRole = !!roleData;
          setIsSuperAdmin(hasRole);
          
          // Log validation result for debugging
          console.log('Super Admin validation:', {
            userId,
            hasRole,
            roleData
          });
        }
      } catch (error) {
        console.error('Error checking super admin role:', error);
        setIsSuperAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    // Initial check for current session
    const initCheck = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      await checkSuperAdminRole(user?.id || null);
    };

    initCheck();

    // Listen for auth state changes to re-validate on login/logout
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        await checkSuperAdminRole(session?.user?.id || null);
      } else if (event === 'SIGNED_OUT') {
        setIsSuperAdmin(false);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { isSuperAdmin, loading };
};