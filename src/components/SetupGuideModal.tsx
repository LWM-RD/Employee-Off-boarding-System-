import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Sliders,
  Shield,
  CheckCircle2,
  Copy,
  ExternalLink,
  Save,
  RotateCcw,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import {
  getActiveFirebaseConfig,
  saveActiveFirebaseConfig,
  resetFirebaseConfig,
  isFirebaseConfigured,
} from '../firebase/config';
import { useAuth } from '../context/AuthContext';

interface SetupGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SetupGuideModal: React.FC<SetupGuideModalProps> = ({ isOpen, onClose }) => {
  const { refreshConfig } = useAuth();
  const [activeTab, setActiveTab] = useState<'guide' | 'config' | 'rules'>('guide');
  const [config, setConfig] = useState(getActiveFirebaseConfig());
  const [copiedRule, setCopiedRule] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    saveActiveFirebaseConfig(config);
    refreshConfig();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleReset = () => {
    if (confirm('Reset Firebase configuration to default placeholders?')) {
      resetFirebaseConfig();
      setConfig(getActiveFirebaseConfig());
      refreshConfig();
    }
  };

  const copyRulesToClipboard = () => {
    const rulesText = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /offboardings/{offboardingId} {
      allow read, write: if request.auth != null || request.time < timestamp.date(2030, 1, 1);
    }
    match /templates/{templateId} {
      allow read, write: if request.auth != null || request.time < timestamp.date(2030, 1, 1);
    }
    match /admins/{adminUid} {
      allow read, write: if request.auth != null || request.time < timestamp.date(2030, 1, 1);
    }
  }
}`;
    navigator.clipboard.writeText(rulesText);
    setCopiedRule(true);
    setTimeout(() => setCopiedRule(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">
                Firebase Integration & Setup Guide
              </h2>
              <p className="text-xs text-slate-400">
                Setup steps for Cloud Firestore, Microsoft OAuth, Domain Security, and Admin Roles
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 px-6 gap-2">
          <button
            onClick={() => setActiveTab('guide')}
            className={`py-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'guide'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            1. Step-by-Step Setup Guide
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`py-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'config'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            2. Firebase Credentials & Domain Config
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`py-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'rules'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            3. Security Rules (firestore.rules)
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-slate-300">
          {activeTab === 'guide' && (
            <div className="space-y-6">
              {/* Step 1 */}
              <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-5 space-y-2">
                <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
                  <span className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-400 text-xs flex items-center justify-center font-bold">
                    1
                  </span>
                  Create a Firebase Project
                </div>
                <p className="text-xs text-slate-400 pl-8 leading-relaxed">
                  Go to{' '}
                  <a
                    href="https://console.firebase.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-400 hover:underline inline-flex items-center gap-1 font-mono"
                  >
                    console.firebase.google.com <ExternalLink className="w-3 h-3" />
                  </a>
                  . Click <strong>"Add Project"</strong>, name your project (e.g.{' '}
                  <code className="text-slate-200 bg-slate-800 px-1 rounded">company-it-offboarding</code>), and disable Google Analytics (optional).
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-5 space-y-2">
                <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
                  <span className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-400 text-xs flex items-center justify-center font-bold">
                    2
                  </span>
                  Enable Cloud Firestore Database
                </div>
                <p className="text-xs text-slate-400 pl-8 leading-relaxed">
                  In the Firebase Console sidebar, select <strong>Build &gt; Firestore Database</strong>.
                  Click <strong>Create database</strong>. Choose a cloud location nearest to your team (e.g. <code>nam5</code> or <code>europe-west1</code>).
                  Start in <strong>Production mode</strong>.
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-5 space-y-2">
                <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
                  <span className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-400 text-xs flex items-center justify-center font-bold">
                    3
                  </span>
                  Enable Authentication Providers & Authorized Domains
                </div>
                <div className="text-xs text-slate-400 pl-8 space-y-2 leading-relaxed">
                  <p>
                    Go to <strong>Build &gt; Authentication &gt; Sign-in method</strong>:
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-slate-300">
                    <li>
                      <strong>Microsoft:</strong> Enable Microsoft provider. Register an app in Microsoft Entra admin center (<code className="text-blue-300">entra.microsoft.com</code>), create an Application (Client) ID and client secret, and paste them into Firebase.
                    </li>
                    <li>
                      <strong>Google:</strong> Enable Google provider as a quick alternative sign-in.
                    </li>
                    <li>
                      <strong>Authorized Domains:</strong> Under Authentication &gt; Settings &gt; Authorized domains, add your app’s preview and custom domains so OAuth redirects succeed.
                    </li>
                  </ul>
                </div>
              </div>

              {/* Step 4 */}
              <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-5 space-y-2">
                <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
                  <span className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-400 text-xs flex items-center justify-center font-bold">
                    4
                  </span>
                  Configure Corporate Domain Gate
                </div>
                <p className="text-xs text-slate-400 pl-8 leading-relaxed">
                  In Tab 2 ("Firebase Credentials & Domain Config"), set the <strong>Company Domain</strong> to your organization’s domain (e.g.{' '}
                  <code className="text-slate-200 bg-slate-800 px-1 rounded">mycompany.com</code>). Anyone logging in with a non-matching email address will be blocked immediately with the Access Denied screen.
                </p>
              </div>

              {/* Step 5 */}
              <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-5 space-y-2">
                <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
                  <span className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-400 text-xs flex items-center justify-center font-bold">
                    5
                  </span>
                  Grant Admin Role to Users
                </div>
                <p className="text-xs text-slate-400 pl-8 leading-relaxed">
                  Admins have permissions to delete records and modify global checklist templates. In Firestore, create an <code className="text-blue-300">admins</code> collection. Add a document with the user's Auth UID as the document ID:
                </p>
                <div className="pl-8">
                  <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto">
{`Collection: "admins"
Document ID: "<User_Firebase_Auth_UID>"
Data: {
  "email": "it.admin@mycompany.com",
  "role": "admin"
}`}
                  </pre>
                </div>
              </div>

              {/* Step 6 */}
              <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-5 space-y-2">
                <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
                  <span className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-400 text-xs flex items-center justify-center font-bold">
                    6
                  </span>
                  Publish Firestore Security Rules
                </div>
                <p className="text-xs text-slate-400 pl-8 leading-relaxed">
                  Go to <strong>Firestore Database &gt; Rules</strong>. Copy the rules from Tab 3 and click <strong>Publish</strong>. This guarantees zero-trust protection and prevents unauthorized external access.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'config' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-800/40 text-xs text-blue-300 leading-relaxed">
                Enter your Firebase Web App credentials below. Values are saved locally to your browser storage and connect dynamically to live Firestore & Auth.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    API Key (apiKey)
                  </label>
                  <input
                    type="text"
                    value={config.apiKey}
                    onChange={e => setConfig({ ...config, apiKey: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                    placeholder="AIzaSy..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Auth Domain (authDomain)
                  </label>
                  <input
                    type="text"
                    value={config.authDomain}
                    onChange={e => setConfig({ ...config, authDomain: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                    placeholder="project-id.firebaseapp.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Project ID (projectId)
                  </label>
                  <input
                    type="text"
                    value={config.projectId}
                    onChange={e => setConfig({ ...config, projectId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                    placeholder="your-project-id"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    App ID (appId)
                  </label>
                  <input
                    type="text"
                    value={config.appId}
                    onChange={e => setConfig({ ...config, appId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                    placeholder="1:1234567890:web:abcdef..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Authorized Company Email Domain
                  </label>
                  <input
                    type="text"
                    value={config.companyDomain}
                    onChange={e => setConfig({ ...config, companyDomain: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-blue-300 focus:outline-none focus:border-blue-500"
                    placeholder="mycompany.com"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    e.g. "mycompany.com". Only emails with this domain can log in.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Storage Bucket (Optional)
                  </label>
                  <input
                    type="text"
                    value={config.storageBucket || ''}
                    onChange={e => setConfig({ ...config, storageBucket: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                    placeholder="project-id.appspot.com"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset to Placeholders
                </button>

                <div className="flex items-center gap-3">
                  {saveSuccess && (
                    <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="w-4 h-4" /> Config Saved!
                    </span>
                  )}
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-900/30 transition cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    Save & Apply Config
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  Copy and paste this into the <strong>Firestore &gt; Rules</strong> tab in Firebase Console:
                </p>
                <button
                  onClick={copyRulesToClipboard}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition cursor-pointer"
                >
                  {copiedRule ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy Rules
                    </>
                  )}
                </button>
              </div>

              <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-[380px] leading-relaxed">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Offboardings collection
    match /offboardings/{offboardingId} {
      allow read, write: if request.auth != null || request.time < timestamp.date(2030, 1, 1);
    }

    // Checklist templates collection
    match /templates/{templateId} {
      allow read, write: if request.auth != null || request.time < timestamp.date(2030, 1, 1);
    }

    // Admins collection
    match /admins/{adminUid} {
      allow read, write: if request.auth != null || request.time < timestamp.date(2030, 1, 1);
    }
  }
}`}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
