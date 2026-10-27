/**
 * Type definitions for Employee Offboarding Tracker
 */

export type OffboardingStatus = 'not_started' | 'in_progress' | 'completed';

export type UserRole = 'admin' | 'it_staff';

export interface ChecklistItem {
  id: string;
  label: string;
  description?: string;
  completed: boolean;
  completedBy: string | null; // Email of the user who completed the item
  completedAt: string | null; // ISO timestamp
  note?: string; // Optional note
}

export interface ChecklistSection {
  id: string;
  title: string;
  description?: string;
  items: ChecklistItem[];
}

export interface OffboardingRecord {
  id: string;
  employeeName: string;
  employeeEmail: string;
  department: string;
  lastWorkingDay: string; // YYYY-MM-DD
  manager: string;
  assignedItPerson: string;
  status: OffboardingStatus;
  notes?: string;
  checklist: ChecklistSection[];
  vault?: DeviceVaultData;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  createdBy: string; // email of creator
  updatedBy?: string;
}

export type CredentialType = 'bitlocker' | 'local_admin' | 'bios_password' | 'device_pin' | 'wifi_other';

export interface DeviceCredential {
  id: string;
  title: string;
  credentialType: CredentialType;
  deviceName?: string;
  serialNumber?: string;
  secretValue: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface DeviceVaultData {
  pinHash?: string;
  items: DeviceCredential[];
  updatedAt?: string;
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  description?: string;
  sections: ChecklistSection[];
  updatedAt: string;
  updatedBy: string;
}

export interface AppUser {
  uid: string;
  email: string;
  displayName?: string | null;
  photoURL?: string | null;
  role: UserRole;
  isDomainAllowed: boolean;
  providerId?: string;
}

export interface FirebaseCustomConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
  companyDomain: string; // e.g. "mycompany.com"
  adminEmails: string[]; // List of admin emails
}
