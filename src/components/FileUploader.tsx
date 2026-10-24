import React, { useState, useRef } from 'react';
import { Camera, UploadCloud, FileText, CheckCircle2, AlertTriangle, Layers, Sparkles, Image as ImageIcon } from 'lucide-react';
import { CameraCapture } from './CameraCapture';

interface FileUploaderProps {
  onFileSelected: (file: File) => void;
  isProcessing: boolean;
  processingStage: string;
  processingPercent: number;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFileSelected,
  isProcessing,
  processingStage,
  processingPercent,
}) => {
  const [showCamera, setShowCamera] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateAndProcess = (file: File) => {
    setFileError(null);

    // 100MB limit check
    if (file.size > MAX_FILE_SIZE) {
      setFileError(`File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the 100MB limit.`);
      return;
    }

    // Supported formats check: images and PDF
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/avif', 'application/pdf'];
    const isImageOrPdf = validTypes.includes(file.type) || file.name.match(/\.(jpe?g|png|webp|heic|pdf)$/i);

    if (!isImageOrPdf) {
      setFileError('Please upload a valid receipt image (JPG, PNG, WEBP) or PDF invoice.');
      return;
    }

    onFileSelected(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcess(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndProcess(e.target.files[0]);
    }
  };

  const handleSampleSelect = (type: 'supermarket' | 'electronics' | 'dining' | 'multi') => {
    let dummyName = 'sample_supermarket_receipt.jpg';
    if (type === 'electronics') dummyName = 'sample_hardware_invoice.pdf';
    if (type === 'dining') dummyName = 'sample_restaurant_bill.jpg';
    if (type === 'multi') dummyName = 'sample_multi_receipt_batch.jpg';

    // Create a 1x1 dummy blob for instant simulation
    const dummyBlob = new Blob(['sample-receipt-content'], { type: 'image/jpeg' });
    const dummyFile = new File([dummyBlob], dummyName, { type: 'image/jpeg' });
    onFileSelected(dummyFile);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Camera Modal */}
      {showCamera && (
        <CameraCapture
          onCapture={(file) => {
            setShowCamera(false);
            validateAndProcess(file);
          }}
          onClose={() => setShowCamera(false)}
        />
      )}

      {/* Main Upload Hero Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all ${
          dragActive
            ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 scale-[1.01]'
            : 'border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-slate-900/60 hover:border-indigo-400 dark:hover:border-indigo-500 shadow-xl'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          onChange={handleInputChange}
          className="hidden"
        />

        {isProcessing ? (
          /* Processing State */
          <div className="py-8 space-y-6">
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-200 dark:border-indigo-900 animate-pulse"></div>
              <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {processingStage || 'Processing Receipt...'}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                AI is inspecting image details, separating individual bills, and parsing line items.
              </p>
            </div>

            {/* Progress Bar */}
            <div className="max-w-md mx-auto">
              <div className="flex justify-between text-xs text-slate-500 font-medium mb-1">
                <span>Progress</span>
                <span>{processingPercent}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${processingPercent}%` }}
                ></div>
              </div>
            </div>
          </div>
        ) : (
          /* Default Upload Actions */
          <div className="space-y-6">
            <div className="w-20 h-20 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
              <UploadCloud className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                Upload Receipts or Capture Live
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
                Snap a bill with your camera or drag and drop images & PDFs up to{' '}
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">100MB</span>. Multi-bill photos are automatically separated!
              </p>
            </div>

            {/* Dual Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <button
                onClick={() => setShowCamera(true)}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center space-x-2"
              >
                <Camera className="w-5 h-5" />
                <span>Open Camera Scanner</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 font-semibold shadow-sm transition-all flex items-center justify-center space-x-2"
              >
                <FileText className="w-5 h-5 text-indigo-500" />
                <span>Browse Files / Google Drive</span>
              </button>
            </div>

            {/* Badge pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800/60 px-2.5 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>100MB Max File Limit</span>
              </span>
              <span className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800/60 px-2.5 py-1 rounded-full">
                <Layers className="w-3.5 h-3.5 text-indigo-500" />
                <span>Automatic Multi-Bill Separation</span>
              </span>
              <span className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800/60 px-2.5 py-1 rounded-full">
                <ImageIcon className="w-3.5 h-3.5 text-purple-500" />
                <span>JPG, PNG, WEBP, PDF</span>
              </span>
            </div>
          </div>
        )}

        {/* Error notification */}
        {fileError && (
          <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center justify-center space-x-2 text-rose-700 dark:text-rose-300 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{fileError}</span>
          </div>
        )}
      </div>

      {/* Quick Test / Demo Samples */}
      <div className="bg-white/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Or Try One-Click Test Scenarios:
            </h4>
          </div>
          <span className="text-xs text-slate-500">Instant AI Simulation</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            onClick={() => handleSampleSelect('supermarket')}
            className="p-3 text-left rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 bg-white dark:bg-slate-800/80 transition-all group"
          >
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
              🛒 Grocery Store
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Itemized Supermarket Receipt</div>
          </button>

          <button
            onClick={() => handleSampleSelect('dining')}
            className="p-3 text-left rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 bg-white dark:bg-slate-800/80 transition-all group"
          >
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
              ☕ Cafe & Dining
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Restaurant Bill with Tax & Tip</div>
          </button>

          <button
            onClick={() => handleSampleSelect('electronics')}
            className="p-3 text-left rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 bg-white dark:bg-slate-800/80 transition-all group"
          >
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
              💻 Tech Hardware
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">B2B Commercial Invoice PDF</div>
          </button>

          <button
            onClick={() => handleSampleSelect('multi')}
            className="p-3 text-left rounded-xl border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/50 dark:bg-indigo-950/20 hover:border-indigo-400 transition-all group"
          >
            <div className="text-xs font-bold text-indigo-700 dark:text-indigo-300 flex items-center space-x-1">
              <Layers className="w-3.5 h-3.5" />
              <span>Multi-Bill Batch</span>
            </div>
            <div className="text-[11px] text-indigo-600/80 dark:text-indigo-400/80 mt-0.5">
              Split 2+ Receipts in 1 Shot
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
