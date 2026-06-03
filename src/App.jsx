import { useState, useEffect } from 'react';
import { supabase } from './utils/supabase';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import ChatWindow from './components/ChatWindow';
import CompositionPanel from './components/CompositionPanel';
import { useSession } from './hooks/useSession';
import { useChat } from './hooks/useChat';
import { useAudioGeneration } from './hooks/useAudioGeneration';
import { Sparkles, WifiOff, AlertCircle, RefreshCw, Server, Terminal } from 'lucide-react';
import api from './utils/api';


// ChatWorkspace encapsulates the actual chatbot UI and hooks to avoid 401s on mount
function ChatWorkspace({ onLogout }) {
  const { sessionId, sessionData, setSessionData, loading: sessionLoading, resetSession, error: sessionError } = useSession();
  const { sendMessage, loading: chatLoading } = useChat(sessionId, setSessionData);
  const { generateTrack, status: audioStatus, audioData, errorMsg: audioError, reset: resetAudio } = useAudioGeneration(sessionId, sessionData?.compositionState);

  const handleBack = async () => {
    if (!sessionData || sessionData.step <= 1) return;
    try {
      const res = await api.post('/api/session/back', { sessionId });
      setSessionData(res.data.session);
    } catch (err) {
      console.error("Failed to go back:", err);
    }
  };

  // Initialize conversation if empty
  useEffect(() => {
    if (sessionData && sessionData.conversationHistory.length === 0 && !chatLoading) {
      sendMessage("Hello Apollo. I'd like to compose a track.");
    }
  }, [sessionData, chatLoading, sendMessage]);

  // Auto-generate track at Step 12 (only if not already generated)
  useEffect(() => {
    if (sessionData?.step === 12 && audioStatus === 'idle' && !sessionData?.compositionState?.audioUrl) {
      generateTrack();
    }
  }, [sessionData?.step, audioStatus, sessionData?.compositionState?.audioUrl, generateTrack]);

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-[var(--canvas)] flex items-center justify-center text-[var(--ink-secondary)] flex-col gap-4 font-sans animate-message-in">
        <Sparkles className="animate-pulse text-[var(--accent)]" size={32} />
        <p>Tuning instruments...</p>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] w-full bg-[var(--canvas)] text-[var(--ink)] overflow-hidden font-sans relative">
      {/* Ambient Glow Nebulae */}
      <div className="absolute top-[-25%] left-[-15%] w-[60%] h-[60%] rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.12)_0%,transparent_75%)] blur-[80px] pointer-events-none animate-float-blob z-0" />
      <div className="absolute bottom-[-25%] right-[-15%] w-[60%] h-[60%] rounded-full bg-[radial-gradient(circle,rgba(6,182,212,0.08)_0%,transparent_75%)] blur-[80px] pointer-events-none animate-float-blob [animation-delay:-12s] z-0" />

      {/* Sidebar Panel */}
      <div className="w-[320px] shrink-0 hidden md:flex flex-col glass-panel border-r border-[var(--hairline)] h-full overflow-hidden z-10 relative">
        <CompositionPanel 
          session={sessionData} 
          onGenerate={generateTrack} 
          setSessionData={setSessionData}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full z-10 relative bg-[var(--canvas)]">
        <header className="h-[72px] shrink-0 flex items-center justify-between px-6 border-b border-[var(--hairline)] glass-panel z-20 relative">
          <div className="flex items-center gap-3">
            <div className="bg-[var(--accent)] w-8 h-8 rounded-full flex items-center justify-center shadow-[0_0_20px_var(--accent-muted)]">
              <Sparkles size={16} className="text-[var(--ink)]" />
            </div>
            <h1 className="text-[20px] font-bold tracking-tight text-[var(--ink)] font-['Space_Grotesk']">
              Apollo<span className="text-[var(--accent-glow)]">.Ai</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                resetSession();
                resetAudio();
              }}
              className="text-[13px] font-medium text-[var(--ink-secondary)] hover:text-[var(--ink)] transition-colors cursor-pointer"
            >
              Start Over
            </button>
            <button 
              onClick={onLogout}
              className="text-[13px] font-medium text-[var(--ink-secondary)] hover:text-[var(--error)] transition-colors cursor-pointer"
            >
              Log Out
            </button>
          </div>
        </header>
        
        <div className="flex-1 flex flex-col overflow-hidden relative bg-[var(--canvas)]">
          {sessionError ? (
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar flex items-center justify-center">
              <div className="max-w-[640px] w-full mx-auto glass-panel rounded-2xl p-8 border border-[var(--error)]/30 shadow-[0_12px_40px_rgba(239,68,68,0.05)] relative z-10 animate-message-in">
                <div className="flex items-start gap-4 mb-6">
                  <div className="bg-red-950/20 p-3.5 rounded-xl border border-[var(--error)]/40 text-[var(--error)] shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                    <WifiOff size={28} />
                  </div>
                  <div>
                    <h2 className="text-[22px] font-bold text-[var(--ink)] font-['Space_Grotesk'] tracking-tight">
                      Connection Advisory
                    </h2>
                    <p className="text-[13px] text-[var(--ink-secondary)] mt-1">
                      Apollo was unable to connect to the backend orchestration service.
                    </p>
                  </div>
                </div>

                <div className="bg-[var(--canvas)] p-4 rounded-xl border border-[var(--hairline)] mb-6 space-y-3 font-mono text-[12px]">
                  <div className="flex items-center gap-2 text-[var(--ink-secondary)]">
                    <Server size={14} className="text-[var(--accent-glow)]" />
                    <span className="font-semibold">Target API URL:</span>
                    <span className="text-[var(--ink)] break-all">{api.defaults.baseURL}</span>
                  </div>
                  <div className="flex items-start gap-2 text-[var(--error)]">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <span className="font-semibold shrink-0">Details:</span>
                    <span className="break-all">{sessionError?.message || String(sessionError)}</span>
                  </div>
                </div>

                <div className="space-y-4 text-[13px] text-[var(--ink-secondary)] mb-8">
                  <div className="flex gap-2">
                    <span className="bg-[var(--surface)] text-[var(--accent-glow)] font-bold font-mono px-2 py-0.5 rounded text-[11px] shrink-0 h-fit mt-0.5">1</span>
                    <p>
                      <strong>Set Environment Variable:</strong> In your Vercel deployment settings, verify that <code>VITE_API_URL</code> is set to your deployed backend URL (e.g. <code>https://your-backend.onrender.com</code> or <code>https://your-backend.up.railway.app</code>) and redeploy the application.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span className="bg-[var(--surface)] text-[var(--accent-glow)] font-bold font-mono px-2 py-0.5 rounded text-[11px] shrink-0 h-fit mt-0.5">2</span>
                    <p>
                      <strong>Verify Backend Status:</strong> Ensure your backend container has deployed successfully and is active. Render free-tier instances automatically spin down due to inactivity and may take up to a minute to start.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span className="bg-[var(--surface)] text-[var(--accent-glow)] font-bold font-mono px-2 py-0.5 rounded text-[11px] shrink-0 h-fit mt-0.5">3</span>
                    <p>
                      <strong>Local Development:</strong> If you are testing locally, make sure you ran <code>python main.py</code> inside the <code>server/</code> folder and that the server is listening on port <code>3001</code>.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 border-t border-[var(--hairline)] pt-5">
                  <button 
                    onClick={() => resetSession()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-glow)] text-[var(--ink)] font-semibold rounded-lg text-[13.5px] cursor-pointer transition-all active:scale-95 shadow-[0_4px_12px_rgba(124,58,237,0.3)] hover:shadow-[0_0_24px_rgba(159,103,255,0.5)] accent-glow-button"
                  >
                    <RefreshCw size={14} className="animate-spin-slow" />
                    <span>Retry Connection</span>
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

  const fetchProfile = async (userId) => {
    setProfileLoading(true);
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
      setProfileLoading(false);
    }
  };

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
  }, []);

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

  // 2. Authenticated -> check role
  if (profile?.role === 'superadmin') {
    return <AdminDashboard />;
  }

  // Default: Normal User Chat Flow
  return <ChatWorkspace onLogout={handleLogout} />;
}

export default App;
