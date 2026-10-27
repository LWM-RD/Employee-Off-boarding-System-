import React, { useState } from 'react';
import {
  Shield,
  ShieldCheck,
  Lock,
  Unlock,
  Key,
  Copy,
  Check,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Edit2,
  Laptop,
  Cpu,
  KeyRound,
  AlertCircle,
  Sparkles,
  Settings,
  X,
  FileText,
} from 'lucide-react';
import {
  DeviceCredential,
  DeviceVaultData,
  CredentialType,
} from '../types/offboarding';
import {
  verifyVaultPin,
  hashVaultPin,
  formatBitlockerKey,
  isBitlockerFormatValid,
  generateRandomPassword,
} from '../utils/vaultCrypto';

interface DeviceVaultProps {
  vaultData?: DeviceVaultData;
  employeeName: string;
  onUpdateVault: (updatedVault: DeviceVaultData) => Promise<void>;
}

export const DeviceVault: React.FC<DeviceVaultProps> = ({
  vaultData = { items: [] },
  employeeName,
  onUpdateVault,
}) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DeviceCredential | null>(null);
  const [isPinSettingsOpen, setIsPinSettingsOpen] = useState(false);

  // Form fields
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState<CredentialType>('bitlocker');
  const [formDeviceName, setFormDeviceName] = useState('');
  const [formSerial, setFormSerial] = useState('');
  const [formSecret, setFormSecret] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // PIN Change Form fields
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [pinSettingsError, setPinSettingsError] = useState<string | null>(null);
  const [pinSettingsSuccess, setPinSettingsSuccess] = useState(false);

  const items = vaultData.items || [];

  // Unlock Vault
  const handleUnlock = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pinInput) {
      setPinError('Please enter the vault PIN');
      return;
    }
    const isValid = await verifyVaultPin(pinInput, vaultData.pinHash);
    if (isValid) {
      setIsUnlocked(true);
      setPinError(null);
      setPinInput('');
    } else {
      setPinError('Incorrect PIN. Default PIN is 1234.');
    }
  };

  const handleLock = () => {
    setIsUnlocked(false);
    setRevealedIds(new Set());
    setCopiedId(null);
  };

  // Toggle reveal secret
  const toggleReveal = (id: string) => {
    setRevealedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Copy secret to clipboard
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  // Open Form to Add
  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormTitle('Laptop BitLocker Recovery Key');
    setFormType('bitlocker');
    setFormDeviceName('');
    setFormSerial('');
    setFormSecret('');
    setFormNotes('');
    setFormError(null);
    setIsFormOpen(true);
  };

  // Open Form to Edit
  const handleOpenEdit = (item: DeviceCredential) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormType(item.credentialType);
    setFormDeviceName(item.deviceName || '');
    setFormSerial(item.serialNumber || '');
    setFormSecret(item.secretValue);
    setFormNotes(item.notes || '');
    setFormError(null);
    setIsFormOpen(true);
  };

  // Save Credential
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError('Title is required');
      return;
    }
    if (!formSecret.trim()) {
      setFormError('Secret key / password is required');
      return;
    }

    setIsSaving(true);
    try {
      let finalSecret = formSecret.trim();
      if (formType === 'bitlocker') {
        finalSecret = formatBitlockerKey(finalSecret);
      }

      let updatedItems: DeviceCredential[];
      if (editingItem) {
        updatedItems = items.map(it =>
          it.id === editingItem.id
            ? {
                ...it,
                title: formTitle.trim(),
                credentialType: formType,
                deviceName: formDeviceName.trim() || undefined,
                serialNumber: formSerial.trim() || undefined,
                secretValue: finalSecret,
                notes: formNotes.trim() || undefined,
                updatedAt: new Date().toISOString(),
              }
            : it
        );
      } else {
        const newItem: DeviceCredential = {
          id: `cred-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          title: formTitle.trim(),
          credentialType: formType,
          deviceName: formDeviceName.trim() || undefined,
          serialNumber: formSerial.trim() || undefined,
          secretValue: finalSecret,
          notes: formNotes.trim() || undefined,
          createdAt: new Date().toISOString(),
        };
        updatedItems = [...items, newItem];
      }

      await onUpdateVault({
        ...vaultData,
        items: updatedItems,
        updatedAt: new Date().toISOString(),
      });

      setIsFormOpen(false);
    } catch (err) {
      console.error('Failed to save vault item:', err);
      setFormError('Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Credential
  const handleDeleteItem = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this protected credential?')) {
      return;
    }
    const updatedItems = items.filter(it => it.id !== id);
    await onUpdateVault({
      ...vaultData,
      items: updatedItems,
      updatedAt: new Date().toISOString(),
    });
  };

  // Handle PIN update
  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinSettingsError(null);
    setPinSettingsSuccess(false);

    if (!currentPin) {
      setPinSettingsError('Please enter your current PIN');
      return;
    }
    const isValid = await verifyVaultPin(currentPin, vaultData.pinHash);
    if (!isValid) {
      setPinSettingsError('Current PIN is incorrect');
      return;
    }
    if (newPin.length < 4) {
      setPinSettingsError('New PIN must be at least 4 digits or characters');
      return;
    }
    if (newPin !== confirmNewPin) {
      setPinSettingsError('New PIN and Confirm PIN do not match');
      return;
    }

    try {
      const newHash = await hashVaultPin(newPin);
      await onUpdateVault({
        ...vaultData,
        pinHash: newHash,
        updatedAt: new Date().toISOString(),
      });
      setPinSettingsSuccess(true);
      setCurrentPin('');
      setNewPin('');
      setConfirmNewPin('');
      setTimeout(() => {
        setIsPinSettingsOpen(false);
        setPinSettingsSuccess(false);
      }, 1500);
    } catch (err) {
      setPinSettingsError('Failed to update PIN');
    }
  };

  const getTypeBadge = (type: CredentialType) => {
    switch (type) {
      case 'bitlocker':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
            <Key className="w-3 h-3 text-amber-500" /> BitLocker Key
          </span>
        );
      case 'local_admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
            <ShieldCheck className="w-3 h-3 text-indigo-500" /> Local Admin Password
          </span>
        );
      case 'bios_password':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30">
            <Cpu className="w-3 h-3 text-rose-500" /> BIOS / UEFI Password
          </span>
        );
      case 'device_pin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
            <KeyRound className="w-3 h-3 text-emerald-500" /> Device PIN / Passcode
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/30">
            <FileText className="w-3 h-3 text-slate-500" /> Credential
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
      {/* Vault Header Banner */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900/90 dark:via-slate-900 dark:to-slate-900/90">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition ${
              isUnlocked
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
            }`}
          >
            {isUnlocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                Device Credentials & BitLocker Vault
              </h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                Optional
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Securely store BitLocker recovery keys, local admin & BIOS passwords for {employeeName}
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          {isUnlocked ? (
            <>
              <button
                type="button"
                onClick={() => setIsPinSettingsOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                title="Change Vault PIN"
              >
                <Settings className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">PIN Settings</span>
              </button>
              <button
                type="button"
                onClick={handleOpenAdd}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Secret
              </button>
              <button
                type="button"
                onClick={handleLock}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                Lock Vault
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 dark:text-slate-400 hidden sm:inline">
                {items.length === 0 ? 'No keys saved' : `${items.length} key(s) protected`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {!isUnlocked ? (
        /* LOCKED STATE PROMPT */
        <div className="p-6 sm:p-8 flex flex-col items-center justify-center text-center max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center mb-3">
            <Shield className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Vault is Locked
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
            Enter the IT Vault PIN to view or add BitLocker keys, admin credentials, and BIOS passwords for this device.
          </p>

          <form onSubmit={handleUnlock} className="w-full mt-4 space-y-3">
            <div className="relative">
              <input
                type="password"
                value={pinInput}
                onChange={e => {
                  setPinInput(e.target.value);
                  setPinError(null);
                }}
                placeholder="Enter Vault PIN (Default: 1234)"
                className="w-full px-4 py-2.5 text-center tracking-widest font-mono text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                autoComplete="off"
              />
            </div>

            {pinError && (
              <p className="text-xs text-rose-600 dark:text-rose-400 flex items-center justify-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" /> {pinError}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition cursor-pointer shadow-xs flex items-center justify-center gap-2"
            >
              <Unlock className="w-4 h-4" /> Unlock Vault
            </button>
          </form>

          <div className="mt-3 flex items-center gap-1 text-[11px] text-slate-400">
            <span>Default IT PIN:</span>
            <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300 font-semibold">
              1234
            </code>
            <span>(Editable once unlocked)</span>
          </div>
        </div>
      ) : (
        /* UNLOCKED STATE - CREDENTIALS LIST */
        <div className="p-5">
          {items.length === 0 ? (
            <div className="text-center py-8 px-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/40">
              <Key className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                No Device Credentials Saved Yet
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                Saving device credentials before offboarding is optional. You can store the employee's BitLocker recovery key, local admin password, or BIOS supervisor password in case the hardware needs re-imaging.
              </p>
              <button
                type="button"
                onClick={handleOpenAdd}
                className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" /> Add BitLocker Key or Password
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {items.map(item => {
                const isRevealed = revealedIds.has(item.id);
                const isCopied = copiedId === item.id;
                const isBitlocker = item.credentialType === 'bitlocker';

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/50 hover:border-slate-300 dark:hover:border-slate-700 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {item.title}
                          </h4>
                          {getTypeBadge(item.credentialType)}
                        </div>

                        {(item.deviceName || item.serialNumber) && (
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                            {item.deviceName && (
                              <span className="flex items-center gap-1">
                                <Laptop className="w-3 h-3 text-slate-400" /> {item.deviceName}
                              </span>
                            )}
                            {item.serialNumber && (
                              <span className="font-mono bg-slate-200/60 dark:bg-slate-800 px-1.5 py-0.2 rounded text-[10px]">
                                S/N: {item.serialNumber}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Item Actions */}
                      <div className="flex items-center gap-1 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => handleCopy(item.id, item.secretValue)}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                            isCopied
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                          title="Copy Secret to Clipboard"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-slate-400" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleReveal(item.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
                          title={isRevealed ? 'Mask secret' : 'Reveal secret'}
                        >
                          {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Secret display box */}
                    <div className="mt-3 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/90 flex items-center justify-between font-mono text-xs select-all overflow-x-auto">
                      <span
                        className={`${
                          isRevealed
                            ? isBitlocker
                              ? 'text-amber-700 dark:text-amber-400 font-semibold tracking-wide'
                              : 'text-slate-900 dark:text-slate-100 font-semibold'
                            : 'text-slate-400 tracking-widest font-sans'
                        }`}
                      >
                        {isRevealed
                          ? item.secretValue
                          : '••••••••••••••••••••••••••••••••••••••••'}
                      </span>
                      {isBitlocker && isRevealed && (
                        <span className="text-[10px] text-slate-400 font-sans shrink-0 ml-2">
                          48-digit Microsoft BitLocker
                        </span>
                      )}
                    </div>

                    {item.notes && (
                      <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 italic">
                        Note: {item.notes}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ADD / EDIT CREDENTIAL MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-500" />
                {editingItem ? 'Edit Protected Credential' : 'Add Device Key / Password'}
              </h3>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Credential Type
                </label>
                <select
                  value={formType}
                  onChange={e => {
                    const newType = e.target.value as CredentialType;
                    setFormType(newType);
                    if (!editingItem) {
                      if (newType === 'bitlocker') setFormTitle('Laptop BitLocker Recovery Key');
                      if (newType === 'local_admin') setFormTitle('Local Admin Password');
                      if (newType === 'bios_password') setFormTitle('Dell/Lenovo BIOS Supervisor Password');
                      if (newType === 'device_pin') setFormTitle('Windows Hello PIN / Device Password');
                      if (newType === 'wifi_other') setFormTitle('VPN / WiFi Pre-shared Key');
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                >
                  <option value="bitlocker">BitLocker 48-Digit Recovery Key</option>
                  <option value="local_admin">Local Administrator Password</option>
                  <option value="bios_password">BIOS / UEFI Supervisor Password</option>
                  <option value="device_pin">Device PIN / Windows Hello Passcode</option>
                  <option value="wifi_other">Other IT System Secret</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Title / Label *
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  placeholder="e.g. Dell Latitude 5420 BitLocker Key"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Device Model (Optional)
                  </label>
                  <input
                    type="text"
                    value={formDeviceName}
                    onChange={e => setFormDeviceName(e.target.value)}
                    placeholder="e.g. Dell Latitude 5420"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Serial Number / Asset Tag (Optional)
                  </label>
                  <input
                    type="text"
                    value={formSerial}
                    onChange={e => setFormSerial(e.target.value)}
                    placeholder="e.g. PF298XK or TAG-0482"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">
                    {formType === 'bitlocker' ? 'BitLocker Key (48 digits) *' : 'Secret Key / Password *'}
                  </label>
                  {formType === 'local_admin' && (
                    <button
                      type="button"
                      onClick={() => setFormSecret(generateRandomPassword(16))}
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <Sparkles className="w-3 h-3" /> Generate Password
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  value={formSecret}
                  onChange={e => setFormSecret(e.target.value)}
                  placeholder={
                    formType === 'bitlocker'
                      ? '123456-789012-345678-901234-567890-123456-789012-345678'
                      : 'Enter sensitive password or key'
                  }
                  className="w-full px-3 py-2 font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                  required
                />

                {formType === 'bitlocker' && formSecret.length > 0 && (
                  <p className="mt-1 text-[11px] text-slate-400">
                    {isBitlockerFormatValid(formSecret) ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                        <Check className="w-3 h-3" /> Valid 48-digit BitLocker format
                      </span>
                    ) : (
                      <span>Enter 48 digits (hyphens will be auto-formatted)</span>
                    )}
                  </p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes / Drive Details (Optional)
                </label>
                <textarea
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="e.g. Operating System C: Drive, Key ID: 4FA12B..., Local admin user: .\admin"
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              {formError && (
                <p className="text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {formError}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : editingItem ? 'Update Credential' : 'Save Credential'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PIN SETTINGS MODAL */}
      {isPinSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-blue-500" />
                Change Master Vault PIN
              </h3>
              <button
                type="button"
                onClick={() => setIsPinSettingsOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleChangePin} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Current PIN (Default is 1234)
                </label>
                <input
                  type="password"
                  value={currentPin}
                  onChange={e => setCurrentPin(e.target.value)}
                  placeholder="Enter current PIN"
                  className="w-full px-3 py-2 font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  New PIN (min 4 digits/characters)
                </label>
                <input
                  type="password"
                  value={newPin}
                  onChange={e => setNewPin(e.target.value)}
                  placeholder="Enter new PIN"
                  className="w-full px-3 py-2 font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm New PIN
                </label>
                <input
                  type="password"
                  value={confirmNewPin}
                  onChange={e => setConfirmNewPin(e.target.value)}
                  placeholder="Confirm new PIN"
                  className="w-full px-3 py-2 font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              {pinSettingsError && (
                <p className="text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {pinSettingsError}
                </p>
              )}

              {pinSettingsSuccess && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> PIN successfully updated!
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPinSettingsOpen(false)}
                  className="px-3 py-1.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold cursor-pointer shadow-xs"
                >
                  Save New PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
