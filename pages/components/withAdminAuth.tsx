import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Loader, Stack, Text } from '@mantine/core';
import supabase from '@/utils/supabase/client';
import { FC, ComponentType } from 'react';

interface AdminProtectedProps {
  [key: string]: any;
}

interface User {
  id: string;
  email?: string;
  user_metadata?: {
    role?: string;
  };
}

interface SupabaseAuthResponse {
  data: {
    user: User | null;
  };
  error: any;
}

export default function withAdminAuth(Component: ComponentType<any>): FC<AdminProtectedProps> {
  return function AdminProtected(props: AdminProtectedProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
      const checkAdminStatus = async () => {
        try {
          // Get current user
          const { data: { user }, error }: SupabaseAuthResponse = await supabase.auth.getUser();
          
          if (error || !user) {
            router.push('/');
            return;
          }
          
          // Check admin status (use your preferred method)
          const isAdminEmail = user.email?.endsWith('@admin.unidorm.com');
          const isAdminRole = user.user_metadata?.role === 'admin';
          
          const { data: adminCheck } = await supabase
            .from('admin_users')
            .select('id')
            .eq('user_id', user.id)
            .single();
          
          const userIsAdmin = isAdminEmail || isAdminRole || (adminCheck !== null);
          
          setIsAdmin(userIsAdmin);
          
          if (!userIsAdmin) {
            alert('You do not have admin privileges.');
            router.push('/');
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
          router.push('/');
        } finally {
          setLoading(false);
        }
      };
      
      checkAdminStatus();
    }, [router]); // Add router to the dependency array

    if (loading) {
      return (
        <Stack justify="center" align="center" style={{ height: '100vh' }}>
          <Loader size="xl" />
          <Text mt="md">Verifying admin access...</Text>
        </Stack>
      );
    }
    
    if (!isAdmin) {
      return null;
    }
    
    return <Component {...props} />;
  };
}