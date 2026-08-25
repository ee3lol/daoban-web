"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MediaCard from '@/components/media-card';
import { Bookmark, Heart, LogOut, User as UserIcon, Link2, Palette, MonitorSmartphone, MonitorX, AlertCircle, KeyRound, Menu, X } from 'lucide-react';
import { logout, revokeSession, revokeOtherSessions } from '@/lib/actions/user';
import { authClient } from '@/lib/auth-client';

interface SessionData {
  currentSessionId: string | null;
  sessions: any[];
}

export default function ProfileTabs({ user, sessionData, connectedAccounts, watchLater, favorites }: { user: any, sessionData: SessionData | null, connectedAccounts: any[], watchLater: any[], favorites: any[] }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'liked' | 'watch_later' | 'my_account' | 'appearance' | 'devices'>('my_account');
  const [isRevoking, setIsRevoking] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const mapToMediaItem = (dbItem: any) => ({
    id: dbItem.mediaId,
    title: dbItem.title,
    poster_path: dbItem.posterPath,
    media_type: dbItem.mediaType,
    vote_average: 0,
  });

  const handleRevokeSession = async (sessionId: string) => {
    setIsRevoking(sessionId);
    await revokeSession(sessionId);
    router.refresh();
    setIsRevoking(null);
  };

  const handleRevokeOtherSessions = async () => {
    if (!sessionData?.currentSessionId) return;
    setIsRevoking('all_others');
    await revokeOtherSessions(sessionData.currentSessionId);
    router.refresh();
    setIsRevoking(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        router.push('/');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  return (
    <div className="flex flex-col md:flex-row w-full h-full relative font-sans overflow-y-auto md:overflow-hidden bg-[#050505]">
      
      {/* 
        ========================================================
        MOBILE TOP BAR
        ======================================================== 
      */}
      <div className="md:hidden flex items-center justify-between w-full bg-[#0a0a0a] border-b border-white/5 px-6 py-4 z-30 sticky top-0">
        <button onClick={() => setIsDrawerOpen(true)} className="p-2 -ml-2 text-white/70 hover:text-white transition-colors">
          <Menu className="w-6 h-6" />
        </button>
        <span className="text-white font-bold tracking-widest uppercase text-[12px]">
          {activeTab === 'liked' ? 'Liked' : 
           activeTab === 'watch_later' ? 'Watch Later' : 
           activeTab === 'my_account' ? 'My Account' : 
           activeTab === 'appearance' ? 'Appearance' : 'Devices'}
        </span>
        <button onClick={() => router.push('/')} className="p-2 -mr-2 text-white/70 hover:text-white transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      <div 
        className={`fixed inset-0 bg-black/80 z-40 backdrop-blur-sm transition-opacity duration-300 md:hidden ${isDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsDrawerOpen(false)}
      />

      {/* 
        ========================================================
        RESPONSIVE SIDEBAR (DRAWER ON MOBILE)
        ======================================================== 
      */}
      <div className={`fixed inset-y-0 left-0 z-50 md:z-auto md:relative w-[280px] shrink-0 h-full bg-[#0a0a0a] border-r border-white/5 flex flex-col pt-12 overflow-y-auto custom-scrollbar transition-transform duration-300 transform ${isDrawerOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        
        <div className="px-8 flex flex-col gap-8 pb-12">
          
          {/* User Info */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 bg-[#151515] flex items-center justify-center shrink-0">
                {user.image ? (
                  <img 
                    src={user.image} 
                    alt={user.username || user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-5 h-5 text-white/30" />
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <h1 className="text-white text-[15px] font-bold tracking-wide truncate">
                  {user.username || user.name}
                </h1>
                <p className="text-[#888888] text-[11px] uppercase tracking-wider mt-0.5">
                  Member since {new Date(user.createdAt).getFullYear()}
                </p>
              </div>
            </div>
            
            {/* Mobile Close Button inside Drawer */}
            <button onClick={() => setIsDrawerOpen(false)} className="md:hidden p-2 text-white/50 hover:text-white transition-colors bg-white/5 rounded-full">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-col gap-1 mt-2">
            <h3 className="text-[#888888] text-[11px] font-bold tracking-[0.15em] uppercase px-4 mb-3">Collection</h3>
            
            <button
              onClick={() => { setActiveTab('liked'); setIsDrawerOpen(false); }}
              className={`flex items-center gap-3 px-4 py-3 font-semibold text-[13px] tracking-wide transition-colors rounded-lg w-full text-left ${
                activeTab === 'liked' 
                  ? 'bg-white/10 text-white' 
                  : 'text-[#888888] hover:text-[#EAE8E3] hover:bg-white/5'
              }`}
            >
              <Heart className={`w-4 h-4 ${activeTab === 'liked' ? 'text-[#D47A73]' : ''}`} />
              Liked
            </button>

            <button
              onClick={() => { setActiveTab('watch_later'); setIsDrawerOpen(false); }}
              className={`flex items-center gap-3 px-4 py-3 font-semibold text-[13px] tracking-wide transition-colors rounded-lg w-full text-left ${
                activeTab === 'watch_later' 
                  ? 'bg-white/10 text-white' 
                  : 'text-[#888888] hover:text-[#EAE8E3] hover:bg-white/5'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${activeTab === 'watch_later' ? 'text-[#D47A73]' : ''}`} />
              Watch Later
            </button>

            <div className="my-3 border-t border-white/5"></div>

            <h3 className="text-[#888888] text-[11px] font-bold tracking-[0.15em] uppercase px-4 mb-3 mt-1">User Settings</h3>
            
            <button
              onClick={() => { setActiveTab('my_account'); setIsDrawerOpen(false); }}
              className={`flex items-center gap-3 px-4 py-3 font-semibold text-[13px] tracking-wide transition-colors rounded-lg w-full text-left ${
                activeTab === 'my_account' 
                  ? 'bg-white/10 text-white' 
                  : 'text-[#888888] hover:text-[#EAE8E3] hover:bg-white/5'
              }`}
            >
              <UserIcon className={`w-4 h-4 ${activeTab === 'my_account' ? 'text-[#D47A73]' : ''}`} />
              My Account
            </button>
            
            <button
              onClick={() => { setActiveTab('appearance'); setIsDrawerOpen(false); }}
              className={`flex items-center gap-3 px-4 py-3 font-semibold text-[13px] tracking-wide transition-colors rounded-lg w-full text-left ${
                activeTab === 'appearance' 
                  ? 'bg-white/10 text-white' 
                  : 'text-[#888888] hover:text-[#EAE8E3] hover:bg-white/5'
              }`}
            >
              <Palette className={`w-4 h-4 ${activeTab === 'appearance' ? 'text-[#D47A73]' : ''}`} />
              Appearance
            </button>

            <button
              onClick={() => { setActiveTab('devices'); setIsDrawerOpen(false); }}
              className={`flex items-center gap-3 px-4 py-3 font-semibold text-[13px] tracking-wide transition-colors rounded-lg w-full text-left ${
                activeTab === 'devices' 
                  ? 'bg-white/10 text-white' 
                  : 'text-[#888888] hover:text-[#EAE8E3] hover:bg-white/5'
              }`}
            >
              <MonitorSmartphone className={`w-4 h-4 ${activeTab === 'devices' ? 'text-[#D47A73]' : ''}`} />
              Devices & Sessions
            </button>
          </div>

          <div className="border-t border-white/5 mt-4 pt-6">
            <form action={logout}>
              <button 
                type="submit"
                className="flex items-center gap-3 px-4 py-3 w-full text-left font-semibold text-[13px] tracking-wide text-[#D47A73] hover:bg-[#D47A73]/10 transition-colors rounded-lg"
              >
                <LogOut className="w-4 h-4" />
                Log Out
              </button>
            </form>
          </div>

        </div>
      </div>

      {/* 
        ========================================================
        RIGHT MAIN CONTENT
        ======================================================== 
      */}
      <div className="flex-1 h-auto md:h-full bg-[#050505] overflow-visible md:overflow-y-auto custom-scrollbar relative flex justify-center lg:justify-start">
        <div className="w-full max-w-[1300px] p-6 pt-10 md:p-16 lg:pl-24 pb-32">

          {/* Liked Tab */}
          {activeTab === 'liked' && (
            <div className="animate-in fade-in duration-300">
              <h2 className="text-white text-2xl font-bold tracking-wide mb-8">Liked</h2>
              {favorites.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                  {favorites.map((item) => (
                    <MediaCard key={item.id} item={mapToMediaItem(item)} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-32 text-[#888888] w-full text-center bg-[#0a0a0a] rounded-2xl border border-white/5 shadow-lg">
                  <Heart className="w-12 h-12 mb-6 opacity-20" />
                  <p className="text-[15px] font-bold tracking-widest uppercase text-white/70">No titles liked</p>
                  <p className="text-[14px] mt-2 max-w-[250px] mx-auto text-balance">Tap the heart icon on any title to save it here.</p>
                </div>
              )}
            </div>
          )}

          {/* Watch Later Tab */}
          {activeTab === 'watch_later' && (
            <div className="animate-in fade-in duration-300">
              <h2 className="text-white text-2xl font-bold tracking-wide mb-8">Watch Later</h2>
              {watchLater.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                  {watchLater.map((item) => (
                    <MediaCard key={item.id} item={mapToMediaItem(item)} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-32 text-[#888888] w-full text-center bg-[#0a0a0a] rounded-2xl border border-white/5 shadow-lg">
                  <Bookmark className="w-12 h-12 mb-6 opacity-20" />
                  <p className="text-[15px] font-bold tracking-widest uppercase text-white/70">No titles saved</p>
                  <p className="text-[14px] mt-2 max-w-[250px] mx-auto text-balance">Add movies and shows to watch them later.</p>
                </div>
              )}
            </div>
          )}

          {/* My Account Tab */}
          {activeTab === 'my_account' && (
            <div className="animate-in fade-in duration-300">
              <h2 className="text-white text-2xl font-bold tracking-wide mb-8">My Account</h2>
              
              <div className="flex flex-col xl:flex-row gap-8 xl:gap-12 w-full">
                
                {/* Left Column (Profile & Password) */}
                <div className="flex-1 flex flex-col gap-10 max-w-3xl">
                  {/* Account Info */}
                  <div className="w-full bg-[#0a0a0a] border border-white/5 p-8 rounded-2xl shadow-lg">
                    <h3 className="text-[#888888] text-[12px] font-bold tracking-[0.1em] uppercase mb-6">Profile Details</h3>
                    
                    <div className="flex flex-col gap-6">
                      <div>
                        <label className="block text-[#EAE8E3] text-[13px] font-semibold mb-2">Username</label>
                        <input 
                          type="text" 
                          defaultValue={user.username || user.name}
                          disabled
                          className="w-full bg-[#151515] border border-white/5 rounded-lg px-4 py-3.5 text-[#EAE8E3] focus:outline-none opacity-50 cursor-not-allowed font-medium text-[15px]"
                        />
                        <p className="text-[12px] text-[#888888] mt-2">Your unique username on DAOBAN.</p>
                      </div>

                      <div>
                        <label className="block text-[#EAE8E3] text-[13px] font-semibold mb-2">Email</label>
                        <input 
                          type="email" 
                          defaultValue={user.email}
                          disabled
                          className="w-full bg-[#151515] border border-white/5 rounded-lg px-4 py-3.5 text-[#EAE8E3] focus:outline-none opacity-50 cursor-not-allowed font-medium text-[15px]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Password & Authentication */}
                  <div className="w-full bg-[#0a0a0a] border border-white/5 p-8 rounded-2xl shadow-lg">
                    <h3 className="text-[#888888] text-[12px] font-bold tracking-[0.1em] uppercase mb-2">Password & Authentication</h3>
                    <p className="text-[#888888] text-[14px] mb-6">Manage your security settings and password.</p>
                    
                    <div className="flex items-center justify-between p-5 bg-[#151515] rounded-xl border border-white/5">
                      <div className="flex items-center gap-4">
                        <KeyRound className="w-5 h-5 text-[#EAE8E3] shrink-0" />
                        <div className="flex flex-col">
                          <p className="text-white text-[15px] font-semibold">Change Password</p>
                          <p className="text-[#888888] text-[12px]">Update your account password</p>
                        </div>
                      </div>
                      <button className="px-5 py-2.5 bg-[#D47A73] hover:bg-[#DE867E] text-white rounded-lg font-semibold text-[13px] transition-colors shadow-lg active:scale-95 shrink-0">
                        Update
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Column (Connected Accounts) */}
                <div className="w-full xl:w-[420px] shrink-0">
                  <div className="w-full bg-[#0a0a0a] border border-white/5 p-8 rounded-2xl shadow-lg">
                    <h3 className="text-[#888888] text-[12px] font-bold tracking-[0.1em] uppercase mb-2">Connected Accounts</h3>
                    <p className="text-[#888888] text-[14px] mb-6">Link your social accounts for faster login.</p>
                    
                    <div className="flex flex-col gap-4">
                      {/* Google */}
                      <div className="flex items-center justify-between p-5 bg-[#151515] rounded-xl border border-white/5">
                        <div className="flex items-center gap-4">
                          <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          <div>
                            <p className="text-white text-[15px] font-semibold">Google</p>
                          </div>
                        </div>
                        {connectedAccounts.some(acc => acc.providerId === 'google') ? (
                          <button
                            onClick={async () => {
                              await authClient.unlinkAccount({ providerId: 'google' } as any);
                              router.refresh();
                            }}
                            className="px-5 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-lg font-semibold text-[13px] transition-colors shrink-0"
                          >
                            Disconnect
                          </button>
                        ) : (
                          <button
                            onClick={() => authClient.linkSocial({ provider: 'google', callbackURL: '/me' })}
                            className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold text-[13px] transition-colors shrink-0"
                          >
                            Connect
                          </button>
                        )}
                      </div>

                      {/* Discord */}
                      <div className="flex items-center justify-between p-5 bg-[#151515] rounded-xl border border-white/5">
                        <div className="flex items-center gap-4">
                          <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24" fill="#5865F2">
                            <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z"/>
                          </svg>
                          <div>
                            <p className="text-white text-[15px] font-semibold">Discord</p>
                          </div>
                        </div>
                        {connectedAccounts.some(acc => acc.providerId === 'discord') ? (
                          <button
                            onClick={async () => {
                              await authClient.unlinkAccount({ providerId: 'discord' } as any);
                              router.refresh();
                            }}
                            className="px-5 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-lg font-semibold text-[13px] transition-colors shrink-0"
                          >
                            Disconnect
                          </button>
                        ) : (
                          <button
                            onClick={() => authClient.linkSocial({ provider: 'discord', callbackURL: '/me' })}
                            className="px-5 py-2.5 bg-[#5865F2]/10 hover:bg-[#5865F2]/20 text-[#5865F2] border border-[#5865F2]/20 rounded-lg font-semibold text-[13px] transition-colors shrink-0"
                          >
                            Connect
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Appearance Tab Placeholder */}
          {activeTab === 'appearance' && (
            <div className="animate-in fade-in duration-300 flex flex-col gap-8 max-w-2xl">
              <h2 className="text-white text-2xl font-bold tracking-wide">Appearance</h2>
              <div className="w-full bg-[#0a0a0a] border border-white/5 p-16 rounded-2xl shadow-lg flex flex-col items-center justify-center text-center">
                <Palette className="w-12 h-12 text-[#888888]/20 mb-6" />
                <h3 className="text-xl font-bold text-white mb-2">Coming Soon</h3>
                <p className="text-[#888888] text-[14px] max-w-[300px]">Theme selection and interface customization options will be available here soon.</p>
              </div>
            </div>
          )}

          {/* Devices Tab */}
          {activeTab === 'devices' && (
            <div className="animate-in fade-in duration-300 flex flex-col gap-8 max-w-3xl">
              
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-6">
                <div>
                  <h2 className="text-white text-2xl font-bold tracking-wide mb-2">Devices & Sessions</h2>
                  <p className="text-[#888888] text-[14px]">Manage where you are logged in across all your devices.</p>
                </div>
                
                <button
                  onClick={handleRevokeOtherSessions}
                  disabled={isRevoking === 'all_others' || (sessionData?.sessions?.length || 0) <= 1}
                  className="px-6 py-3 bg-[#D47A73]/10 hover:bg-[#D47A73]/20 text-[#D47A73] border border-[#D47A73]/20 rounded-lg font-semibold text-[13px] transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                >
                  {isRevoking === 'all_others' ? 'Logging out...' : 'Log out of all other devices'}
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {sessionData?.sessions?.map((s) => {
                  const isCurrent = s.id === sessionData.currentSessionId;
                  const userAgent = s.userAgent || 'Unknown Device';
                  
                  return (
                    <div key={s.id} className={`flex items-center justify-between p-5 rounded-2xl border ${isCurrent ? 'bg-[#151515] border-[#D47A73]/20 shadow-lg' : 'bg-[#0a0a0a] border-white/5'}`}>
                      <div className="flex items-center gap-5">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isCurrent ? 'bg-[#D47A73]/10 text-[#D47A73]' : 'bg-white/5 text-[#888888]'}`}>
                          <MonitorSmartphone className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-3">
                            <p className="text-white text-[15px] font-semibold truncate max-w-[200px] sm:max-w-sm">{userAgent.split(' ')[0]}</p>
                            {isCurrent && (
                              <span className="px-2 py-0.5 bg-[#D47A73]/20 text-[#D47A73] text-[10px] font-bold uppercase tracking-wider rounded">Current</span>
                            )}
                          </div>
                          <p className="text-[#888888] text-[13px]">{s.ipAddress || 'Unknown IP'} • {new Date(s.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRevokeSession(s.id)}
                        disabled={isRevoking === s.id || isCurrent}
                        className={`p-3 rounded-full transition-colors ${
                          isCurrent 
                            ? 'bg-transparent text-white/5 cursor-not-allowed' 
                            : 'bg-white/5 hover:bg-rose-500/10 text-[#888888] hover:text-rose-500 disabled:opacity-50'
                        }`}
                        title={isCurrent ? "Cannot log out current session here" : "Log out device"}
                      >
                        <MonitorX className="w-5 h-5" />
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="bg-[#0a0a0a] border border-rose-500/20 p-6 rounded-2xl flex items-start gap-4 mt-2">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <p className="text-[#888888] text-[14px] leading-relaxed">
                  If you see a device you don't recognize, you can log it out by clicking the X icon next to the session. If you believe your account has been compromised, log out of all other devices immediately and change your password.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Global ESC Button (Hidden on Mobile, swiping/tapping 'Back' is standard) */}
        <div className="hidden md:flex absolute top-8 right-8 z-50 flex-col items-center gap-1.5">
          <button 
            onClick={() => router.push('/')} 
            className="w-10 h-10 rounded-full border-2 border-white/20 flex items-center justify-center text-[#888888] hover:bg-white/10 hover:text-white hover:border-white/50 transition-all group"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform">
              <path d="M18 6 6 18"/>
              <path d="m6 6 12 12"/>
            </svg>
          </button>
          <span className="text-[10px] font-bold text-[#888888] tracking-widest uppercase">ESC</span>
        </div>
      </div>
    </div>
  );
}
