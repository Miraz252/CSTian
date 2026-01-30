
import React, { useState, useEffect } from 'react';
import { User, AppView, Notice } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PERFORMANCE_LEVELS } from '../constants';
import { supabase } from '../supabaseClient';

interface DashboardProps {
  user: User;
  onNavigate: (view: AppView) => void;
  unreadChatCount?: number;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onNavigate, unreadChatCount = 0 }) => {
  const [latestNotice, setLatestNotice] = useState<Notice | null>(null);
  const [isLoadingNotice, setIsLoadingNotice] = useState(true);

  useEffect(() => {
    const fetchLatestNotice = async () => {
      try {
        const { data, error } = await supabase
          .from('notices')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setLatestNotice({
            id: data.id,
            title: data.title,
            content: data.content,
            imageUrl: data.image_url,
            author: data.author,
            date: data.created_at
          });
        }
      } catch (err) {
        console.error("Error fetching latest notice:", err);
      } finally {
        setIsLoadingNotice(false);
      }
    };

    fetchLatestNotice();

    const channel = supabase
      .channel('dashboard_notice_sync')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notices' }, (payload) => {
        setLatestNotice({
          id: payload.new.id,
          title: payload.new.title,
          content: payload.new.content,
          imageUrl: payload.new.image_url,
          author: payload.new.author,
          date: payload.new.created_at
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const chartData = user.gpaHistory.map((gpa, index) => ({
    name: `Sem ${index + 1}`,
    gpa: gpa
  }));

  const currentGpa = user.gpaHistory[user.gpaHistory.length - 1] || 0;
  const performanceStatus = PERFORMANCE_LEVELS.find(p => currentGpa >= p.min && currentGpa <= p.max) || PERFORMANCE_LEVELS[0];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-black tracking-tighter italic">WELCOME, {user.name.split(' ')[0]}!</h2>
          <p className="opacity-80 font-bold text-xs uppercase tracking-[0.2em] mt-1">Roll: {user.rollNumber} • Batch 23-24</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-black text-xs uppercase tracking-widest text-gray-400">Academic Progress</h3>
            <span 
              className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-sm" 
              style={{ backgroundColor: performanceStatus.color }}
            >
              {performanceStatus.label}
            </span>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorGpa" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontWeight: 700}} />
                <YAxis domain={[0, 4]} hide />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 'bold'}}
                  itemStyle={{color: '#3b82f6'}}
                />
                <Area 
                  type="monotone" 
                  dataKey="gpa" 
                  stroke="#3B82F6" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorGpa)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex justify-between items-end">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Current GPA</p>
              <p className="text-2xl font-black text-gray-900 tracking-tighter">{currentGpa.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Last Updated</p>
              <p className="text-[11px] font-bold text-gray-600 italic">This Semester</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 flex flex-col">
          <h3 className="font-black text-xs uppercase tracking-widest text-gray-400 mb-6">Latest Class Notice</h3>
          
          {isLoadingNotice ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-2 opacity-30">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-[10px] font-bold uppercase">Syncing...</p>
            </div>
          ) : latestNotice ? (
            <div className="flex-1 bg-blue-50/50 rounded-3xl p-5 border border-blue-100 relative group overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-5">
                <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
              </div>
              <h4 className="font-black text-blue-800 text-lg mb-2 line-clamp-1">{latestNotice.title}</h4>
              <p className="text-sm text-blue-900/70 font-medium line-clamp-3 leading-relaxed">{latestNotice.content}</p>
              <div className="mt-4 pt-4 border-t border-blue-100 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black">{latestNotice.author[0]}</div>
                  <span className="text-[10px] font-black text-blue-800 uppercase tracking-tighter">{latestNotice.author}</span>
                </div>
                <span className="text-[9px] font-bold text-blue-400 uppercase">{new Date(latestNotice.date).toLocaleDateString()}</span>
              </div>
            </div>
          ) : (
            <div className="flex-1 bg-gray-50 rounded-3xl p-5 border border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
              <svg className="w-10 h-10 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 2v4a2 2 0 002 2h4"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h8"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16h8"></path></svg>
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">No Active Notices</p>
            </div>
          )}
          
          <button 
            onClick={() => onNavigate('notices')}
            className="mt-6 w-full py-4 bg-gray-50 text-blue-600 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95"
          >
            All Notices Portal
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8">
        <h3 className="font-black text-xs uppercase tracking-widest text-gray-400 mb-8">Access Points</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <QuickActionIcon 
            label="Live Chat" 
            badge={unreadChatCount > 0 ? unreadChatCount : undefined}
            icon={<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />} 
            onClick={() => onNavigate('chat')} 
            color="bg-purple-600 shadow-purple-100"
          />
          <QuickActionIcon 
            label="Exam Result" 
            icon={<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>} 
            onClick={() => onNavigate('results')} 
            color="bg-orange-600 shadow-orange-100"
          />
          <QuickActionIcon 
            label="Upcoming..." 
            icon={<path d="M18 20V10M12 20V4M6 20v-6" />} 
            onClick={() => alert('Detailed Analytics coming soon!')} 
            color="bg-emerald-600 shadow-emerald-100"
          />
          <QuickActionIcon 
            label="My Profile" 
            icon={<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>} 
            onClick={() => onNavigate('profile')} 
            color="bg-blue-600 shadow-blue-100"
          />
        </div>
      </div>
    </div>
  );
};

const QuickActionIcon: React.FC<{ label: string, icon: React.ReactNode, onClick: () => void, color: string, badge?: number }> = ({ label, icon, onClick, color, badge }) => (
  <button 
    onClick={onClick}
    className="flex flex-col items-center group active:scale-90 transition-transform"
  >
    <div className={`p-4 rounded-[1.5rem] ${color} text-white mb-3 relative shadow-2xl transition-all group-hover:-translate-y-1`}>
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        {icon}
      </svg>
      {badge !== undefined && (
        <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[9px] font-black px-2 py-1 rounded-full border-2 border-white shadow-lg animate-bounce">
          {badge}
        </span>
      )}
    </div>
    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{label}</span>
  </button>
);

export default Dashboard;
