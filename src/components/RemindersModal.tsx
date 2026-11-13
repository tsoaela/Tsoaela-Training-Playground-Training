import React, { useState } from 'react';
import { X, Bell, Plus, Clock, Calendar, Check, Trash2, AlertCircle, ToggleLeft, ToggleRight } from 'lucide-react';
import { Reminder } from '../types';

interface RemindersModalProps {
  isOpen: boolean;
  onClose: () => void;
  reminders: Reminder[];
  onAddReminder: (reminder: Omit<Reminder, 'id'>) => void;
  onToggleReminder: (id: string) => void;
  onDeleteReminder: (id: string) => void;
  initialTargetTitle?: string;
  initialType?: 'study_guide' | 'retreat' | 'general';
}

export const RemindersModal: React.FC<RemindersModalProps> = ({
  isOpen,
  onClose,
  reminders,
  onAddReminder,
  onToggleReminder,
  onDeleteReminder,
  initialTargetTitle = '',
  initialType = 'study_guide',
}) => {
  const [isAdding, setIsAdding] = useState(!!initialTargetTitle);
  const [title, setTitle] = useState(initialTargetTitle ? `Study: ${initialTargetTitle}` : '');
  const [targetTitle, setTargetTitle] = useState(initialTargetTitle || 'Foundations of First-Principles Systems Thinking');
  const [type, setType] = useState<'study_guide' | 'retreat' | 'general'>(initialType);
  const [date, setDate] = useState('2026-11-12');
  const [time, setTime] = useState('09:00 AM');
  const [frequency, setFrequency] = useState<'Daily' | 'Weekly' | 'Once'>('Daily');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddReminder({
      title: title.trim(),
      targetTitle: targetTitle.trim() || 'General Strategy Session',
      type,
      date,
      time,
      frequency,
      isEnabled: true,
      notes: notes.trim(),
    });

    setTitle('');
    setNotes('');
    setIsAdding(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-stone-950/75 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden z-10 my-6 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900">
              <Bell className="w-4 h-4 text-amber-400 dark:text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">Study & Event Reminders</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">Schedule deep work intervals and retreat preparation alerts</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs">
          
          {/* Quick Add Form or Toggle */}
          {!isAdding ? (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="w-full py-2.5 px-3 rounded-xl border border-dashed border-stone-300 dark:border-stone-700 hover:border-stone-900 dark:hover:border-stone-400 text-stone-700 dark:text-stone-300 font-semibold flex items-center justify-center gap-1.5 transition-colors bg-stone-50/50 dark:bg-stone-850"
            >
              <Plus className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Schedule New Reminder</span>
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-850 space-y-3">
              <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-750 pb-2">
                <span className="font-semibold text-stone-900 dark:text-stone-100 uppercase tracking-wider text-[11px]">
                  New Reminder Entry
                </span>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                >
                  Cancel
                </button>
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 mb-1 font-medium">
                  Reminder Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Daily Cognitive Modeling Practice"
                  className="w-full px-3 py-1.5 border border-stone-300 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 dark:text-stone-300 mb-1 font-medium">
                    Reminder Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3 py-1.5 border border-stone-300 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  >
                    <option value="study_guide">Study Guide</option>
                    <option value="retreat">TTG Retreat</option>
                    <option value="general">Deep Focus Block</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 mb-1 font-medium">
                    Cadence / Frequency
                  </label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as any)}
                    className="w-full px-3 py-1.5 border border-stone-300 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                  >
                    <option value="Daily">Daily (Every Day)</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Once">Once (Fixed Date)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 dark:text-stone-300 mb-1 font-medium">
                    Target Time
                  </label>
                  <input
                    type="text"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="08:30 AM"
                    className="w-full px-3 py-1.5 border border-stone-300 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-stone-300 mb-1 font-medium">
                    Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-stone-300 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 mb-1 font-medium">
                  Associated Topic or Module
                </label>
                <input
                  type="text"
                  value={targetTitle}
                  onChange={(e) => setTargetTitle(e.target.value)}
                  placeholder="e.g. Behavioral Game Theory"
                  className="w-full px-3 py-1.5 border border-stone-300 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div>
                <label className="block text-stone-700 dark:text-stone-300 mb-1 font-medium">
                  Preparation Notes (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Read chapter 2 before executive call"
                  className="w-full px-3 py-1.5 border border-stone-300 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 text-stone-600 dark:text-stone-400 hover:text-stone-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-semibold"
                >
                  Save Reminder
                </button>
              </div>
            </form>
          )}

          {/* List of Active Reminders */}
          <div className="space-y-3">
            <span className="font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400 text-[11px] block">
              Active Scheduled Reminders ({reminders.length})
            </span>

            {reminders.length === 0 ? (
              <p className="text-stone-400 py-4 text-center">No active reminders configured.</p>
            ) : (
              reminders.map((rem) => (
                <div
                  key={rem.id}
                  className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                    rem.isEnabled
                      ? 'border-stone-200 dark:border-stone-750 bg-white dark:bg-stone-850'
                      : 'border-stone-100 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-900 opacity-60'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-900 dark:text-stone-100 text-xs">
                        {rem.title}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                        {rem.frequency}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-stone-500 dark:text-stone-400 font-mono">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                        {rem.time}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-stone-400" />
                        {rem.date}
                      </span>
                    </div>

                    <p className="text-[11px] text-stone-600 dark:text-stone-400 pt-0.5">
                      Target: <span className="font-medium text-stone-800 dark:text-stone-200">{rem.targetTitle}</span>
                    </p>

                    {rem.notes && (
                      <p className="text-[11px] text-stone-500 italic pt-0.5">
                        &ldquo;{rem.notes}&rdquo;
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onToggleReminder(rem.id)}
                      className="p-1 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
                      title={rem.isEnabled ? 'Disable reminder' : 'Enable reminder'}
                    >
                      {rem.isEnabled ? (
                        <span className="text-emerald-600 font-semibold text-[11px] flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Active
                        </span>
                      ) : (
                        <span className="text-stone-400 text-[11px]">Paused</span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteReminder(rem.id)}
                      className="p-1 text-stone-400 hover:text-red-600 rounded transition-colors"
                      title="Delete reminder"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 flex items-center justify-between">
          <span className="text-[11px] text-stone-500 dark:text-stone-400">
            Reminders automatically synchronize with your local schedule
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:bg-stone-300 dark:hover:bg-stone-700"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
