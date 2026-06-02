import { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { supabase } from '../utils/supabase';
import { 
  Users, Music, MessageSquare, Activity, PlusCircle, Trash2, 
  LogOut, Sparkles, Play, Pause, AlertCircle, RefreshCw 
} from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'users' | 'logs'
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Create user form state
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('normal');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Audio preview ref
  const [playingTrackId, setPlayingTrackId] = useState(null);
  const audioPreviewRef = useRef(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, usersRes, logsRes] = await Promise.all([
        api.get('/api/admin/analytics'),
        api.get('/api/admin/users'),
        api.get('/api/admin/logs')
      ]);
      
      setAnalytics(analyticsRes.data);
      setUsers(usersRes.data.users);
      setLogs(logsRes.data.logs);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const init = async () => {
      await Promise.resolve(); // avoid synchronous state updates
      if (active) {
        fetchDashboardData();
      }
    };
    init();
    return () => {
      active = false;
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
      }
    };
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionSuccess('');
    
    if (!newEmail || !newPassword) {
      setActionError('Email and Password are required.');
      return;
    }
    if (newPassword.length < 6) {
      setActionError('Password must be at least 6 characters.');
      return;
    }

    setActionLoading(true);
    try {
      await api.post('/api/admin/users', {
        email: newEmail,
        password: newPassword,
        role: newRole
      });
      
      setActionSuccess(`Successfully provisioned account for ${newEmail}`);
      setNewEmail('');
      setNewPassword('');
      setNewRole('normal');
      
      // Refresh list
      fetchDashboardData();
    } catch (err) {
      setActionError(err.response?.data?.detail || 'Failed to create user.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (userId, email) => {
    if (!confirm(`Are you absolutely sure you want to delete user ${email}? This action will permanently remove all their sessions and generated tracks.`)) {
      return;
    }
    
    try {
      await api.delete(`/api/admin/users/${userId}`);
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete user.');
    }
  };

  const togglePlayTrack = (trackId, audioUrl) => {
    if (playingTrackId === trackId) {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
      }
      setPlayingTrackId(null);
    } else {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
      }
      const newAudio = new Audio(audioUrl);
      newAudio.play();
      newAudio.onended = () => setPlayingTrackId(null);
      audioPreviewRef.current = newAudio;
      setPlayingTrackId(trackId);
    }
  };

  const handleLogout = async () => {
    if (audioPreviewRef.current) audioPreviewRef.current.pause();
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen w-full bg-[var(--canvas)] text-[var(--ink)] flex flex-col font-sans overflow-y-auto">
      
      {/* Header */}
      <header className="h-[72px] shrink-0 border-b border-[var(--hairline)] bg-[var(--canvas-overlay)] px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-[var(--accent)] w-8 h-8 rounded-full flex items-center justify-center shadow-[0_0_20px_var(--accent-muted)]">
            <Sparkles size={16} className="text-[var(--ink)]" />
          </div>
          <h1 className="text-[20px] font-bold tracking-tight text-[var(--ink)] font-['Space_Grotesk']">
            Apollo<span className="text-[var(--accent-glow)]">.Ai</span>
            <span className="text-[12px] font-mono ml-3 px-2 py-0.5 rounded bg-[var(--accent-muted)] border border-[var(--accent)] text-[var(--accent-glow)] tracking-wider uppercase">
              Control Deck
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={fetchDashboardData}
            title="Refresh statistics"
            className="p-2 rounded-full border border-[var(--hairline)] hover:border-[var(--accent)] text-[var(--ink-secondary)] hover:text-[var(--ink)] transition-colors cursor-pointer"
          >
            <RefreshCw size={16} />
          </button>
          
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 border border-[var(--hairline)] hover:border-[var(--error)] text-[var(--ink-secondary)] hover:text-[var(--error)] px-4 py-2 rounded-[8px] text-[13px] font-medium transition-colors cursor-pointer"
          >
            <LogOut size={14} />
            <span>Exit Studio</span>
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 max-w-[1200px] w-full mx-auto p-6 md:p-8 flex flex-col md:flex-row gap-8">
        
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-[220px] shrink-0 flex flex-col gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-[10px] text-[14px] font-medium transition-colors cursor-pointer ${
              activeTab === 'overview' 
                ? 'bg-[var(--accent-muted)] border border-[var(--accent)] text-[var(--accent-glow)]' 
                : 'border border-transparent text-[var(--ink-secondary)] hover:bg-[var(--surface)] hover:text-[var(--ink)]'
            }`}
          >
            <Activity size={18} />
            <span>Overview & Stats</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-[10px] text-[14px] font-medium transition-colors cursor-pointer ${
              activeTab === 'users' 
                ? 'bg-[var(--accent-muted)] border border-[var(--accent)] text-[var(--accent-glow)]' 
                : 'border border-transparent text-[var(--ink-secondary)] hover:bg-[var(--surface)] hover:text-[var(--ink)]'
            }`}
          >
            <Users size={18} />
            <span>Manage Clients</span>
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-[10px] text-[14px] font-medium transition-colors cursor-pointer ${
              activeTab === 'logs' 
                ? 'bg-[var(--accent-muted)] border border-[var(--accent)] text-[var(--accent-glow)]' 
                : 'border border-transparent text-[var(--ink-secondary)] hover:bg-[var(--surface)] hover:text-[var(--ink)]'
            }`}
          >
            <MessageSquare size={18} />
            <span>Access Logs</span>
          </button>
        </aside>

        {/* Content Panel */}
        <main className="flex-1 min-w-0 bg-[var(--canvas-overlay)] border border-[var(--hairline)] rounded-[16px] p-6 shadow-lg">
          
          {loading ? (
            <div className="h-[300px] w-full flex flex-col items-center justify-center text-[var(--ink-secondary)] gap-3">
              <RefreshCw size={24} className="animate-spin text-[var(--accent)]" />
              <p className="text-[14px]">Fetching telemetry...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-8 animate-message-in">
                  <h2 className="text-[20px] font-bold text-[var(--ink)] font-['Space_Grotesk']">System Overview</h2>
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {/* Stat Card 1 */}
                    <div className="bg-[var(--canvas-elevated)] border border-[var(--hairline)] rounded-[12px] p-5 relative overflow-hidden group hover:border-[var(--accent)] transition-all">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-[var(--accent)]" />
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[11px] font-semibold text-[var(--ink-secondary)] uppercase tracking-wider">Total Clients</p>
                          <h3 className="text-[32px] font-bold font-mono mt-1 text-[var(--ink)]">{analytics?.summary?.totalUsers || 0}</h3>
                        </div>
                        <div className="p-2.5 bg-[var(--surface)] rounded-[8px] text-[var(--ink-secondary)]">
                          <Users size={18} />
                        </div>
                      </div>
                    </div>

                    {/* Stat Card 2 */}
                    <div className="bg-[var(--canvas-elevated)] border border-[var(--hairline)] rounded-[12px] p-5 relative overflow-hidden group hover:border-[var(--wave)] transition-all">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-[var(--wave)]" />
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[11px] font-semibold text-[var(--ink-secondary)] uppercase tracking-wider">Tracks Composed</p>
                          <h3 className="text-[32px] font-bold font-mono mt-1 text-[var(--ink)]">{analytics?.summary?.totalTracks || 0}</h3>
                        </div>
                        <div className="p-2.5 bg-[var(--surface)] rounded-[8px] text-[var(--ink-secondary)]">
                          <Music size={18} />
                        </div>
                      </div>
                    </div>

                    {/* Stat Card 3 */}
                    <div className="bg-[var(--canvas-elevated)] border border-[var(--hairline)] rounded-[12px] p-5 relative overflow-hidden group hover:border-[var(--accent)] transition-all">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-[var(--accent-glow)]" />
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[11px] font-semibold text-[var(--ink-secondary)] uppercase tracking-wider">Sessions Opened</p>
                          <h3 className="text-[32px] font-bold font-mono mt-1 text-[var(--ink)]">{analytics?.summary?.totalSessions || 0}</h3>
                        </div>
                        <div className="p-2.5 bg-[var(--surface)] rounded-[8px] text-[var(--ink-secondary)]">
                          <MessageSquare size={18} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Tracks */}
                  <div className="space-y-4 pt-4 border-t border-[var(--hairline)]">
                    <h3 className="text-[16px] font-semibold text-[var(--ink)]">Recent Composition Outputs</h3>
                    
                    {analytics?.recentTracks?.length === 0 ? (
                      <div className="border border-[var(--hairline)] rounded-[12px] p-8 text-center text-[var(--ink-secondary)]">
                        No songs generated yet by users.
                      </div>
                    ) : (
                      <div className="border border-[var(--hairline)] rounded-[12px] overflow-hidden bg-[var(--canvas-elevated)]">
                        <table className="w-full text-left text-[13px] border-collapse">
                          <thead>
                            <tr className="bg-[var(--surface)] border-b border-[var(--hairline)] text-[var(--ink-secondary)] font-semibold uppercase text-[10px] tracking-wider">
                              <th className="px-5 py-3">Track Info</th>
                              <th className="px-5 py-3">Composer</th>
                              <th className="px-5 py-3">Date</th>
                              <th className="px-5 py-3 text-right">Preview</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--hairline)]">
                            {analytics?.recentTracks?.map((track) => (
                              <tr key={track.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                                <td className="px-5 py-3.5">
                                  <div className="font-semibold text-[var(--ink)]">{track.title}</div>
                                  <div className="text-[11px] text-[var(--ink-secondary)] font-mono">
                                    {(track.duration / 60).toFixed(0)}m {Math.round(track.duration % 60)}s
                                  </div>
                                </td>
                                <td className="px-5 py-3.5 text-[var(--ink-secondary)]">{track.email}</td>
                                <td className="px-5 py-3.5 font-mono text-[11px] text-[var(--ink-secondary)]">
                                  {new Date(track.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-5 py-3.5 text-right">
                                  {track.id ? (
                                    <button
                                      onClick={() => togglePlayTrack(track.id, track.audioUrl || `https://api.sunoapi.org/music/${track.id}.mp3`)}
                                      className="p-2 rounded-full bg-[var(--accent-muted)] hover:bg-[var(--accent)] border border-[var(--accent)] text-[var(--accent-glow)] hover:text-[var(--ink)] transition-colors cursor-pointer"
                                    >
                                      {playingTrackId === track.id ? <Pause size={12} /> : <Play size={12} />}
                                    </button>
                                  ) : (
                                    <span className="text-[11px] text-[var(--ink-muted)]">No URL</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: MANAGE USERS */}
              {activeTab === 'users' && (
                <div className="space-y-8 animate-message-in">
                  <div className="flex justify-between items-center">
                    <h2 className="text-[20px] font-bold text-[var(--ink)] font-['Space_Grotesk']">User & Client Management</h2>
                  </div>

                  {/* Create New User Section */}
                  <div className="bg-[var(--canvas-elevated)] border border-[var(--hairline)] rounded-[12px] p-5 space-y-4">
                    <h3 className="text-[14px] font-semibold text-[var(--ink)] flex items-center gap-2">
                      <PlusCircle size={16} className="text-[var(--accent)]" />
                      <span>Provision Client Login</span>
                    </h3>

                    {actionError && (
                      <div className="bg-red-950/20 border border-[var(--error)] rounded-[8px] p-3 text-[13px] text-[var(--ink)] flex items-center gap-2">
                        <AlertCircle size={16} className="text-[var(--error)]" />
                        <span>{actionError}</span>
                      </div>
                    )}
                    {actionSuccess && (
                      <div className="bg-green-950/20 border border-[var(--success)] rounded-[8px] p-3 text-[13px] text-[var(--ink)]">
                        {actionSuccess}
                      </div>
                    )}

                    <form onSubmit={handleCreateUser} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                      <div className="space-y-1.5 col-span-1.5">
                        <label className="text-[10px] uppercase font-bold text-[var(--ink-secondary)] tracking-wider">Email Address</label>
                        <input
                          type="email"
                          required
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          placeholder="client@company.com"
                          className="w-full bg-[var(--surface)] border border-[var(--hairline)] rounded-[8px] px-3.5 py-2 text-[13px] outline-none text-[var(--ink)] focus:border-[var(--accent)] focus:shadow-[0_0_0_2px_var(--accent-muted)]"
                        />
                      </div>
                      <div className="space-y-1.5 col-span-1.5">
                        <label className="text-[10px] uppercase font-bold text-[var(--ink-secondary)] tracking-wider">Password</label>
                        <input
                          type="text"
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Set password"
                          className="w-full bg-[var(--surface)] border border-[var(--hairline)] rounded-[8px] px-3.5 py-2 text-[13px] outline-none text-[var(--ink)] focus:border-[var(--accent)] focus:shadow-[0_0_0_2px_var(--accent-muted)]"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-[var(--ink-secondary)] tracking-wider">User Role</label>
                        <select
                          value={newRole}
                          onChange={(e) => setNewRole(e.target.value)}
                          className="w-full bg-[var(--surface)] border border-[var(--hairline)] rounded-[8px] px-3 py-2 text-[13px] outline-none text-[var(--ink)] focus:border-[var(--accent)]"
                        >
                          <option value="normal">Normal Client</option>
                          <option value="superadmin">Superadmin</option>
                        </select>
                      </div>
                      <div>
                        <button
                          type="submit"
                          disabled={actionLoading}
                          className="w-full bg-[var(--accent)] hover:bg-[var(--accent-glow)] text-[var(--ink)] font-semibold rounded-[8px] py-2.5 text-[13px] cursor-pointer transition-colors block disabled:opacity-50"
                        >
                          {actionLoading ? 'Creating...' : 'Provision'}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Registered Users List */}
                  <div className="space-y-3">
                    <h3 className="text-[14px] font-semibold text-[var(--ink)]">Registered Users</h3>
                    
                    <div className="border border-[var(--hairline)] rounded-[12px] overflow-hidden bg-[var(--canvas-elevated)]">
                      <table className="w-full text-left text-[13px] border-collapse">
                        <thead>
                          <tr className="bg-[var(--surface)] border-b border-[var(--hairline)] text-[var(--ink-secondary)] font-semibold uppercase text-[10px] tracking-wider">
                            <th className="px-5 py-3">Email</th>
                            <th className="px-5 py-3">Role</th>
                            <th className="px-5 py-3">Registered Date</th>
                            <th className="px-5 py-3 text-right">Delete Account</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--hairline)]">
                          {users.map((u) => (
                            <tr key={u.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                              <td className="px-5 py-3 text-[var(--ink)] font-medium">{u.email}</td>
                              <td className="px-5 py-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ${
                                  u.role === 'superadmin' 
                                    ? 'bg-purple-900/30 text-purple-300 border border-purple-700/50' 
                                    : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                                }`}>
                                  {u.role}
                                </span>
                              </td>
                              <td className="px-5 py-3 font-mono text-[11px] text-[var(--ink-secondary)]">
                                {new Date(u.created_at).toLocaleString()}
                              </td>
                              <td className="px-5 py-3 text-right">
                                <button
                                  onClick={() => handleDeleteUser(u.id, u.email)}
                                  className="p-1.5 rounded bg-transparent border border-transparent hover:border-[var(--error)] text-[var(--ink-secondary)] hover:text-[var(--error)] transition-all cursor-pointer"
                                  title="Delete User Account"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: ACCESS LOGS */}
              {activeTab === 'logs' && (
                <div className="space-y-4 animate-message-in">
                  <h2 className="text-[20px] font-bold text-[var(--ink)] font-['Space_Grotesk']">System Access Logs</h2>
                  
                  {logs.length === 0 ? (
                    <div className="border border-[var(--hairline)] rounded-[12px] p-8 text-center text-[var(--ink-secondary)]">
                      No system access logs found.
                    </div>
                  ) : (
                    <div className="border border-[var(--hairline)] rounded-[12px] overflow-hidden bg-[var(--canvas-elevated)]">
                      <table className="w-full text-left text-[13px] border-collapse">
                        <thead>
                          <tr className="bg-[var(--surface)] border-b border-[var(--hairline)] text-[var(--ink-secondary)] font-semibold uppercase text-[10px] tracking-wider">
                            <th className="px-5 py-3">User</th>
                            <th className="px-5 py-3">Action</th>
                            <th className="px-5 py-3">Context Details</th>
                            <th className="px-5 py-3">Timestamp</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--hairline)]">
                          {logs.map((log) => (
                            <tr key={log.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                              <td className="px-5 py-3 text-[var(--ink)]">{log.email}</td>
                              <td className="px-5 py-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ${
                                  log.action === 'generate_track' 
                                    ? 'bg-cyan-900/30 text-cyan-300 border border-cyan-700/50' 
                                    : 'bg-emerald-900/30 text-emerald-300 border border-emerald-700/50'
                                }`}>
                                  {log.action.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="px-5 py-3 font-mono text-[11px] text-[var(--ink-secondary)]">
                                {log.action === 'generate_track' ? (
                                  <span>Generated: "{log.metadata?.trackTitle || 'Track'}"</span>
                                ) : log.action === 'login' ? (
                                  <span className="truncate max-w-[280px] block" title={log.metadata?.userAgent}>
                                    {log.metadata?.userAgent || 'User session signed in'}
                                  </span>
                                ) : (
                                  <span>{JSON.stringify(log.metadata)}</span>
                                )}
                              </td>
                              <td className="px-5 py-3 font-mono text-[11px] text-[var(--ink-secondary)]">
                                {new Date(log.createdAt).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

        </main>
      </div>

    </div>
  );
}
