import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// Legacy app_role type for backward compatibility
type AppRole = 'general_counsel' | 'legal_ops' | 'contract_counsel' | 'account_executive' | 'sales_manager' | 'finance_reviewer';

// New custom role interface
interface CustomRole {
  id: string;
  name: string;
  display_name: string | null;
  is_manager_role: boolean;
  is_work_routing: boolean;
  parent_id: string | null;
}

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  title: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null; // Legacy - kept for backward compatibility
  customRoles: CustomRole[]; // New - unified role system
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  // Helper functions for the unified system
  isManager: () => boolean;
  hasCustomRole: (roleId: string) => boolean;
  getWorkRoutingRoleIds: () => string[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData);
      }

      // Fetch custom roles (unified system)
      const { data: userCustomRoles } = await supabase
        .from('user_roles')
        .select(`
          role_id,
          roles (
            id,
            name,
            display_name,
            is_manager_role,
            is_work_routing,
            parent_id
          )
        `)
        .eq('user_id', userId);

      if (userCustomRoles) {
        const roles = userCustomRoles
          .map((ucr: any) => ucr.roles)
          .filter((r: any): r is CustomRole => r !== null);
        setCustomRoles(roles);

        // Derive legacy role from custom roles for backward compatibility
        const legacyRoleNames = ['general_counsel', 'legal_ops', 'contract_counsel', 'account_executive', 'sales_manager', 'finance_reviewer'];
        const matchingRole = roles.find(r => legacyRoleNames.includes(r.name));
        if (matchingRole) {
          setRole(matchingRole.name as AppRole);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchUserData(user.id);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
    setCustomRoles([]);
  };

  // Helper: Check if user has any manager role
  const isManager = () => {
    return customRoles.some(r => r.is_manager_role);
  };

  // Helper: Check if user has a specific custom role
  const hasCustomRole = (roleId: string) => {
    return customRoles.some(r => r.id === roleId);
  };

  // Helper: Get user's work routing role IDs
  const getWorkRoutingRoleIds = () => {
    return customRoles
      .filter(r => r.is_work_routing)
      .map(r => r.id);
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Defer data fetching to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setRole(null);
          setCustomRoles([]);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserData(session.user.id).finally(() => {
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      profile, 
      role, 
      customRoles,
      isLoading, 
      signOut,
      refreshProfile,
      isManager,
      hasCustomRole,
      getWorkRoutingRoleIds,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
