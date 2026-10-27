/**
 * Firebase Configuration for Employee Offboarding Tracker
 *
 * Uses credentials provisioned in firebase-applet-config.json,
 * falling back to custom env vars or in-app settings.
 */

import appletConfig from '../../firebase-applet-config.json';

const STORAGE_KEY = 'offboarding_tracker_firebase_config';

export interface FirebaseAppConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  firestoreDatabaseId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
  companyDomain: string;
  adminEmails: string[];
}

// Live provisioned Firebase configuration
export const DEFAULT_FIREBASE_CONFIG: FirebaseAppConfig = {
  apiKey: appletConfig.apiKey || import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: appletConfig.authDomain || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: appletConfig.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  firestoreDatabaseId: appletConfig.firestoreDatabaseId || undefined,
  storageBucket: appletConfig.storageBucket || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: appletConfig.messagingSenderId || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: appletConfig.appId || import.meta.env.VITE_FIREBASE_APP_ID || '',
  companyDomain: import.meta.env.VITE_COMPANY_DOMAIN || 'mycompany.com',
  adminEmails: ['it.admin@mycompany.com', 'itlynear@gmail.com'],
};

// Retrieve active configuration
export function getActiveFirebaseConfig(): FirebaseAppConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_FIREBASE_CONFIG, ...parsed };
    }
  } catch (e) {
    console.error('Failed to parse saved Firebase config', e);
  }
  return DEFAULT_FIREBASE_CONFIG;
}

// Save custom configuration from Settings UI
export function saveActiveFirebaseConfig(config: Partial<FirebaseAppConfig>): void {
  try {
    const current = getActiveFirebaseConfig();
    const updated = { ...current, ...config };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save Firebase config', e);
  }
}

// Reset configuration to defaults
export function resetFirebaseConfig(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// Check if Firebase is actually configured with non-placeholder keys
export function isFirebaseConfigured(): boolean {
  const config = getActiveFirebaseConfig();
  return Boolean(
    config.apiKey &&
    !config.apiKey.includes('YOUR_FIREBASE_API_KEY') &&
    config.projectId &&
    !config.projectId.includes('your-company-offboard')
  );
}

// Check if an email address belongs to the allowed company domain or is an authorized admin
export function checkEmailDomainAllowed(email: string | null | undefined, companyDomain: string, adminEmails: string[] = []): boolean {
  if (!email) return false;
  const cleanEmail = email.trim().toLowerCase();
  
  if (adminEmails.some(adm => adm.toLowerCase() === cleanEmail)) {
    return true;
  }
  
  const cleanDomain = companyDomain.replace(/^@/, '').trim().toLowerCase();
  if (!cleanDomain || cleanDomain === '*' || cleanDomain === 'all') {
    return true;
  }
  
  return cleanEmail.endsWith(`@${cleanDomain}`);
}
