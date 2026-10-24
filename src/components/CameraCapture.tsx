import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, CheckCircle2, X, AlertCircle, Sparkles } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize camera stream
  const startCamera = async (mode: 'environment' | 'user') => {
    setIsInitializing(true);
    setCameraError(null);

    // Stop existing stream if any
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser or environment.');
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err: any) {
      console.error('Error opening camera:', err);
      // Try fallback to any available video source
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
        setStream(fallbackStream);
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
        }
      } catch (fallbackErr: any) {
        setCameraError(
          err.message || 'Unable to access camera. Please check camera permissions in your browser.'
        );
      }
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    startCamera(facingMode);

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode]);

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      setCapturedImage(dataUrl);

      // Stop camera stream while previewing
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera(facingMode);
  };

  const confirmPhoto = () => {
    if (!capturedImage) return;

    // Convert dataUrl to File
    fetch(capturedImage)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], `receipt_camera_${Date.now()}.jpg`, { type: 'image/jpeg' });
        onCapture(file);
      })
      .catch((err) => {
        console.error('Error generating photo file:', err);
      });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-between p-4 sm:p-6 backdrop-blur-md animate-fade-in">
      {/* Top bar */}
      <div className="w-full max-w-2xl flex items-center justify-between text-white z-10">
        <div className="flex items-center space-x-2">
          <Camera className="w-5 h-5 text-indigo-400" />
          <span className="font-semibold text-sm">Receipt & Bill Scanner</span>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Viewport */}
      <div className="relative w-full max-w-2xl flex-1 flex items-center justify-center my-4 overflow-hidden rounded-2xl border-2 border-indigo-500/30 bg-slate-950 shadow-2xl">
        {cameraError ? (
          <div className="text-center p-6 max-w-md">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">Camera Unavailable</h3>
            <p className="text-sm text-slate-400 mb-6">{cameraError}</p>
            <button
              onClick={() => startCamera(facingMode)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : capturedImage ? (
          <div className="relative w-full h-full flex items-center justify-center bg-black">
            <img src={capturedImage} alt="Captured receipt" className="max-h-full max-w-full object-contain" />
            <div className="absolute top-4 right-4 bg-emerald-500/90 text-white text-xs px-3 py-1 rounded-full font-medium flex items-center space-x-1 shadow-md">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Receipt Captured</span>
            </div>
          </div>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center">
            {isInitializing && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950 z-10">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            )}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover sm:object-contain"
            />

            {/* Target alignment guideline box */}
            <div className="absolute inset-8 sm:inset-12 border-2 border-dashed border-indigo-400/60 rounded-xl pointer-events-none flex flex-col justify-between p-4 shadow-[0_0_20px_rgba(99,102,241,0.25)]">
              <div className="flex justify-between">
                <div className="w-4 h-4 border-t-2 border-l-2 border-indigo-400 -mt-2 -ml-2"></div>
                <div className="w-4 h-4 border-t-2 border-r-2 border-indigo-400 -mt-2 -mr-2"></div>
              </div>
              <div className="text-center text-xs text-indigo-300/80 bg-slate-900/60 backdrop-blur-sm px-3 py-1.5 rounded-full mx-auto self-center">
                Align receipt or bill inside frame (supports multiple bills)
              </div>
              <div className="flex justify-between">
                <div className="w-4 h-4 border-b-2 border-l-2 border-indigo-400 -mb-2 -ml-2"></div>
                <div className="w-4 h-4 border-b-2 border-r-2 border-indigo-400 -mb-2 -mr-2"></div>
              </div>
            </div>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Bottom controls */}
      <div className="w-full max-w-2xl flex items-center justify-center space-x-6 pb-2 z-10">
        {capturedImage ? (
          <>
            <button
              onClick={retakePhoto}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retake Photo</span>
            </button>
            <button
              onClick={confirmPhoto}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-sm font-semibold shadow-lg shadow-indigo-500/30 transition-all flex items-center space-x-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Analyze & Process</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={toggleFacingMode}
              className="p-3.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Flip camera"
            >
              <RefreshCw className="w-5 h-5" />
            </button>

            {/* Shutter Button */}
            <button
              onClick={capturePhoto}
              disabled={isInitializing || !!cameraError}
              className="w-18 h-18 p-1.5 rounded-full border-4 border-white flex items-center justify-center bg-transparent hover:scale-105 active:scale-95 transition-transform disabled:opacity-50"
            >
              <div className="w-14 h-14 rounded-full bg-white hover:bg-indigo-100 transition-colors"></div>
            </button>

            <div className="w-11"></div>
          </>
        )}
      </div>
    </div>
  );
};
