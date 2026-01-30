
import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import { supabase } from '../supabaseClient';

interface ProfileProps {
  user: User;
  onUpdate: (user: User) => void;
  onLogout: () => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onUpdate, onLogout }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showCaptainAuth, setShowCaptainAuth] = useState(false);
  const [captainPass, setCaptainPass] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState<number>(0);
  const [isCaptain, setIsCaptain] = useState(false);
  const [members, setMembers] = useState<User[]>([]);
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: user.name,
    bio: user.bio || '',
    facebook: user.socialLinks?.facebook || '',
    messenger: user.socialLinks?.messenger || '',
    linkedin: user.socialLinks?.linkedin || '',
    gpa1: user.gpaHistory[0] || 0,
    gpa2: user.gpaHistory[1] || 0,
    gpa3: user.gpaHistory[2] || 0,
  });

  useEffect(() => {
    fetchMembers();
    const savedLock = localStorage.getItem('captain_lockout');
    if (savedLock) {
      const timeLeft = parseInt(savedLock) - Date.now();
      if (timeLeft > 0) setLockoutTime(Math.ceil(timeLeft / 1000));
    }
  }, []);

  const fetchMembers = async () => {
    const { data, error } = await supabase.from('profiles').select('*').order('name', { ascending: true });
    if (error) console.error("Error fetching members:", error);
    if (data) {
      setMembers(data.map(p => ({
        id: p.id,
        rollNumber: p.roll_number,
        name: p.name,
        bio: p.bio,
        profileImage: p.profile_image,
        gpaHistory: p.gpa_history || [0, 0, 0],
        socialLinks: p.social_links || {},
        role: p.role as 'student' | 'admin'
      })));
    }
  };

  const handleDevClick = () => {
    const dev = members.find(m => m.rollNumber === '825807');
    if (dev) {
      setSelectedMember(dev);
    } else {
      // Fallback if not loaded yet or not found
      alert("Miraz Ahmmed's profile is still loading...");
    }
  };

  useEffect(() => {
    if (lockoutTime > 0) {
      const timer = setInterval(() => {
        setLockoutTime(prev => {
          if (prev <= 1) {
            localStorage.removeItem('captain_lockout');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [lockoutTime]);

  const handleCaptainAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutTime > 0) return;
    
    if (captainPass === 'captain007') {
      setIsCaptain(true);
      setShowCaptainAuth(false);
      setAttempts(0);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= 3) {
        const lockUntil = Date.now() + 5 * 60 * 1000;
        localStorage.setItem('captain_lockout', lockUntil.toString());
        setLockoutTime(300);
      }
      setCaptainPass('');
    }
  };

  const handleGPAChange = (key: string, val: string) => {
    let num = parseFloat(val);
    if (isNaN(num)) num = 0;
    if (num > 4) num = 4.0;
    if (num < 0) num = 0;
    setFormData({ ...formData, [key]: num });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      const finalUrl = `${publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_image: finalUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      onUpdate({ ...user, profileImage: finalUrl });
      alert("Profile picture updated!");
      fetchMembers();
    } catch (err) {
      console.error(err);
      alert("Upload failed. Make sure 'profiles' storage bucket is public.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const gpaHistory = [formData.gpa1, formData.gpa2, formData.gpa3];
    const social_links = { facebook: formData.facebook, messenger: formData.messenger, linkedin: formData.linkedin };
    
    try {
      const { error } = await supabase.from('profiles').update({
        name: formData.name,
        bio: formData.bio,
        social_links: social_links,
        gpa_history: gpaHistory,
        updated_at: new Date()
      }).eq('id', user.id);

      if (error) throw error;

      onUpdate({ ...user, name: formData.name, bio: formData.bio, socialLinks: social_links, gpaHistory: gpaHistory });
      setIsEditing(false);
      alert("Profile updated!");
      fetchMembers();
    } catch (err) {
      console.error(err);
      alert("Update failed.");
    } finally {
      setIsSaving(false);
    }
  };

  const [newNotice, setNewNotice] = useState({ title: '', content: '', imageUrl: '' });
  const [isPosting, setIsPosting] = useState(false);

  const postNotice = async () => {
    if (!newNotice.title || !newNotice.content) return;
    setIsPosting(true);
    const { error } = await supabase.from('notices').insert([{
      title: newNotice.title,
      content: newNotice.content,
      image_url: newNotice.imageUrl,
      author: user.name
    }]);
    if (!error) {
      setNewNotice({ title: '', content: '', imageUrl: '' });
      alert("Notice Published!");
    }
    setIsPosting(false);
  };

  return (
    <div className="space-y-6 pb-20 max-w-lg mx-auto px-1">
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-24 bg-blue-600"></div>
        
        <div className="relative flex flex-col items-center mt-4">
          <div className="relative group cursor-pointer" onClick={() => !isEditing && fileInputRef.current?.click()}>
            <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-gray-50 flex items-center justify-center relative">
              <img 
                src={user.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`} 
                className="w-full h-full object-cover" 
                alt="Profile" 
              />
              {isUploading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full">
                  <div className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full" />
                </div>
              )}
            </div>
          </div>
          <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />

          <div className="mt-4 text-center">
            <h2 className="text-2xl font-black text-gray-900">{user.name}</h2>
            <p className="text-blue-600 font-bold text-xs uppercase tracking-widest mt-1">Roll: {user.rollNumber}</p>
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[11px] font-black uppercase text-gray-400 tracking-widest">Academic Records</h3>
            {!isEditing && <button onClick={() => setIsEditing(true)} className="text-blue-600 text-[10px] font-black uppercase border-b-2 border-blue-100">Modify</button>}
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex flex-col items-center shadow-sm">
                <span className="text-[9px] font-black text-gray-400 uppercase mb-2">Semester {i}</span>
                {isEditing ? (
                  <input 
                    type="number" step="0.01" max="4" min="0"
                    className="w-full bg-white border-2 border-blue-200 rounded-xl text-center font-bold text-blue-600 py-1 text-sm outline-none focus:border-blue-500"
                    value={(formData as any)[`gpa${i}`]}
                    onChange={(e) => handleGPAChange(`gpa${i}`, e.target.value)}
                  />
                ) : (
                  <span className="text-xl font-black text-gray-800 tracking-tighter">{(user.gpaHistory[i-1] || 0).toFixed(2)}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {isEditing && (
          <div className="mt-6 space-y-4 animate-in fade-in duration-300">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-gray-400 uppercase ml-2">Name</label>
              <input className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-4 py-3 font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-gray-400 uppercase ml-2">Bio</label>
              <textarea className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm font-medium" rows={2} value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} />
            </div>
            <div className="flex space-x-2">
              <button onClick={() => setIsEditing(false)} className="flex-1 py-4 text-gray-400 font-bold text-xs uppercase">Cancel</button>
              <button onClick={handleSave} disabled={isSaving} className="flex-[2] py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all">
                {isSaving ? "SAVING..." : "SAVE CHANGES"}
              </button>
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-col space-y-6">
          {!isCaptain ? (
            <button onClick={() => setShowCaptainAuth(true)} className="flex items-center justify-center space-x-3 py-4 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
              <span>Captain Portal</span>
            </button>
          ) : (
            <div className="bg-blue-600 rounded-[2rem] p-6 text-white space-y-5 animate-in slide-in-from-bottom duration-500 shadow-xl">
              <div className="flex justify-between items-center">
                <h3 className="font-black text-lg italic tracking-tighter uppercase">Captain Control</h3>
                <button onClick={() => setIsCaptain(false)} className="text-[10px] bg-white/20 px-2 py-1 rounded-lg font-bold">EXIT</button>
              </div>
              <div className="space-y-3">
                <input className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm outline-none placeholder:text-white/40" placeholder="Notice Title" value={newNotice.title} onChange={e => setNewNotice({...newNotice, title: e.target.value})} />
                <textarea className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm outline-none placeholder:text-white/40" rows={2} placeholder="Description..." value={newNotice.content} onChange={e => setNewNotice({...newNotice, content: e.target.value})} />
                <button onClick={postNotice} disabled={isPosting} className="w-full bg-white text-blue-600 py-3 rounded-xl font-black uppercase text-xs active:scale-95 transition-all shadow-lg">
                  {isPosting ? "POSTING..." : "PUBLISH NOTICE"}
                </button>
              </div>
            </div>
          )}

          <div className="pt-6 border-t border-gray-100">
            <h3 className="text-[11px] font-black uppercase text-gray-400 tracking-widest mb-4">Batch 23-24 Members</h3>
            <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto pr-1 hide-scrollbar">
              {members.map(member => (
                <div 
                  key={member.id} 
                  onClick={() => setSelectedMember(member)}
                  className="flex items-center space-x-4 p-3.5 bg-gray-50 rounded-[1.5rem] border border-gray-100 active:scale-[0.98] transition-all cursor-pointer hover:bg-white hover:shadow-md group"
                >
                  <div className="relative">
                    <img 
                      src={member.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random`} 
                      className="w-12 h-12 rounded-full border-2 border-white shadow-sm object-cover" 
                      alt={member.name} 
                    />
                    <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-gray-900 truncate group-hover:text-blue-600 transition-colors">{member.name}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Roll: {member.rollNumber}</p>
                  </div>
                  <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <button onClick={onLogout} className="w-full py-4 text-red-500 font-black text-[10px] uppercase tracking-[0.2em] opacity-30 hover:opacity-100 transition-all mb-2">Logout Securely</button>
          
          <div className="text-center pt-2 border-t border-gray-50">
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
              developed by <span onClick={handleDevClick} className="text-blue-400 cursor-pointer hover:underline">Miraz Ahmmed</span>
            </p>
          </div>
        </div>
      </div>

      {selectedMember && (
        <div className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-24 bg-blue-600"></div>
            <button 
              onClick={() => setSelectedMember(null)} 
              className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 p-2 rounded-full text-white transition-all active:scale-90"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>

            <div className="relative mt-4">
              <img 
                src={selectedMember.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedMember.name)}&background=random`} 
                className="w-28 h-28 rounded-full border-4 border-white shadow-2xl mx-auto object-cover" 
                alt="Member" 
              />
            </div>
            
            <h4 className="mt-6 text-2xl font-black text-gray-900 tracking-tighter">{selectedMember.name}</h4>
            <div className="flex items-center justify-center space-x-2 mt-1">
              <span className="bg-blue-100 text-blue-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Roll: {selectedMember.rollNumber}</span>
            </div>

            <div className="mt-8 bg-gray-50 rounded-3xl p-6 text-sm text-gray-600 italic border border-gray-100 shadow-inner">
              "{selectedMember.bio || 'Member of Batch 23-24'}"
            </div>

            <div className="mt-8">
              <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Academic Results</h5>
              <div className="grid grid-cols-3 gap-3">
                {selectedMember.gpaHistory.map((gpa, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-2xl py-4 border border-gray-100 shadow-sm">
                    <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Sem {idx+1}</p>
                    <p className="text-lg font-black text-gray-800 tracking-tighter">{(gpa || 0).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={() => setSelectedMember(null)}
              className="mt-10 w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all"
            >
              Close Profile
            </button>
          </div>
        </div>
      )}

      {showCaptainAuth && (
        <div className="fixed inset-0 z-[120] bg-black/98 backdrop-blur-2xl flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-xs rounded-[3rem] p-10 space-y-8 text-center shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
            </div>
            <h4 className="text-xl font-black uppercase tracking-tighter">Captain Portal Access</h4>
            {lockoutTime > 0 ? (
              <div className="space-y-4">
                <div className="text-red-500 font-black text-5xl tabular-nums">{Math.floor(lockoutTime / 60)}:{(lockoutTime % 60).toString().padStart(2, '0')}</div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest animate-pulse">Security Lock Active</p>
                <button onClick={() => setShowCaptainAuth(false)} className="text-blue-600 font-black text-xs uppercase tracking-widest mt-4">Close</button>
              </div>
            ) : (
              <form onSubmit={handleCaptainAuth} className="space-y-6">
                <input 
                  type="password" autoFocus 
                  className="w-full text-center text-3xl font-black bg-gray-50 border-2 border-gray-100 rounded-3xl py-5 outline-none focus:border-blue-600 transition-all tracking-[0.3em] placeholder:tracking-normal placeholder:text-gray-300" 
                  placeholder="Password" 
                  value={captainPass} onChange={e => setCaptainPass(e.target.value)} 
                />
                <div className="flex flex-col space-y-4">
                  <button type="submit" className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-100 active:scale-95 transition-all uppercase text-xs tracking-widest">Authorize Access</button>
                  <button type="button" onClick={() => setShowCaptainAuth(false)} className="text-gray-400 font-bold text-xs uppercase tracking-widest">Cancel</button>
                </div>
                {attempts > 0 && <p className="text-[10px] text-red-500 font-black uppercase tracking-tighter">Invalid Attempt {attempts} of 3</p>}
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
