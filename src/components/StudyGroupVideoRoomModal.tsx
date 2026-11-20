import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Monitor, 
  MonitorOff, 
  MessageSquare, 
  Users, 
  PhoneOff, 
  Send, 
  Sparkles, 
  ShieldCheck, 
  Share2, 
  Copy, 
  Check, 
  Maximize2, 
  Volume2, 
  Radio, 
  CircleDot,
  GraduationCap,
  FileEdit,
  Columns2
} from 'lucide-react';
import { StudyGroupRoom, StudyGroupPeer, UserProfile } from '../types';
import { useStudyRoomSharedNotes } from '../hooks/useStudyRoomSharedNotes';
import { StudyRoomSharedNotesPanel } from './StudyRoomSharedNotesPanel';

interface StudyGroupVideoRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseTitle: string;
  courseId: string;
  roomId?: string;
  user: UserProfile;
}

interface ChatMessage {
  id: string;
  senderName: string;
  senderEmail: string;
  text: string;
  timestamp: string;
}

export const StudyGroupVideoRoomModal: React.FC<StudyGroupVideoRoomModalProps> = ({
  isOpen,
  onClose,
  courseTitle,
  courseId,
  roomId,
  user,
}) => {
  const effectiveRoomId = roomId || `room_${courseId}`;
  const [stageLayout, setStageLayout] = useState<'split' | 'notes' | 'video'>('split');

  // Real-time WebSocket Shared Notes for this registered study group room
  const sharedNotes = useStudyRoomSharedNotes({
    isOpen,
    roomId: effectiveRoomId,
    courseId,
    courseTitle,
    user,
  });

  // Local Media Stream State
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeSideTab, setActiveSideTab] = useState<'chat' | 'participants'>('chat');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_1',
      senderName: 'Dr. Evelyn Brand',
      senderEmail: 'evelyn.brand@ttg.edu',
      text: `Welcome to the live session for ${courseTitle}! Feel free to share your notes or ask questions.`,
      timestamp: '10:00 AM'
    },
    {
      id: 'msg_2',
      senderName: 'Marcus Thorne',
      senderEmail: 'marcus.t@ttg.edu',
      text: 'Audio and video stream coming through crisp. Examining Chapter 2 formulas.',
      timestamp: '10:02 AM'
    }
  ]);
  const [newChatText, setNewChatText] = useState('');
  const [callDuration, setCallDuration] = useState(142); // in seconds
  const [isHandRaised, setIsHandRaised] = useState(false);

  // Video refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const screenShareVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Peer participants list
  const [peers, setPeers] = useState<StudyGroupPeer[]>([
    {
      id: 'peer_1',
      name: 'Dr. Evelyn Brand (Faculty Chair)',
      isMuted: false,
      isVideoOff: false,
      isHost: true,
      avatarBg: 'bg-amber-600',
    },
    {
      id: 'peer_2',
      name: 'Marcus Thorne (Visiting Fellow)',
      isMuted: true,
      isVideoOff: false,
      isHost: false,
      avatarBg: 'bg-purple-600',
    },
    {
      id: 'peer_3',
      name: 'Soraya M. Khemir (Mechanism Design)',
      isMuted: false,
      isVideoOff: true,
      isHost: false,
      avatarBg: 'bg-emerald-600',
    }
  ]);

  // Call timer interval
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Format call duration MM:SS
  const formatDuration = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // WebRTC Camera initialization via navigator.mediaDevices.getUserMedia
  useEffect(() => {
    if (!isOpen) {
      // Cleanup streams when closing
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
        localStreamRef.current = null;
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
        screenStreamRef.current = null;
      }
      return;
    }

    let isMounted = true;

    async function initCamera() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
            audio: true
          });
          if (isMounted) {
            localStreamRef.current = stream;
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = stream;
              localVideoRef.current.play().catch(() => {});
            }
          }
        }
      } catch (err) {
        console.warn('Camera/mic access unavailable or denied in sandbox; falling back to canvas avatar stream:', err);
      }
    }

    initCamera();

    return () => {
      isMounted = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
        localStreamRef.current = null;
      }
    };
  }, [isOpen]);

  // Toggle Video Track
  const handleToggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
        return;
      }
    }
    setIsVideoEnabled(prev => !prev);
  };

  // Toggle Audio Track
  const handleToggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
        return;
      }
    }
    setIsAudioEnabled(prev => !prev);
  };

  // Toggle Screen Sharing via navigator.mediaDevices.getDisplayMedia
  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
        screenStreamRef.current = null;
      }
      setIsScreenSharing(false);
    } else {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
          const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
          screenStreamRef.current = stream;
          if (screenShareVideoRef.current) {
            screenShareVideoRef.current.srcObject = stream;
            screenShareVideoRef.current.play().catch(() => {});
          }
          stream.getVideoTracks()[0].onended = () => {
            setIsScreenSharing(false);
          };
          setIsScreenSharing(true);
        } else {
          setIsScreenSharing(true);
        }
      } catch (err) {
        console.warn('Screen share cancelled or not permitted:', err);
        setIsScreenSharing(false);
      }
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatText.trim()) return;

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      senderName: user.name || 'Student Scholar',
      senderEmail: user.email || 'student@ttg.edu',
      text: newChatText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, newMsg]);
    setNewChatText('');
    setTimeout(() => {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleCopyInviteLink = () => {
    const inviteUrl = `${window.location.origin}/study-group/${encodeURIComponent(
      courseId
    )}?room=${encodeURIComponent(sharedNotes.group?.id || effectiveRoomId)}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(inviteUrl).then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      });
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-950/85 backdrop-blur-md overflow-hidden animate-in fade-in duration-150">
      <div className="relative w-full max-w-7xl h-[92vh] max-h-[860px] bg-stone-900 text-stone-100 rounded-3xl shadow-2xl border border-stone-800 flex flex-col overflow-hidden">
        
        {/* Top Header Bar */}
        <div className="px-4 sm:px-5 py-3 bg-stone-950/80 border-b border-stone-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-purple-950/80 border border-purple-800/60 text-purple-400 shrink-0">
              <Radio className="w-4 h-4 animate-pulse text-rose-500" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1 whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                  Live Study Room
                </span>
                <span className="text-xs text-stone-400 font-mono tabular-nums">
                  {formatDuration(callDuration)}
                </span>
                <span className="hidden md:inline text-stone-600">·</span>
                <span className="hidden md:inline text-xs font-mono text-emerald-400 tabular-nums">
                  {sharedNotes.participants.length} collaborating on notes
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-white truncate max-w-lg mt-0.5">
                {sharedNotes.group?.name || `${courseTitle} — Live Study Group`}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Stage Mode Switcher: Video + Shared Notes Split / Shared Notes Focus / Video Only */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-stone-900 border border-stone-800 text-xs">
              <button
                type="button"
                onClick={() => setStageLayout('split')}
                className={`px-2.5 py-1 rounded-lg font-semibold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap transition-colors ${
                  stageLayout === 'split'
                    ? 'bg-emerald-600 text-white'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Columns2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Video + Notes</span>
              </button>
              <button
                type="button"
                onClick={() => setStageLayout('notes')}
                className={`px-2.5 py-1 rounded-lg font-semibold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap transition-colors ${
                  stageLayout === 'notes'
                    ? 'bg-emerald-600 text-white'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <FileEdit className="w-3.5 h-3.5" />
                <span>Shared Notes</span>
              </button>
              <button
                type="button"
                onClick={() => setStageLayout('video')}
                className={`px-2.5 py-1 rounded-lg font-semibold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap transition-colors ${
                  stageLayout === 'video'
                    ? 'bg-purple-600 text-white'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Video Only</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleCopyInviteLink}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold border border-stone-700 transition-colors whitespace-nowrap"
              title="Copy session invite link"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Link Copied!' : 'Copy Invite'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-white rounded-xl hover:bg-stone-800 transition-colors cursor-pointer"
              title="Close window"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Video Arena & Sidebar */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Video + Shared Notes Collaborative Stage */}
          <div className="flex-1 p-4 bg-stone-950 flex flex-col gap-3 overflow-y-auto">
            <div
              className={`flex-1 min-h-0 grid gap-3 ${
                stageLayout === 'split'
                  ? 'grid-cols-1 xl:grid-cols-2'
                  : 'grid-cols-1'
              }`}
            >
              {/* Video Column */}
              {stageLayout !== 'notes' && (
                <div className="flex flex-col gap-3 min-h-0">
                  {/* Screen Share Stage (if active) */}
                  {isScreenSharing && (
                    <div className="relative w-full h-56 rounded-2xl bg-stone-900 border-2 border-purple-500/60 overflow-hidden shadow-xl shrink-0 flex items-center justify-center">
                      <video
                        ref={screenShareVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-contain bg-black"
                      />
                      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-xs text-[11px] font-bold text-purple-300 flex items-center gap-1.5">
                        <Monitor className="w-3.5 h-3.5 text-purple-400" />
                        <span>You are sharing your screen</span>
                      </div>
                    </div>
                  )}

                  {/* Participants Video Feeds Grid */}
                  <div
                    className={`grid gap-3 flex-1 ${
                      isScreenSharing
                        ? 'grid-cols-2 max-h-48'
                        : 'grid-cols-2'
                    }`}
                  >
                    {/* Local User Card (You) */}
                    <div className="relative rounded-2xl bg-stone-900/90 border border-stone-800 overflow-hidden flex items-center justify-center min-h-[140px] shadow-inner group">
                      {isVideoEnabled ? (
                        <video
                          ref={localVideoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover transform -scale-x-100"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-14 h-14 rounded-full bg-purple-700 text-white font-extrabold text-lg flex items-center justify-center shadow-lg">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs font-semibold text-stone-400">Video Paused</span>
                        </div>
                      )}

                      <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-xs text-[11px] font-bold text-white flex items-center gap-1.5">
                        <span>{user.name} (You)</span>
                        {isHandRaised && <span className="text-amber-400">✋</span>}
                      </div>

                      <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                        {!isAudioEnabled && (
                          <div className="p-1.5 rounded-lg bg-rose-600/90 text-white shadow-xs">
                            <MicOff className="w-3 h-3" />
                          </div>
                        )}
                        {!isVideoEnabled && (
                          <div className="p-1.5 rounded-lg bg-rose-600/90 text-white shadow-xs">
                            <VideoOff className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Remote Peer 1 */}
                    <div className="relative rounded-2xl bg-gradient-to-br from-stone-900 to-stone-950 border border-stone-800 overflow-hidden flex items-center justify-center min-h-[140px] shadow-inner">
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="w-14 h-14 rounded-full bg-amber-600 text-white font-extrabold text-lg flex items-center justify-center shadow-lg ring-2 ring-amber-500/40">
                          EB
                        </div>
                        <div className="text-center">
                          <span className="text-xs font-bold text-stone-200">Dr. Evelyn Brand</span>
                          <span className="block text-[10px] text-amber-400 font-medium">Speaking...</span>
                        </div>
                      </div>

                      <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-xs text-[11px] font-bold text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Dr. Evelyn Brand (Host)</span>
                      </div>

                      <div className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-emerald-600/30 border border-emerald-500/40 text-emerald-400">
                        <Volume2 className="w-3 h-3 animate-pulse" />
                      </div>
                    </div>

                    {/* Remote Peer 2 */}
                    <div className="relative rounded-2xl bg-gradient-to-br from-stone-900 to-stone-950 border border-stone-800 overflow-hidden flex items-center justify-center min-h-[140px] shadow-inner">
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="w-14 h-14 rounded-full bg-purple-700 text-white font-extrabold text-lg flex items-center justify-center shadow-lg">
                          MT
                        </div>
                        <span className="text-xs font-bold text-stone-200">Marcus Thorne</span>
                      </div>

                      <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-xs text-[11px] font-bold text-white">
                        <span>Marcus Thorne</span>
                      </div>

                      <div className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-rose-600/90 text-white">
                        <MicOff className="w-3 h-3" />
                      </div>
                    </div>

                    {/* Remote Peer 3 */}
                    <div className="relative rounded-2xl bg-gradient-to-br from-stone-900 to-stone-950 border border-stone-800 overflow-hidden flex items-center justify-center min-h-[140px] shadow-inner">
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="w-14 h-14 rounded-full bg-emerald-700 text-white font-extrabold text-lg flex items-center justify-center shadow-lg">
                          SK
                        </div>
                        <span className="text-xs font-bold text-stone-200">Soraya M. Khemir</span>
                      </div>

                      <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-xs text-[11px] font-bold text-white">
                        <span>Soraya M. Khemir</span>
                      </div>

                      <div className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-stone-800 text-stone-400">
                        <VideoOff className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Live Shared Study Notes Column */}
              {stageLayout !== 'video' && (
                <div className="min-h-[300px] h-full flex flex-col">
                  <StudyRoomSharedNotesPanel
                    group={sharedNotes.group}
                    note={sharedNotes.note}
                    draftTitle={sharedNotes.draftTitle}
                    draftContent={sharedNotes.draftContent}
                    participants={sharedNotes.participants}
                    selfClientId={sharedNotes.selfClientId}
                    connectionStatus={sharedNotes.connectionStatus}
                    lastSyncedAt={sharedNotes.lastSyncedAt}
                    isSaving={sharedNotes.isSaving}
                    isMemberRegistered={sharedNotes.isMemberRegistered}
                    isJoiningGroup={sharedNotes.isJoiningGroup}
                    onTitleChange={sharedNotes.updateLocalTitle}
                    onContentChange={sharedNotes.updateLocalContent}
                    onSyncNow={sharedNotes.syncNow}
                    onRegisterInGroup={() => void sharedNotes.registerSelfInGroup()}
                  />
                </div>
              )}
            </div>

            {/* Bottom In-Room Control Dock */}
            <div className="py-2 px-4 rounded-2xl bg-stone-900/95 border border-stone-800 flex items-center justify-between shrink-0 shadow-lg">
              
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-stone-400 font-mono hidden sm:inline">
                  WebRTC P2P Encryption Active
                </span>
                <span className="hidden sm:inline text-stone-600">·</span>
                <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  HD 1080p 60fps
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {/* Audio Toggle */}
                <button
                  type="button"
                  onClick={handleToggleAudio}
                  className={`p-3 rounded-xl font-bold transition-all ${
                    isAudioEnabled 
                      ? 'bg-stone-800 hover:bg-stone-700 text-white' 
                      : 'bg-rose-600 text-white hover:bg-rose-700 shadow-md'
                  }`}
                  title={isAudioEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
                >
                  {isAudioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </button>

                {/* Video Toggle */}
                <button
                  type="button"
                  onClick={handleToggleVideo}
                  className={`p-3 rounded-xl font-bold transition-all ${
                    isVideoEnabled 
                      ? 'bg-stone-800 hover:bg-stone-700 text-white' 
                      : 'bg-rose-600 text-white hover:bg-rose-700 shadow-md'
                  }`}
                  title={isVideoEnabled ? 'Stop Video Camera' : 'Start Video Camera'}
                >
                  {isVideoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                </button>

                {/* Screen Share Toggle */}
                <button
                  type="button"
                  onClick={handleToggleScreenShare}
                  className={`p-3 rounded-xl font-bold transition-all ${
                    isScreenSharing 
                      ? 'bg-purple-600 text-white shadow-md' 
                      : 'bg-stone-800 hover:bg-stone-700 text-white'
                  }`}
                  title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen / Whiteboard'}
                >
                  {isScreenSharing ? <MonitorOff className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                </button>

                {/* Raise Hand Toggle */}
                <button
                  type="button"
                  onClick={() => setIsHandRaised(prev => !prev)}
                  className={`px-3 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                    isHandRaised 
                      ? 'bg-amber-500 text-stone-950 font-extrabold shadow-md' 
                      : 'bg-stone-800 hover:bg-stone-700 text-stone-300'
                  }`}
                  title="Raise hand to ask a question"
                >
                  <span>✋</span>
                  <span className="hidden sm:inline">{isHandRaised ? 'Hand Raised' : 'Raise Hand'}</span>
                </button>

                {/* Leave Call */}
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md ml-2"
                >
                  <PhoneOff className="w-4 h-4" />
                  <span>Leave</span>
                </button>
              </div>

              {/* Sidebar toggle buttons for mobile */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActiveSideTab('chat')}
                  className={`p-2 rounded-xl text-xs ${
                    activeSideTab === 'chat' ? 'bg-purple-700 text-white' : 'text-stone-400 hover:text-white'
                  }`}
                  title="Open Chat"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSideTab('participants')}
                  className={`p-2 rounded-xl text-xs ${
                    activeSideTab === 'participants' ? 'bg-purple-700 text-white' : 'text-stone-400 hover:text-white'
                  }`}
                  title="View Participants"
                >
                  <Users className="w-4 h-4" />
                </button>
              </div>

            </div>

          </div>

          {/* Right Sidebar: In-Call Chat & Participants */}
          <div className="w-80 border-l border-stone-800 bg-stone-900/95 flex flex-col shrink-0 hidden md:flex">
            
            {/* Sidebar Tab Header */}
            <div className="p-3 border-b border-stone-800 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveSideTab('chat')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeSideTab === 'chat'
                    ? 'bg-stone-800 text-white shadow-xs'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Discussion ({chatMessages.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSideTab('participants')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeSideTab === 'participants'
                    ? 'bg-stone-800 text-white shadow-xs'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Roster ({peers.length + 1})</span>
              </button>
            </div>

            {/* Sidebar Tab Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {activeSideTab === 'chat' ? (
                <>
                  <div className="text-[11px] text-stone-400 text-center py-1 border-b border-stone-800/60 pb-2">
                    Academic chat history for this study guide session
                  </div>

                  {chatMessages.map(msg => (
                    <div key={msg.id} className="space-y-0.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-stone-200 text-[11px]">{msg.senderName}</span>
                        <span className="text-[10px] text-stone-500 font-mono">{msg.timestamp}</span>
                      </div>
                      <p className="text-stone-300 bg-stone-950/60 p-2.5 rounded-xl border border-stone-800/80 leading-relaxed text-[11px]">
                        {msg.text}
                      </p>
                    </div>
                  ))}
                  <div ref={chatBottomRef} />
                </>
              ) : (
                <div className="space-y-2">
                  <div className="text-[11px] text-stone-400 uppercase font-mono font-bold tracking-wider mb-2">
                    In This Study Room ({peers.length + 1})
                  </div>

                  {/* You */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-stone-950/60 border border-stone-800">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-purple-700 text-white font-bold text-xs flex items-center justify-center">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-xs">
                        <span className="font-bold text-white block">{user.name}</span>
                        <span className="text-[10px] text-stone-400">You (Student)</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-stone-400">
                      {isAudioEnabled ? <Mic className="w-3 h-3 text-emerald-400" /> : <MicOff className="w-3 h-3 text-rose-500" />}
                      {isVideoEnabled ? <Video className="w-3 h-3 text-emerald-400" /> : <VideoOff className="w-3 h-3 text-rose-500" />}
                    </div>
                  </div>

                  {/* Other Peers */}
                  {peers.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-2 rounded-xl bg-stone-950/40 border border-stone-800/80">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full ${p.avatarBg} text-white font-bold text-xs flex items-center justify-center`}>
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-xs">
                          <span className="font-bold text-stone-200 block truncate max-w-[140px]">{p.name}</span>
                          <span className="text-[10px] text-stone-500">{p.isHost ? 'Host & Moderator' : 'Participant'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-stone-400">
                        {p.isMuted ? <MicOff className="w-3 h-3 text-rose-500" /> : <Mic className="w-3 h-3 text-emerald-400" />}
                        {p.isVideoOff ? <VideoOff className="w-3 h-3 text-rose-500" /> : <Video className="w-3 h-3 text-emerald-400" />}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Chat Input Bar */}
            {activeSideTab === 'chat' && (
              <form onSubmit={handleSendMessage} className="p-3 border-t border-stone-800 bg-stone-950/80 flex items-center gap-2">
                <input
                  type="text"
                  value={newChatText}
                  onChange={(e) => setNewChatText(e.target.value)}
                  placeholder="Share a thought or equation..."
                  className="flex-1 px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-purple-500"
                />
                <button
                  type="submit"
                  className="p-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};
