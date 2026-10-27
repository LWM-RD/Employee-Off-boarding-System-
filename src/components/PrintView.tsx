import React, { useRef, useState } from 'react';
import {
  ArrowLeft,
  Printer,
  ShieldCheck,
  Check,
  Calendar,
  User,
  UserCheck,
  AlertTriangle,
  FileDown,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { OffboardingRecord } from '../types/offboarding';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PrintViewProps {
  record: OffboardingRecord;
  onBack: () => void;
}

export const PrintView: React.FC<PrintViewProps> = ({ record, onBack }) => {
  const documentRef = useRef<HTMLDivElement>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Directly generate and download PDF file
  const handleDownloadPdf = async () => {
    if (!documentRef.current || generatingPdf) return;
    setGeneratingPdf(true);
    setDownloadSuccess(false);

    try {
      const element = documentRef.current;

      // Render canvas with crisp 2x resolution
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1024,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      // First page
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      // Subsequent pages if checklist is long
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      const safeName = (record.employeeName || 'employee')
        .trim()
        .replace(/[^a-zA-Z0-9_-]/g, '_');
      pdf.save(`Offboarding-Audit-${safeName}.pdf`);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3500);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      // Fallback to browser print if canvas fails
      window.print();
    } finally {
      setGeneratingPdf(false);
    }
  };

  // Browser print with automatic PDF download fallback if iframe blocks print()
  const handlePrint = () => {
    try {
      window.print();
    } catch (e) {
      console.warn('Browser print blocked or unsupported, downloading PDF directly:', e);
      handleDownloadPdf();
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const isOverdue = record.status !== 'completed' && record.lastWorkingDay < todayStr;

  let totalItems = 0;
  let completedItems = 0;
  record.checklist.forEach(sec => {
    sec.items.forEach(it => {
      totalItems++;
      if (it.completed) completedItems++;
    });
  });
  const percent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  const formatDate = (isoStr: string | null) => {
    if (!isoStr) return '—';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Screen action bar - hidden during print */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs print:hidden">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Record
        </button>

        <div className="flex items-center gap-2.5 flex-wrap">
          {downloadSuccess && (
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              PDF Downloaded!
            </span>
          )}

          {/* Primary Action: Download PDF File directly */}
          <button
            onClick={handleDownloadPdf}
            disabled={generatingPdf}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 disabled:opacity-60 transition cursor-pointer"
          >
            {generatingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4" />
                Download PDF
              </>
            )}
          </button>

          {/* Secondary Action: Browser Print Dialog */}
          <button
            onClick={handlePrint}
            disabled={generatingPdf}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 transition cursor-pointer"
            title="Open browser print dialog"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            Print Dialog
          </button>
        </div>
      </div>

      {/* Printable Audit Document Container */}
      <div
        ref={documentRef}
        className="bg-white text-slate-900 p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-sm print:p-0 print:border-none print:shadow-none print:rounded-none max-w-4xl mx-auto"
      >
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-5 mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-slate-700 font-bold text-xs uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              IT Infrastructure & Security Operations
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Employee Offboarding & Decommissioning Audit Report
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Microsoft Entra ID, Intune Device Wipes, M365 Mailboxes & Identity Perimeter Compliance
            </p>
          </div>

          <div className="text-right sm:text-right text-xs text-slate-600 font-mono shrink-0">
            <div>Doc Ref: <strong className="text-slate-900">{record.id}</strong></div>
            <div>Generated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
            <div>Auditor: {record.assignedItPerson}</div>
          </div>
        </div>

        {/* Status Callout if Overdue */}
        {isOverdue && (
          <div className="mb-6 p-3 bg-red-50 border border-red-300 text-red-900 text-xs rounded-lg flex items-center gap-2 font-medium">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>
              <strong>OVERDUE AUDIT NOTICE:</strong> Employee’s last working day ({record.lastWorkingDay}) has passed with incomplete deprovisioning tasks.
            </span>
          </div>
        )}

        {/* Employee Summary Table */}
        <div className="mb-6 bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
                Employee Full Name
              </span>
              <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                {record.employeeName}
              </span>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
                Corporate Email
              </span>
              <span className="font-mono text-slate-900 mt-0.5 block">
                {record.employeeEmail}
              </span>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
                Department
              </span>
              <span className="font-semibold text-slate-900 mt-0.5 block">
                {record.department}
              </span>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
                Last Working Day
              </span>
              <span className={`font-mono font-bold mt-0.5 block ${isOverdue ? 'text-red-700' : 'text-slate-900'}`}>
                {record.lastWorkingDay}
              </span>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
                Direct Manager
              </span>
              <span className="text-slate-900 mt-0.5 block">
                {record.manager}
              </span>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
                Assigned IT Specialist
              </span>
              <span className="text-slate-900 mt-0.5 block">
                {record.assignedItPerson}
              </span>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
                Overall Status
              </span>
              <span className="font-bold text-slate-900 uppercase mt-0.5 block">
                {record.status.replace('_', ' ')}
              </span>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
                Verification Progress
              </span>
              <span className="font-mono font-bold text-slate-900 mt-0.5 block">
                {completedItems} / {totalItems} ({percent}%)
              </span>
            </div>
          </div>

          {record.notes && (
            <div className="mt-3 pt-3 border-t border-slate-200 text-slate-700 text-xs">
              <strong className="text-slate-900">Scope & Equipment Context:</strong> {record.notes}
            </div>
          )}
        </div>

        {/* Detailed Checklist Audit */}
        <div className="space-y-6">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
            Sectional Verification Audit Log
          </h2>

          {record.checklist.map((section, sIndex) => {
            const sectionCompleted = section.items.filter(i => i.completed).length;
            const sectionTotal = section.items.length;

            return (
              <div key={section.id} className="border border-slate-200 rounded-lg overflow-hidden break-inside-avoid">
                {/* Section Title */}
                <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
                  <div className="font-bold text-xs text-slate-900">
                    {sIndex + 1}. {section.title}
                  </div>
                  <div className="text-[10px] font-mono text-slate-600">
                    {sectionCompleted} / {sectionTotal} Verified
                  </div>
                </div>

                {/* Items Table */}
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[10px] uppercase">
                    <tr>
                      <th className="py-2 px-3 w-10 text-center">Status</th>
                      <th className="py-2 px-3">Task & Guidance</th>
                      <th className="py-2 px-3 w-36">Status & Date</th>
                      <th className="py-2 px-3 w-48">Audit Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {section.items.map(item => (
                      <tr key={item.id} className={item.completed ? '' : 'bg-slate-50/40'}>
                        <td className="py-2 px-3 text-center align-top">
                          <span
                            className={`inline-block w-4 h-4 rounded border text-center leading-3 font-bold text-[10px] ${
                              item.completed
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'border-slate-400 text-transparent'
                            }`}
                          >
                            ✓
                          </span>
                        </td>
                        <td className="py-2 px-3 align-top">
                          <div className={`font-semibold flex items-center gap-1.5 flex-wrap ${item.completed ? 'text-slate-900' : 'text-slate-800'}`}>
                            <span>{item.label.replace('[Recommended]', '').trim()}</span>
                            {item.label.includes('[Recommended]') && (
                              <span className="text-[9px] font-bold text-purple-800 bg-purple-100 px-1.5 py-0.5 rounded border border-purple-200">
                                Best Practice
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                              {item.description}
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-3 align-top text-[10px]">
                          {item.completed ? (
                            <div>
                              <span className="font-semibold text-emerald-700">Done</span>
                              <div className="text-slate-500 font-mono text-[9px] mt-0.5">{formatDate(item.completedAt)}</div>
                            </div>
                          ) : (
                            <span className="text-amber-700 font-semibold">Pending</span>
                          )}
                        </td>
                        <td className="py-2 px-3 align-top text-[10px] text-slate-600">
                          {item.note || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>

        {/* Device Vault Custody Summary if credentials exist */}
        {record.vault?.items && record.vault.items.length > 0 && (
          <div className="mt-8 border border-slate-300 rounded-xl overflow-hidden break-inside-avoid">
            <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
              <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                <span>Hardware & Recovery Key Vault Records</span>
                <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-mono">
                  {record.vault.items.length} Registered
                </span>
              </div>
              <div className="text-[10px] text-slate-500 italic">
                Secrets securely hashed & archived in IT Digital Vault
              </div>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[10px] uppercase">
                <tr>
                  <th className="py-2 px-3">Device / Asset</th>
                  <th className="py-2 px-3">Credential Type</th>
                  <th className="py-2 px-3">Serial / Asset ID</th>
                  <th className="py-2 px-3">Custody Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 text-[11px]">
                {record.vault.items.map(item => (
                  <tr key={item.id}>
                    <td className="py-2 px-3 font-semibold text-slate-900">
                      {item.title}
                      {item.deviceName && <div className="text-[10px] text-slate-500 font-normal">{item.deviceName}</div>}
                    </td>
                    <td className="py-2 px-3 uppercase text-[10px] font-mono text-slate-600">
                      {item.credentialType.replace('_', ' ')}
                    </td>
                    <td className="py-2 px-3 font-mono text-[10px] text-slate-600">
                      {item.serialNumber || '—'}
                    </td>
                    <td className="py-2 px-3 text-[10px]">
                      <span className="text-emerald-700 font-semibold">✓ Archived in Secure Vault</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Official Sign-off Blocks */}
        <div className="mt-10 pt-6 border-t-2 border-slate-900 break-inside-avoid">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-6">
            Authorized Clearances & Compliance Sign-offs
          </h3>

          <div className="grid grid-cols-3 gap-6 text-xs text-slate-700">
            {/* IT Sign-off */}
            <div className="border border-slate-300 rounded-lg p-3">
              <div className="font-bold text-slate-900 text-[11px] uppercase mb-4">
                IT Operations Admin
              </div>
              <div className="h-10 border-b border-dashed border-slate-400 mb-2" />
              <div className="text-[10px] text-slate-500">Signature: __________________</div>
              <div className="text-[10px] text-slate-500 mt-1">Date: _______________________</div>
            </div>

            {/* Manager Sign-off */}
            <div className="border border-slate-300 rounded-lg p-3">
              <div className="font-bold text-slate-900 text-[11px] uppercase mb-4">
                Department Manager
              </div>
              <div className="h-10 border-b border-dashed border-slate-400 mb-2" />
              <div className="text-[10px] text-slate-500">Signature: __________________</div>
              <div className="text-[10px] text-slate-500 mt-1">Date: _______________________</div>
            </div>

            {/* HR / Legal */}
            <div className="border border-slate-300 rounded-lg p-3">
              <div className="font-bold text-slate-900 text-[11px] uppercase mb-4">
                HR & Legal Clearance
              </div>
              <div className="h-10 border-b border-dashed border-slate-400 mb-2" />
              <div className="text-[10px] text-slate-500">Signature: __________________</div>
              <div className="text-[10px] text-slate-500 mt-1">Date: _______________________</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
