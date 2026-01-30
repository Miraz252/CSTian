
import React, { useState } from 'react';
import { ROLL_MIN, ROLL_MAX } from '../constants';
import { supabase } from '../supabaseClient';

interface LoginProps {
  onLogin: (userId: string) => void;
}

type AuthMode = 'login' | 'signup' | 'forgot';

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [roll, setRoll] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    if (mode === 'signup') {
      if (!name.trim()) return "আপনার পুরো নাম লিখুন।";
      const rollNum = parseInt(roll);
      // Validating range but not showing hint as requested
      if (isNaN(rollNum) || rollNum < ROLL_MIN || rollNum > ROLL_MAX) {
        return "সঠিক রোল নম্বর প্রদান করুন।";
      }
    }
    if (!email.includes('@')) return "সঠিক ইমেইল এড্রেস লিখুন।";
    if (password.length < 6) return "পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে।";
    return null;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      if (mode === 'signup') {
        // Step 1: Check if roll number already exists in profiles
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('roll_number')
          .eq('roll_number', roll)
          .maybeSingle();

        if (existingProfile) {
          throw new Error("এই রোল নম্বরটি ইতিমধ্যে নিবন্ধিত হয়েছে।");
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { 
            data: { name, roll_number: roll },
            emailRedirectTo: window.location.origin
          }
        });

        if (signUpError) throw signUpError;
        
        if (data.user && !data.session) {
          setMessage('অ্যাকাউন্ট তৈরি হয়েছে! আপনার ইমেইল (Inbox/Spam) চেক করে কনফার্ম করুন, তারপর লগইন করুন।');
          setMode('login');
        } else if (data.user && data.session) {
          onLogin(data.user.id);
        }
      } else if (mode === 'login') {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (signInError) {
          if (signInError.message.includes("Email not confirmed")) {
            throw new Error("আপনার ইমেইল ভেরিফাই করা হয়নি। দয়া করে ইনবক্স চেক করুন।");
          }
          if (signInError.message.includes("Invalid login credentials")) {
            throw new Error("ইমেইল অথবা পাসওয়ার্ড ভুল। আপনি কি 'Sign Up' করেছেন?");
          }
          throw signInError;
        }

        if (data?.user) {
          onLogin(data.user.id);
        }
      } else if (mode === 'forgot') {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);
        if (resetError) throw resetError;
        setMessage('পাসওয়ার্ড রিসেট লিঙ্ক আপনার ইমেইলে পাঠানো হয়েছে।');
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      setError(err.message || "একটি সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।");
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = email.includes('@') && password.length >= 6 && (mode !== 'signup' || (name.trim() !== '' && roll !== ''));

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-600 p-4">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-8 space-y-6 animate-in fade-in zoom-in duration-300">
        <div className="text-center space-y-1">
          <h2 className="text-4xl font-black text-gray-900 tracking-tighter uppercase italic">Batch 23-24</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Digital Student Portal</p>
        </div>
        
        <form className="space-y-4" onSubmit={handleAuth}>
          <div className="space-y-3">
            {mode === 'signup' && (
              <>
                <div className="group">
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl font-semibold outline-none focus:border-blue-600 focus:bg-white transition-all"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="group">
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl font-semibold outline-none focus:border-blue-600 focus:bg-white transition-all"
                    placeholder="Roll Number" -- Removed range hint (825xxx)
                    value={roll}
                    onChange={(e) => setRoll(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
              </>
            )}

            <div className="group">
              <input
                type="email"
                required
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl font-semibold outline-none focus:border-blue-600 focus:bg-white transition-all"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {mode !== 'forgot' && (
              <div className="relative group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl font-semibold outline-none focus:border-blue-600 focus:bg-white transition-all"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3 text-[10px] font-black text-gray-400 h-10 px-2"
                >
                  {showPassword ? 'HIDE' : 'SHOW'}
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-600 text-[11px] font-bold rounded-2xl border border-red-100 animate-in slide-in-from-top-2 duration-200">
              ⚠️ {error}
            </div>
          )}
          
          {message && (
            <div className="p-4 bg-green-50 text-green-600 text-[11px] font-bold rounded-2xl border border-green-100">
              ✅ {message}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !isFormValid}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span className="text-sm">Processing...</span>
              </div>
            ) : (
              <span>{mode === 'login' ? 'Login' : mode === 'signup' ? 'Create Account' : 'Reset Password'}</span>
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          {mode === 'login' ? (
            <div className="space-y-3">
              <p className="text-xs text-gray-500 font-medium">
                অ্যাকাউন্ট নেই? <button onClick={() => { setMode('signup'); setError(''); setMessage(''); }} className="text-blue-600 font-black uppercase tracking-tighter hover:underline">Sign Up করুন</button>
              </p>
              <button onClick={() => setMode('forgot')} className="text-[10px] text-gray-400 font-bold uppercase tracking-widest hover:text-blue-600 transition-colors">Forgot Password?</button>
            </div>
          ) : (
            <button onClick={() => { setMode('login'); setError(''); setMessage(''); }} className="text-xs text-blue-600 font-black uppercase tracking-tighter hover:underline">Back to Login</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
