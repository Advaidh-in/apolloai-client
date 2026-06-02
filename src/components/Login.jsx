import { useState } from 'react';
import { supabase } from '../utils/supabase';
import api from '../utils/api';
import { Sparkles, Mail, Lock, AlertCircle, Loader } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      // Successful login - trigger audit log on backend (silently)
      try {
        await api.post('/api/admin/log-login', {
          userAgent: navigator.userAgent
        });
      } catch (logErr) {
        console.warn('Could not record login audit log:', logErr);
      }

    } catch (err) {
      console.error('Authentication failed:', err);
      setErrorMsg(err.message || 'Invalid email or password.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[var(--canvas)] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-25%] left-[-20%] w-[65%] h-[65%] rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.14)_0%,transparent_75%)] blur-[85px] pointer-events-none animate-float-blob" />
      <div className="absolute bottom-[-25%] right-[-20%] w-[65%] h-[65%] rounded-full bg-[radial-gradient(circle,rgba(6,182,212,0.1)_0%,transparent_75%)] blur-[85px] pointer-events-none animate-float-blob [animation-delay:-12s]" />

      {/* Login Card */}
      <div className="w-full max-w-[420px] glass-panel rounded-[16px] p-8 shadow-[0_12px_40px_rgba(0,0,0,0.65)] relative z-10 animate-message-in">
        
        {/* Header Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-[var(--accent)] w-12 h-12 rounded-full flex items-center justify-center shadow-[0_0_24px_rgba(124,58,237,0.5)] mb-3">
            <Sparkles size={24} className="text-[var(--ink)]" />
          </div>
          <h1 className="text-[28px] font-bold tracking-tight text-[var(--ink)] font-['Space_Grotesk']">
            Apollo<span className="text-[var(--accent-glow)]">.Ai</span>
          </h1>
          <p className="text-[13px] text-[var(--ink-secondary)] mt-1 font-medium">
            AI Music Composition Assistant
          </p>
        </div>

        {/* Error Feedback */}
        {errorMsg && (
          <div className="mb-6 bg-red-950/20 border border-[var(--error)] rounded-[8px] p-3.5 flex items-start gap-3 text-[13px] text-[var(--ink)] shadow-[0_0_15px_rgba(239,68,68,0.1)]">
            <AlertCircle size={18} className="text-[var(--error)] shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-[var(--ink-secondary)] uppercase tracking-[0.08em] block">
              Email Address
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-[50%] translate-y-[-50%] text-[var(--ink-muted)] pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@vibewire.com"
                className="w-full bg-[var(--surface)] border border-[var(--hairline)] rounded-[10px] pl-10.5 pr-4 py-3 text-[14px] text-[var(--ink)] placeholder:text-[var(--ink-muted)] outline-none transition-all focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-muted)]"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-[var(--ink-secondary)] uppercase tracking-[0.08em] block">
              Password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-[50%] translate-y-[-50%] text-[var(--ink-muted)] pointer-events-none" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[var(--surface)] border border-[var(--hairline)] rounded-[10px] pl-10.5 pr-4 py-3 text-[14px] text-[var(--ink)] placeholder:text-[var(--ink-muted)] outline-none transition-all focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-muted)]"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--accent)] text-[var(--ink)] font-semibold rounded-[10px] py-3 text-[14px] cursor-pointer flex items-center justify-center gap-2 block disabled:opacity-50 disabled:cursor-not-allowed accent-glow-button"
          >
            {loading ? (
              <>
                <Loader size={16} className="animate-spin text-[var(--ink)]" />
                <span>Entering Studio...</span>
              </>
            ) : (
              <span>Enter Studio</span>
            )}
          </button>
        </form>

        {/* Footer Note */}
        <div className="mt-8 text-center border-t border-[var(--hairline)] pt-4">
          <p className="text-[11px] text-[var(--ink-muted)]">
            VibeWire Group • Confidential Workspace
          </p>
        </div>

      </div>
    </div>
  );
}
