import React, { createContext, useContext, useState, useEffect } from 'react';
import { StaffUser } from '../types';

interface AuthContextType {
  currentStaff: StaffUser | null;
  isAuthenticated: boolean;
  loginWithPin: (pinCode: string, staffId?: number) => Promise<boolean>;
  logout: () => void;
  isPinModalOpen: boolean;
  openPinModal: () => void;
  closePinModal: () => void;
}

const AuthContext = createContext<AuthContextType>({
  currentStaff: null,
  isAuthenticated: false,
  loginWithPin: async () => false,
  logout: () => {},
  isPinModalOpen: false,
  openPinModal: () => {},
  closePinModal: () => {},
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

  const loginWithPin = async (pinCode: string, staffId?: number): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/pin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinCode, staffId }),
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentStaff(data.user);
        localStorage.setItem('dine_os_staff', JSON.stringify(data.user));
        setIsPinModalOpen(false);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Login error:', e);
      return false;
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
