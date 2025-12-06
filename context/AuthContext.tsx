import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User, UserRole } from '../types';
import { supabase } from '../lib/supabaseClient';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    // Check local storage for session
    const storedUser = localStorage.getItem('wtech_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Use limit(1).maybeSingle() to avoid error PGRST116 if duplicates exist
      const { data, error } = await supabase
        .from('SITE_Users')
        .select('*')
        .eq('email', email)
        .eq('password', password) // Note: Plain text for demo.
        .limit(1)
        .maybeSingle();

      if (error) {
          console.error("Login Error:", error);
          return { success: false, error: 'Erro de conexão.' };
      }

      if (!data) {
        return { success: false, error: 'Credenciais inválidas.' };
      }

      const loggedUser: User = {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role as UserRole,
        avatar: data.avatar,
        permissions: data.permissions,
        status: data.status,
      };

      setUser(loggedUser);
      localStorage.setItem('wtech_user', JSON.stringify(loggedUser));
      setShowLoginModal(false);
      return { success: true };

    } catch (err) {
      console.error(err);
      return { success: false, error: 'Erro ao conectar.' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('wtech_user');
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, showLoginModal, setShowLoginModal }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};