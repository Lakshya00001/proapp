import React, { useState, useEffect, useRef } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2, KeyRound, AlertCircle, RefreshCw, Loader2, ShieldCheck, Inbox } from 'lucide-react';

interface AuthGateProps {
  onAuthenticated: (user: { email: string }) => void;
}

export const AuthGate: React.FC<AuthGateProps> = ({ onAuthenticated }) => {
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Flow: 'credentials' | 'otp' | 'success'
  const [step, setStep] = useState<'credentials' | 'otp' | 'success'>('credentials');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [serverNotice, setServerNotice] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Real 60-second countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'otp' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((c) => c - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  // Request backend to send OTP email
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setServerNotice(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch verification code.');
      }

      setServerNotice(data.message || `Verification code sent to ${cleanEmail}`);
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
      setStep('otp');

      // Auto focus first OTP input
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 150);
    } catch (err: any) {
      console.error('Send OTP Error:', err);
      setErrorMsg(err.message || 'Could not send verification code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle individual OTP digit typing
  const handleOtpChange = (index: number, val: string) => {
    // Only accept numeric characters
    const cleanVal = val.replace(/[^0-9]/g, '');
    if (!cleanVal && val) return;

    const newOtp = [...otp];
    newOtp[index] = cleanVal ? cleanVal.slice(-1) : '';
    setOtp(newOtp);

    // Auto-advance
    if (cleanVal && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Support full paste (e.g. copying 6-digit code from email)
  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim().replace(/[^0-9]/g, '');
    if (pasted.length >= 6) {
      const digits = pasted.slice(0, 6).split('');
      setOtp(digits);
      inputRefs.current[5]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Verify OTP with backend
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const enteredCode = otp.join('').trim();
    if (enteredCode.length !== 6) {
      setErrorMsg('Please enter all 6 digits of the verification code.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          otp: enteredCode,
          password
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Invalid or expired verification code.');
      }

      setStep('success');

      const userSession = { email: email.trim() };
      localStorage.setItem('proapp_user_session', JSON.stringify(userSession));

      setTimeout(() => {
        onAuthenticated(userSession);
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed. Please check the code and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
      setServerNotice(`A new code was sent to ${email.trim()}`);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to resend verification code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex items-center justify-center p-4 selection:bg-indigo-500 selection:text-white">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-white space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white mx-auto shadow-xl shadow-indigo-500/20">
            <KeyRound className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">BillSnap AI Pro</h2>
          <p className="text-xs text-slate-400">
            Enterprise Invoicing • Groq 120B AI • Supabase Database
          </p>
        </div>

        {/* Tab Toggle: Create Account / Sign In */}
        {step === 'credentials' && (
          <div className="bg-slate-800/80 p-1 rounded-2xl flex border border-slate-750">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(true);
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                isSignUp
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                !isSignUp
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
          </div>
        )}

        {/* Error notification */}
        {errorMsg && (
          <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl flex items-center space-x-2 text-rose-300 text-xs font-medium animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Step 1: Credentials Form */}
        {step === 'credentials' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-indigo-500 font-mono"
                  autoFocus
                />
              </div>
            </div>

            {/* Password with Eye Icon */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                {isSignUp ? 'Create Password' : 'Password'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-indigo-500 font-mono"
                />
                {/* Eye Icon to Toggle Password View */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'View password'}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white transition-colors p-0.5"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-indigo-400" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                Minimum 6 characters. Use the eye icon to verify.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:brightness-110 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Dispatching Code...</span>
                </>
              ) : (
                <>
                  <span>Send OTP Verification Code</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Step 2: Real OTP Verification Screen */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-5 animate-fade-in">
            {/* Header with Email Icon */}
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                <Inbox className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Check Your Inbox</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                We sent a 6-digit verification code to{' '}
                <span className="font-semibold text-white font-mono">{email}</span>
              </p>
            </div>

            {/* Instruction pill */}
            <div className="p-3 bg-slate-800/80 border border-slate-750 rounded-2xl text-center text-xs text-slate-400">
              Please enter the code from your email. Check your spam or promotions folder if you don't see it in a moment.
            </div>

            {/* 6 Digit PIN Boxes with Paste Support */}
            <div className="flex justify-center space-x-2">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => { inputRefs.current[idx] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  onPaste={handleOtpPaste}
                  className="w-11 h-12 text-center text-lg font-bold bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 font-mono shadow-inner"
                />
              ))}
            </div>

            {/* Countdown & Resend */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>
                Code expires in:{' '}
                <strong className={`font-mono ${countdown < 10 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {countdown}s
                </strong>
              </span>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={countdown > 0 || isSubmitting}
                className="text-indigo-400 hover:text-indigo-300 font-semibold disabled:opacity-30 disabled:hover:text-indigo-400 flex items-center space-x-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Resend Code</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:brightness-110 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Code...</span>
                </>
              ) : (
                <>
                  <span>Verify OTP & Open Site</span>
                  <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('credentials');
                setErrorMsg(null);
              }}
              className="w-full text-center text-xs text-slate-400 hover:text-white transition-colors"
            >
              Wrong email address? Change credentials
            </button>
          </form>
        )}

        {/* Step 3: Success Screen */}
        {step === 'success' && (
          <div className="text-center py-6 space-y-3 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-xl">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-black text-white">Account Verified & Logged In!</h3>
            <p className="text-xs text-slate-400">Opening your AI receipt & billing workspace...</p>
          </div>
        )}

        {/* Security Footer */}
        <div className="pt-2 border-t border-slate-800 text-center">
          <span className="text-[11px] text-slate-500 flex items-center justify-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Zoho Mail Delivery • Supabase Auth • Groq 120B AI</span>
          </span>
        </div>
      </div>
    </div>
  );
};
