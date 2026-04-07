import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { apiClient } from "@/integrations/api/client";

type UserRole = "teacher" | "student";

interface Profile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: {
    id: string;
    email: string;
    role: UserRole;
  } | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string; role: UserRole } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const response = await apiClient.getMe();
      if (response.user) {
        const userData = response.user;
        setUser({
          id: userData.id,
          email: userData.email,
          role: userData.role,
        });
        setProfile({
          id: userData.id,
          name: userData.name,
          email: userData.email,
          role: userData.role,
        });
      }
    } catch {
      setUser(null);
      setProfile(null);
      apiClient.clearToken();
    }
  };

  useEffect(() => {
    // Check if token exists in localStorage
    const token = localStorage.getItem("auth_token");
    if (token) {
      apiClient.setToken(token);
      fetchProfile();
    }
    setLoading(false);
  }, []);

  const signUp = async (email: string, password: string, name: string, role: UserRole) => {
    const response = await apiClient.signup(email, password, name, role);
    if (response.user) {
      setUser({
        id: response.user.id,
        email: response.user.email,
        role: response.user.role,
      });
      setProfile({
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        role: response.user.role,
      });
    }
  };

  const signIn = async (email: string, password: string) => {
    const response = await apiClient.signin(email, password);
    if (response.user) {
      setUser({
        id: response.user.id,
        email: response.user.email,
        role: response.user.role,
      });
      setProfile({
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        role: response.user.role,
      });
    }
  };

  const signOut = async () => {
    apiClient.clearToken();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

export type { Profile, UserRole };
