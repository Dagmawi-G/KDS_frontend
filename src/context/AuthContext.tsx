import React, { createContext, useContext, useState, useEffect } from 'react';
import { StaffUser } from '../types';
import { apiUrl } from '../utils/api';

export interface LoginParams {
  pinCode: string;
  staffId?: number;
  email?: string;
  name?: string;
  identifier?: string;
}

export interface LoginResult {
  success: boolean;
  error?: string;
}

interface AuthContextType {
  currentStaff: StaffUser | null;
  isAuthenticated: boolean;
  loginWithPin: (params: string | LoginParams, staffId?: number) => Promise<LoginResult>;
  logout: () => void;
  isPinModalOpen: boolean;
  openPinModal: () => void;
  closePinModal: () => void;
}

const AuthContext = createContext<AuthContextType>({
  currentStaff: null,
  isAuthenticated: false,
  loginWithPin: async () => ({ success: false, error: 'Auth not initialized' }),
  logout: () => { },
  isPinModalOpen: false,
  openPinModal: () => { },
  closePinModal: () => { },
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentStaff, setCurrentStaff] = useState<StaffUser | null>(() => {
    try {
      const saved = localStorage.getItem('dine_os_staff');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  const loginWithPin = async (
    params: string | LoginParams,
    optionalStaffId?: number
  ): Promise<LoginResult> => {
    try {
      let body: Record<string, any> = {};

      if (typeof params === 'string') {
        body = { pinCode: params, staffId: optionalStaffId };
      } else {
        body = { ...params };
      }

      const res = await fetch(apiUrl('/api/auth/pin-login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      let data: any = {};
      try {
        const text = await res.text();
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }

      if (res.ok && data.user) {
        setCurrentStaff(data.user);
        localStorage.setItem('dine_os_staff', JSON.stringify(data.user));
        setIsPinModalOpen(false);
        return { success: true };
      }

      return {
        success: false,
        error: data.error || (res.status === 401 ? 'Incorrect PIN code. Please try again.' : 'Authentication failed. Please check your credentials.'),
      };
    } catch (e: any) {
      console.error('Login error:', e);
      return { success: false, error: 'Unable to connect to server. Please try again.' };
    }
  };

  const logout = () => {
    setCurrentStaff(null);
    localStorage.removeItem('dine_os_staff');
  };

  return (
    <AuthContext.Provider
      value={{
        currentStaff,
        isAuthenticated: Boolean(currentStaff),
        loginWithPin,
        logout,
        isPinModalOpen,
        openPinModal: () => setIsPinModalOpen(true),
        closePinModal: () => setIsPinModalOpen(false),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

