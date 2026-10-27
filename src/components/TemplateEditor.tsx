import React, { useState, useEffect } from 'react';
import {
  FileEdit,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  Shield,
} from 'lucide-react';
import { ChecklistTemplate, ChecklistSection, ChecklistItem } from '../types/offboarding';
import { saveTemplate, resetTemplateToDefaults } from '../firebase/service';
import { useAuth } from '../context/AuthContext';
import { ConfirmModal } from './ConfirmModal';

interface TemplateEditorProps {
  template: ChecklistTemplate;
  onTemplateUpdated: (template: ChecklistTemplate) => void;
}

export const TemplateEditor: React.FC<TemplateEditorProps> = ({
  template,
  onTemplateUpdated,
}) => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  // Working draft
  const [draft, setDraft] = useState<ChecklistTemplate>(() =>
    JSON.parse(JSON.stringify(template))
  );
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modals
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<string | null>(null);

  useEffect(() => {
    setDraft(JSON.parse(JSON.stringify(template)));
  }, [template]);

  // New section input state
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionDesc, setNewSectionDesc] = useState('');
  const [showAddSection, setShowAddSection] = useState(false);

  // New item inputs by section ID
  const [newItemLabels, setNewItemLabels] = useState<{ [secId: string]: string }>({});
  const [newItemDescs, setNewItemDescs] = useState<{ [secId: string]: string }>({});
  const [showAddItem, setShowAddItem] = useState<{ [secId: string]: boolean }>({});

  const handleSave = async () => {
    if (!isAdmin) {
      setErrorMsg('Unauthorized: Only administrators with the Admin role can modify global checklist templates.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    try {
      const userEmail = currentUser?.email || 'admin@company.com';
      await saveTemplate(draft, userEmail);
      onTemplateUpdated(draft);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!isAdmin) {
      setErrorMsg('Unauthorized: Only administrators can reset the master template.');
      return;
    }

    setSaving(true);
    try {
      const userEmail = currentUser?.email || 'admin@company.com';
      const reset = await resetTemplateToDefaults(userEmail);
      setDraft(JSON.parse(JSON.stringify(reset)));
      onTemplateUpdated(reset);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to reset template');
    } finally {
      setSaving(false);
    }
  };

  // Section operations
  const addSection = () => {
    if (!newSectionTitle.trim()) return;
    const newSec: ChecklistSection = {
      id: `section_${Date.now()}`,
      title: newSectionTitle.trim(),
      description: newSectionDesc.trim(),
      items: [],
    };
    setDraft({
      ...draft,
      sections: [...draft.sections, newSec],
    });
    setNewSectionTitle('');
    setNewSectionDesc('');
    setShowAddSection(false);
  };

  const deleteSection = (secId: string) => {
    setDraft({
      ...draft,
      sections: draft.sections.filter(s => s.id !== secId),
    });
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...draft.sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSections.length) return;
    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;
    setDraft({ ...draft, sections: newSections });
  };

  // Item operations
  const addItem = (sectionId: string) => {
    const label = newItemLabels[sectionId]?.trim();
    if (!label) return;
    const desc = newItemDescs[sectionId]?.trim() || '';

    const newItem: ChecklistItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      label,
      description: desc,
      completed: false,
      completedBy: null,
      completedAt: null,
      note: '',
    };

    const updatedSections = draft.sections.map(sec => {
      if (sec.id !== sectionId) return sec;
      return {
        ...sec,
        items: [...sec.items, newItem],
      };
    });

    setDraft({ ...draft, sections: updatedSections });
    setNewItemLabels({ ...newItemLabels, [sectionId]: '' });
    setNewItemDescs({ ...newItemDescs, [sectionId]: '' });
    setShowAddItem({ ...showAddItem, [sectionId]: false });
  };

  const deleteItem = (sectionId: string, itemId: string) => {
    const updatedSections = draft.sections.map(sec => {
      if (sec.id !== sectionId) return sec;
      return {
        ...sec,
        items: sec.items.filter(i => i.id !== itemId),
      };
    });
    setDraft({ ...draft, sections: updatedSections });
  };

  const moveItem = (sectionId: string, itemIndex: number, direction: 'up' | 'down') => {
    const updatedSections = draft.sections.map(sec => {
      if (sec.id !== sectionId) return sec;
      const targetIndex = direction === 'up' ? itemIndex - 1 : itemIndex + 1;
      if (targetIndex < 0 || targetIndex >= sec.items.length) return sec;
      const items = [...sec.items];
      const temp = items[itemIndex];
      items[itemIndex] = items[targetIndex];
      items[targetIndex] = temp;
      return { ...sec, items };
    });
    setDraft({ ...draft, sections: updatedSections });
  };

  const updateItemLabel = (sectionId: string, itemId: string, label: string) => {
    const updatedSections = draft.sections.map(sec => {
      if (sec.id !== sectionId) return sec;
      return {
        ...sec,
        items: sec.items.map(i => (i.id === itemId ? { ...i, label } : i)),
      };
    });
    setDraft({ ...draft, sections: updatedSections });
  };

  const totalItemCount = draft.sections.reduce((acc, s) => acc + s.items.length, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner / Explanatory Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-900/50">
              Master Template
            </span>
            <span className="text-xs text-slate-400">
              {draft.sections.length} Sections &bull; {totalItemCount} Items Total
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Checklist Template Editor
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Customize the standard checklist template. When a new offboarding record is created, this template is copied into the new record snapshot. Changes made here will never overwrite historical offboardings.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsResetModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to Standard Policy Preset (PDF Checklist)
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 disabled:opacity-50 transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Template Changes'}
          </button>
        </div>
      </div>

      {/* Admin Notice Banner if user is not admin */}
      {!isAdmin && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/50 rounded-2xl p-4 text-xs flex items-center justify-between gap-3 text-amber-900 dark:text-amber-300">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              You are currently viewing in Read-Only mode as <strong>IT Staff</strong>. Only users with the <strong>Admin</strong> role can persist modifications to the master template.
            </span>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-600 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-600 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Checklist template successfully updated and synced with Firestore!</span>
        </div>
      )}

      {/* Sections List */}
      <div className="space-y-5">
        {draft.sections.map((section, sIndex) => (
          <div
            key={section.id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden"
          >
            {/* Section Header */}
            <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0">
                  {sIndex + 1}
                </span>
                <div>
                  <input
                    type="text"
                    value={section.title}
                    onChange={e => {
                      const updated = draft.sections.map(s =>
                        s.id === section.id ? { ...s, title: e.target.value } : s
                      );
                      setDraft({ ...draft, sections: updated });
                    }}
                    className="font-bold text-sm text-slate-900 dark:text-slate-100 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none transition-colors"
                  />
                  {section.description !== undefined && (
                    <input
                      type="text"
                      value={section.description}
                      onChange={e => {
                        const updated = draft.sections.map(s =>
                          s.id === section.id ? { ...s, description: e.target.value } : s
                        );
                        setDraft({ ...draft, sections: updated });
                      }}
                      placeholder="Optional section description..."
                      className="block text-xs text-slate-500 dark:text-slate-400 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none mt-0.5 w-full max-w-md"
                    />
                  )}
                </div>
              </div>

              {/* Section Controls */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => moveSection(sIndex, 'up')}
                  disabled={sIndex === 0}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
                  title="Move Section Up"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => moveSection(sIndex, 'down')}
                  disabled={sIndex === draft.sections.length - 1}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
                  title="Move Section Down"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setSectionToDelete(section.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer ml-1"
                  title="Delete Section"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Items inside section */}
            <div className="p-4 sm:p-5 space-y-2">
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {section.items.map((item, iIndex) => (
                  <div
                    key={item.id}
                    className="py-2.5 px-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition flex items-center justify-between gap-3 group"
                  >
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={item.label}
                        onChange={e => updateItemLabel(section.id, item.id, e.target.value)}
                        className="w-full text-xs font-semibold text-slate-900 dark:text-slate-100 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none"
                      />
                      {item.description && (
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {item.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => moveItem(section.id, iIndex, 'up')}
                        disabled={iIndex === 0}
                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 rounded cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => moveItem(section.id, iIndex, 'down')}
                        disabled={iIndex === section.items.length - 1}
                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 rounded cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => deleteItem(section.id, item.id)}
                        className="p-1 text-slate-400 hover:text-rose-500 rounded cursor-pointer ml-1"
                        title="Delete Item"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Item form */}
              {showAddItem[section.id] ? (
                <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <input
                    type="text"
                    placeholder="Item title (e.g. Audit Entra App Registrations)..."
                    value={newItemLabels[section.id] || ''}
                    onChange={e =>
                      setNewItemLabels({ ...newItemLabels, [section.id]: e.target.value })
                    }
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Operational guidance / detail description (optional)..."
                    value={newItemDescs[section.id] || ''}
                    onChange={e =>
                      setNewItemDescs({ ...newItemDescs, [section.id]: e.target.value })
                    }
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() =>
                        setShowAddItem({ ...showAddItem, [section.id]: false })
                      }
                      className="px-3 py-1 text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => addItem(section.id)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Add Item
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddItem({ ...showAddItem, [section.id]: true })}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 py-1 px-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Checklist Item
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Add New Section */}
        {showAddSection ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Create New Checklist Section
            </h3>
            <input
              type="text"
              placeholder="Section Name (e.g. Legal & IP Retention)..."
              value={newSectionTitle}
              onChange={e => setNewSectionTitle(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
            />
            <input
              type="text"
              placeholder="Section Description / Scope..."
              value={newSectionDesc}
              onChange={e => setNewSectionDesc(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddSection(false)}
                className="px-3.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={addSection}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
              >
                Create Section
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddSection(true)}
            className="w-full py-4 border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 rounded-2xl flex items-center justify-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add New Section
          </button>
        )}
      </div>

      {/* Confirmation Modals */}
      <ConfirmModal
        isOpen={Boolean(sectionToDelete)}
        title="Delete Checklist Section"
        message="Are you sure you want to delete this section and all its checklist items from the master template? This will apply to new records created from now on."
        confirmLabel="Delete Section"
        onConfirm={() => {
          if (sectionToDelete) deleteSection(sectionToDelete);
        }}
        onCancel={() => setSectionToDelete(null)}
      />

      <ConfirmModal
        isOpen={isResetModalOpen}
        title="Reset to Standard IT Presets"
        message="This will reset all template sections and items back to the default Microsoft Entra ID and Intune enterprise preset. Existing offboarding records will not be touched."
        confirmLabel="Reset Template"
        isDestructive={false}
        onConfirm={handleReset}
        onCancel={() => setIsResetModalOpen(false)}
      />
    </div>
  );
};
