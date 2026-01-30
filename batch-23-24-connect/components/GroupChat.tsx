
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { User, Message } from '../types';
import { supabase } from '../supabaseClient';

interface GroupChatProps {
  currentUser: User;
}

interface MessageWithStatus extends Message {
  status: 'sending' | 'delivered' | 'failed';
  senderImage?: string;
}

interface PresenceState {
  userId: string;
  name: string;
  image: string;
  lastReadAt: string;
}

const GroupChat: React.FC<GroupChatProps> = ({ currentUser }) => {
  const [messages, setMessages] = useState<MessageWithStatus[]>([]);
  const [inputText, setInputText] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<PresenceState[]>([]);
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const updateReadStatus = async () => {
    try {
      const now = new Date().toISOString();
      await supabase.from('profiles').update({ last_read_at: now }).eq('id', currentUser.id);
    } catch (e) {
      console.error("Presence Error", e);
    }
  };

  useEffect(() => {
    updateReadStatus();
    const interval = setInterval(updateReadStatus, 15000); 
    return () => clearInterval(interval);
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;
      
      if (data) {
        setMessages(data.map(m => ({
          id: m.id,
          senderId: m.sender_id,
          senderName: m.sender_name,
          senderImage: m.sender_image,
          text: m.text,
          timestamp: new Date(m.created_at),
          status: 'delivered'
        })));
      }
    } catch (err) {
      console.error("Load Error", err);
    }
  }, []);

  const fetchOnlineUsers = async () => {
    try {
      const { data } = await supabase.from('profiles').select('id, name, profile_image, last_read_at');
      if (data) {
        setOnlineUsers(data.map(p => ({
          userId: p.id,
          name: p.name,
          image: p.profile_image,
          lastReadAt: p.last_read_at
        })));
      }
    } catch (e) {
      console.error("Profile Fetch Error", e);
    }
  };

  useEffect(() => {
    fetchMessages();
    fetchOnlineUsers();
    
    const channel = supabase.channel('chat_v4')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMessage: MessageWithStatus = {
          id: payload.new.id,
          senderId: payload.new.sender_id,
          senderName: payload.new.sender_name,
          senderImage: payload.new.sender_image,
          text: payload.new.text,
          timestamp: new Date(payload.new.created_at),
          status: 'delivered'
        };
        setMessages(prev => {
          if (prev.some(m => m.id === newMessage.id)) return prev;
          return [...prev, newMessage];
        });
        updateReadStatus();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, () => {
        fetchOnlineUsers();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchMessages]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;
    
    const text = inputText;
    setInputText('');
    setIsSending(true);

    try {
      const { error } = await supabase.from('messages').insert([{
        sender_id: currentUser.rollNumber,
        sender_name: currentUser.name,
        sender_image: currentUser.profileImage || null,
        text: text
      }]);

      if (error) throw error;
      await updateReadStatus();
    } catch (err) {
      console.error("Message Send Error:", err);
      setInputText(text);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-200px)] bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
      <div className="bg-blue-600 p-4 flex items-center justify-between text-white shadow-lg z-10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center font-black italic shadow-inner">23</div>
          <div>
            <h2 className="font-black text-sm uppercase tracking-tighter">BATCH COMMUNITY</h2>
            <p className="text-[9px] font-bold opacity-70 uppercase tracking-widest">{onlineUsers.length} Students Online</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f4f7f9] hide-scrollbar">
        {messages.map((msg, idx) => {
          const isMe = msg.senderId === currentUser.rollNumber;
          const showHeader = !isMe && (idx === 0 || messages[idx-1].senderId !== msg.senderId);
          
          // Improved Seen Logic: filter people who read after msg timestamp
          const readers = onlineUsers.filter(u => 
            u.userId !== currentUser.id && 
            u.name !== msg.senderName &&
            new Date(u.lastReadAt).getTime() >= (msg.timestamp.getTime() - 2000)
          );
          
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group mb-1`}>
              {showHeader && (
                <span className="text-[8px] font-black text-gray-400 uppercase ml-11 mb-1 tracking-widest">{msg.senderName}</span>
              )}
              
              <div className={`flex items-end space-x-2 max-w-[90%] ${isMe ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
                {/* Sender Profile Image - Always visible for others */}
                {!isMe && (
                  <img 
                    src={msg.senderImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.senderName)}&background=random`} 
                    className="w-8 h-8 rounded-full border border-white shadow-sm object-cover mb-0.5" 
                    alt="sender"
                  />
                )}
                
                <div className={`px-4 py-2.5 rounded-2xl text-[13px] font-medium shadow-sm transition-all ${
                  isMe 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                }`}>
                  {msg.text}
                </div>
              </div>
              
              {/* Seen Avatars Bubble - Modern style */}
              {isMe && readers.length > 0 && (
                <div className="mt-1 flex -space-x-1.5 overflow-hidden pr-0.5">
                  {readers.slice(0, 4).map(reader => (
                    <img 
                      key={reader.userId}
                      title={reader.name}
                      src={reader.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(reader.name)}&background=random`}
                      className="inline-block h-3.5 w-3.5 rounded-full ring-2 ring-white object-cover"
                      alt={reader.name}
                    />
                  ))}
                  {readers.length > 4 && (
                    <div className="flex items-center justify-center h-3.5 w-3.5 rounded-full ring-2 ring-white bg-gray-200 text-[6px] font-black text-gray-600">
                      +{readers.length - 4}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-gray-100">
        <form onSubmit={handleSend} className="flex items-center space-x-2 bg-gray-50 rounded-[1.5rem] px-2 py-1 focus-within:ring-2 focus-within:ring-blue-100 transition-all border border-gray-100">
          <input 
            type="text" value={inputText} onChange={e => setInputText(e.target.value)} 
            placeholder="Type your message..." 
            className="flex-1 bg-transparent px-4 py-2 text-sm font-semibold outline-none text-gray-800" 
            disabled={isSending}
          />
          <button 
            type="submit" disabled={!inputText.trim() || isSending} 
            className={`p-2 rounded-full transition-all ${isSending ? 'text-gray-300' : 'text-blue-600 active:scale-90 hover:bg-blue-50'}`}
          >
            {isSending ? <div className="w-6 h-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div> : <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default GroupChat;
