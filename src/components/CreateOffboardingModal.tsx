import React, { useState } from 'react';
import { X, UserPlus, Calendar, Mail, Building, UserCheck, ShieldAlert, Sparkles } from 'lucide-react';
import { OffboardingRecord, ChecklistTemplate } from '../types/offboarding';
import { createOffboardingRecord } from '../firebase/service';
import { useAuth } from '../context/AuthContext';
import { DatePicker } from './DatePicker';

interface CreateOffboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTemplate: ChecklistTemplate;
  onCreated: (recordId: string) => void;
}

export const DEPARTMENTS = [
  'IT',
  'Research (RES)',
  'Operation (OPS)',
  'Adversary',
  'Compliance',
  'Admin & Finance',
  'Unit Trust (UT)',
  'Digital Marketing (DM)',
];

export const CreateOffboardingModal: React.FC<CreateOffboardingModalProps> = ({
  isOpen,
  onClose,
  activeTemplate,
  onCreated,
}) => {
  const { currentUser, companyDomain } = useAuth();

  const [employeeName, setEmployeeName] = useState('');
  const [employeeEmail, setEmployeeEmail] = useState('');
  const [department, setDepartment] = useState('IT');
  const [lastWorkingDay, setLastWorkingDay] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // default 1 week from today
  );
  const [manager, setManager] = useState('');
  const [assignedItPerson, setAssignedItPerson] = useState(
    currentUser?.displayName || currentUser?.email || 'IT Operations'
  );
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!employeeName.trim() || !employeeEmail.trim() || !lastWorkingDay) {
      setErrorMsg('Please fill in Employee Name, Email, and Last Working Day.');
      return;
    }

    setSubmitting(true);
    try {
      // Deep copy active template sections so modifications to templates in future NEVER alter this record
      const checklistSnapshot = JSON.parse(JSON.stringify(activeTemplate.sections));

      // Reset any completion values to pristine fresh checklist
      checklistSnapshot.forEach((section: any) => {
        section.items.forEach((item: any) => {
          item.completed = false;
          item.completedBy = null;
          item.completedAt = null;
          item.note = '';
        });
      });

      const newId = `offboard-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const now = new Date().toISOString();

      const newRecord: OffboardingRecord = {
        id: newId,
        employeeName: employeeName.trim(),
        employeeEmail: employeeEmail.trim(),
        department,
        lastWorkingDay,
        manager: manager.trim() || 'Unassigned',
        assignedItPerson: assignedItPerson.trim() || (currentUser?.email ?? 'IT Staff'),
        status: 'not_started',
        notes: notes.trim(),
        checklist: checklistSnapshot,
        createdAt: now,
        updatedAt: now,
        createdBy: currentUser?.email || 'it.admin@' + companyDomain,
      };

      await createOffboardingRecord(newRecord);
      onCreated(newId);
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to create offboarding record');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to auto-complete company domain
  const handleEmailBlur = () => {
    if (employeeEmail && !employeeEmail.includes('@')) {
      setEmployeeEmail(`${employeeEmail.trim()}@${companyDomain}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Initiate New Offboarding
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Copies current checklist template ({activeTemplate.sections.reduce((acc, s) => acc + s.items.length, 0)} items)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-600 dark:text-rose-300">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Employee Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Employee Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={employeeName}
                onChange={e => setEmployeeName(e.target.value)}
                placeholder="e.g. Malith Weerasinghe"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Employee Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Company Email <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={employeeEmail}
                  onChange={e => setEmployeeEmail(e.target.value)}
                  onBlur={handleEmailBlur}
                  placeholder={`malith.w@${companyDomain}`}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Department <span className="text-rose-500">*</span>
              </label>
              <select
                value={department}
                onChange={e => setDepartment(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                {DEPARTMENTS.map(dept => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Last Working Day */}
            <div>
              <DatePicker
                label="Last Working Day"
                required
                value={lastWorkingDay}
                onChange={setLastWorkingDay}
              />
            </div>

            {/* Manager */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Direct Manager / Lead
              </label>
              <input
                type="text"
                value={manager}
                onChange={e => setManager(e.target.value)}
                placeholder="e.g. Chaminda Silva (VP Eng)"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Assigned IT Person */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Assigned IT Specialist
              </label>
              <input
                type="text"
                value={assignedItPerson}
                onChange={e => setAssignedItPerson(e.target.value)}
                placeholder="e.g. Saman IT Admin"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Notes field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Initial Offboarding Context & Hardware Notes
              </label>
              {/* Security Warning as specifically requested in prompt requirement 15 */}
              <span className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium">
                <ShieldAlert className="w-3.5 h-3.5" />
                Never store passwords or BitLocker keys here
              </span>
            </div>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Dell Latitude laptop, Samsung Galaxy Android phone, external monitor and YubiKey assigned. Manager requests OneDrive handover within 14 days."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 disabled:opacity-50 transition cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              {submitting ? 'Creating...' : 'Create Record & Copy Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
