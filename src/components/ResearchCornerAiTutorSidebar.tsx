import React, { useEffect, useRef, useState } from 'react';
import {
  Sparkles,
  BookOpen,
  X,
  Send,
  Minimize2,
  Maximize2,
  Trash2,
  AlertTriangle,
  HelpCircle,
  Layers,
  MessageSquareText,
} from 'lucide-react';
import { TutorChatMessage, TutorExplainResponse } from '../types';
import { TTG_LOGO_URL } from '../utils/pdfBranding';

interface ResearchCornerAiTutorSidebarProps {
  activePageLabel: string;
  activeStudyContext?: {
    courseTitle?: string;
    chapterTitle?: string;
  } | null;
}

interface TextSelectionOverlay {
  text: string;
  top: number;
  left: number;
}

const TUTOR_STORAGE_KEY = 'ttg_research_corner_ai_tutor_messages';

export const ResearchCornerAiTutorSidebar: React.FC<ResearchCornerAiTutorSidebarProps> = ({
  activePageLabel,
  activeStudyContext,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectionOverlay, setSelectionOverlay] = useState<TextSelectionOverlay | null>(null);
  const [draftQuestion, setDraftQuestion] = useState('');
  const [selectedMode, setSelectedMode] = useState<'explain' | 'breakdown'>('explain');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<TutorChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(TUTOR_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore malformed storage
    }
    return [];
  });

  const sidebarRef = useRef<HTMLElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(TUTOR_STORAGE_KEY, JSON.stringify(messages.slice(-20)));
    } catch {
      // Ignore quota issues
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Listen for text highlights across study pages & study guide modals
  useEffect(() => {
    const inspectSelection = () => {
      if (typeof window === 'undefined') return;
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setSelectionOverlay(null);
        return;
      }

      const text = selection.toString().trim();
      if (text.length < 4) {
        setSelectionOverlay(null);
        return;
      }

      // Do not trigger floating Ask AI popover when user highlights inside form controls or the tutor sidebar itself
      const anchorNode = selection.anchorNode;
      const anchorElement =
        anchorNode instanceof Element ? anchorNode : anchorNode?.parentElement;
      if (
        !anchorElement ||
        anchorElement.closest('input, textarea, select, [data-ai-tutor-sidebar="true"]')
      ) {
        return;
      }

      try {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        if (!rect || (rect.width === 0 && rect.height === 0)) return;

        const popoverWidth = 270;
        const clampedLeft = Math.max(
          16,
          Math.min(
            window.innerWidth - popoverWidth - 16,
            rect.left + rect.width / 2 - popoverWidth / 2
          )
        );
        const placeBelow = rect.top < 72;
        const top = placeBelow
          ? Math.min(window.innerHeight - 64, rect.bottom + 10)
          : Math.max(12, rect.top - 48);

        setSelectionOverlay({
          text: text.slice(0, 1500),
          top,
          left: clampedLeft,
        });
      } catch {
        setSelectionOverlay(null);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectionOverlay(null);
        return;
      }
      if (e.shiftKey || e.key.startsWith('Arrow')) {
        inspectSelection();
      }
    };

    document.addEventListener('mouseup', inspectSelection);
    document.addEventListener('keyup', handleKeyUp);
    return () => {
      document.removeEventListener('mouseup', inspectSelection);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const requestTutorExplanation = async (params: {
    highlightedText: string;
    question?: string;
    mode: 'explain' | 'breakdown' | 'custom';
  }) => {
    setIsOpen(true);
    setSelectionOverlay(null);
    setIsLoading(true);

    const contextSummary = [
      activeStudyContext?.courseTitle,
      activeStudyContext?.chapterTitle,
      activePageLabel,
    ]
      .filter(Boolean)
      .join(' · ');

    const userMsgId = `tutor_u_${Date.now()}`;
    const userPromptLabel =
      params.question?.trim() ||
      (params.mode === 'breakdown'
        ? 'Summarize concept breakdown'
        : 'Explain highlighted study passage');

    const userEntry: TutorChatMessage = {
      id: userMsgId,
      role: 'user',
      highlightedText: params.highlightedText,
      userPrompt: userPromptLabel,
      mode: params.mode,
      courseContext: contextSummary || activePageLabel,
      explanation: params.highlightedText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userEntry]);

    try {
      const response = await fetch('/api/tutor/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          highlightedText: params.highlightedText,
          question: params.question,
          mode: params.mode,
          courseTitle: activeStudyContext?.courseTitle,
          chapterTitle: activeStudyContext?.chapterTitle,
          pageLabel: activePageLabel,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || `AI Tutor error (${response.status})`);
      }

      const payload = data as TutorExplainResponse;
      const tutorReply: TutorChatMessage = {
        id: `tutor_a_${Date.now()}`,
        role: 'tutor',
        userPrompt: userPromptLabel,
        mode: payload.mode,
        courseContext: contextSummary || activePageLabel,
        summary: payload.summary,
        explanation: payload.explanation,
        keyConcepts: payload.keyConcepts,
        studyCheckQuestion: payload.studyCheckQuestion,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, tutorReply]);
    } catch (err: any) {
      const errorReply: TutorChatMessage = {
        id: `tutor_err_${Date.now()}`,
        role: 'tutor',
        highlightedText: params.highlightedText,
        userPrompt: userPromptLabel,
        mode: params.mode,
        courseContext: contextSummary || activePageLabel,
        explanation:
          err?.message ||
          'Unable to reach the Gemini AI Tutor service. Check server API key configuration in Settings > Secrets and retry.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
      };
      setMessages((prev) => [...prev, errorReply]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitCustomQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    const q = draftQuestion.trim();
    if (!q || isLoading) return;

    const latestHighlight =
      selectionOverlay?.text ||
      messages
        .slice()
        .reverse()
        .find((m) => m.highlightedText)?.highlightedText ||
      activeStudyContext?.chapterTitle ||
      activeStudyContext?.courseTitle ||
      q;

    setDraftQuestion('');
    void requestTutorExplanation({
      highlightedText: latestHighlight,
      question: q,
      mode: 'custom',
    });
  };

  return (
    <>
      {/* Highlighted Text Floating 'Ask AI' Popover */}
      {selectionOverlay && (
        <div
          style={{
            top: `${selectionOverlay.top}px`,
            left: `${selectionOverlay.left}px`,
          }}
          className="fixed z-[80] flex items-center gap-1 p-1 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-2xl border border-stone-700 dark:border-stone-300"
          role="toolbar"
          aria-label="Study passage AI actions"
        >
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() =>
              void requestTutorExplanation({
                highlightedText: selectionOverlay.text,
                mode: 'explain',
              })
            }
            className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ask AI</span>
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() =>
              void requestTutorExplanation({
                highlightedText: selectionOverlay.text,
                mode: 'breakdown',
              })
            }
            className="px-2.5 py-1.5 rounded-lg hover:bg-stone-800 dark:hover:bg-stone-200 text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Breakdown</span>
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setSelectionOverlay(null)}
            className="p-1.5 rounded-lg hover:bg-stone-800 dark:hover:bg-stone-200 text-stone-400 dark:text-stone-600 cursor-pointer"
            aria-label="Dismiss selection Ask AI bar"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Collapsed Persistent Dock Trigger */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          data-ai-tutor-sidebar="true"
          className="fixed bottom-5 right-5 z-[75] px-4 py-2.5 rounded-2xl bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-stone-200 text-white dark:text-stone-900 border border-amber-500/50 shadow-xl inline-flex items-center gap-2 text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
          aria-label="Open TAI Tutor floating sidebar"
        >
          <Sparkles className="w-4 h-4 text-amber-400 dark:text-amber-600" />
          <span>TAI Tutor</span>
          {messages.length > 0 && (
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-amber-500 text-stone-950">
              {messages.filter((m) => m.role === 'tutor' && !m.isError).length}
            </span>
          )}
        </button>
      )}

      {/* Expanded Floating Sidebar Panel (Persists Across Study Pages) */}
      {isOpen && (
        <aside
          ref={sidebarRef}
          data-ai-tutor-sidebar="true"
          aria-label="TAI Tutor Sidebar"
          className="fixed top-20 right-4 bottom-4 z-[75] w-[min(92vw,410px)] rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Sidebar Header */}
          <div className="p-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={TTG_LOGO_URL}
                alt="Tsoaela Training Ground Platform Logo"
                referrerPolicy="no-referrer"
                className="h-8 w-auto rounded-lg object-contain bg-white px-1 py-0.5 ring-1 ring-stone-200 dark:ring-stone-700 shrink-0"
              />
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">TAI Tutor</span>
                </div>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                  Context: {activeStudyContext?.courseTitle || activePageLabel}
                  {activeStudyContext?.chapterTitle ? ` · ${activeStudyContext.chapterTitle}` : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={() => setMessages([])}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                  title="Clear tutor history"
                  aria-label="Clear tutor conversation"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                title="Minimize TAI Tutor"
                aria-label="Minimize TAI Tutor"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Persistent Study Guidance Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-stone-300 dark:border-stone-700 bg-stone-50/70 dark:bg-stone-950 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-stone-900 dark:text-stone-100">
                  <MessageSquareText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Highlight any passage in a study guide</span>
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                  Select any sentence or concept across Educare study guides or Research Corner dossiers and click{' '}
                  <span className="font-semibold text-stone-900 dark:text-stone-100">Ask AI</span> or{' '}
                  <span className="font-semibold text-stone-900 dark:text-stone-100">Breakdown</span> for an immediate, context-aware explanation.
                </p>
                {activeStudyContext?.courseTitle && (
                  <button
                    type="button"
                    onClick={() =>
                      void requestTutorExplanation({
                        highlightedText: `${activeStudyContext.courseTitle}${
                          activeStudyContext.chapterTitle ? ` — ${activeStudyContext.chapterTitle}` : ''
                        }`,
                        mode: selectedMode,
                        question: `Summarize the core thesis and practical takeaway for ${
                          activeStudyContext.chapterTitle || activeStudyContext.courseTitle
                        }`,
                      })
                    }
                    className="w-full py-2 px-3 rounded-lg bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Summarize Active Study Context</span>
                  </button>
                )}
              </div>
            ) : (
              messages.map((msg) =>
                msg.role === 'user' ? (
                  <div key={msg.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-mono text-stone-400">
                      <span>YOU · {msg.mode?.toUpperCase() || 'ASK AI'}</span>
                      <span>{msg.timestamp}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-stone-900 dark:bg-stone-800 text-white text-xs space-y-1.5">
                      <div className="font-semibold text-amber-300">{msg.userPrompt}</div>
                      {msg.highlightedText && msg.highlightedText !== msg.userPrompt && (
                        <blockquote className="text-[11px] text-stone-300 italic border-l-2 border-amber-400 pl-2.5 line-clamp-3">
                          &ldquo;{msg.highlightedText}&rdquo;
                        </blockquote>
                      )}
                    </div>
                  </div>
                ) : msg.isError ? (
                  <div
                    key={msg.id}
                    className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-xs text-rose-800 dark:text-rose-200 space-y-2"
                  >
                    <div className="flex items-center gap-1.5 font-bold">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>AI Tutor Request Failed</span>
                    </div>
                    <p>{msg.explanation}</p>
                    {msg.highlightedText && (
                      <button
                        type="button"
                        onClick={() =>
                          void requestTutorExplanation({
                            highlightedText: msg.highlightedText!,
                            mode: msg.mode || 'explain',
                          })
                        }
                        className="px-2.5 py-1 rounded bg-rose-700 hover:bg-rose-800 text-white text-[11px] font-semibold cursor-pointer"
                      >
                        Retry Explanation
                      </button>
                    )}
                  </div>
                ) : (
                  <div
                    key={msg.id}
                    className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950 space-y-2.5 text-xs"
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-stone-500 dark:text-stone-400">
                      <span className="font-bold text-amber-700 dark:text-amber-400">
                        TAI TUTOR BREAKDOWN
                      </span>
                      <span>{msg.timestamp}</span>
                    </div>

                    {msg.summary && (
                      <div className="font-semibold text-stone-900 dark:text-stone-100 leading-snug">
                        {msg.summary}
                      </div>
                    )}

                    <p className="text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-line">
                      {msg.explanation}
                    </p>

                    {msg.keyConcepts && msg.keyConcepts.length > 0 && (
                      <div className="pt-2 border-t border-stone-200/70 dark:border-stone-800 space-y-1">
                        <div className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">
                          Key Concepts
                        </div>
                        <ul className="space-y-1 text-stone-700 dark:text-stone-300">
                          {msg.keyConcepts.map((kc, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">
                                0{idx + 1}.
                              </span>
                              <span>{kc}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {msg.studyCheckQuestion && (
                      <div className="p-2.5 rounded-lg bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 flex items-start gap-2 text-[11px] text-amber-950 dark:text-amber-200">
                        <HelpCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <span>
                          <span className="font-bold">Self-Check: </span>
                          {msg.studyCheckQuestion}
                        </span>
                      </div>
                    )}
                  </div>
                )
              )
            )}

            {isLoading && (
              <div className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 space-y-2 animate-pulse">
                <div className="h-3 w-28 rounded bg-stone-200 dark:bg-stone-800" />
                <div className="h-12 w-full rounded bg-stone-200 dark:bg-stone-800" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Composer */}
          <form
            onSubmit={handleSubmitCustomQuestion}
            className="p-3 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 space-y-2"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-stone-200/70 dark:bg-stone-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => setSelectedMode('explain')}
                  className={`px-2 py-0.5 rounded font-semibold cursor-pointer ${
                    selectedMode === 'explain'
                      ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100'
                      : 'text-stone-600 dark:text-stone-400'
                  }`}
                >
                  Explain
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMode('breakdown')}
                  className={`px-2 py-0.5 rounded font-semibold cursor-pointer ${
                    selectedMode === 'breakdown'
                      ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100'
                      : 'text-stone-600 dark:text-stone-400'
                  }`}
                >
                  Breakdown
                </button>
              </div>
              {selectionOverlay && (
                <button
                  type="button"
                  onClick={() =>
                    void requestTutorExplanation({
                      highlightedText: selectionOverlay.text,
                      mode: selectedMode,
                    })
                  }
                  className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>Explain Highlight</span>
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={draftQuestion}
                onChange={(e) => setDraftQuestion(e.target.value)}
                placeholder="Ask a follow-up question..."
                className="flex-1 px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-600"
              />
              <button
                type="submit"
                disabled={isLoading || !draftQuestion.trim()}
                className="px-3 py-2 rounded-lg bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-stone-200 text-white dark:text-stone-900 text-xs font-semibold inline-flex items-center gap-1 disabled:opacity-50 cursor-pointer shrink-0"
                aria-label="Send question to TAI Tutor"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </aside>
      )}
    </>
  );
};
