import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { LogIn, HelpCircle, AlertCircle, Sparkles } from 'lucide-react';
import { dbService } from '../services/db';

export default function AdminLogin() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function checkAuth() {
      const u = await dbService.getCurrentUser();
      if (u) {
        navigate('/admin/dashboard');
      }
    }
    checkAuth();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await dbService.login(email, password);
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Review admin@menu.com / admin123 credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F7F9] text-[#1C1C1E] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background ambient circular graphics */}
      <div className="absolute -top-40 -left-40 w-120 h-120 bg-[#2ECC71]/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-120 h-120 bg-slate-500/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Frame card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl border border-slate-200/60 p-8 shadow-xl relative"
      >
        {/* Sleek top indicator bar */}
        <div className="absolute top-0 inset-x-0 h-[5px] bg-[#1C1C1E] rounded-t-3xl" />

        {/* Branding */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-slate-50 border border-slate-200 text-[#2ECC71] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="font-serif font-black text-2xl text-[#1C1C1E] tracking-tight">
            The Saffron Heritage
          </h2>
          <p className="font-sans text-slate-500 text-[10px] uppercase font-bold tracking-widest mt-1.5 leading-relaxed">
            Administrative Gastronomy Console
          </p>
        </div>

        {/* Form panel */}
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex gap-2.5 items-start animate-pulse"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-semibold block mb-0.5">Authentication Issue</span>
                {error}
              </div>
            </motion.div>
          )}

          <div>
            <label className="text-slate-650 text-[9px] uppercase font-black tracking-widest block mb-1.5 pl-1">
              Admin Gateway ID
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. admin@menu.com"
              required
              className="w-full py-3.5 px-4 bg-white ring-1 ring-slate-205 focus:ring-2 focus:ring-[#1C1C1E] text-[#1C1C1E] rounded-xl text-xs focus:outline-none transition-all placeholder-slate-400 font-sans"
            />
          </div>

          <div>
            <label className="text-slate-650 text-[9px] uppercase font-black tracking-widest block mb-1.5 pl-1 font-sans">
              Secret Passcode
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              className="w-full py-3.5 px-4 bg-white ring-1 ring-slate-205 focus:ring-2 focus:ring-[#1C1C1E] text-[#1C1C1E] rounded-xl text-xs focus:outline-none transition-all placeholder-slate-400 font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2.5 py-4 bg-[#1C1C1E] hover:bg-slate-800 active:bg-slate-950 disabled:bg-slate-100 disabled:text-slate-400 text-white text-[10px] font-black tracking-widest uppercase rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            id="admin-login-submit"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4 text-[#2ECC71]" /> Establish Authority
              </>
            )}
          </button>
        </form>

        {/* Credentials Sandbox Helper */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <div className="bg-[#F6F7F9] border border-slate-205/60 p-4 rounded-xl text-[11px] leading-relaxed text-slate-500">
            <div className="flex gap-2 items-start text-emerald-800 font-bold mb-1.5">
              <HelpCircle className="w-4 h-4 shrink-0 text-[#2ECC71] mt-0.5" />
              <span className="uppercase tracking-wider text-[10px] font-display text-slate-800">Sandbox Authority</span>
            </div>
            <div>
              <p className="text-slate-500">To view and modify Saffron Heritage menu, use the sandbox admin account:</p>
              <ul className="list-disc mt-1.5 pl-4 space-y-1 text-slate-500 font-mono text-[10px]">
                <li>ID: <span className="text-emerald-800 font-bold">admin@menu.com</span></li>
                <li>Key: <span className="text-emerald-800 font-bold">admin123</span></li>
              </ul>
              <p className="mt-2.5 text-[9px] text-slate-400">
                Any other email with a password of 6+ characters will also auto-register as an administrator for convenience.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
