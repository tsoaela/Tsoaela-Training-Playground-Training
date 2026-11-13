import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  Mail, 
  User, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  Music, 
  Camera, 
  Video, 
  BookOpen, 
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  Briefcase
} from 'lucide-react';
import { UserProfile, UserRole } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
  initialMode?: 'login' | 'register';
  guardMessage?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialMode = 'login',
  guardMessage,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [tier, setTier] = useState<'free' | 'educare_pro' | 'all_access'>('free');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    if (mode === 'register' && !name.trim()) {
      setError('Please provide your full legal or artist name.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const userProfile: UserProfile = {
        id: `user_${Date.now()}`,
        name: name || (email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1)),
        email: email,
        role,
        subscription_tier: tier,
        plan_status: tier === 'free' ? 'None' : 'Active',
        renewal_date: '2026-12-10',
        billing_interval: 'monthly',
        payment_method: {
          brand: 'Visa',
          last4: '4242',
          exp_month: 12,
          exp_year: 2028,
        },
      };

      try {
        localStorage.setItem('ttg_is_authenticated', 'true');
        localStorage.setItem('ttg_user_profile', JSON.stringify(userProfile));
        localStorage.setItem('ttg_user_role', role);
      } catch (err) {
        console.error(err);
      }

      onLoginSuccess(userProfile);
      onClose();
    }, 600);
  };

  const handleQuickDemoLogin = (profile: UserProfile, selectedRole: UserRole) => {
    const profileWithRole: UserProfile = { ...profile, role: selectedRole };
    try {
      localStorage.setItem('ttg_is_authenticated', 'true');
      localStorage.setItem('ttg_user_profile', JSON.stringify(profileWithRole));
      localStorage.setItem('ttg_user_role', selectedRole);
    } catch (err) {
      console.error(err);
    }
    onLoginSuccess(profileWithRole);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-md bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between p-5 border-b border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 flex items-center justify-center font-bold text-xs">
              TTG
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                {mode === 'login' ? 'Sign In to Your Account' : 'Register Creator & Student Profile'}
              </h3>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Tsoaela Training Ground Universal Education & Media Store
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Protected Feature Guard Banner (if invoked via requireAuth) */}
        {guardMessage && (
          <div className="px-5 py-3 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/50 flex items-center gap-2.5 text-xs text-amber-900 dark:text-amber-200">
            <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <p className="font-medium leading-relaxed">{guardMessage}</p>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex border-b border-stone-200 dark:border-stone-800 bg-stone-100/50 dark:bg-stone-800/40 p-1 m-4 rounded-xl">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              mode === 'login'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(null); }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              mode === 'register'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            Register ($0 Free)
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="px-6 py-2 space-y-4">
          {error && (
            <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Full Legal or Artist Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Tsoaelat S. / Aether Resonance"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-stone-900 dark:focus:border-stone-100"
                    required
                  />
                </div>
              </div>

              {/* Primary Role Selector */}
              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Primary Role / Marketplace Identity
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`p-2 rounded-xl border text-left flex flex-col items-center gap-1 transition-all ${
                      role === 'student'
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200'
                        : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span className="text-[10px] font-semibold text-center">Student</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('instructor')}
                    className={`p-2 rounded-xl border text-left flex flex-col items-center gap-1 transition-all ${
                      role === 'instructor'
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200'
                        : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    <Briefcase className="w-4 h-4" />
                    <span className="text-[10px] font-semibold text-center">Instructor</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('artist')}
                    className={`p-2 rounded-xl border text-left flex flex-col items-center gap-1 transition-all ${
                      role === 'artist'
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200'
                        : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    <Music className="w-4 h-4" />
                    <span className="text-[10px] font-semibold text-center">Music Artist</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('author')}
                    className={`p-2 rounded-xl border text-left flex flex-col items-center gap-1 transition-all ${
                      role === 'author'
                        ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/30 text-purple-900 dark:text-purple-200'
                        : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    <span className="text-[10px] font-semibold text-center">Author</span>
                  </button>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@domain.com"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-stone-900 dark:focus:border-stone-100"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-stone-900 dark:focus:border-stone-100"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 text-xs font-semibold rounded-xl text-white bg-stone-900 dark:bg-stone-100 dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors shadow-xs flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{mode === 'login' ? 'Sign In & Unlock Features' : 'Create Free Account ($0)'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Demo One-Click Quick Sign In */}
        <div className="p-4 mx-6 mb-4 mt-2 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800 text-left space-y-2">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
            Instant One-Click Login (Pre-Configured)
          </span>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemoLogin({
                id: 'user_88219',
                name: 'Tsoaelat S.',
                email: 'Tsoaelat.s@gmail.com',
                subscription_tier: 'educare_pro',
                plan_status: 'Active',
                renewal_date: '2026-12-07',
                billing_interval: 'monthly',
                payment_method: { brand: 'Visa', last4: '4242', exp_month: 12, exp_year: 2028 },
              }, 'student')}
              className="flex-1 py-1.5 px-2.5 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-amber-500 text-[11px] font-medium text-stone-800 dark:text-stone-200 flex items-center justify-between transition-colors shadow-2xs cursor-pointer"
            >
              <span>Tsoaelat S. (Student)</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoLogin({
                id: 'artist_kaelen',
                name: 'Kaelen Vance',
                email: 'kaelen.vance@studio.ttg',
                subscription_tier: 'all_access',
                plan_status: 'Active',
                renewal_date: '2026-12-15',
                billing_interval: 'annual',
                payment_method: { brand: 'Mastercard', last4: '8819', exp_month: 8, exp_year: 2029 },
              }, 'artist')}
              className="flex-1 py-1.5 px-2.5 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-emerald-500 text-[11px] font-medium text-stone-800 dark:text-stone-200 flex items-center justify-between transition-colors shadow-2xs cursor-pointer"
            >
              <span>Kaelen V. (Creator)</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleQuickDemoLogin({
              id: 'inst_evelyn',
              name: 'Dr. Evelyn Brand',
              email: 'evelyn.brand@ttg.edu',
              subscription_tier: 'all_access',
              plan_status: 'Active',
              renewal_date: '2026-12-31',
              billing_interval: 'annual',
              payment_method: { brand: 'Visa', last4: '9001', exp_month: 10, exp_year: 2029 },
            }, 'instructor')}
            className="w-full py-1.5 px-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 hover:border-indigo-500 text-[11px] font-bold text-indigo-900 dark:text-indigo-200 flex items-center justify-between transition-colors shadow-2xs cursor-pointer"
          >
            <span>Dr. Evelyn Brand (Faculty Instructor · Unlocks Faculty Portal)</span>
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
          </button>
        </div>

      </div>
    </div>
  );
};
