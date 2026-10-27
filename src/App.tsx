import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { OffboardingDetail } from './components/OffboardingDetail';
import { TemplateEditor } from './components/TemplateEditor';
import { PrintView } from './components/PrintView';
import { CreateOffboardingModal } from './components/CreateOffboardingModal';
import { SetupGuideModal } from './components/SetupGuideModal';
import { ConfirmModal } from './components/ConfirmModal';

import { OffboardingRecord, ChecklistTemplate } from './types/offboarding';
import {
  subscribeToOffboardings,
  subscribeToTemplate,
  deleteOffboardingRecord,
} from './firebase/service';
import { DEFAULT_CHECKLIST_SECTIONS } from './data/defaultChecklist';

function AppContent() {
  const { currentUser } = useAuth();

  // Dark mode state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('offboarding_tracker_dark_mode');
    if (saved !== null) return saved === 'true';
    return true; // default dark for modern IT admin dashboard
  });

  useEffect(() => {
    localStorage.setItem('offboarding_tracker_dark_mode', String(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Main navigation view state
  const [view, setView] = useState<'dashboard' | 'detail' | 'template' | 'print'>('dashboard');
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  // Firestore real-time synchronized data
  const [records, setRecords] = useState<OffboardingRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [activeTemplate, setActiveTemplate] = useState<ChecklistTemplate>({
    id: 'default',
    name: 'Standard Microsoft Entra & Intune Offboarding Template',
    sections: DEFAULT_CHECKLIST_SECTIONS,
    updatedAt: new Date().toISOString(),
    updatedBy: 'system',
  });

  // Modal states
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<OffboardingRecord | null>(null);

  // Real-time subscriptions
  useEffect(() => {
    setRecordsLoading(true);
    const unsubOffboardings = subscribeToOffboardings(
      data => {
        setRecords(data);
        setRecordsLoading(false);
      },
      err => {
        console.error('Offboardings sync error:', err);
        setRecordsLoading(false);
      }
    );

    const unsubTemplate = subscribeToTemplate(
      template => {
        setActiveTemplate(template);
      },
      err => {
        console.error('Template sync error:', err);
      }
    );

    return () => {
      unsubOffboardings();
      unsubTemplate();
    };
  }, []);

  // Selected record helper
  const selectedRecord = records.find(r => r.id === selectedRecordId) || null;

  // Handle record selection
  const handleSelectRecord = (id: string) => {
    setSelectedRecordId(id);
    setView('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle print record
  const handlePrintRecord = (id: string) => {
    setSelectedRecordId(id);
    setView('print');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle delete record
  const handleDeleteRecord = async () => {
    if (!recordToDelete) return;
    try {
      await deleteOffboardingRecord(recordToDelete.id);
      if (selectedRecordId === recordToDelete.id) {
        setSelectedRecordId(null);
        setView('dashboard');
      }
    } catch (err) {
      console.error('Failed to delete record:', err);
    } finally {
      setRecordToDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar
        activeView={view === 'detail' || view === 'print' ? 'dashboard' : view}
        onNavigate={targetView => {
          setView(targetView);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenNewModal={() => setIsNewModalOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {view === 'dashboard' && (
          <Dashboard
            records={records}
            loading={recordsLoading}
            onSelectRecord={handleSelectRecord}
            onPrintRecord={handlePrintRecord}
            onDeleteRecord={rec => setRecordToDelete(rec)}
            onOpenNewModal={() => setIsNewModalOpen(true)}
          />
        )}

        {view === 'detail' && selectedRecord && (
          <OffboardingDetail
            record={selectedRecord}
            activeTemplate={activeTemplate}
            onBack={() => setView('dashboard')}
            onPrint={() => setView('print')}
          />
        )}

        {view === 'print' && selectedRecord && (
          <PrintView
            record={selectedRecord}
            onBack={() => setView('detail')}
          />
        )}

        {view === 'template' && (
          <TemplateEditor
            template={activeTemplate}
            onTemplateUpdated={updated => setActiveTemplate(updated)}
          />
        )}
      </main>

      {/* New Offboarding Modal */}
      <CreateOffboardingModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        activeTemplate={activeTemplate}
        onCreated={newId => {
          setSelectedRecordId(newId);
          setView('detail');
        }}
      />

      {/* Firebase Setup Guide & Config Modal */}
      <SetupGuideModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />



      {/* Delete Record Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(recordToDelete)}
        title="Delete Offboarding Record"
        message={`Are you sure you want to permanently delete the offboarding record for ${recordToDelete?.employeeName}? All checklist history, notes, and verification stamps will be purged from Firestore.`}
        confirmLabel="Permanently Delete"
        onConfirm={handleDeleteRecord}
        onCancel={() => setRecordToDelete(null)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
