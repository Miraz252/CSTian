
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, AppView } from './types';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import NoticeList from './components/NoticeList';
import GroupChat from './components/GroupChat';
import Results from './components/Results';
import Profile from './components/Profile';
import Navbar from './components/Navbar';
import { supabase } from './supabaseClient';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<AppView>('dashboard');
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [lastNotification, setLastNotification] = useState<{name: string, text: string, image?: string} | null>(null);
  
  const isFetchingRef = useRef(false);

  useEffect(() => {
    if (view === 'chat') {
      setUnreadCount(0);
    }
  }, [view]);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error("Signout error", e);
    }
    setUser(null);
    setView('dashboard');
    setAuthError(null);
    setIsLoading(false);
    setLoadingTimeout(false);
  };

  const createMissingProfile = async (userId: string) => {
    try {
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
      if (userError || !authUser) throw new Error("Session expired.");

      const metadata = authUser.user_metadata;
      const newProfile = {
        id: userId,
        roll_number: metadata.roll_number || '825xxx',
        name: metadata.name || 'New Student',
        gpa_history: [0, 0, 0],
        social_links: { facebook: "", messenger: "", linkedin: "" },
        role: 'student'
      };

      const { data, error } = await supabase
        .from('profiles')
        .upsert(newProfile, { onConflict: 'id' })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err: any) {
      console.error("Manual profile creation failed:", err);
      return null;
    }
  };

  const fetchProfile = useCallback(async (userId: string, retryCount = 0) => {
    if (isFetchingRef.current && retryCount === 0) return;
    isFetchingRef.current = true;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      let profileData = data;

      if (!profileData) {
        if (retryCount < 2) {
          setTimeout(() => {
            isFetchingRef.current = false;
            fetchProfile(userId, retryCount + 1);
          }, 1000);
          return;
        } else {
          profileData = await createMissingProfile(userId);
        }
      }

      if (profileData) {
        setUser({
          id: profileData.id,
          rollNumber: profileData.roll_number || 'TBD',
          name: profileData.name || 'Student',
          bio: profileData.bio,
          profileImage: profileData.profile_image,
          gpaHistory: profileData.gpa_history || [0, 0, 0],
          socialLinks: profileData.social_links || {},
          role: (profileData.role as 'student' | 'admin') || 'student'
        });
        setAuthError(null);
      } else {
        throw new Error("প্রোফাইল খুঁজে পাওয়া যায়নি।");
      }
    } catch (err: any) {
      console.error('Profile Load Error:', err);
      setAuthError("সার্ভার কানেকশনে সমস্যা হচ্ছে। দয়া করে রিফ্রেশ করুন।");
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutTimer = setTimeout(() => {
      if (isLoading) {
        setLoadingTimeout(true);
      }
    }, 6000); // 6 seconds timeout for visibility

    const initApp = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setIsLoading(false);
        }
      } catch (e) {
        console.error("Init error", e);
        setIsLoading(false);
      }
    };
    initApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        if (event === 'SIGNED_IN') {
          setIsLoading(true);
          await fetchProfile(session.user.id);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsLoading(false);
        setLoadingTimeout(false);
      }
    });

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeoutTimer);
    };
  }, [fetchProfile]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('global_notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        if (payload.new.sender_id !== user.rollNumber) {
          if (view !== 'chat') {
            setUnreadCount(prev => prev + 1);
            
            const senderImage = payload.new.sender_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(payload.new.sender_name)}&background=random`;

            setLastNotification({
              name: payload.new.sender_name,
              text: payload.new.text,
              image: senderImage
            });
            setTimeout(() => setLastNotification(null), 5000);

            if (document.hidden && Notification.permission === "granted") {
              new Notification(`${payload.new.sender_name} sent a message`, {
                body: payload.new.text,
                icon: senderImage
              });
            }
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, view]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-blue-600 p-6">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
          <div className="space-y-2">
            <h2 className="text-white font-black text-lg tracking-widest uppercase">Securing Access</h2>
            <p className="text-blue-200 text-xs font-medium animate-pulse italic">Synchronizing Student Data...</p>
          </div>
          
          {loadingTimeout && (
            <div className="pt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <p className="text-white/60 text-[10px] mb-4 font-bold uppercase tracking-widest">Slow Connection Detected</p>
              <div className="flex flex-col space-y-3">
                <button 
                  onClick={() => window.location.reload()} 
                  className="bg-white text-blue-600 px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl transition-all active:scale-95"
                >
                  Refresh Page
                </button>
                <button 
                  onClick={handleLogout} 
                  className="bg-red-500/20 text-white/80 px-8 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all"
                >
                  Emergency Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="relative min-h-screen">
        {authError && (
          <div className="fixed top-4 left-4 right-4 z-[100] bg-red-600 text-white p-4 rounded-2xl shadow-2xl text-xs font-bold flex justify-between items-center">
            <span>{authError}</span>
            <button onClick={() => setAuthError(null)} className="ml-2 bg-white/20 px-2 py-1 rounded-lg">Dismiss</button>
          </div>
        )}
        <Login onLogin={(id) => fetchProfile(id)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 md:pb-0 md:pt-16 bg-gray-50 flex flex-col">
      {lastNotification && (
        <div 
          onClick={() => setView('chat')}
          className="fixed top-4 left-4 right-4 z-[100] bg-white border-l-4 border-blue-600 shadow-2xl rounded-2xl p-4 flex items-center space-x-3 cursor-pointer animate-in slide-in-from-top duration-300 md:max-w-md md:left-auto md:right-4 active:scale-95 transition-transform"
        >
          <img 
            src={lastNotification.image} 
            className="w-12 h-12 rounded-full object-cover border-2 border-blue-50" 
            alt="sender" 
            onError={(e) => (e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(lastNotification.name || 'User')}&background=random`)}
          />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">New Message</p>
            <p className="text-sm font-bold text-gray-900 truncate">{lastNotification.name}</p>
            <p className="text-xs text-gray-500 truncate">{lastNotification.text}</p>
          </div>
        </div>
      )}

      <header className="hidden md:flex fixed top-0 w-full z-50 bg-white border-b border-gray-100 px-6 py-3 items-center justify-between shadow-sm">
        <h1 className="text-xl font-black text-blue-600 tracking-tighter italic uppercase">Batch 23-24 Portal</h1>
        <div className="flex items-center space-x-3">
           <img 
            src={user.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`} 
            className="w-8 h-8 rounded-full border border-gray-100 object-cover" 
            alt="User" 
           />
           <span className="font-bold text-sm text-gray-700">{user.name}</span>
        </div>
      </header>

      <main className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {view === 'dashboard' && <Dashboard user={user} onNavigate={setView} unreadChatCount={unreadCount} />}
          {view === 'notices' && <NoticeList />}
          {view === 'chat' && <GroupChat currentUser={user} />}
          {view === 'results' && <Results user={user} />}
          {view === 'profile' && <Profile user={user} onUpdate={setUser} onLogout={handleLogout} />}
        </div>
      </main>

      <Navbar activeView={view} setView={setView} unreadCount={unreadCount} />
    </div>
  );
};

export default App;
