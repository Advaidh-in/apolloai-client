import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from './utils/supabase';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import ChatWindow from './components/ChatWindow';
import CompositionPanel from './components/CompositionPanel';
import { useSession } from './hooks/useSession';
import { useChat } from './hooks/useChat';
import { useAudioGeneration } from './hooks/useAudioGeneration';
import { Sparkles, WifiOff, RefreshCw, Lock, PanelLeft, X } from 'lucide-react';
import api from './utils/api';

// ChatWorkspace encapsulates the actual chatbot UI and hooks to avoid 401s on mount
function ChatWorkspace({ onLogout }) {
  const { sessionId, sessionData, setSessionData, loading: sessionLoading, resetSession, error: sessionError } = useSession();
  const { sendMessage, loading: chatLoading } = useChat(sessionId, setSessionData);
  const { generateTrack, status: audioStatus, audioData, errorMsg: audioError, reset: resetAudio } = useAudioGeneration(sessionId, sessionData?.compositionState, setSessionData);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  // Mode state: 'menu' | 'composition' | 'hum-to-search' | 'verify'
  const [mode, setMode] = useState('menu');

  const handleBack = async () => {
    if (!sessionData || sessionData.step <= 1) return;
    try {
      const res = await api.post('/api/session/back', { sessionId });
      setSessionData(res.data.session);
      if (sessionData.step === 12) {
        resetAudio();
      }
    } catch (err) {
      console.error("Failed to go back:", err);
    }
  };

  // Only auto-start the greeting when the user deliberately enters composition mode
  useEffect(() => {
    if (mode === 'composition' && sessionData && sessionData.conversationHistory.length === 0 && !chatLoading) {
      sendMessage("Hello Apollo. I'd like to compose a track.");
    }
  }, [mode, sessionData, chatLoading, sendMessage]);

  // Auto-generate track at Step 12 (only if not already generated)
  useEffect(() => {
    if (mode === 'composition' && sessionData?.step === 12 && audioStatus === 'idle' && !sessionData?.compositionState?.audioUrl) {
      generateTrack();
    }
  }, [mode, sessionData?.step, audioStatus, sessionData?.compositionState?.audioUrl, generateTrack]);

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-[var(--canvas)] flex items-center justify-center text-[var(--ink-secondary)] flex-col gap-4 font-sans animate-message-in">
        <Sparkles className="animate-pulse text-[var(--accent)]" size={32} />
        <p>Tuning instruments...</p>
      </div>
    );
  }

  const handleBackToMenu = () => {
    setMode('menu');
  };

  const handleStartComposition = async () => {
    await resetSession();
    resetAudio();
    setMode('composition');
  };

  return (
    <div className="flex h-[100dvh] w-full bg-[var(--canvas)] text-[var(--ink)] overflow-hidden font-sans relative">
      {/* Ambient Glow Nebulae */}
      <div className="absolute top-[-25%] left-[-15%] w-[60%] h-[60%] rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.12)_0%,transparent_75%)] blur-[80px] pointer-events-none animate-float-blob z-0" />
      <div className="absolute bottom-[-25%] right-[-15%] w-[60%] h-[60%] rounded-full bg-[radial-gradient(circle,rgba(6,182,212,0.08)_0%,transparent_75%)] blur-[80px] pointer-events-none animate-float-blob [animation-delay:-12s] z-0" />

      {/* Sidebar Panel — desktop only, composition mode only */}
      {mode === 'composition' && (
        <div className="w-[320px] shrink-0 hidden md:flex flex-col glass-panel border-r border-[var(--hairline)] h-full overflow-hidden z-10 relative">
          <CompositionPanel 
            session={sessionData} 
            onGenerate={generateTrack} 
            setSessionData={setSessionData}
          />
        </div>
      )}

      {/* Mobile Panel Drawer — composition mode only */}
      {mode === 'composition' && mobilePanelOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobilePanelOpen(false)} />
          <div className="relative mt-auto h-[85dvh] w-full glass-panel border-t border-[var(--hairline)] rounded-t-2xl overflow-hidden flex flex-col animate-message-in">
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--hairline)] shrink-0">
              <span className="text-[13px] font-semibold text-[var(--ink)]">Composition Brief</span>
              <button onClick={() => setMobilePanelOpen(false)} className="text-[var(--ink-secondary)] hover:text-[var(--ink)] p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <CompositionPanel 
                session={sessionData} 
                onGenerate={generateTrack} 
                setSessionData={setSessionData}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full z-10 relative bg-[var(--canvas)]">
        <header className="h-[60px] md:h-[72px] shrink-0 flex items-center justify-between px-3 md:px-6 border-b border-[var(--hairline)] glass-panel z-20 relative">
          <div className="flex items-center gap-2 md:gap-3">
            {/* Mobile: panel toggle — composition only */}
            {mode === 'composition' && (
              <button
                onClick={() => setMobilePanelOpen(true)}
                className="md:hidden p-2 rounded-lg bg-[var(--surface)] border border-[var(--hairline)] text-[var(--ink-secondary)] hover:text-[var(--accent-glow)] hover:border-[var(--accent)] transition-all cursor-pointer"
                title="View composition brief"
              >
                <PanelLeft size={16} />
              </button>
            )}
            {/* Back to Menu button — all non-menu modes */}
            {mode !== 'menu' && (
              <button
                onClick={handleBackToMenu}
                className="flex items-center gap-1.5 text-[12px] md:text-[13px] font-medium text-[var(--ink-secondary)] hover:text-[var(--ink)] transition-colors cursor-pointer px-2 py-1 rounded-lg hover:bg-[var(--surface)] border border-transparent hover:border-[var(--hairline)]"
              >
                <span className="text-[var(--ink-secondary)]">←</span>
                <span className="hidden sm:inline">Menu</span>
              </button>
            )}
            <div className="bg-[var(--accent)] w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center shadow-[0_0_20px_var(--accent-muted)]">
              <Sparkles size={14} className="text-[var(--ink)]" />
            </div>
            <h1 className="text-[16px] md:text-[20px] font-bold tracking-tight text-[var(--ink)] font-['Space_Grotesk']">
              Apollo<span className="text-[var(--accent-glow)]">.Ai</span>
            </h1>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            {mode === 'composition' && (
              <button 
                onClick={() => {
                  resetSession();
                  resetAudio();
                }}
                className="text-[12px] md:text-[13px] font-medium text-[var(--ink-secondary)] hover:text-[var(--ink)] transition-colors cursor-pointer"
              >
                <span className="hidden sm:inline">Start Over</span>
                <span className="sm:hidden">Reset</span>
              </button>
            )}
            <button 
              onClick={onLogout}
              className="text-[12px] md:text-[13px] font-medium text-[var(--ink-secondary)] hover:text-[var(--error)] transition-colors cursor-pointer"
            >
              <span className="hidden sm:inline">Log Out</span>
              <span className="sm:hidden">Exit</span>
            </button>
          </div>
        </header>
        
        <div className="flex-1 flex flex-col overflow-hidden relative bg-[var(--canvas)]">
          {sessionError ? (
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar flex items-center justify-center">
              <div className="max-w-[480px] w-full mx-auto glass-panel rounded-2xl p-8 border border-[var(--error)]/30 shadow-[0_12px_40px_rgba(239,68,68,0.05)] relative z-10 animate-message-in text-center">
                <div className="bg-red-950/20 w-14 h-14 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.15)] border border-[var(--error)]/30 mx-auto mb-5 text-[var(--error)]">
                  <WifiOff size={26} />
                </div>
                <h2 className="text-[20px] font-bold text-[var(--ink)] font-['Space_Grotesk'] tracking-tight mb-2">
                  Apollo is Unavailable
                </h2>
                <p className="text-[13.5px] text-[var(--ink-secondary)] leading-relaxed mb-8">
                  We're experiencing a temporary issue. Please refresh the page or try again in a moment.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => resetSession()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-glow)] text-[var(--ink)] font-semibold rounded-lg text-[13.5px] cursor-pointer transition-all active:scale-95 shadow-[0_4px_12px_rgba(124,58,237,0.3)] hover:shadow-[0_0_24px_rgba(159,103,255,0.5)] accent-glow-button"
                  >
                    <RefreshCw size={14} />
                    <span>Try Again</span>
                  </button>
                  <button
                    onClick={onLogout}
                    className="px-4 py-2.5 bg-transparent hover:bg-[var(--surface)] border border-[var(--hairline)] text-[var(--ink-secondary)] hover:text-[var(--ink)] rounded-lg text-[13px] transition-all cursor-pointer"
                  >
                    Log Out
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <ChatWindow 
              sessionData={sessionData} 
              onSendMessage={sendMessage} 
              onBack={handleBack}
              loading={chatLoading} 
              audioStatus={audioStatus}
              audioData={audioData}
              audioError={audioError}
              onGenerateRetry={generateTrack}
              mode={mode}
              setMode={setMode}
              onStartComposition={handleStartComposition}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);

  const profileRef = useRef(profile);
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  const fetchProfile = useCallback(async (userId) => {
    const currentProfile = profileRef.current;
    const needsLoadingState = !currentProfile || currentProfile.id !== userId;
    if (needsLoadingState) {
      setProfileLoading(true);
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      setProfile(data);
    } catch (err) {
      console.error("Error fetching user profile:", err);
    } finally {
      if (needsLoadingState) {
        setProfileLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    // Check current auth status on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setProfileLoading(false);
      }
    });

    // Listen for auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      setAuthLoading(false);
      if (newSession) {
        fetchProfile(newSession.user.id);
      } else {
        setProfile(null);
        setProfileLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Auto logout after 1.5 hours of inactivity
  useEffect(() => {
    if (!session) return;

    const TIMEOUT_MS = 1.5 * 60 * 60 * 1000; // 1.5 hours
    let timeoutId;

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        console.log("Inactivity timeout reached (1.5 hours). Logging out...");
        handleLogout();
      }, TIMEOUT_MS);
    };

    // Track user interactions to reset the timer
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    // Initialize timer
    resetTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [session]);

  if (authLoading || (session && profileLoading)) {
    return (
      <div className="min-h-screen bg-[var(--canvas)] flex items-center justify-center text-[var(--ink-secondary)] flex-col gap-4 font-sans">
        <Sparkles className="animate-pulse text-[var(--accent)]" size={32} />
        <p>Connecting to system...</p>
      </div>
    );
  }

  // 1. Unauthenticated -> Login Screen
  if (!session) {
    return <Login />;
  }

  // 2. Temporarily Blocked User Screen
  if (profile?.is_blocked) {
    return (
      <div className="min-h-screen w-full bg-[var(--canvas)] flex items-center justify-center p-4 relative overflow-hidden font-sans">
        {/* Ambient Glow Nebulae */}
        <div className="absolute top-[-25%] left-[-20%] w-[65%] h-[65%] rounded-full bg-[radial-gradient(circle,rgba(239,68,68,0.08)_0%,transparent_75%)] blur-[85px] pointer-events-none animate-float-blob" />
        
        <div className="w-full max-w-[440px] glass-panel rounded-[16px] p-8 shadow-[0_12px_40px_rgba(0,0,0,0.65)] relative z-10 animate-message-in text-center border border-[var(--error)]/20">
          <div className="bg-red-950/20 w-16 h-16 rounded-full flex items-center justify-center shadow-[0_0_24px_rgba(239,68,68,0.2)] border border-[var(--error)]/30 mx-auto mb-6 text-[var(--error)] animate-pulse">
            <Lock size={32} />
          </div>
          <h1 className="text-[24px] font-bold tracking-tight text-[var(--ink)] font-['Space_Grotesk'] mb-3">
            Access Suspended
          </h1>
          <p className="text-[13.5px] text-[var(--ink-secondary)] leading-relaxed mb-6 font-sans">
            Your account has been temporarily blocked by the administrator. Please contact support or your account administrator to restore access.
          </p>
          <button
            onClick={handleLogout}
            className="w-full bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--hairline)] hover:border-[var(--error)] text-[var(--ink)] hover:text-[var(--error)] font-semibold rounded-[10px] py-3 text-[14px] cursor-pointer transition-all active:scale-95"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  // 3. Authenticated -> check role
  if (profile?.role === 'superadmin') {
    return <AdminDashboard />;
  }

  // Default: Normal User Chat Flow
  return <ChatWorkspace onLogout={handleLogout} />;
}

export default App;
