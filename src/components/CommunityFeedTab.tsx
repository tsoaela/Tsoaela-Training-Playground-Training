import React, { useState } from 'react';
import { 
  MessageSquare, 
  Heart, 
  Share2, 
  Send, 
  Sparkles, 
  Pin, 
  Code2, 
  ExternalLink, 
  User, 
  Filter, 
  PlusCircle, 
  ShieldCheck, 
  GraduationCap, 
  CheckCircle2, 
  Layers,
  Search,
  X,
  BookOpen
} from 'lucide-react';
import { CommunityPost, CommunityPostTag, CommunityComment, StudyGuide, UserProfile } from '../types';
import { INITIAL_COMMUNITY_POSTS } from '../data/communityData';
import { RegisteredStudyGroupsPanel } from './RegisteredStudyGroupsPanel';

interface CommunityFeedTabProps {
  user: UserProfile;
  isAuthenticated: boolean;
  studyGuides?: StudyGuide[];
  onRequireAuth: (action: () => void, message: string) => void;
  onNavigateToCourse?: (courseId: string) => void;
  onStartStudyRoom?: (courseTitle: string, courseId: string, roomId?: string) => void;
}

export const CommunityFeedTab: React.FC<CommunityFeedTabProps> = ({
  user,
  isAuthenticated,
  studyGuides = [],
  onRequireAuth,
  onNavigateToCourse,
  onStartStudyRoom,
}) => {
  const [posts, setPosts] = useState<CommunityPost[]>(() => {
    try {
      const saved = localStorage.getItem('ttg_community_posts');
      return saved ? JSON.parse(saved) : INITIAL_COMMUNITY_POSTS;
    } catch {
      return INITIAL_COMMUNITY_POSTS;
    }
  });

  const [activeFilter, setActiveFilter] = useState<'All' | CommunityPostTag>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New Post Form State
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTag, setNewTag] = useState<CommunityPostTag>('Academic Update');
  const [newFaculty, setNewFaculty] = useState('Faculty of Frontier AI & Search Theory');
  const [newProjectUrl, setNewProjectUrl] = useState('');
  const [newCodeSnippet, setNewCodeSnippet] = useState('');

  // Comment Thread Expansion State
  const [expandedPostIds, setExpandedPostIds] = useState<Set<string>>(new Set(['post_01']));
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  // Sync to localStorage
  const savePosts = (updated: CommunityPost[]) => {
    setPosts(updated);
    try {
      localStorage.setItem('ttg_community_posts', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleLikePost = (postId: string) => {
    onRequireAuth(() => {
      const updated = posts.map(p => {
        if (p.id === postId) {
          return { ...p, likes: p.likes + 1 };
        }
        return p;
      });
      savePosts(updated);
    }, 'Sign in or register to like and interact with academic posts.');
  };

  const handleAddComment = (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    onRequireAuth(() => {
      const newComment: CommunityComment = {
        id: `comm_${Date.now()}`,
        authorName: user.name || 'Scholar Student',
        authorEmail: user.email || 'scholar@ttg.edu',
        authorRole: 'Registered Scholar',
        content: text,
        timestamp: 'Just now',
        likes: 0
      };

      const updated = posts.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            commentsCount: p.commentsCount + 1,
            comments: [...p.comments, newComment]
          };
        }
        return p;
      });

      savePosts(updated);
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    }, 'Sign in or register to contribute to academic discussions.');
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const newPost: CommunityPost = {
      id: `post_${Date.now()}`,
      title: newTitle.trim(),
      content: newContent.trim(),
      authorName: user.name || 'Registered Scholar',
      authorEmail: user.email || 'scholar@ttg.edu',
      authorRole: 'Academic Scholar & Creator',
      tag: newTag,
      facultyCategory: newFaculty,
      timestamp: 'Just now',
      likes: 1,
      commentsCount: 0,
      comments: [],
      projectUrl: newProjectUrl.trim() || undefined,
      codeSnippet: newCodeSnippet.trim() || undefined
    };

    savePosts([newPost, ...posts]);
    setIsCreateModalOpen(false);
    setNewTitle('');
    setNewContent('');
    setNewProjectUrl('');
    setNewCodeSnippet('');
  };

  const toggleComments = (postId: string) => {
    setExpandedPostIds(prev => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
  };

  const tags: ('All' | CommunityPostTag)[] = [
    'All',
    'Academic Update',
    'Project Showcase',
    'Discussion Thread',
    'Research Thesis',
    'Peer Review'
  ];

  const filteredPosts = posts.filter(p => {
    if (activeFilter !== 'All' && p.tag !== activeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        p.authorName.toLowerCase().includes(q) ||
        (p.facultyCategory && p.facultyCategory.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-8 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Community Feed Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-950 to-purple-950 rounded-3xl p-6 sm:p-8 text-white border border-stone-800 shadow-xl flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 mb-2 uppercase tracking-wider">
            <GraduationCap className="w-4 h-4" />
            <span>Tsoaela Academy & Creator Community</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Academic Community Feed & Project Showcase
          </h2>
          <p className="text-stone-400 text-xs sm:text-sm mt-1 max-w-xl">
            Where scholars, engineering researchers, and creators share formal preprints, thesis updates, open-source models, and peer review threads.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            onRequireAuth(() => {
              setIsCreateModalOpen(true);
            }, 'Sign in or register to publish academic updates and showcases.');
          }}
          className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md shrink-0 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Publish Post or Showcase</span>
        </button>
      </div>

      {/* Registered Study Groups & Real-Time Shared Notes */}
      <RegisteredStudyGroupsPanel
        user={user}
        isAuthenticated={isAuthenticated}
        studyGuides={studyGuides}
        onRequireAuth={onRequireAuth}
        onStartStudyRoom={onStartStudyRoom}
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Category Tag Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {tags.map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setActiveFilter(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeFilter === t
                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-xs'
                  : 'bg-stone-200/70 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-auto sm:min-w-[240px]">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search threads, papers, creators..."
            className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 focus:outline-none focus:border-purple-500 text-stone-900 dark:text-stone-100"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Posts List */}
      <div className="space-y-6">
        {filteredPosts.map(post => {
          const isExpanded = expandedPostIds.has(post.id);

          return (
            <article 
              key={post.id}
              className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm hover:shadow-md transition-all space-y-4"
            >
              {/* Post Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-700 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-sm">
                    {post.authorName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs sm:text-sm text-stone-900 dark:text-stone-100">
                        {post.authorName}
                      </span>
                      <span className="text-[10px] text-stone-400">· {post.timestamp}</span>
                    </div>
                    <span className="text-[11px] text-stone-500 dark:text-stone-400 block">
                      {post.authorRole}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {post.pinned && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 text-[10px] font-bold flex items-center gap-1 border border-amber-200 dark:border-amber-800">
                      <Pin className="w-3 h-3 fill-current" />
                      Pinned
                    </span>
                  )}
                  <span className="px-2.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 text-[10px] font-bold border border-purple-200 dark:border-purple-800">
                    {post.tag}
                  </span>
                </div>
              </div>

              {/* Faculty & Related Course Banner */}
              {(post.facultyCategory || post.relatedCourseTitle) && (
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-stone-500 dark:text-stone-400 pt-1">
                  {post.facultyCategory && (
                    <span className="font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5" />
                      {post.facultyCategory}
                    </span>
                  )}
                  {post.relatedCourseTitle && (
                    <>
                      <span>·</span>
                      <button
                        type="button"
                        onClick={() => post.relatedCourseId && onNavigateToCourse?.(post.relatedCourseId)}
                        className="hover:underline text-purple-600 dark:text-purple-400 font-semibold cursor-pointer"
                      >
                        Course: {post.relatedCourseTitle}
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Title & Body */}
              <div className="space-y-2">
                <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100">
                  {post.title}
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed whitespace-pre-line">
                  {post.content}
                </p>
              </div>

              {/* Code Snippet (if available) */}
              {post.codeSnippet && (
                <div className="p-3.5 rounded-xl bg-stone-950 text-stone-200 font-mono text-[11px] border border-stone-800 overflow-x-auto">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-800 text-[10px] text-stone-400">
                    <span className="flex items-center gap-1">
                      <Code2 className="w-3.5 h-3.5" />
                      Code / Model Verification
                    </span>
                    <span>Python 3.12</span>
                  </div>
                  <pre>{post.codeSnippet}</pre>
                </div>
              )}

              {/* Project / Repository Link */}
              {post.projectUrl && (
                <div className="pt-1">
                  <a
                    href={post.projectUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>View Repository / Live Demo</span>
                  </a>
                </div>
              )}

              {/* Post Actions Dock */}
              <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => handleLikePost(post.id)}
                    className="flex items-center gap-1.5 text-stone-500 hover:text-rose-500 transition-colors font-medium cursor-pointer"
                  >
                    <Heart className="w-4 h-4 hover:fill-rose-500" />
                    <span>{post.likes}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleComments(post.id)}
                    className="flex items-center gap-1.5 text-stone-500 hover:text-purple-600 transition-colors font-medium cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>{post.commentsCount} Discussions</span>
                  </button>
                </div>

                {/* Quick Join Study Room if linked to course */}
                {post.relatedCourseTitle && onStartStudyRoom && (
                  <button
                    type="button"
                    onClick={() => onStartStudyRoom(post.relatedCourseTitle || 'Course Group', post.relatedCourseId || 'general')}
                    className="px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Launch WebRTC study room for this topic"
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    <span>Launch Study Room</span>
                  </button>
                )}
              </div>

              {/* Comments Accordion Thread */}
              {isExpanded && (
                <div className="pt-4 border-t border-stone-100 dark:border-stone-800/80 space-y-3 bg-stone-50/60 dark:bg-stone-950/40 p-4 rounded-xl">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                    Peer Discussion Thread ({post.comments.length})
                  </h4>

                  {post.comments.map(c => (
                    <div key={c.id} className="p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-stone-900 dark:text-stone-100">{c.authorName}</span>
                          <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">({c.authorRole})</span>
                        </div>
                        <span className="text-[10px] text-stone-400">{c.timestamp}</span>
                      </div>
                      <p className="text-stone-700 dark:text-stone-300 leading-relaxed text-[11px]">
                        {c.content}
                      </p>
                    </div>
                  ))}

                  {/* Add Comment Input */}
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="text"
                      value={commentInputs[post.id] || ''}
                      onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddComment(post.id);
                        }
                      }}
                      placeholder="Add an analytical observation or question..."
                      className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-purple-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddComment(post.id)}
                      className="p-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white transition-colors cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {/* Create New Post Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 p-6 sm:p-8 space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                  Publish Academic Post or Showcase
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 text-stone-400 hover:text-stone-600 rounded-xl"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Post Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Heuristic Search Bounds in Large Language Models"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Tag / Category
                  </label>
                  <select
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value as CommunityPostTag)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-purple-500"
                  >
                    <option value="Academic Update">Academic Update</option>
                    <option value="Project Showcase">Project Showcase</option>
                    <option value="Discussion Thread">Discussion Thread</option>
                    <option value="Research Thesis">Research Thesis</option>
                    <option value="Peer Review">Peer Review</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Academic Faculty
                  </label>
                  <select
                    value={newFaculty}
                    onChange={(e) => setNewFaculty(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-purple-500"
                  >
                    <option value="Faculty of Frontier AI & Search Theory">Faculty of Frontier AI & Search Theory</option>
                    <option value="Faculty of Cognitive Architecture">Faculty of Cognitive Architecture</option>
                    <option value="Faculty of Sovereign Economics">Faculty of Sovereign Economics</option>
                    <option value="Faculty of Autonomous Swarms">Faculty of Autonomous Swarms</option>
                    <option value="Faculty of Mechanism Design">Faculty of Mechanism Design</option>
                    <option value="Faculty of Creative Arts & Media Tech">Faculty of Creative Arts & Media Tech</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Content / Abstract / Thesis *
                </label>
                <textarea
                  rows={4}
                  required
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Share details of your research findings, project highlights, or discussion prompt..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Code Snippet / Mathematical Formulation (Optional)
                </label>
                <textarea
                  rows={3}
                  value={newCodeSnippet}
                  onChange={(e) => setNewCodeSnippet(e.target.value)}
                  placeholder="def mcts_eval(node): ..."
                  className="w-full font-mono px-3.5 py-2 rounded-xl bg-stone-950 text-stone-100 text-[11px] border border-stone-800 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Demo / GitHub / Paper URL (Optional)
                </label>
                <input
                  type="url"
                  value={newProjectUrl}
                  onChange={(e) => setNewProjectUrl(e.target.value)}
                  placeholder="https://github.com/..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="pt-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  Publish to Community Feed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
