import React, { useState, useEffect } from 'react';
import { X, User, Mail, Building, UserCheck, Calendar, Save, CheckCircle2 } from 'lucide-react';
import { OffboardingRecord } from '../types/offboarding';
import { updateOffboardingRecord } from '../firebase/service';
import { useAuth } from '../context/AuthContext';
import { DatePicker } from './DatePicker';
import { DEPARTMENTS } from './CreateOffboardingModal';

interface EditEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: OffboardingRecord;
  onSaved?: () => void;
}

export const EditEmployeeModal: React.FC<EditEmployeeModalProps> = ({
  isOpen,
  onClose,
  record,
  onSaved,
}) => {
  const { currentUser } = useAuth();

  const [employeeName, setEmployeeName] = useState(record.employeeName || '');
  const [employeeEmail, setEmployeeEmail] = useState(record.employeeEmail || '');
  const [department, setDepartment] = useState(record.department || 'IT');
  const [customDepartment, setCustomDepartment] = useState('');
  const [isCustomDept, setIsCustomDept] = useState(false);
  const [lastWorkingDay, setLastWorkingDay] = useState(record.lastWorkingDay || '');
  const [manager, setManager] = useState(record.manager || '');
  const [assignedItPerson, setAssignedItPerson] = useState(record.assignedItPerson || '');
  
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Synchronize state when record changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setEmployeeName(record.employeeName || '');
      setEmployeeEmail(record.employeeEmail || '');
      
      if (DEPARTMENTS.includes(record.department)) {
        setDepartment(record.department);
        setIsCustomDept(false);
        setCustomDepartment('');
      } else {
        setDepartment('Other');
        setIsCustomDept(true);
        setCustomDepartment(record.department || '');
      }

      setLastWorkingDay(record.lastWorkingDay || '');
      setManager(record.manager || '');
      setAssignedItPerson(record.assignedItPerson || '');
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen, record]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const trimmedName = employeeName.trim();
    const trimmedEmail = employeeEmail.trim();
    const finalDepartment = isCustomDept ? customDepartment.trim() : department;

    if (!trimmedName) {
      setErrorMsg('Please enter employee name.');
      return;
    }

    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setErrorMsg('Please enter a valid corporate email address.');
      return;
    }

    if (!lastWorkingDay) {
      setErrorMsg('Please select the employee last working day.');
      return;
    }

    if (isCustomDept && !finalDepartment) {
      setErrorMsg('Please specify the department name.');
      return;
    }

    setSubmitting(true);
    try {
      const updatedRecord: OffboardingRecord = {
        ...record,
        employeeName: trimmedName,
        employeeEmail: trimmedEmail,
        department: finalDepartment,
        lastWorkingDay,
        manager: manager.trim() || 'Not specified',
        assignedItPerson: assignedItPerson.trim() || 'IT Operations',
        updatedBy: currentUser?.email || 'IT Staff',
      };

      await updateOffboardingRecord(updatedRecord);
      setSuccessMsg('Employee information updated successfully!');
      
      setTimeout(() => {
        if (onSaved) onSaved();
        onClose();
      }, 700);
    } catch (err: any) {
      console.error('Failed to update employee details:', err);
      setErrorMsg(err.message || 'Failed to update employee details. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/30">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Edit Employee Information
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Record ID: {record.id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Employee Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-500" />
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
              placeholder="e.g. Nadeesha Senaratne"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Corporate Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-blue-500" />
              Corporate Email Address <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              required
              value={employeeEmail}
              onChange={(e) => setEmployeeEmail(e.target.value)}
              placeholder="e.g. nadeesha.s@mycompany.com"
              className="w-full px-3.5 py-2 text-sm font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Department & Last Working Day Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Department */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-blue-500" />
                Department <span className="text-rose-500">*</span>
              </label>
              <select
                value={isCustomDept ? 'Other' : department}
                onChange={(e) => {
                  if (e.target.value === 'Other') {
                    setIsCustomDept(true);
                  } else {
                    setIsCustomDept(false);
                    setDepartment(e.target.value);
                  }
                }}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
                <option value="Other">Other / Custom Department</option>
              </select>

              {isCustomDept && (
                <input
                  type="text"
                  value={customDepartment}
                  onChange={(e) => setCustomDepartment(e.target.value)}
                  placeholder="Enter custom department name"
                  className="w-full mt-2 px-3.5 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>

            {/* Last Working Day */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                Last Working Day <span className="text-rose-500">*</span>
              </label>
              <DatePicker
                value={lastWorkingDay}
                onChange={setLastWorkingDay}
              />
            </div>
          </div>

          {/* Direct Manager & Assigned IT Specialist Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Direct Manager */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-500" />
                Direct Manager
              </label>
              <input
                type="text"
                value={manager}
                onChange={(e) => setManager(e.target.value)}
                placeholder="e.g. Sanjaya Perera - VP Marketing"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Assigned IT Specialist */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                Assigned IT Specialist
              </label>
              <input
                type="text"
                value={assignedItPerson}
                onChange={(e) => setAssignedItPerson(e.target.value)}
                placeholder="e.g. Amila Jayasinghe"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              {submitting ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
