import React, { useState, useEffect } from 'react';
import { supabase } from './utils/supabase';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import ChatWindow from './components/ChatWindow';
import CompositionPanel from './components/CompositionPanel';
import { useSession } from './hooks/useSession';
import { useChat } from './hooks/useChat';
import { useAudioGeneration } from './hooks/useAudioGeneration';
import { Sparkles } from 'lucide-react';
import api from './utils/api';

// ChatWorkspace encapsulates the actual chatbot UI and hooks to avoid 401s on mount
function ChatWorkspace({ onLogout }) {
  const { sessionId, sessionData, setSessionData, loading: sessionLoading, resetSession } = useSession();
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
  }, [sessionData, chatLoading]);

  // Auto-generate track at Step 12 (only if not already generated)
  useEffect(() => {
    if (sessionData?.step === 12 && audioStatus === 'idle' && !sessionData?.compositionState?.audioUrl) {
      generateTrack();
    }
  }, [sessionData?.step, audioStatus, sessionData?.compositionState?.audioUrl]);

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
    // Clear localStorage to prevent conflicts on next session login
    localStorage.removeItem('apolloSessionId');
    await supabase.auth.signOut();
  };

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
