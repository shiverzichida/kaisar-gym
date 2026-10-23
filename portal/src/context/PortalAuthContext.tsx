'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'MEMBER' | 'COACH' | null;

export interface PortalUser {
  id: string;
  role: UserRole;
  fullName: string;
  code: string; // Member Code (KG-2026-xxxx) or Trainer Code (TR-xxx / PT-xxx)
  phone?: string;
  email?: string;
  specialization?: string; // For Coach
  membershipStatus?: string; // For Member
  membershipType?: string;
  expiryDate?: string;
  rfidUid?: string;
}

interface PortalAuthContextType {
  user: PortalUser | null;
  role: UserRole;
  isLoggedIn: boolean;
  loginAsMember: (member: any) => void;
  loginAsCoach: (coach: any) => void;
  logout: () => void;
}

const PortalAuthContext = createContext<PortalAuthContextType>({
  user: null,
  role: null,
  isLoggedIn: false,
  loginAsMember: () => {},
  loginAsCoach: () => {},
  logout: () => {},
});

export function PortalAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PortalUser | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('kaisar_portal_user');
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  const loginAsMember = (member: any) => {
    const u: PortalUser = {
      id: member.id,
      role: 'MEMBER',
      fullName: member.fullName,
      code: member.memberCode,
      phone: member.phone,
      email: member.email,
      membershipStatus: member.status || 'ACTIVE',
    };
    setUser(u);
    localStorage.setItem('kaisar_portal_user', JSON.stringify(u));
  };

  const loginAsCoach = (coach: any) => {
    const u: PortalUser = {
      id: coach.id,
      role: 'COACH',
      fullName: coach.fullName,
      code: coach.code,
      phone: coach.phone,
      email: coach.email,
      specialization: coach.specialization,
    };
    setUser(u);
    localStorage.setItem('kaisar_portal_user', JSON.stringify(u));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('kaisar_portal_user');
  };

  return (
    <PortalAuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isLoggedIn: !!user,
        loginAsMember,
        loginAsCoach,
        logout,
      }}
    >
      {children}
    </PortalAuthContext.Provider>
  );
}

export function usePortalAuth() {
  return useContext(PortalAuthContext);
}
