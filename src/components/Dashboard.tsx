import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowUpDown,
  User,
  Building,
  UserCheck,
  ChevronRight,
  Printer,
  Trash2,
  PlusCircle,
  Shield,
  Layers,
  LayoutGrid,
  List,
  Key,
} from 'lucide-react';
import { OffboardingRecord } from '../types/offboarding';
import { useAuth } from '../context/AuthContext';

interface DashboardProps {
  records: OffboardingRecord[];
  loading: boolean;
  onSelectRecord: (recordId: string) => void;
  onPrintRecord: (recordId: string) => void;
  onDeleteRecord: (record: OffboardingRecord) => void;
  onOpenNewModal: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  records,
  loading,
  onSelectRecord,
  onPrintRecord,
  onDeleteRecord,
  onOpenNewModal,
}) => {
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'lwd_asc' | 'lwd_desc' | 'name' | 'progress_desc'>('lwd_desc');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Today string YYYY-MM-DD
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Helper to check if record is overdue
  const checkIsOverdue = (record: OffboardingRecord) => {
    if (record.status === 'completed') return false;
    return record.lastWorkingDay < todayStr;
  };

  const getDaysOverdue = (lwd: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(lwd);
    target.setHours(0, 0, 0, 0);
    const diff = Math.floor((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff);
  };

  // Helper to compute progress
  const getProgress = (record: OffboardingRecord) => {
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
  };

  // Metrics calculation
  const metrics = useMemo(() => {
    let inProgress = 0;
    let completed = 0;
    let notStarted = 0;
    let overdue = 0;

    records.forEach(r => {
      if (r.status === 'completed') completed++;
      else if (r.status === 'in_progress') inProgress++;
      else notStarted++;

      if (checkIsOverdue(r)) overdue++;
    });

    return {
      total: records.length,
      inProgress,
      completed,
      notStarted,
      overdue,
    };
  }, [records, todayStr]);

  // Filtered and sorted records
  const filteredRecords = useMemo(() => {
    return records
      .filter(record => {
        // Search filter
        const query = searchTerm.toLowerCase();
        const matchesQuery =
          record.employeeName.toLowerCase().includes(query) ||
          record.employeeEmail.toLowerCase().includes(query) ||
          record.department.toLowerCase().includes(query) ||
          record.assignedItPerson.toLowerCase().includes(query) ||
          record.manager.toLowerCase().includes(query);

        if (!matchesQuery) return false;

        // Status filter
        if (statusFilter === 'all') return true;
        if (statusFilter === 'overdue') return checkIsOverdue(record);
        return record.status === statusFilter;
      })
      .sort((a, b) => {
        if (sortBy === 'lwd_asc') return a.lastWorkingDay.localeCompare(b.lastWorkingDay);
        if (sortBy === 'lwd_desc') return b.lastWorkingDay.localeCompare(a.lastWorkingDay);
        if (sortBy === 'name') return a.employeeName.localeCompare(b.employeeName);
        if (sortBy === 'progress_desc') {
          return getProgress(b).percent - getProgress(a).percent;
        }
        return 0;
      });
  }, [records, searchTerm, statusFilter, sortBy, todayStr]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Metrics Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Offboardings
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {metrics.total}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Tracked IT transitions</div>
        </div>

        {/* In Progress */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              In Progress
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            {metrics.inProgress}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Active deprovisioning tasks</div>
        </div>

        {/* Completed */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Completed
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {metrics.completed}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Fully revoked & archived</div>
        </div>

        {/* Overdue */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'overdue' ? 'all' : 'overdue')}
          className={`border rounded-2xl p-4 shadow-xs cursor-pointer transition-all ${
            metrics.overdue > 0
              ? 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 hover:border-rose-400'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1.5 font-semibold">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
              Overdue Warning
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-xs">
              !
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-600 dark:text-rose-400">
            {metrics.overdue}
          </div>
          <div className="text-[11px] text-rose-700/80 dark:text-rose-400/80 mt-0.5">
            {metrics.overdue > 0
              ? 'Past Last Working Day & incomplete'
              : 'Zero overdue items'}
          </div>
        </div>
      </div>

      {/* Search, Filter & Sort Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by employee name, email, department, IT admin..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          {/* Sort & View toggles */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="lwd_desc">Last Working Day (Furthest)</option>
                <option value="lwd_asc">Last Working Day (Nearest)</option>
                <option value="name">Employee Name (A-Z)</option>
                <option value="progress_desc">Checklist Progress (%)</option>
              </select>
            </div>

            {/* View Mode Switcher */}
            <div className="flex border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden p-0.5 bg-slate-50 dark:bg-slate-950">
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Cards View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Table View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 text-[11px] font-medium flex items-center gap-1 shrink-0">
            <Filter className="w-3 h-3" /> Status:
          </span>
          {[
            { id: 'all', label: 'All Records', count: metrics.total },
            { id: 'in_progress', label: 'In Progress', count: metrics.inProgress },
            { id: 'not_started', label: 'Not Started', count: metrics.notStarted },
            { id: 'completed', label: 'Completed', count: metrics.completed },
            { id: 'overdue', label: 'Overdue', count: metrics.overdue, isOverdueChip: true },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === f.id
                  ? f.isOverdueChip
                    ? 'bg-rose-500 text-white font-semibold shadow-xs'
                    : 'bg-blue-600 text-white font-semibold shadow-xs'
                  : f.isOverdueChip && f.count > 0
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {f.label}
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  statusFilter === f.id
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {f.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main List / Table */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
          <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500">Loading offboarding records from Firestore...</p>
        </div>
      ) : filteredRecords.length === 0 ? (
        /* Empty State */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-500 flex items-center justify-center mx-auto mb-4 border border-blue-200 dark:border-blue-900/40">
            <Shield className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            No Offboardings Found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-5">
            {searchTerm || statusFilter !== 'all'
              ? 'No records match your search criteria. Try adjusting filters or clearing the search query.'
              : 'No employee offboardings have been initiated yet. Create the first record to generate the Entra ID and Intune checklist.'}
          </p>
          <button
            onClick={onOpenNewModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            Create First Offboarding
          </button>
        </div>
      ) : viewMode === 'cards' ? (
        /* Grid of Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecords.map(record => {
            const isOverdue = checkIsOverdue(record);
            const daysOverdue = isOverdue ? getDaysOverdue(record.lastWorkingDay) : 0;
            const progress = getProgress(record);

            return (
              <div
                key={record.id}
                className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-xs transition-all hover:shadow-md flex flex-col justify-between group relative overflow-hidden ${
                  isOverdue
                    ? 'border-rose-400 dark:border-rose-600/60 ring-1 ring-rose-400/30 dark:ring-rose-600/30'
                    : 'border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600/50'
                }`}
              >
                {/* Top strip banner for Overdue */}
                {isOverdue && (
                  <div className="absolute top-0 inset-x-0 bg-rose-500 text-white text-[10px] font-bold py-0.5 px-3 flex items-center justify-between shadow-xs">
                    <span className="flex items-center gap-1 uppercase tracking-wider">
                      <AlertTriangle className="w-3 h-3" /> Overdue
                    </span>
                    <span>{daysOverdue} {daysOverdue === 1 ? 'day' : 'days'} past last working day</span>
                  </div>
                )}

                <div className={isOverdue ? 'pt-3' : ''}>
                  {/* Status chip & Department */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700/60">
                      {record.department}
                    </span>

                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        record.status === 'completed'
                          ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/40'
                          : record.status === 'in_progress'
                          ? 'bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-800/40'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {record.status === 'completed'
                        ? 'Completed'
                        : record.status === 'in_progress'
                        ? 'In Progress'
                        : 'Not Started'}
                    </span>
                  </div>

                  {/* Employee Name & Email */}
                  <div className="cursor-pointer" onClick={() => onSelectRecord(record.id)}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {record.employeeName}
                      </h4>
                      {record.vault?.items && record.vault.items.length > 0 && (
                        <span
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30"
                          title={`${record.vault.items.length} device keys/passwords in vault`}
                        >
                          <Key className="w-2.5 h-2.5" />
                          Vault ({record.vault.items.length})
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">
                      {record.employeeEmail}
                    </p>
                  </div>

                  {/* Metadata tags */}
                  <div className="mt-3.5 space-y-1.5 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Last Working Day:
                      </span>
                      <span
                        className={`font-mono font-medium ${
                          isOverdue
                            ? 'text-rose-600 dark:text-rose-400 font-bold'
                            : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {record.lastWorkingDay}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        Manager:
                      </span>
                      <span className="text-slate-800 dark:text-slate-300 truncate max-w-[140px]">
                        {record.manager}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                        Assigned IT:
                      </span>
                      <span className="text-slate-800 dark:text-slate-300 truncate max-w-[140px]">
                        {record.assignedItPerson}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-500 font-medium">Checklist Progress</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">
                        {progress.completed}/{progress.total}{' '}
                        <span className="text-slate-400 text-[11px]">({progress.percent}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          progress.percent === 100
                            ? 'bg-emerald-500'
                            : isOverdue
                            ? 'bg-rose-500'
                            : 'bg-blue-600'
                        }`}
                        style={{ width: `${progress.percent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onPrintRecord(record.id)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                      title="Print / Export PDF"
                    >
                      <Printer className="w-4 h-4" />
                    </button>

                    {/* Delete button (only admin role) */}
                    {currentUser?.role === 'admin' ? (
                      <button
                        onClick={() => onDeleteRecord(record)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                        title="Delete Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <span
                        className="p-1.5 text-slate-300 dark:text-slate-700 cursor-not-allowed"
                        title="Only Admin can delete records"
                      >
                        <Trash2 className="w-4 h-4 opacity-40" />
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => onSelectRecord(record.id)}
                    className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition cursor-pointer group"
                  >
                    Open Checklist
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Last Working Day</th>
                  <th className="py-3 px-4">Manager / Assigned IT</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 w-44">Progress</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
                {filteredRecords.map(record => {
                  const isOverdue = checkIsOverdue(record);
                  const daysOverdue = isOverdue ? getDaysOverdue(record.lastWorkingDay) : 0;
                  const progress = getProgress(record);

                  return (
                    <tr
                      key={record.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                        isOverdue ? 'bg-rose-50/40 dark:bg-rose-950/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div
                          onClick={() => onSelectRecord(record.id)}
                          className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                        >
                          <span>{record.employeeName}</span>
                          {record.vault?.items && record.vault.items.length > 0 && (
                            <span
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30"
                              title={`${record.vault.items.length} keys in vault`}
                            >
                              <Key className="w-2.5 h-2.5" />
                              {record.vault.items.length}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono truncate max-w-[180px]">
                          {record.employeeEmail}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px] font-medium text-slate-600 dark:text-slate-300">
                          {record.department}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono">
                        <div
                          className={`flex items-center gap-1.5 ${
                            isOverdue
                              ? 'text-rose-600 dark:text-rose-400 font-bold'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {isOverdue && <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
                          {record.lastWorkingDay}
                        </div>
                        {isOverdue && (
                          <span className="text-[10px] text-rose-500 font-sans block">
                            {daysOverdue} {daysOverdue === 1 ? 'day' : 'days'} overdue
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-slate-800 dark:text-slate-200">{record.manager}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                          IT: {record.assignedItPerson}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider inline-block ${
                            record.status === 'completed'
                              ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400'
                              : record.status === 'in_progress'
                              ? 'bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-400'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {record.status === 'completed'
                            ? 'Completed'
                            : record.status === 'in_progress'
                            ? 'In Progress'
                            : 'Not Started'}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">
                            {progress.percent}%
                          </span>
                          <span className="text-slate-400 text-[10px]">
                            {progress.completed}/{progress.total}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              progress.percent === 100
                                ? 'bg-emerald-500'
                                : isOverdue
                                ? 'bg-rose-500'
                                : 'bg-blue-600'
                            }`}
                            style={{ width: `${progress.percent}%` }}
                          />
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onPrintRecord(record.id)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                            title="Print / Export PDF"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          {currentUser?.role === 'admin' && (
                            <button
                              onClick={() => onDeleteRecord(record)}
                              className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => onSelectRecord(record.id)}
                            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 transition cursor-pointer ml-1"
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
