import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useSuperAdmin = () => {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSuperAdminRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setIsSuperAdmin(false);
          setLoading(false);
          return;
        }

        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'super_admin')
          .single();

        setIsSuperAdmin(!!roleData);
      } catch (error) {
        console.error('Error checking super admin role:', error);
        setIsSuperAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkSuperAdminRole();
  }, []);

  return { isSuperAdmin, loading };
};