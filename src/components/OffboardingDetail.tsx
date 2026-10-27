import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  Calendar,
  User,
  UserCheck,
  Building,
  Mail,
  Printer,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Check,
  ExternalLink,
  Shield,
  Save,
  Sparkles,
  Pencil,
  KeyRound,
  RotateCcw,
} from 'lucide-react';
import { OffboardingRecord, ChecklistSection, ChecklistItem, ChecklistTemplate, OffboardingStatus, DeviceVaultData } from '../types/offboarding';
import { toggleChecklistItem, updateItemNote, updateOffboardingRecord } from '../firebase/service';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_CHECKLIST_SECTIONS } from '../data/defaultChecklist';
import { DatePicker } from './DatePicker';
import { DeviceVault } from './DeviceVault';
import { EditEmployeeModal } from './EditEmployeeModal';

interface OffboardingDetailProps {
  record: OffboardingRecord;
  activeTemplate?: ChecklistTemplate;
  onBack: () => void;
  onPrint: () => void;
}

export const OffboardingDetail: React.FC<OffboardingDetailProps> = ({
  record,
  activeTemplate,
  onBack,
  onPrint,
}) => {
  const { currentUser } = useAuth();
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [editingNotes, setEditingNotes] = useState<{ [itemId: string]: string }>({});
  const [filterMode, setFilterMode] = useState<'all' | 'pending' | 'completed'>('all');

  const toggleSection = (sectionId: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const handleExpandAll = () => {
    setCollapsedSections({});
  };

  const handleCollapseAll = () => {
    const allCollapsed: Record<string, boolean> = {};
    record.checklist.forEach(sec => {
      allCollapsed[sec.id] = true;
    });
    setCollapsedSections(allCollapsed);
  };
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [generalNotes, setGeneralNotes] = useState(record.notes || '');
  const [savingGeneralNotes, setSavingGeneralNotes] = useState(false);
  const [generalNotesSaved, setGeneralNotesSaved] = useState(false);

  // Last working day editing state
  const [isEditingLwd, setIsEditingLwd] = useState(false);
  const [tempLwd, setTempLwd] = useState(record.lastWorkingDay);
  const [savingLwd, setSavingLwd] = useState(false);

  // Edit employee information modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    setGeneralNotes(record.notes || '');
  }, [record.id, record.notes]);

  useEffect(() => {
    setTempLwd(record.lastWorkingDay);
  }, [record.id, record.lastWorkingDay]);

  const handleSaveLwd = async () => {
    if (!tempLwd) return;
    setSavingLwd(true);
    try {
      await updateOffboardingRecord({
        ...record,
        lastWorkingDay: tempLwd,
        updatedBy: currentUser?.email,
      });
      setIsEditingLwd(false);
    } catch (e) {
      console.error('Failed to update last working day:', e);
    } finally {
      setSavingLwd(false);
    }
  };

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const isOverdue = record.status !== 'completed' && record.lastWorkingDay < todayStr;

  const getDaysOverdue = (lwd: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(lwd);
    target.setHours(0, 0, 0, 0);
    const diff = Math.floor((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff);
  };

  // Progress metrics
  const progress = useMemo(() => {
    let total = 0;
    let completed = 0;
    record.checklist.forEach(sec => {
      sec.items.forEach(it => {
        total++;
        if (it.completed) completed++;
      });
    });
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percent };
  }, [record]);

  // Handle toggling checkbox
  const handleToggle = async (sectionId: string, itemId: string, currentCompleted: boolean) => {
    const userEmail = currentUser?.email || 'it.admin@company.com';
    try {
      await toggleChecklistItem(
        record,
        sectionId,
        itemId,
        !currentCompleted,
        userEmail
      );
    } catch (err) {
      console.error('Failed to toggle item:', err);
    }
  };

  // Handle note save
  const handleSaveNote = async (sectionId: string, itemId: string) => {
    const userEmail = currentUser?.email || 'it.admin@company.com';
    const noteText = editingNotes[itemId] !== undefined ? editingNotes[itemId] : '';
    try {
      await updateItemNote(record, sectionId, itemId, noteText, userEmail);
    } catch (err) {
      console.error('Failed to save note:', err);
    }
  };

  // Handle Manual Status Change
  const handleStatusChange = async (newStatus: OffboardingStatus) => {
    setStatusUpdating(true);
    try {
      await updateOffboardingRecord({
        ...record,
        status: newStatus,
        updatedBy: currentUser?.email,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setStatusUpdating(false);
    }
  };

  // Handle Vault updates
  const handleUpdateVault = async (updatedVault: DeviceVaultData) => {
    try {
      await updateOffboardingRecord({
        ...record,
        vault: updatedVault,
        updatedBy: currentUser?.email,
      });
    } catch (e) {
      console.error('Failed to update device vault:', e);
    }
  };

  const handleSyncChecklistTemplate = async () => {
    if (confirm('Update this record to match the master enterprise checklist template? Any matching completed items will retain their completion status.')) {
      setStatusUpdating(true);
      try {
        const sourceSections = activeTemplate?.sections && activeTemplate.sections.length > 0
          ? activeTemplate.sections
          : DEFAULT_CHECKLIST_SECTIONS;
        const masterSections: ChecklistSection[] = JSON.parse(JSON.stringify(sourceSections));
        
        // Preserve any existing completed items if item IDs match
        const completedMap = new Map<string, { completed: boolean; completedBy: string | null; completedAt: string | null; note?: string }>();
        record.checklist.forEach(sec => {
          sec.items.forEach(it => {
            if (it.completed || it.note) {
              completedMap.set(it.id, {
                completed: it.completed,
                completedBy: it.completedBy,
                completedAt: it.completedAt,
                note: it.note,
              });
            }
          });
        });

        masterSections.forEach(sec => {
          sec.items.forEach(it => {
            const prev = completedMap.get(it.id);
            if (prev) {
              it.completed = prev.completed;
              it.completedBy = prev.completedBy;
              it.completedAt = prev.completedAt;
              if (prev.note) it.note = prev.note;
            }
          });
        });

        await updateOffboardingRecord({
          ...record,
          checklist: masterSections,
          updatedBy: currentUser?.email,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setStatusUpdating(false);
      }
    }
  };

  // Handle general notes save
  const handleSaveGeneralNotes = async () => {
    setSavingGeneralNotes(true);
    try {
      await updateOffboardingRecord({
        ...record,
        notes: generalNotes.trim(),
        updatedBy: currentUser?.email,
      });
      setGeneralNotesSaved(true);
      setTimeout(() => setGeneralNotesSaved(false), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingGeneralNotes(false);
    }
  };

  // Format date helper
  const formatDateTime = (isoString: string | null) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <div className="flex items-center gap-2.5">
          {/* Status selector */}
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="text-slate-500 dark:text-slate-400">Status:</span>
            <select
              value={record.status}
              disabled={statusUpdating}
              onChange={e => handleStatusChange(e.target.value as OffboardingStatus)}
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Edit Info Button */}
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/70 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-semibold border border-blue-200 dark:border-blue-800 transition cursor-pointer shadow-xs"
          >
            <Pencil className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            Edit Info
          </button>

          {/* Print / Export Button */}
          <button
            onClick={onPrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-300 dark:border-slate-700 transition cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            Print / Export PDF
          </button>
        </div>
      </div>

      {/* OVERDUE Warning Banner (Requirement 5) */}
      {isOverdue && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-500/60 rounded-2xl p-4 sm:p-5 shadow-md flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-500 border border-rose-500/40 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/30">
                Overdue Decommissioning Warning
              </span>
              <span className="text-xs font-mono font-semibold text-rose-700 dark:text-rose-300">
                {getDaysOverdue(record.lastWorkingDay)} {getDaysOverdue(record.lastWorkingDay) === 1 ? 'day' : 'days'} past last working day
              </span>
            </div>
            <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200 mt-1">
              Checklist Incomplete Beyond Last Working Day ({record.lastWorkingDay})
            </h3>
            <p className="text-xs text-rose-800/90 dark:text-rose-300/80 mt-1 leading-relaxed">
              This employee is no longer with the organization. Immediate action is required to revoke Entra ID refresh tokens, block sign-in, remote wipe Intune devices, and convert the mailbox to prevent unauthorized access.
            </p>
          </div>
        </div>
      )}

      {/* Employee Profile & Record Details Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-900/50">
                {record.department}
              </span>
              <span className="text-[11px] font-mono text-slate-400">ID: {record.id}</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {record.employeeName}
              </h1>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 transition cursor-pointer shadow-2xs"
                title="Edit Employee Information"
              >
                <Pencil className="w-3 h-3" />
                <span>Edit Details</span>
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              {record.employeeEmail}
            </p>
          </div>

          {/* Quick Progress Dial */}
          <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
            <div className="text-right">
              <div className="text-xs text-slate-500 font-medium">Offboarding Progress</div>
              <div className="text-xl font-bold text-slate-900 dark:text-slate-100 font-mono">
                {progress.completed} / {progress.total}
              </div>
              <div className="text-[10px] text-slate-400">Items verified</div>
            </div>
            <div className="relative w-14 h-14 flex items-center justify-center">
              <svg className="w-14 h-14 -rotate-90">
                <circle
                  cx="28"
                  cy="28"
                  r="23"
                  className="stroke-slate-200 dark:stroke-slate-800"
                  strokeWidth="5"
                  fill="none"
                />
                <circle
                  cx="28"
                  cy="28"
                  r="23"
                  className={`${
                    progress.percent === 100
                      ? 'stroke-emerald-500'
                      : isOverdue
                      ? 'stroke-rose-500'
                      : 'stroke-blue-600'
                  }`}
                  strokeWidth="5"
                  strokeDasharray={144.5}
                  strokeDashoffset={144.5 - (144.5 * progress.percent) / 100}
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
              <span className="absolute font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                {progress.percent}%
              </span>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5 text-xs">
          <div className="bg-slate-50 dark:bg-slate-950/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/60 relative">
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                <Calendar className="w-3.5 h-3.5 text-blue-500" /> Last Working Day
              </span>
              {!isEditingLwd ? (
                <button
                  type="button"
                  onClick={() => setIsEditingLwd(true)}
                  className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer font-medium"
                >
                  <Pencil className="w-2.5 h-2.5" /> Edit
                </button>
              ) : null}
            </div>

            {!isEditingLwd ? (
              <span
                className={`font-mono text-sm font-semibold block ${
                  isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'
                }`}
              >
                {record.lastWorkingDay}
              </span>
            ) : (
              <div className="space-y-2 mt-1">
                <DatePicker
                  value={tempLwd}
                  onChange={setTempLwd}
                />
                <div className="flex items-center gap-1.5 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setTempLwd(record.lastWorkingDay);
                      setIsEditingLwd(false);
                    }}
                    className="px-2 py-0.5 rounded text-[11px] text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={savingLwd}
                    onClick={handleSaveLwd}
                    className="px-2.5 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium text-[11px] disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {savingLwd ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-slate-50 dark:bg-slate-950/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/60">
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                <User className="w-3.5 h-3.5 text-indigo-500" /> Direct Manager
              </span>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 cursor-pointer font-medium"
              >
                <Pencil className="w-2.5 h-2.5" /> Edit
              </button>
            </div>
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate block">
              {record.manager}
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/60">
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                <UserCheck className="w-3.5 h-3.5 text-emerald-500" /> Assigned IT Specialist
              </span>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5 cursor-pointer font-medium"
              >
                <Pencil className="w-2.5 h-2.5" /> Edit
              </button>
            </div>
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate block">
              {record.assignedItPerson}
            </span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/60">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium mb-1">
              <Clock className="w-3.5 h-3.5 text-amber-500" /> Record Initiated
            </span>
            <span className="text-xs font-mono font-semibold text-slate-900 dark:text-slate-100 block">
              {formatDateTime(record.createdAt)}
            </span>
          </div>
        </div>

        {/* General Notes matching PDF: "Notes: Anything unusual, pending items, data transfer details..." */}
        <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-100 dark:border-slate-800/80 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
              General Offboarding Notes & Audit Details
            </span>
            <div className="flex items-center gap-2">
              {generalNotesSaved && (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Saved
                </span>
              )}
              {generalNotes !== (record.notes || '') && (
                <button
                  onClick={handleSaveGeneralNotes}
                  disabled={savingGeneralNotes}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                >
                  <Save className="w-3 h-3" />
                  {savingGeneralNotes ? 'Saving...' : 'Save Notes'}
                </button>
              )}
            </div>
          </div>
          <textarea
            value={generalNotes}
            onChange={e => setGeneralNotes(e.target.value)}
            rows={2}
            placeholder="Anything unusual, pending items, data transfer details, scheduled account deletion date..."
            className="w-full p-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500 resize-y"
          />
        </div>
      </div>

      {/* Password-Protected Device & BitLocker Vault (Optional) */}
      <DeviceVault
        vaultData={record.vault}
        employeeName={record.employeeName}
        onUpdateVault={handleUpdateVault}
      />

      {/* Policy checklist update banner if checklist has fewer than 6 sections */}
      {record.checklist.length < 6 && (
        <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="text-xs text-slate-700 dark:text-slate-300">
              <strong className="block text-slate-900 dark:text-slate-100">
                Full 6-Section Policy Checklist Available ({record.checklist.length} of 6 sections currently loaded)
              </strong>
              Update this employee's file to the complete 6-section offboarding policy from your PDF. Completed checks will be retained.
            </div>
          </div>
          <button
            onClick={handleSyncChecklistTemplate}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shrink-0 cursor-pointer transition shadow-xs"
          >
            Update to 6-Section Checklist
          </button>
        </div>
      )}

      {/* Filter checklist buttons & Collapse/Expand All controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          Decommissioning Checklist
          <span className="text-xs font-normal text-slate-500 font-mono">
            ({record.checklist.length} Sections)
          </span>
        </h2>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Quick Collapse / Expand All */}
          <div className="flex items-center gap-1 border-r border-slate-200 dark:border-slate-800 pr-2 mr-0.5">
            <button
              type="button"
              onClick={handleExpandAll}
              className="px-2 py-1 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Expand all sections"
            >
              Expand All
            </button>
            <button
              type="button"
              onClick={handleCollapseAll}
              className="px-2 py-1 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Collapse all sections"
            >
              Collapse All
            </button>
          </div>

          <span className="text-slate-400 text-[11px] font-medium hidden sm:inline">Show:</span>
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
              filterMode === 'all'
                ? 'bg-blue-600 text-white font-semibold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            All Items
          </button>
          <button
            onClick={() => setFilterMode('pending')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
              filterMode === 'pending'
                ? 'bg-blue-600 text-white font-semibold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Pending Only
          </button>
          <button
            onClick={() => setFilterMode('completed')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
              filterMode === 'completed'
                ? 'bg-blue-600 text-white font-semibold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Completed Only
          </button>

          <button
            type="button"
            onClick={handleSyncChecklistTemplate}
            title="Update this employee's checklist to match the latest Master Template (completed tasks are preserved)"
            className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 transition cursor-pointer flex items-center gap-1.5 ml-1"
          >
            <RotateCcw className="w-3 h-3 text-slate-500" />
            <span>Sync with Template</span>
          </button>
        </div>
      </div>

      {/* Checklist Sections */}
      <div className="space-y-4">
        {record.checklist.map((section, sectionIdx) => {
          const completedCount = section.items.filter(i => i.completed).length;
          const totalCount = section.items.length;
          const isSectionDone = totalCount > 0 && completedCount === totalCount;

          const visibleItems = section.items.filter(item => {
            if (filterMode === 'pending') return !item.completed;
            if (filterMode === 'completed') return item.completed;
            return true;
          });

          if (visibleItems.length === 0 && filterMode !== 'all') {
            return null;
          }

          const isCollapsed = !!collapsedSections[section.id];

          return (
            <div
              key={section.id}
              className={`bg-white dark:bg-slate-900 border rounded-2xl overflow-hidden shadow-xs transition-all ${
                isSectionDone
                  ? 'border-emerald-200 dark:border-emerald-900/40'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              {/* Section Header */}
              <div
                onClick={() => toggleSection(section.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleSection(section.id);
                  }
                }}
                aria-expanded={!isCollapsed}
                className={`group p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none transition-colors ${
                  isSectionDone
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-50/80 dark:hover:bg-emerald-950/40'
                    : 'bg-slate-50/70 dark:bg-slate-950/40 hover:bg-slate-100 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                      isSectionDone
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {isSectionDone ? <Check className="w-4 h-4" /> : sectionIdx + 1}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      {section.title}
                    </h3>
                    {section.description && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {section.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`font-mono text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                      isSectionDone
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/50'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {completedCount}/{totalCount} completed
                  </span>
                  
                  {/* Arrow Toggle Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSection(section.id);
                    }}
                    title={isCollapsed ? "Click to expand section" : "Click to collapse section"}
                    aria-label={isCollapsed ? `Expand section ${section.title}` : `Collapse section ${section.title}`}
                    className="p-1.5 rounded-lg text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 transition-all cursor-pointer"
                  >
                    {isCollapsed ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronUp className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Section Items */}
              {!isCollapsed && (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/80 p-2 sm:p-4 space-y-2">
                  {visibleItems.map(item => {
                    const currentNote =
                      editingNotes[item.id] !== undefined ? editingNotes[item.id] : item.note || '';

                    return (
                      <div
                        key={item.id}
                        className={`p-3 sm:p-4 rounded-xl transition-all ${
                          item.completed
                            ? 'bg-emerald-50/30 dark:bg-emerald-950/15 border border-emerald-200/50 dark:border-emerald-900/30'
                            : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/40 border border-transparent'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Checkbox (Requirement 3: when ticked auto records email & time; when unticked clears them) */}
                          <button
                            type="button"
                            onClick={() => handleToggle(section.id, item.id, item.completed)}
                            className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-all cursor-pointer ${
                              item.completed
                                ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                                : 'border-slate-300 dark:border-slate-700 hover:border-blue-500 bg-white dark:bg-slate-950'
                            }`}
                          >
                            {item.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </button>

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4
                                  className={`text-xs sm:text-sm font-semibold ${
                                    item.completed
                                      ? 'text-slate-600 dark:text-slate-400 line-through'
                                      : 'text-slate-900 dark:text-slate-100'
                                  }`}
                                >
                                  {item.label.replace('[Recommended]', '').trim()}
                                </h4>
                                {item.label.includes('[Recommended]') && (
                                  <span className="text-[10px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800/60 shrink-0">
                                    ★ Best Practice
                                  </span>
                                )}
                              </div>

                              {/* Completed Status */}
                              {item.completed && (
                                <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-300/60 dark:border-emerald-800/40 whitespace-nowrap flex items-center gap-1">
                                  <Check className="w-3 h-3 stroke-[3]" /> Done
                                </span>
                              )}
                            </div>

                            {item.description && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                                {item.description}
                              </p>
                            )}

                            {/* Item Note Input */}
                            <div className="mt-2.5 flex items-center gap-2">
                              <div className="relative flex-1">
                                <MessageSquare className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                                <input
                                  type="text"
                                  value={currentNote}
                                  onChange={e =>
                                    setEditingNotes({ ...editingNotes, [item.id]: e.target.value })
                                  }
                                  onBlur={() => handleSaveNote(section.id, item.id)}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') handleSaveNote(section.id, item.id);
                                  }}
                                  placeholder="Add optional operational note or ticket # (no secrets)..."
                                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                                />
                              </div>
                              {editingNotes[item.id] !== undefined &&
                                editingNotes[item.id] !== (item.note || '') && (
                                  <button
                                    onClick={() => handleSaveNote(section.id, item.id)}
                                    className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-medium transition cursor-pointer"
                                  >
                                    Save
                                  </button>
                                )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Edit Employee Information Modal */}
      <EditEmployeeModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        record={record}
      />
    </div>
  );
};
