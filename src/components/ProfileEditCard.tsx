import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { Pencil, Check, X, Building2, BookOpen, Mail, User as UserIcon } from 'lucide-react';

interface ProfileEditCardProps {
  user: UserProfile;
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
  syncedFocusMinutes?: number;
  completedSessions?: number;
}

export const ProfileEditCard: React.FC<ProfileEditCardProps> = ({
  user,
  onUpdateProfile,
  syncedFocusMinutes = 0,
  completedSessions = 0,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [institution, setInstitution] = useState(user.institution || 'Tsoaela Training Ground Institute');
  const [specialization, setSpecialization] = useState(
    user.specialization || 'Autonomous Systems & Quantitative Economics'
  );
  const [bio, setBio] = useState(
    user.bio || 'Executive scholar pursuing accredited cross-disciplinary mastery.'
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedBanner, setSavedBanner] = useState(false);

  useEffect(() => {
    setName(user.name);
    setEmail(user.email);
    setInstitution(user.institution || 'Tsoaela Training Ground Institute');
    setSpecialization(user.specialization || 'Autonomous Systems & Quantitative Economics');
    setBio(user.bio || 'Executive scholar pursuing accredited cross-disciplinary mastery.');
  }, [user]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName) {
      setErrorMsg('Full name is required.');
      return;
    }
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    setErrorMsg(null);
    onUpdateProfile({
      name: trimmedName,
      email: trimmedEmail,
      institution: institution.trim() || 'Tsoaela Training Ground Institute',
      specialization: specialization.trim() || 'Interdisciplinary Studies',
      bio: bio.trim(),
    });
    setIsEditing(false);
    setSavedBanner(true);
    window.setTimeout(() => setSavedBanner(false), 3000);
  };

  const handleCancel = () => {
    setName(user.name);
    setEmail(user.email);
    setInstitution(user.institution || 'Tsoaela Training Ground Institute');
    setSpecialization(user.specialization || 'Autonomous Systems & Quantitative Economics');
    setBio(user.bio || 'Executive scholar pursuing accredited cross-disciplinary mastery.');
    setErrorMsg(null);
    setIsEditing(false);
  };

  const initials = (user.name || 'TTG')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n.charAt(0).toUpperCase())
    .join('');

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-bold text-sm flex items-center justify-center shrink-0">
            {initials}
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">{user.name}</h2>
              <span className="text-xs font-medium text-stone-500 dark:text-stone-400 capitalize">
                · {user.role || 'student'}
              </span>
              {savedBanner && (
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  Profile updated
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500 dark:text-stone-400">
              <span className="inline-flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                {user.email}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                {user.institution || 'Tsoaela Training Ground Institute'}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                {user.specialization || 'Autonomous Systems & Quantitative Economics'}
              </span>
            </div>
            {(user.bio || !isEditing) && (
              <p className="text-xs text-stone-600 dark:text-stone-400 pt-1 max-w-2xl">
                {user.bio || 'Executive scholar pursuing accredited cross-disciplinary mastery.'}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {syncedFocusMinutes > 0 && (
            <div className="text-right hidden md:block pr-2 border-r border-stone-200 dark:border-stone-800">
              <span className="text-[11px] text-stone-500 dark:text-stone-400 block">
                Pomodoro Sync
              </span>
              <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
                {syncedFocusMinutes}m · {completedSessions} sessions
              </span>
            </div>
          )}

          {!isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-xs font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
          )}
        </div>
      </div>

      {isEditing && (
        <form
          onSubmit={handleSave}
          className="mt-5 pt-5 border-t border-stone-100 dark:border-stone-800 space-y-4"
        >
          {errorMsg && (
            <div className="px-3 py-2 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block space-y-1 text-xs">
              <span className="font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-stone-400" />
                Full Name
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-900 dark:focus:ring-stone-300"
              />
            </label>

            <label className="block space-y-1 text-xs">
              <span className="font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-stone-400" />
                Email Address
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-900 dark:focus:ring-stone-300"
              />
            </label>

            <label className="block space-y-1 text-xs">
              <span className="font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-stone-400" />
                Institution / Organization
              </span>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-900 dark:focus:ring-stone-300"
              />
            </label>

            <label className="block space-y-1 text-xs">
              <span className="font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-stone-400" />
                Academic Specialization
              </span>
              <input
                type="text"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-900 dark:focus:ring-stone-300"
              />
            </label>
          </div>

          <label className="block space-y-1 text-xs">
            <span className="font-semibold text-stone-700 dark:text-stone-300">
              Scholar Bio &amp; Learning Focus
            </span>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-900 dark:focus:ring-stone-300 resize-none"
            />
          </label>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-1.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-stone-200 text-white dark:text-stone-900 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Profile</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
