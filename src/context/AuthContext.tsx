import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppUser, UserRole } from '../types/offboarding';
import {
  signInWithMicrosoft,
  signInWithGoogle,
  logOut,
  subscribeToAuthState,
} from '../firebase/service';
import {
  getActiveFirebaseConfig,
  isFirebaseConfigured,
} from '../firebase/config';

interface AuthContextType {
  currentUser: AppUser;
  loading: boolean;
  isFirebaseLive: boolean;
  updateUserProfile: (displayName: string, email: string) => void;
  loginMicrosoft: () => Promise<void>;
  loginGoogle: () => Promise<void>;
  loginDemo: (role?: UserRole, customEmail?: string) => void;
  logout: () => Promise<void>;
  refreshConfig: () => void;
  companyDomain: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_PROFILE_KEY = 'offboarding_tracker_user_profile';

const DEFAULT_USER: AppUser = {
  uid: 'pc-admin-workstation',
  email: 'admin@company.com',
  displayName: 'IT Administrator',
  role: 'admin',
  isDomainAllowed: true,
  providerId: 'workstation',
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load saved profile or use default
  const [currentUser, setCurrentUser] = useState<AppUser>(() => {
    try {
      const saved = localStorage.getItem(USER_PROFILE_KEY);
      if (saved) {
        return { ...DEFAULT_USER, ...JSON.parse(saved), role: 'admin', isDomainAllowed: true };
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_USER;
  });

  const [loading, setLoading] = useState(false);
  const [isFirebaseLive, setIsFirebaseLive] = useState(isFirebaseConfigured());
  const [companyDomain, setCompanyDomain] = useState(getActiveFirebaseConfig().companyDomain);

  const refreshConfig = () => {
    const config = getActiveFirebaseConfig();
    setCompanyDomain(config.companyDomain);
    setIsFirebaseLive(isFirebaseConfigured());
  };

  const updateUserProfile = (displayName: string, email: string) => {
    const updated: AppUser = {
      ...currentUser,
      displayName: displayName.trim() || 'IT Administrator',
      email: email.trim() || 'itlynear@gmail.com',
    };
    setCurrentUser(updated);
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(updated));
  };

  useEffect(() => {
    // If Firebase Auth state changes with a real user, preserve their email
    let unsubscribe = () => {};
    if (isFirebaseLive) {
      unsubscribe = subscribeToAuthState(fbUser => {
        if (fbUser && fbUser.email) {
          setCurrentUser(prev => ({
            ...prev,
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName || prev.displayName,
          }));
        }
      });
    }
    return () => unsubscribe();
  }, [isFirebaseLive]);

  const loginMicrosoft = async () => {
    try {
      const user = await signInWithMicrosoft();
      if (user) {
        setCurrentUser(user);
        localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(user));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loginGoogle = async () => {
    try {
      const user = await signInWithGoogle();
      if (user) {
        setCurrentUser(user);
        localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(user));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loginDemo = (role: UserRole = 'admin', customEmail?: string) => {
    const email = customEmail || 'itlynear@gmail.com';
    const demoUser: AppUser = {
      uid: 'pc-admin-workstation',
      email,
      displayName: role === 'admin' ? 'Lead IT Systems Administrator' : 'IT Operations Engineer',
      role,
      isDomainAllowed: true,
      providerId: 'local-pc',
    };
    setCurrentUser(demoUser);
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(demoUser));
  };

  const logout = async () => {
    try {
      await logOut();
    } catch (e) {
      console.warn(e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        isFirebaseLive,
        updateUserProfile,
        loginMicrosoft,
        loginGoogle,
        loginDemo,
        logout,
        refreshConfig,
        companyDomain,
      }}
    >
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
