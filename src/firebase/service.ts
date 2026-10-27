/**
 * Firebase Firestore & Authentication Service
 * Includes real-time snapshot sync, Microsoft/Google OAuth, and robust error handling.
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  signInWithPopup,
  signOut,
  OAuthProvider,
  GoogleAuthProvider,
  onAuthStateChanged,
  User as FirebaseUser,
  signInAnonymously,
} from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  getDoc,
  getDocFromServer,
  Unsubscribe,
} from 'firebase/firestore';

import {
  getActiveFirebaseConfig,
  isFirebaseConfigured,
  checkEmailDomainAllowed,
} from './config';
import {
  OffboardingRecord,
  ChecklistTemplate,
  ChecklistSection,
  AppUser,
} from '../types/offboarding';
import { DEFAULT_CHECKLIST_SECTIONS } from '../data/defaultChecklist';
import { SAMPLE_OFFBOARDINGS } from '../data/sampleOffboardings';

// Error handling matching Firebase Integration Skill specifications
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
  authInstance?: Auth | null
) {
  const currentAuth = authInstance || (authAvailable ? auth : null);
  const currentUser = currentAuth?.currentUser;
  
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid,
      email: currentUser?.email,
      emailVerified: currentUser?.emailVerified,
      isAnonymous: currentUser?.isAnonymous,
      tenantId: currentUser?.tenantId,
      providerInfo: currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

let firebaseApp: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let authAvailable = false;

// Initialize Firebase if configured
export function initFirebase() {
  const config = getActiveFirebaseConfig();
  if (!isFirebaseConfigured()) {
    return { app: null, db: null, auth: null, configured: false };
  }

  try {
    if (!getApps().length) {
      firebaseApp = initializeApp({
        apiKey: config.apiKey,
        authDomain: config.authDomain,
        projectId: config.projectId,
        storageBucket: config.storageBucket,
        messagingSenderId: config.messagingSenderId,
        appId: config.appId,
      });
    } else {
      firebaseApp = getApp();
    }

    db = config.firestoreDatabaseId
      ? getFirestore(firebaseApp, config.firestoreDatabaseId)
      : getFirestore(firebaseApp);
    auth = getAuth(firebaseApp);
    authAvailable = true;

    // Background silent sign-in so operations have auth credentials without any login UI
    if (auth && !auth.currentUser) {
      signInAnonymously(auth).catch(err => {
        // If Anonymous auth is not yet enabled in Firebase Console, fallback gracefully
        console.info('Firebase auth note:', err.message);
      });
    }

    // Test connection as required by skill
    testFirestoreConnection(db);

    return { app: firebaseApp, db, auth, configured: true };
  } catch (err) {
    console.warn('Firebase initialization skipped or failed:', err);
    return { app: null, db: null, auth: null, configured: false };
  }
}

// Test initial connection as mandated by skill
async function testFirestoreConnection(database: Firestore) {
  try {
    await getDocFromServer(doc(database, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore notice: client is offline or network is waiting.');
    }
  }
}

// Initial boot
initFirebase();

// LocalStorage mock state for seamless preview without requiring live credentials
const MOCK_OFFBOARDINGS_KEY = 'offboarding_tracker_records';
const MOCK_TEMPLATE_KEY = 'offboarding_tracker_template';

function migrateAndroidItems(sections: ChecklistSection[]): { sections: ChecklistSection[]; changed: boolean } {
  let changed = false;
  const updatedSections = (sections || []).map(sec => ({
    ...sec,
    items: (sec.items || []).map(item => {
      if (item.id === 'intune_wipe_mobile' && (item.label.includes('Apple') || item.description?.includes('Apple'))) {
        changed = true;
        return {
          ...item,
          label: 'Wipe company Android mobile device (Remove Google FRP / Work Profile)',
          description: 'Remove personal/corporate Google accounts to prevent Factory Reset Protection (FRP) lock, then retire Android Enterprise Work Profile or trigger remote wipe in Microsoft Intune',
        };
      }
      return item;
    }),
  }));
  return { sections: updatedSections, changed };
}

function getLocalOffboardings(): OffboardingRecord[] {
  try {
    const raw = localStorage.getItem(MOCK_OFFBOARDINGS_KEY);
    if (raw) {
      const records = JSON.parse(raw) as OffboardingRecord[];
      const hasOutdated = records.some(r => !r.checklist || !r.checklist.some(s => s.id === 'final_checks'));
      if (hasOutdated) {
        localStorage.setItem(MOCK_OFFBOARDINGS_KEY, JSON.stringify(SAMPLE_OFFBOARDINGS));
        return SAMPLE_OFFBOARDINGS;
      }
      return records;
    }
  } catch (e) {
    console.error(e);
  }
  // Initialize with sample records if empty
  localStorage.setItem(MOCK_OFFBOARDINGS_KEY, JSON.stringify(SAMPLE_OFFBOARDINGS));
  return SAMPLE_OFFBOARDINGS;
}

function saveLocalOffboardings(records: OffboardingRecord[]) {
  localStorage.setItem(MOCK_OFFBOARDINGS_KEY, JSON.stringify(records));
  notifyLocalOffboardingsListeners();
}

function getLocalTemplate(): ChecklistTemplate {
  try {
    const raw = localStorage.getItem(MOCK_TEMPLATE_KEY);
    if (raw) {
      const tmpl = JSON.parse(raw) as ChecklistTemplate;
      const hasFinalChecks = (tmpl.sections || []).some(s => s.id === 'final_checks');
      if (!hasFinalChecks || (tmpl.sections?.length || 0) < 6) {
        tmpl.sections = DEFAULT_CHECKLIST_SECTIONS;
        localStorage.setItem(MOCK_TEMPLATE_KEY, JSON.stringify(tmpl));
      }
      return tmpl;
    }
  } catch (e) {
    console.error(e);
  }
  const defaultTmpl: ChecklistTemplate = {
    id: 'default',
    name: 'Standard Microsoft Entra & Intune Offboarding Template',
    description: 'Enterprise IT offboarding checklist for cloud identity, device wipe, and SaaS compliance',
    sections: DEFAULT_CHECKLIST_SECTIONS,
    updatedAt: new Date().toISOString(),
    updatedBy: 'system',
  };
  localStorage.setItem(MOCK_TEMPLATE_KEY, JSON.stringify(defaultTmpl));
  return defaultTmpl;
}

function saveLocalTemplate(template: ChecklistTemplate) {
  localStorage.setItem(MOCK_TEMPLATE_KEY, JSON.stringify(template));
  notifyLocalTemplateListeners();
}

// Event listeners for mock real-time updates across components
type OffboardingsListener = (records: OffboardingRecord[]) => void;
type TemplateListener = (template: ChecklistTemplate) => void;
const localOffboardingsListeners: Set<OffboardingsListener> = new Set();
const localTemplateListeners: Set<TemplateListener> = new Set();

function notifyLocalOffboardingsListeners() {
  const records = getLocalOffboardings();
  localOffboardingsListeners.forEach(listener => listener(records));
}

function notifyLocalTemplateListeners() {
  const template = getLocalTemplate();
  localTemplateListeners.forEach(listener => listener(template));
}

// ----------------------------------------------------------------------
// Realtime Subscriptions
// ----------------------------------------------------------------------

/**
 * Subscribe to all offboarding records in real-time
 */
export function subscribeToOffboardings(
  onData: (records: OffboardingRecord[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  if (isFirebaseConfigured() && db) {
    const collPath = 'offboardings';
    try {
      return onSnapshot(
        collection(db, collPath),
        snapshot => {
          if (snapshot.empty) {
            // Check if system was already initialized, allowing users to have 0 records in production
            const wasInitialized = localStorage.getItem('offboarding_db_initialized');
            if (wasInitialized) {
              onData([]);
              return;
            }
            localStorage.setItem('offboarding_db_initialized', 'true');
            // Seed initial records into Firestore on very first launch only
            SAMPLE_OFFBOARDINGS.forEach(record => {
              setDoc(doc(db!, 'offboardings', record.id), record).catch(console.error);
            });
            onData(SAMPLE_OFFBOARDINGS);
            return;
          }
          const records: OffboardingRecord[] = [];
          snapshot.forEach(docSnap => {
            const data = { ...(docSnap.data() as OffboardingRecord), id: docSnap.id };
            const m = migrateAndroidItems(data.checklist);
            if (m.changed) {
              data.checklist = m.sections;
              if (db) {
                setDoc(doc(db, 'offboardings', docSnap.id), { checklist: m.sections }, { merge: true }).catch(console.error);
              }
            }
            records.push(data);
          });
          // Sort by lastWorkingDay descending
          records.sort((a, b) => (b.lastWorkingDay > a.lastWorkingDay ? 1 : -1));
          onData(records);
        },
        error => {
          handleFirestoreError(error, OperationType.LIST, collPath, auth);
          if (onError) onError(error);
        }
      );
    } catch (err) {
      if (onError) onError(err as Error);
    }
  }

  // Fallback to local storage real-time emitter
  const initial = getLocalOffboardings();
  onData(initial);
  localOffboardingsListeners.add(onData);
  return () => {
    localOffboardingsListeners.delete(onData);
  };
}

/**
 * Subscribe to the default template in real-time
 */
export function subscribeToTemplate(
  onData: (template: ChecklistTemplate) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const database = db;
  if (isFirebaseConfigured() && database) {
    const docPath = 'templates/default';
    try {
      return onSnapshot(
        doc(database, 'templates', 'default'),
        docSnap => {
          if (docSnap.exists()) {
            const tmpl = docSnap.data() as ChecklistTemplate;
            const hasFinalChecks = (tmpl.sections || []).some(s => s.id === 'final_checks');
            if (!hasFinalChecks || (tmpl.sections?.length || 0) < 6) {
              tmpl.sections = DEFAULT_CHECKLIST_SECTIONS;
              setDoc(doc(database, 'templates', 'default'), { sections: DEFAULT_CHECKLIST_SECTIONS }, { merge: true }).catch(console.error);
            } else {
              const m = migrateAndroidItems(tmpl.sections);
              if (m.changed) {
                tmpl.sections = m.sections;
                setDoc(doc(database, 'templates', 'default'), { sections: m.sections }, { merge: true }).catch(console.error);
              }
            }
            onData(tmpl);
          } else {
            // Seed default template into Firestore
            const initialTemplate = getLocalTemplate();
            setDoc(doc(database, 'templates', 'default'), initialTemplate).catch(console.error);
            onData(initialTemplate);
          }
        },
        error => {
          handleFirestoreError(error, OperationType.GET, docPath, auth);
          if (onError) onError(error);
        }
      );
    } catch (err) {
      if (onError) onError(err as Error);
    }
  }

  // Fallback to local template
  const initial = getLocalTemplate();
  onData(initial);
  localTemplateListeners.add(onData);
  return () => {
    localTemplateListeners.delete(onData);
  };
}

// ----------------------------------------------------------------------
// Offboarding Records Operations
// ----------------------------------------------------------------------

export async function createOffboardingRecord(record: OffboardingRecord): Promise<void> {
  if (isFirebaseConfigured() && db) {
    const docPath = `offboardings/${record.id}`;
    try {
      await setDoc(doc(db, 'offboardings', record.id), record);
      return;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, docPath, auth);
    }
  }

  // Local storage fallback
  const records = getLocalOffboardings();
  records.unshift(record);
  saveLocalOffboardings(records);
}

export async function updateOffboardingRecord(record: OffboardingRecord): Promise<void> {
  const updated = {
    ...record,
    updatedAt: new Date().toISOString(),
  };

  if (isFirebaseConfigured() && db) {
    const docPath = `offboardings/${record.id}`;
    try {
      await setDoc(doc(db, 'offboardings', record.id), updated, { merge: true });
      return;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, docPath, auth);
    }
  }

  // Local storage fallback
  const records = getLocalOffboardings();
  const index = records.findIndex(r => r.id === record.id);
  if (index !== -1) {
    records[index] = updated;
    saveLocalOffboardings(records);
  }
}

export async function deleteOffboardingRecord(recordId: string): Promise<void> {
  if (isFirebaseConfigured() && db) {
    const docPath = `offboardings/${recordId}`;
    try {
      await deleteDoc(doc(db, 'offboardings', recordId));
      return;
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, docPath, auth);
    }
  }

  // Local storage fallback
  const records = getLocalOffboardings();
  const filtered = records.filter(r => r.id !== recordId);
  saveLocalOffboardings(filtered);
}

/**
 * Toggles a checklist item's completion status.
 * If completed == true: automatically writes completedBy = userEmail and completedAt = ISO timestamp.
 * If completed == false: clears completedBy and completedAt.
 */
export async function toggleChecklistItem(
  record: OffboardingRecord,
  sectionId: string,
  itemId: string,
  newCompleted: boolean,
  userEmail: string,
  noteText?: string
): Promise<OffboardingRecord> {
  const now = new Date().toISOString();

  const updatedSections = record.checklist.map(section => {
    if (section.id !== sectionId) return section;

    const updatedItems = section.items.map(item => {
      if (item.id !== itemId) return item;

      return {
        ...item,
        completed: newCompleted,
        completedBy: newCompleted ? userEmail : null,
        completedAt: newCompleted ? now : null,
        note: noteText !== undefined ? noteText : item.note,
      };
    });

    return { ...section, items: updatedItems };
  });

  // Calculate new overall status
  let totalItems = 0;
  let completedItems = 0;
  updatedSections.forEach(sec => {
    sec.items.forEach(it => {
      totalItems++;
      if (it.completed) completedItems++;
    });
  });

  let newStatus = record.status;
  if (completedItems === 0) {
    newStatus = 'not_started';
  } else if (completedItems === totalItems && totalItems > 0) {
    newStatus = 'completed';
  } else {
    newStatus = 'in_progress';
  }

  const updatedRecord: OffboardingRecord = {
    ...record,
    checklist: updatedSections,
    status: newStatus,
    updatedAt: now,
    updatedBy: userEmail,
  };

  await updateOffboardingRecord(updatedRecord);
  return updatedRecord;
}

/**
 * Updates a note on a checklist item
 */
export async function updateItemNote(
  record: OffboardingRecord,
  sectionId: string,
  itemId: string,
  newNote: string,
  userEmail: string
): Promise<OffboardingRecord> {
  const updatedSections = record.checklist.map(section => {
    if (section.id !== sectionId) return section;

    const updatedItems = section.items.map(item => {
      if (item.id !== itemId) return item;
      return {
        ...item,
        note: newNote,
      };
    });

    return { ...section, items: updatedItems };
  });

  const updatedRecord: OffboardingRecord = {
    ...record,
    checklist: updatedSections,
    updatedAt: new Date().toISOString(),
    updatedBy: userEmail,
  };

  await updateOffboardingRecord(updatedRecord);
  return updatedRecord;
}

// ----------------------------------------------------------------------
// Checklist Template Operations
// ----------------------------------------------------------------------

export async function saveTemplate(template: ChecklistTemplate, userEmail: string): Promise<void> {
  const updated: ChecklistTemplate = {
    ...template,
    updatedAt: new Date().toISOString(),
    updatedBy: userEmail,
  };

  if (isFirebaseConfigured() && db) {
    const docPath = 'templates/default';
    try {
      await setDoc(doc(db, 'templates', 'default'), updated);
      return;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath, auth);
    }
  }

  saveLocalTemplate(updated);
}

export async function resetTemplateToDefaults(userEmail: string): Promise<ChecklistTemplate> {
  const defaultTemplate: ChecklistTemplate = {
    id: 'default',
    name: 'Standard Microsoft Entra & Intune Offboarding Template',
    description: 'Enterprise IT offboarding checklist for cloud identity, device wipe, and SaaS compliance',
    sections: JSON.parse(JSON.stringify(DEFAULT_CHECKLIST_SECTIONS)),
    updatedAt: new Date().toISOString(),
    updatedBy: userEmail,
  };

  await saveTemplate(defaultTemplate, userEmail);
  return defaultTemplate;
}

// ----------------------------------------------------------------------
// Authentication Handlers
// ----------------------------------------------------------------------

export async function signInWithMicrosoft(): Promise<AppUser | null> {
  const config = getActiveFirebaseConfig();
  if (!isFirebaseConfigured() || !auth) {
    throw new Error('Firebase Authentication is not configured. Please enter your Firebase project credentials or use Demo Login.');
  }

  try {
    const provider = new OAuthProvider('microsoft.com');
    // Request basic profile and offline access
    provider.addScope('User.Read');
    // Prompt consent or select account
    provider.setCustomParameters({
      prompt: 'select_account',
      tenant: 'common',
    });

    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const isDomainAllowed = checkEmailDomainAllowed(user.email, config.companyDomain, config.adminEmails);
    const isAdmin = config.adminEmails.some(a => a.toLowerCase() === user.email?.toLowerCase());

    return {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || user.email?.split('@')[0],
      photoURL: user.photoURL,
      role: isAdmin ? 'admin' : 'it_staff',
      isDomainAllowed,
      providerId: 'microsoft.com',
    };
  } catch (error: any) {
    console.error('Microsoft sign-in error:', error);
    throw error;
  }
}

export async function signInWithGoogle(): Promise<AppUser | null> {
  const config = getActiveFirebaseConfig();
  if (!isFirebaseConfigured() || !auth) {
    throw new Error('Firebase Authentication is not configured. Please enter your Firebase project credentials or use Demo Login.');
  }

  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account',
    });

    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const isDomainAllowed = checkEmailDomainAllowed(user.email, config.companyDomain, config.adminEmails);
    const isAdmin = config.adminEmails.some(a => a.toLowerCase() === user.email?.toLowerCase());

    return {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || user.email?.split('@')[0],
      photoURL: user.photoURL,
      role: isAdmin ? 'admin' : 'it_staff',
      isDomainAllowed,
      providerId: 'google.com',
    };
  } catch (error: any) {
    console.error('Google sign-in error:', error);
    throw error;
  }
}

export async function logOut(): Promise<void> {
  if (auth) {
    await signOut(auth);
  }
}

export function subscribeToAuthState(
  onUserChanged: (user: AppUser | null) => void
): Unsubscribe {
  if (auth) {
    return onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (!fbUser) {
        onUserChanged(null);
        return;
      }

      const config = getActiveFirebaseConfig();
      const email = fbUser.email || '';
      const isDomainAllowed = checkEmailDomainAllowed(email, config.companyDomain, config.adminEmails);
      const isAdmin = config.adminEmails.some(a => a.toLowerCase() === email.toLowerCase());

      onUserChanged({
        uid: fbUser.uid,
        email,
        displayName: fbUser.displayName || email.split('@')[0],
        photoURL: fbUser.photoURL,
        role: isAdmin ? 'admin' : 'it_staff',
        isDomainAllowed,
        providerId: fbUser.providerData[0]?.providerId || 'password',
      });
    });
  }

  // If no auth, return no-op
  return () => {};
}
