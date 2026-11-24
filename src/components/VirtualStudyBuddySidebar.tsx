import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Brain, BookOpen, RotateCw, CheckCircle2, ChevronRight, ChevronLeft, HelpCircle, Award, Lightbulb, Zap, X, Mic, MicOff, Volume2 } from 'lucide-react';
import { StudyGuide } from '../types';

interface VirtualStudyBuddySidebarProps {
  currentCourse?: StudyGuide | null;
  activeChapterTitle?: string;
  completedChaptersCount?: number;
  totalChapters?: number;
  onClose?: () => void;
}

interface FlashcardItem {
  front: string;
  back: string;
  hint: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export const VirtualStudyBuddySidebar: React.FC<VirtualStudyBuddySidebarProps> = ({
  currentCourse,
  activeChapterTitle,
  completedChaptersCount = 1,
  totalChapters = 8,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deckTitle, setDeckTitle] = useState<string>('Active Module Master Deck');
  const [buddyTip, setBuddyTip] = useState<string>("Hi! I'm your Virtual Study Buddy. Click below to generate AI flashcards tailored to your active chapter progress.");
  const [flashcards, setFlashcards] = useState<FlashcardItem[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [masteredCards, setMasteredCards] = useState<Set<number>>(new Set());

  // Voice Mode state
  const [voiceModeActive, setVoiceModeActive] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [lastTranscript, setLastTranscript] = useState<string>('');
  const recognitionRef = useRef<any>(null);

  // Text-to-Speech helper
  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Initialize Speech Recognition for Voice Commands
  useEffect(() => {
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionAPI && voiceModeActive) {
      try {
        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
          setLastTranscript(transcript);

          if (transcript.includes('flip') || transcript.includes('turn') || transcript.includes('show')) {
            setIsFlipped((prev) => {
              const next = !prev;
              if (flashcards[currentIdx]) {
                speakText(next ? flashcards[currentIdx].back : flashcards[currentIdx].front);
              }
              return next;
            });
          } else if (transcript.includes('next') || transcript.includes('forward') || transcript.includes('skip')) {
            handleNext();
          } else if (transcript.includes('back') || transcript.includes('previous')) {
            handlePrev();
          } else if (transcript.includes('got it') || transcript.includes('master') || transcript.includes('pass')) {
            handleMarkMastered();
          } else if (transcript.includes('read') || transcript.includes('speak')) {
            if (flashcards[currentIdx]) {
              speakText(isFlipped ? flashcards[currentIdx].back : flashcards[currentIdx].front);
            }
          }
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
          // Auto restart if voice mode remains active
          if (voiceModeActive && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch {
              // ignore
            }
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err) {
        console.warn('Speech recognition start failed:', err);
        setIsListening(false);
      }
    } else if (!voiceModeActive && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
      setIsListening(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, [voiceModeActive, currentIdx, isFlipped, flashcards]);

  const generateFlashcards = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/study-buddy/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseTitle: currentCourse?.title || 'Advanced Academic Guide',
          chapterTitle: activeChapterTitle || currentCourse?.chapters?.[0]?.title || 'Core Module Concepts',
          completedChaptersCount,
          totalChapters: currentCourse?.chapters?.length || totalChapters,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate flashcards.');
      }

      setDeckTitle(data.sessionTitle || 'Active Chapter Flashcards');
      setBuddyTip(data.buddyTip || 'Review each concept carefully to solidify your understanding.');
      setFlashcards(data.flashcards || []);
      setCurrentIdx(0);
      setIsFlipped(false);
      setMasteredCards(new Set());
      if (data.flashcards?.[0]) {
        speakText(data.flashcards[0].front);
      }
    } catch (err: any) {
      console.error('Error generating flashcards:', err);
      setError(err?.message || 'Unable to connect to Gemini AI study service.');
    } finally {
      setLoading(false);
    }
  };

  const currentCard = flashcards[currentIdx];

  const handleMarkMastered = () => {
    const nextMastered = new Set(masteredCards);
    nextMastered.add(currentIdx);
    setMasteredCards(nextMastered);
    if (currentIdx < flashcards.length - 1) {
      const nextIdx = currentIdx + 1;
      setCurrentIdx(nextIdx);
      setIsFlipped(false);
      if (flashcards[nextIdx]) {
        speakText(flashcards[nextIdx].front);
      }
    }
  };

  const handleNext = () => {
    if (currentIdx < flashcards.length - 1) {
      const nextIdx = currentIdx + 1;
      setCurrentIdx(nextIdx);
      setIsFlipped(false);
      if (flashcards[nextIdx]) {
        speakText(flashcards[nextIdx].front);
      }
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      const prevIdx = currentIdx - 1;
      setCurrentIdx(prevIdx);
      setIsFlipped(false);
      if (flashcards[prevIdx]) {
        speakText(flashcards[prevIdx].front);
      }
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              Virtual Study Buddy <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">Gemini AI</span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Context-aware flashcards & voice coach</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setVoiceModeActive(!voiceModeActive)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              voiceModeActive
                ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30 animate-pulse'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
            title={voiceModeActive ? 'Disable Voice Mode' : 'Enable Voice Mode (Hands-free commands)'}
          >
            {voiceModeActive ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{voiceModeActive ? 'Voice ON' : 'Voice Mode'}</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Voice Mode Status Banner */}
      {voiceModeActive && (
        <div className="mt-3 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-center justify-between text-xs text-rose-800 dark:text-rose-200">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
            <span>Say: <strong>"Flip"</strong>, <strong>"Next"</strong>, <strong>"Back"</strong>, <strong>"Got it"</strong>, or <strong>"Read"</strong></span>
          </div>
          {lastTranscript && <span className="italic opacity-80 text-[10px]"> Heard: "{lastTranscript}"</span>}
        </div>
      )}

      {/* Active Context Banner */}
      <div className="my-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs">
        <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200 mb-1">
          <span className="truncate max-w-[200px]" title={currentCourse?.title || 'Study Guide'}>
            {currentCourse?.title || 'General Academic Course'}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold">
            Ch. {completedChaptersCount} / {currentCourse?.chapters?.length || totalChapters}
          </span>
        </div>
        <div className="text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
          <BookOpen className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          <span>Active: {activeChapterTitle || currentCourse?.chapters?.[completedChaptersCount - 1]?.title || 'Core Module Concepts'}</span>
        </div>
      </div>

      {/* Buddy Tip Box */}
      <div className="mb-4 p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex items-start gap-2.5">
        <Lightbulb className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
        <p className="text-xs text-indigo-900 dark:text-indigo-200 leading-relaxed">{buddyTip}</p>
      </div>

      {/* Main Content Area */}
      {flashcards.length === 0 ? (
        <div className="py-8 px-4 text-center flex flex-col items-center justify-center my-auto">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h5 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Ready to Generate Flashcards</h5>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[240px] mb-5">
            Your Virtual Study Buddy will instantly synthesize high-yield review cards for your active chapter.
          </p>
          <button
            onClick={generateFlashcards}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                Synthesizing with Gemini AI...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Active Flashcards
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="flex flex-col flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Card {currentIdx + 1} of {flashcards.length}
            </span>
            <div className="flex items-center gap-1.5">
              <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                currentCard?.difficulty === 'Hard' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300' :
                currentCard?.difficulty === 'Medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' :
                'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
              }`}>
                {currentCard?.difficulty}
              </span>
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                {masteredCards.size} mastered
              </span>
            </div>
          </div>

          {/* Flashcard Flip Card */}
          <div
            onClick={() => {
              const nextFlipped = !isFlipped;
              setIsFlipped(nextFlipped);
              if (currentCard) {
                speakText(nextFlipped ? currentCard.back : currentCard.front);
              }
            }}
            className={`relative min-h-[190px] rounded-2xl border p-5 cursor-pointer transition-all duration-300 flex flex-col justify-between shadow-sm select-none ${
              isFlipped
                ? 'bg-indigo-900 text-white border-indigo-800 shadow-indigo-900/20'
                : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] opacity-75">
              <span>{isFlipped ? 'Answer / Explanation' : 'Concept Question'}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (currentCard) {
                      speakText(isFlipped ? currentCard.back : currentCard.front);
                    }
                  }}
                  className="p-1 rounded hover:bg-white/20 transition-colors"
                  title="Read aloud"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
                <span className="flex items-center gap-1 text-[10px] font-medium">
                  <RotateCw className="w-3 h-3" /> Click to flip
                </span>
              </div>
            </div>

            <div className="my-auto py-3 text-center">
              <p className="text-sm font-semibold leading-relaxed">
                {isFlipped ? currentCard?.back : currentCard?.front}
              </p>
            </div>

            <div className="text-[11px] opacity-80 pt-2 border-t border-current/10 flex items-center justify-between">
              <span>Hint: {currentCard?.hint}</span>
              {masteredCards.has(currentIdx) && (
                <span className="text-emerald-400 flex items-center gap-1 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Mastered
                </span>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between gap-2 mt-4">
            <button
              onClick={handlePrev}
              disabled={currentIdx === 0}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={handleMarkMastered}
              className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" /> Got it! Next
            </button>

            <button
              onClick={handleNext}
              disabled={currentIdx === flashcards.length - 1}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <button
              onClick={generateFlashcards}
              disabled={loading}
              className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" /> Regenerate Deck
            </button>
            <span className="text-slate-400">{Math.round(((currentIdx + 1) / flashcards.length) * 100)}% reviewed</span>
          </div>
        </div>
      )}
    </div>
  );
};
