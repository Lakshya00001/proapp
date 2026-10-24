import React, { useState, useRef } from 'react';
import { Camera, UploadCloud, FileText, CheckCircle2, AlertTriangle, Layers, Sparkles, Image as ImageIcon, Cpu } from 'lucide-react';
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

  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB limit

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

    // Supported formats: images and PDF
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

      {/* Main Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all ${
          dragActive
            ? 'border-indigo-500 bg-indigo-950/30 scale-[1.01]'
            : 'border-slate-800 bg-slate-900/60 hover:border-indigo-500/70 shadow-2xl'
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
              <div className="absolute inset-0 rounded-full border-4 border-indigo-900 animate-pulse"></div>
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Cpu className="w-8 h-8 text-indigo-400" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">
                {processingStage || 'Running Open-Source Neural OCR...'}
              </h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                Tesseract AI is reading characters, detecting line items, rates, taxes, and merchant info.
              </p>
            </div>

            {/* Progress Bar */}
            <div className="max-w-md mx-auto">
              <div className="flex justify-between text-xs text-slate-400 font-medium mb-1">
                <span>OCR Pipeline</span>
                <span className="font-mono text-indigo-400 font-bold">{processingPercent}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 h-2.5 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${processingPercent}%` }}
                ></div>
              </div>
            </div>
          </div>
        ) : (
          /* Default Upload Actions */
          <div className="space-y-6">
            <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
              <UploadCloud className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
                <Cpu className="w-3.5 h-3.5" />
                <span>Open-Source AI & On-Device Tesseract Neural OCR</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Upload Any Receipt or Bill Photo
              </h2>
              <p className="text-sm text-slate-400 max-w-lg mx-auto">
                Snap a bill with your phone camera or select images & PDFs up to{' '}
                <span className="font-bold text-indigo-400">100MB</span>. Real text, quantities, rates, and totals are extracted and stored in IndexedDB.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <button
                onClick={() => setShowCamera(true)}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:brightness-110 text-white font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2"
              >
                <Camera className="w-5 h-5" />
                <span>Open Camera Scanner</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-750 text-slate-200 font-bold shadow-sm transition-all flex items-center justify-center space-x-2"
              >
                <FileText className="w-5 h-5 text-indigo-400" />
                <span>Browse Files / Google Drive</span>
              </button>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs text-slate-400">
              <span className="flex items-center space-x-1 bg-slate-800/80 border border-slate-700/60 px-3 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>100MB Limit</span>
              </span>
              <span className="flex items-center space-x-1 bg-slate-800/80 border border-slate-700/60 px-3 py-1 rounded-full">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>Multi-Bill Separation</span>
              </span>
              <span className="flex items-center space-x-1 bg-slate-800/80 border border-slate-700/60 px-3 py-1 rounded-full">
                <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
                <span>JPG, PNG, WEBP, PDF</span>
              </span>
            </div>
          </div>
        )}

        {/* File error */}
        {fileError && (
          <div className="mt-4 p-3 bg-rose-950/40 border border-rose-800 rounded-xl flex items-center justify-center space-x-2 text-rose-300 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{fileError}</span>
          </div>
        )}
      </div>
    </div>
  );
};
