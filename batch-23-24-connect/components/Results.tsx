
import React, { useState, useEffect } from 'react';
import { User } from '../types';

interface ResultsProps {
  user: User;
}

const Results: React.FC<ResultsProps> = ({ user }) => {
  const [roll, setRoll] = useState(user.rollNumber || '');
  const [exam, setExam] = useState('Diploma in Engineering');
  const [regulation, setRegulation] = useState('2022');
  const [isSearching, setIsSearching] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [resultUrl, setResultUrl] = useState('');

  const handleFetchResult = () => {
    if (!roll || roll.length < 6) {
      alert("দয়া করে সঠিক ৬ ডিজিটের রোল নম্বর দিন।");
      return;
    }
    
    setIsSearching(true);
    
    // Official structure for btebresultszone
    const url = `https://btebresultszone.com/results?roll=${roll}&regulation=${regulation}`;
    
    // Simulate a small delay for better UX transition
    setTimeout(() => {
      setResultUrl(url);
      setShowResult(true);
      setIsSearching(false);
    }, 800);
  };

  const handleBackToSearch = () => {
    setShowResult(false);
    setResultUrl('');
  };

  if (showResult) {
    return (
      <div className="fixed inset-0 z-[60] bg-[#f0f4f8] flex flex-col animate-in slide-in-from-right duration-300">
        {/* Portal Header - Orange Style */}
        <div className="bg-[#f05a1a] px-5 py-4 flex items-center justify-between text-white shadow-lg z-10">
          <button 
            onClick={handleBackToSearch}
            className="flex items-center space-x-2 font-bold text-sm bg-white/10 px-3 py-2 rounded-xl active:scale-90 transition-all hover:bg-white/20"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back</span>
          </button>
          <div className="text-right">
            <p className="text-[10px] font-black opacity-80 uppercase tracking-tighter">BTEB Results Zone</p>
            <p className="text-sm font-black italic tracking-tight">Roll: {roll}</p>
          </div>
        </div>

        {/* Sandboxed Result Viewer */}
        <div className="flex-1 relative overflow-hidden bg-white">
          <div className="absolute inset-0 flex flex-col items-center justify-center -z-10 bg-gray-50">
            <div className="text-center space-y-3">
              <div className="w-10 h-10 border-4 border-[#f05a1a]/20 border-t-[#f05a1a] rounded-full animate-spin mx-auto"></div>
              <p className="text-xs font-bold text-gray-400 animate-pulse">Connecting to BTEB Server...</p>
            </div>
          </div>
          
          {/* 
            CRITICAL: The 'sandbox' attribute (without allow-top-navigation) 
            prevents the iframe from hijacking the whole browser page 
            via frame-busting scripts.
          */}
          <iframe 
            src={resultUrl} 
            sandbox="allow-scripts allow-forms allow-same-origin"
            className="w-full h-full border-none shadow-inner"
            title="BTEB Result View"
          />
        </div>

        {/* Live Status Indicator */}
        <div className="bg-white border-t border-gray-100 p-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Official Connection</span>
          </div>
          <div className="bg-[#f2d8cc] text-[#9a4b32] text-[9px] font-black px-3 py-1 rounded-full uppercase">
            In-App View Mode
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-blue-100/50 border border-gray-100 p-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-left">
            <h2 className="text-xl font-black text-blue-600 italic uppercase tracking-tighter inline-block relative">
              BTEB Results Zone
              <span className="absolute -bottom-1 left-0 w-12 h-1.5 bg-blue-600 rounded-full"></span>
            </h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase mt-2 tracking-widest">Native Portal Integration</p>
          </div>

          <div className="space-y-6">
            {/* Curriculum */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-gray-700 ml-1 uppercase tracking-widest">Curriculum / Exam</label>
              <div className="relative">
                <select 
                  value={exam}
                  onChange={(e) => setExam(e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-50 rounded-2xl font-bold text-gray-800 outline-none appearance-none focus:border-blue-600 focus:bg-white transition-all shadow-sm"
                >
                  <option>Diploma in Engineering</option>
                  <option>Diploma in Textile Engineering</option>
                  <option>Diploma in Agriculture</option>
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>

            {/* Regulation */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-gray-700 ml-1 uppercase tracking-widest">Regulation</label>
              <div className="relative">
                <select 
                  value={regulation}
                  onChange={(e) => setRegulation(e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-50 rounded-2xl font-bold text-gray-800 outline-none appearance-none focus:border-blue-600 focus:bg-white transition-all shadow-sm"
                >
                  <option>2022</option>
                  <option>2016</option>
                  <option>2010</option>
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>

            {/* Roll */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-gray-700 ml-1 uppercase tracking-widest">Roll Number *</label>
              <input
                type="text"
                inputMode="numeric"
                value={roll}
                onChange={(e) => setRoll(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 6-digit roll"
                className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-50 rounded-2xl font-black text-gray-800 outline-none focus:border-blue-600 focus:bg-white transition-all shadow-sm placeholder:opacity-20"
              />
            </div>

            {/* View Button */}
            <button
              onClick={handleFetchResult}
              disabled={isSearching}
              className="w-full py-5 bg-[#2b68e8] text-white rounded-[1.25rem] font-black text-lg shadow-xl shadow-blue-200/50 hover:bg-blue-700 active:scale-[0.97] transition-all flex items-center justify-center space-x-3 mt-4 disabled:opacity-70"
            >
              {isSearching ? (
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/30 border-t-white"></div>
              ) : (
                <>
                  <span>View Result</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                </>
              )}
            </button>
          </div>

          {/* Sponsor */}
          <div className="pt-6 flex flex-col items-center space-y-3">
            <p className="text-[9px] text-gray-300 font-black uppercase tracking-[0.3em]">Powered by</p>
            <div className="flex items-center space-x-2 opacity-40 hover:opacity-100 transition-opacity">
               <div className="bg-gray-900 p-1 rounded">
                  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                  </svg>
               </div>
               <span className="font-black text-gray-900 tracking-tighter uppercase text-sm">SATISFYHOST</span>
            </div>
          </div>
        </div>
      </div>

      <p className="text-center text-[10px] text-gray-400 font-bold px-8 leading-relaxed">
        এই ফিচারের মাধ্যমে আপনি বিটিইবি-র রেজাল্ট সরাসরি এই অ্যাপের ভেতরেই দেখতে পারবেন। 
        আমাদের বিশেষ সিকিউরিটি লেয়ার রেজাল্ট পেজকে রিডাইরেক্ট হতে বাধা দেয়।
      </p>
    </div>
  );
};

export default Results;
