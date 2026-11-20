import React, { useState, useRef } from 'react';
import {
  FileEdit,
  Users,
  Check,
  Copy,
  Download,
  RefreshCw,
  UserPlus,
  CheckCircle2,
  Wifi,
  WifiOff,
  ListTodo,
  Heading2,
  Sigma,
} from 'lucide-react';
import {
  RegisteredStudyGroup,
  StudyRoomActiveParticipant,
  StudyRoomSharedNote,
} from '../types';
import { SharedNotesConnectionStatus } from '../hooks/useStudyRoomSharedNotes';

export interface StudyRoomSharedNotesPanelProps {
  group: RegisteredStudyGroup | null;
  note: StudyRoomSharedNote | null;
  draftTitle: string;
  draftContent: string;
  participants: StudyRoomActiveParticipant[];
  selfClientId: string;
  connectionStatus: SharedNotesConnectionStatus;
  lastSyncedAt: string | null;
  isSaving: boolean;
  isMemberRegistered: boolean;
  isJoiningGroup: boolean;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  onSyncNow: () => void;
  onRegisterInGroup: () => void;
}

export const StudyRoomSharedNotesPanel: React.FC<StudyRoomSharedNotesPanelProps> = ({
  group,
  note,
  draftTitle,
  draftContent,
  participants,
  selfClientId,
  connectionStatus,
  lastSyncedAt,
  isSaving,
  isMemberRegistered,
  isJoiningGroup,
  onTitleChange,
  onContentChange,
  onSyncNow,
  onRegisterInGroup,
}) => {
  const [copiedNotes, setCopiedNotes] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const activeTypers = participants.filter(
    (p) => p.isTyping && p.clientId !== selfClientId
  );

  const wordCount = draftContent.trim()
    ? draftContent.trim().split(/\s+/).length
    : 0;
  const lineCount = draftContent ? draftContent.split('\n').length : 0;

  const handleInsertSnippet = (snippet: string) => {
    if (!isMemberRegistered) return;
    const el = textareaRef.current;
    if (!el) {
      onContentChange(`${draftContent}${draftContent.endsWith('\n') ? '' : '\n'}${snippet}`);
      return;
    }
    const start = el.selectionStart ?? draftContent.length;
    const end = el.selectionEnd ?? draftContent.length;
    const before = draftContent.slice(0, start);
    const after = draftContent.slice(end);
    const prefix = before.length > 0 && !before.endsWith('\n') ? '\n' : '';
    const next = `${before}${prefix}${snippet}${after}`;
    onContentChange(next);
    window.setTimeout(() => {
      el.focus();
      const caretPos = before.length + prefix.length + snippet.length;
      el.setSelectionRange(caretPos, caretPos);
    }, 10);
  };

  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(`# ${draftTitle}\n\n${draftContent}`);
      setCopiedNotes(true);
      window.setTimeout(() => setCopiedNotes(false), 2000);
    } catch {
      // Ignore clipboard failures in restricted frames
    }
  };

  const handleDownloadMarkdown = () => {
    const filename = `${(group?.name || 'study_room_notes')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')}_v${note?.version || 1}.md`;
    const body = `# ${draftTitle}\n\n${draftContent}\n`;
    const blob = new Blob([body], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="flex flex-col h-full rounded-2xl border border-stone-800 bg-stone-900/95 text-stone-100 overflow-hidden">
      {/* Header & Registered Study Group Status */}
      <div className="px-4 py-3 border-b border-stone-800 bg-stone-950/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-stone-400">
            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold">
              {connectionStatus === 'connected' ? (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
              ) : (
                <WifiOff className="w-3 h-3 text-amber-400" />
              )}
              <span>
                {connectionStatus === 'connected'
                  ? 'WebSocket Live Sync'
                  : connectionStatus === 'reconnecting'
                  ? 'Reconnecting…'
                  : connectionStatus === 'connecting'
                  ? 'Connecting Room…'
                  : 'Offline'}
              </span>
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums text-stone-300">
              {participants.length} in room
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums text-stone-400">
              {group?.memberEmails.length || 1} registered members
            </span>
          </div>
          <h4 className="text-xs sm:text-sm font-bold text-white truncate mt-0.5">
            {group?.name || 'Registered Study Group Notes'}
          </h4>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          {!isMemberRegistered ? (
            <button
              type="button"
              onClick={onRegisterInGroup}
              disabled={isJoiningGroup}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap disabled:opacity-60"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{isJoiningGroup ? 'Registering…' : 'Register to Co-Edit'}</span>
            </button>
          ) : (
            <span className="text-[11px] text-emerald-400 font-semibold inline-flex items-center gap-1 mr-1 whitespace-nowrap">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Registered Member</span>
            </span>
          )}

          <button
            type="button"
            onClick={onSyncNow}
            title="Push latest note state to room"
            className="px-2.5 py-1.5 rounded-lg border border-stone-700 bg-stone-800 hover:bg-stone-700 text-xs font-semibold text-stone-200 inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSaving ? 'animate-spin text-emerald-400' : ''}`} />
            <span className="hidden sm:inline">{isSaving ? 'Syncing…' : 'Sync'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyMarkdown}
            className="px-2.5 py-1.5 rounded-lg border border-stone-700 bg-stone-800 hover:bg-stone-700 text-xs font-semibold text-stone-200 inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
            title="Copy shared notes Markdown"
          >
            {copiedNotes ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">{copiedNotes ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadMarkdown}
            className="px-2.5 py-1.5 rounded-lg border border-stone-700 bg-stone-800 hover:bg-stone-700 text-xs font-semibold text-stone-200 inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
            title="Download shared notes as Markdown (.md)"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">.md</span>
          </button>
        </div>
      </div>

      {/* Collaborator Presence & Active Typing Indicator */}
      <div className="px-4 py-2 border-b border-stone-800/80 bg-stone-900 flex flex-wrap items-center justify-between gap-2 text-[11px] shrink-0">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <Users className="w-3.5 h-3.5 text-stone-400 shrink-0" />
          <span className="text-stone-400 shrink-0">Active collaborators:</span>
          {participants.length === 0 ? (
            <span className="text-stone-500">Connecting presence…</span>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {participants.map((p) => {
                const isSelf = p.clientId === selfClientId;
                return (
                  <span
                    key={p.clientId}
                    className="inline-flex items-center gap-1.5 text-stone-200 font-medium"
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: p.color }}
                      aria-hidden="true"
                    />
                    <span>
                      {p.name}
                      {isSelf ? ' (You)' : ''}
                    </span>
                    {p.isTyping && !isSelf && (
                      <span className="text-emerald-400 font-mono text-[10px]">
                        editing…
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {activeTypers.length > 0 && (
          <span className="text-emerald-400 font-medium shrink-0">
            {activeTypers.map((p) => p.name).join(', ')} typing…
          </span>
        )}
      </div>

      {/* Registration Prompt Banner if Learner Isn't Registered in This Study Group */}
      {!isMemberRegistered && group && (
        <div className="px-4 py-2.5 bg-amber-950/50 border-b border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-200 shrink-0">
          <span>
            You are viewing <strong>{group.name}</strong> in read-only preview. Register into this study group to co-edit shared notes live.
          </span>
          <button
            type="button"
            onClick={onRegisterInGroup}
            disabled={isJoiningGroup}
            className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs cursor-pointer whitespace-nowrap shrink-0"
          >
            {isJoiningGroup ? 'Joining…' : 'Register & Unlock Editing'}
          </button>
        </div>
      )}

      {/* Editable Shared Document Header + Formatting Quick Actions */}
      <div className="px-4 pt-3 pb-2 border-b border-stone-800/70 bg-stone-950/40 space-y-2 shrink-0">
        <div className="flex items-center gap-2">
          <FileEdit className="w-4 h-4 text-emerald-400 shrink-0" />
          <input
            type="text"
            value={draftTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            disabled={!isMemberRegistered}
            placeholder="Shared study group note title…"
            className="w-full bg-transparent text-sm font-bold text-white placeholder-stone-500 focus:outline-none disabled:opacity-70"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <button
            type="button"
            disabled={!isMemberRegistered}
            onClick={() => handleInsertSnippet('## New Section Heading\n')}
            className="px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 inline-flex items-center gap-1 cursor-pointer disabled:opacity-40"
          >
            <Heading2 className="w-3 h-3" />
            <span>Heading</span>
          </button>
          <button
            type="button"
            disabled={!isMemberRegistered}
            onClick={() => handleInsertSnippet('- [ ] Follow-up derivation / peer check\n')}
            className="px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 inline-flex items-center gap-1 cursor-pointer disabled:opacity-40"
          >
            <ListTodo className="w-3 h-3" />
            <span>Action Item</span>
          </button>
          <button
            type="button"
            disabled={!isMemberRegistered}
            onClick={() =>
              handleInsertSnippet('```\nUCT(s, a) = Q(s, a) + c * sqrt(ln(N) / n(s, a))\n```\n')
            }
            className="px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 inline-flex items-center gap-1 cursor-pointer disabled:opacity-40"
          >
            <Sigma className="w-3 h-3" />
            <span>Formula Block</span>
          </button>
        </div>
      </div>

      {/* Live Synchronized Textarea */}
      <div className="flex-1 min-h-[220px] p-3 bg-stone-950">
        <textarea
          ref={textareaRef}
          value={draftContent}
          onChange={(e) => onContentChange(e.target.value)}
          disabled={!isMemberRegistered}
          spellCheck
          placeholder="Start typing shared study notes — every peer in this study room receives edits immediately via WebSockets…"
          className="w-full h-full min-h-[210px] resize-none bg-transparent text-xs sm:text-sm font-mono leading-relaxed text-stone-100 placeholder-stone-600 focus:outline-none disabled:opacity-75"
        />
      </div>

      {/* Author & Version Attribution Footer */}
      <div className="px-4 py-2 border-t border-stone-800 bg-stone-950/90 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono tabular-nums text-stone-400 shrink-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-emerald-400 font-semibold">
            v{note?.version || 1}
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Last edit by <strong className="text-stone-200">{note?.lastEditedBy || group?.hostName || 'Host'}</strong>
          </span>
          {lastSyncedAt && (
            <>
              <span aria-hidden="true">·</span>
              <span>Synced {new Date(lastSyncedAt).toLocaleTimeString()}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Wifi className="w-3 h-3 text-emerald-400" />
          <span>
            {lineCount} lines · {wordCount} words
          </span>
        </div>
      </div>
    </div>
  );
};
