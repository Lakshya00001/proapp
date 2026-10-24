import React, { useState } from 'react';
import { X, Mail, Send, ExternalLink, CheckCircle2, AlertCircle, Paperclip, Loader2 } from 'lucide-react';
import { BillData } from '../types/bill';
import { sendEmailViaZoho, getZohoUser, setZohoUser, getZohoPass, getZohoWebmailComposeUrl } from '../services/emailService';

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill?: BillData;
  pdfBase64?: string;
  excelBase64?: string;
  excelFileName?: string;
  zipBase64?: string;
  zipFileName?: string;
  defaultSubject?: string;
}

export const EmailModal: React.FC<EmailModalProps> = ({
  isOpen,
  onClose,
  bill,
  pdfBase64,
  excelBase64,
  excelFileName,
  zipBase64,
  zipFileName,
  defaultSubject
}) => {
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState(
    defaultSubject || (bill ? `Invoice #${bill.invoiceNumber} from ${bill.vendorName}` : 'Expense Report from BillSnap AI')
  );
  const [notes, setNotes] = useState(
    bill ? `Please find attached your digital invoice #${bill.invoiceNumber} for ${bill.currency}${bill.totalAmount.toFixed(2)}.` : 'Please find attached the financial export report.'
  );

  const [zohoUser, setZohoUserState] = useState(getZohoUser());
  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid recipient email address.' });
      return;
    }

    if (!zohoUser) {
      setStatusMessage({ type: 'error', text: 'Please enter your Zoho Mail address (sender) below.' });
      return;
    }

    // Save Zoho User
    setZohoUser(zohoUser);

    setIsSending(true);
    setStatusMessage(null);

    try {
      const result = await sendEmailViaZoho({
        to: recipient,
        subject,
        notes,
        bill,
        pdfBase64,
        pdfFileName: bill ? `Invoice_${bill.invoiceNumber}.pdf` : undefined,
        excelBase64,
        excelFileName,
        zipBase64,
        zipFileName,
        zohoUser,
        zohoPass: getZohoPass()
      });

      setStatusMessage({ type: 'success', text: result.message });
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to dispatch email. Verify your Zoho login or App Password.'
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleOpenZohoWebmail = () => {
    const url = getZohoWebmailComposeUrl(recipient, subject, notes);
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-fade-in text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Send via Zoho Mail Service</h3>
              <p className="text-xs text-slate-400 flex items-center space-x-1">
                <span>smtp.zoho.in:465</span>
                <span>•</span>
                <span className="text-emerald-400">SSL Encrypted</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSend} className="space-y-4">
          {/* Sender Zoho User Config */}
          <div className="space-y-1.5 p-3 rounded-2xl bg-slate-800/60 border border-slate-750">
            <label className="text-[11px] font-bold text-slate-300 block uppercase tracking-wider">
              From (Your Zoho Email)
            </label>
            <input
              type="email"
              placeholder="e.g. user@zoho.in or your-domain.com"
              value={zohoUser}
              onChange={(e) => setZohoUserState(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:ring-2 focus:ring-amber-500 font-mono"
              required
            />
          </div>

          {/* Recipient */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">
              Recipient Email Address (To)
            </label>
            <input
              type="email"
              placeholder="client@company.com or accounts@..."
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full bg-slate-800 border border-slate-750 rounded-xl px-3.5 py-2 text-xs text-white focus:ring-2 focus:ring-indigo-500 font-mono"
              required
            />
          </div>

          {/* Subject */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-slate-800 border border-slate-750 rounded-xl px-3.5 py-2 text-xs text-white focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          {/* Notes / Body */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">Message Body</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-800 border border-slate-750 rounded-xl p-3 text-xs text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Attachment Badges */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-400 block">Attachments Included:</span>
            <div className="flex flex-wrap gap-2 text-xs">
              {bill && (
                <span className="px-2.5 py-1 rounded-lg bg-indigo-950/60 border border-indigo-800 text-indigo-300 flex items-center space-x-1">
                  <Paperclip className="w-3 h-3" />
                  <span>Digital Invoice ({bill.currency}{bill.totalAmount.toFixed(2)})</span>
                </span>
              )}
              {pdfBase64 && (
                <span className="px-2.5 py-1 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 flex items-center space-x-1">
                  <Paperclip className="w-3 h-3" />
                  <span>PDF Document</span>
                </span>
              )}
              {excelBase64 && (
                <span className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 flex items-center space-x-1">
                  <Paperclip className="w-3 h-3" />
                  <span>{excelFileName || 'Bills_Report.xlsx'}</span>
                </span>
              )}
              {zipBase64 && (
                <span className="px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-800 text-amber-300 flex items-center space-x-1">
                  <Paperclip className="w-3 h-3" />
                  <span>{zipFileName || 'PowerBI_Package.zip'}</span>
                </span>
              )}
            </div>
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl flex items-center space-x-2 text-xs font-semibold ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                  : 'bg-rose-950/60 border border-rose-800 text-rose-300'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={handleOpenZohoWebmail}
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center space-x-1 underline underline-offset-2"
            >
              <span>Open in Zoho Webmail (mail.zoho.in)</span>
              <ExternalLink className="w-3 h-3" />
            </button>

            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSending}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-600 hover:brightness-110 text-white text-xs font-bold shadow-lg shadow-amber-600/30 flex items-center space-x-1.5 transition-all disabled:opacity-50"
              >
                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>{isSending ? 'Sending via Zoho...' : 'Send Email'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
