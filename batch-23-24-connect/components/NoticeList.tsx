
import React, { useEffect, useState } from 'react';
import { Notice } from '../types';
import { supabase } from '../supabaseClient';

const NoticeList: React.FC = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotices = async () => {
    const { data, error } = await supabase
      .from('notices')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notices:', error);
    } else {
      setNotices(data.map(n => ({
        id: n.id,
        title: n.title,
        content: n.content,
        imageUrl: n.image_url,
        author: n.author,
        date: n.created_at
      })));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotices();
    const channel = supabase
      .channel('notices_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notices' }, () => {
        fetchNotices();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-gray-400">Loading notices...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Class Notices</h2>
        <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">Batch 23-24</span>
      </div>
      
      {notices.length === 0 ? (
        <div className="bg-white p-10 rounded-xl text-center border-2 border-dashed border-gray-200">
          <p className="text-gray-400">No notices posted yet.</p>
        </div>
      ) : notices.map(notice => (
        <div key={notice.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
          {notice.imageUrl && (
            <img src={notice.imageUrl} className="w-full h-48 object-cover border-b border-gray-100" alt="notice" />
          )}
          <div className="p-5">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-lg text-gray-800">{notice.title}</h3>
              <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-1 rounded border border-gray-100 font-bold">
                {new Date(notice.date).toLocaleDateString()}
              </span>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed mb-4 whitespace-pre-wrap">
              {notice.content}
            </p>
            <div className="flex items-center text-xs font-medium text-gray-500 border-t pt-3 border-gray-50">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-2 text-blue-600 font-bold uppercase">
                {notice.author.charAt(0)}
              </div>
              <span>Posted by <span className="text-gray-900">{notice.author}</span></span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NoticeList;
