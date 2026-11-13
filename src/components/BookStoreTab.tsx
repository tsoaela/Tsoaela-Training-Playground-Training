import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Download, 
  Star, 
  Sparkles, 
  Search, 
  X, 
  Upload, 
  DollarSign, 
  Bookmark, 
  FileText, 
  CheckCircle2, 
  ShieldCheck, 
  Sun, 
  Moon, 
  Type, 
  ChevronRight, 
  Headphones, 
  Layers,
  GraduationCap
} from 'lucide-react';
import { BookItem, UserProfile } from '../types';
import { INITIAL_BOOKS } from '../data/storesData';
import { ACADEMIC_FACULTIES } from '../data/academicCatalog';

interface BookStoreTabProps {
  user: UserProfile;
  isAuthenticated: boolean;
  onRequireAuth: (action: () => void, message: string) => void;
  onPurchaseBook: (book: BookItem, format: 'eBook' | 'Print' | 'Audiobook') => void;
}

export const BookStoreTab: React.FC<BookStoreTabProps> = ({
  user,
  isAuthenticated,
  onRequireAuth,
  onPurchaseBook,
}) => {
  const [books, setBooks] = useState<BookItem[]>(() => {
    try {
      const saved = localStorage.getItem('ttg_books');
      if (saved) {
        const parsed: BookItem[] = JSON.parse(saved);
        const facultyNames = new Set(ACADEMIC_FACULTIES.map(f => f.name));
        const hasUpdatedFaculties = parsed.some(b => b.faculty && facultyNames.has(b.faculty));
        if (hasUpdatedFaculties) return parsed;
      }
      return INITIAL_BOOKS;
    } catch {
      return INITIAL_BOOKS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('ttg_books', JSON.stringify(books));
    } catch (e) {
      console.error(e);
    }
  }, [books]);

  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Interactive E-Reader Modal State
  const [readingBook, setReadingBook] = useState<BookItem | null>(null);
  const [readerTheme, setReaderTheme] = useState<'day' | 'sepia' | 'night'>('sepia');
  const [readerFontSize, setReaderFontSize] = useState<number>(16);

  // Author Publishing Modal State
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState(user.name || '');
  const [newGenre, setNewGenre] = useState<BookItem['genre']>('Cognitive Science');
  const [newFaculty, setNewFaculty] = useState<string>(ACADEMIC_FACULTIES[0].name);
  const [newCoverUrl, setNewCoverUrl] = useState('');
  const [newSynopsis, setNewSynopsis] = useState('');
  const [newPages, setNewPages] = useState('320');
  const [newPriceEbook, setNewPriceEbook] = useState('8.99');
  const [newPricePrint, setNewPricePrint] = useState('24.99');
  const [newSampleText, setNewSampleText] = useState('');


  const handleOpenPublishModal = () => {
    onRequireAuth(() => {
      setIsPublishModalOpen(true);
    }, 'Sign in or register as an Author to publish e-books, paperbacks, and monetize your research.');
  };

  const handlePublishSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newAuthor.trim()) return;

    const matchedFaculty = ACADEMIC_FACULTIES.find(f => f.name === newFaculty) || ACADEMIC_FACULTIES[0];

    const newBook: BookItem = {
      id: `book_${Date.now()}`,
      title: newTitle.trim(),
      author: newAuthor.trim(),
      authorId: user.id,
      genre: newGenre,
      faculty: matchedFaculty.name,
      courseCode: `${matchedFaculty.codePrefix}-${Math.floor(100 + Math.random() * 499)}`,
      coverUrl: newCoverUrl.trim() || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800',
      synopsis: newSynopsis.trim() || 'A new foundational release in institutional literature.',
      pages: parseInt(newPages) || 300,
      isbn: `978-0-9981244-${Math.floor(10 + Math.random() * 89)}-${Math.floor(1 + Math.random() * 9)}`,
      publicationYear: new Date().getFullYear(),
      rating: 5.0,
      reviewCount: 1,
      priceEbook: parseFloat(newPriceEbook) || 7.99,
      pricePrint: parseFloat(newPricePrint) || 21.99,
      formats: ['eBook (EPUB/PDF)', 'Collector Paperback'],
      sampleChapterTitle: 'Chapter 1: The Introductory Invariants',
      sampleChapterText: newSampleText.trim() || 'The foundational principles of this text explore systemic models under volatility...',
      tableOfContents: ['1. The Introductory Invariants', '2. Structural Deconstruction', '3. Mechanism Design'],
      authorBio: `${newAuthor.trim()} is an author and institutional scholar.`
    };

    setBooks(prev => [newBook, ...prev]);
    setIsPublishModalOpen(false);
    setNewTitle('');
    setNewSynopsis('');
  };

  const [activeViewMode, setActiveViewMode] = useState<'all' | 'faculty_library'>('faculty_library');
  const [selectedFaculty, setSelectedFaculty] = useState<string>('all');

  const faculties = [
    { id: 'all', label: 'All 6 Faculties' },
    ...ACADEMIC_FACULTIES.map(f => ({
      id: f.name,
      label: `${f.number}. ${f.shortName}`,
    })),
  ];

  const genres = [
    { id: 'all', label: 'All Titles' },
    { id: 'cognitive science', label: 'Cognitive Science' },
    { id: 'law & commerce', label: 'Law & Commerce' },
    { id: 'health & medical sciences', label: 'Health & Medicine' },
    { id: 'science & agriculture', label: 'Science & Agriculture' },
    { id: 'education & pedagogy', label: 'Education & Pedagogy' },
    { id: 'cybernetics & ai', label: 'Cybernetics & AI' },
    { id: 'systems architecture', label: 'Systems Architecture' },
    { id: 'speculative fiction', label: 'Arts & Speculative' }
  ];

  const filteredBooks = books.filter(b => {
    if (activeViewMode === 'faculty_library' && selectedFaculty !== 'all') {
      if (b.faculty !== selectedFaculty) return false;
    } else if (activeViewMode === 'all' && selectedGenre !== 'all') {
      if (b.genre.toLowerCase() !== selectedGenre.toLowerCase()) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        b.title.toLowerCase().includes(q) || 
        b.author.toLowerCase().includes(q) || 
        b.synopsis.toLowerCase().includes(q) ||
        (b.courseCode && b.courseCode.toLowerCase().includes(q)) ||
        (b.faculty && b.faculty.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="bg-stone-50 dark:bg-stone-950 min-h-screen pb-24 text-stone-900 dark:text-stone-100 transition-colors">
      
      {/* Header Banner */}
      <div className="border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/60 px-4 sm:px-8 py-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-purple-600 dark:text-purple-400 mb-1 uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Independent Authors & Academic Publishing House</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Authors Book Store & Faculty Library
            </h1>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-1 max-w-2xl">
              Published treatises, peer-reviewed manuscripts, and books categorized according to course faculties and syllabi. Read sample chapters online or purchase digital e-books and collector paperbacks.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center p-1 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700/60">
              <button
                type="button"
                onClick={() => setActiveViewMode('faculty_library')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeViewMode === 'faculty_library'
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100'
                }`}
              >
                Faculty Course Library
              </button>
              <button
                type="button"
                onClick={() => setActiveViewMode('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeViewMode === 'all'
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100'
                }`}
              >
                All Releases
              </button>
            </div>

            <button
              type="button"
              onClick={handleOpenPublishModal}
              className="px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Publish Your Book (Authors)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Catalog View */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        
        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {activeViewMode === 'faculty_library' ? (
              faculties.map(fac => (
                <button
                  key={fac.id}
                  type="button"
                  onClick={() => setSelectedFaculty(fac.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedFaculty === fac.id
                      ? 'bg-purple-700 text-white shadow-xs'
                      : 'bg-stone-200/70 dark:bg-stone-800/60 hover:bg-stone-300/70 dark:hover:bg-stone-700/60 text-stone-600 dark:text-stone-300'
                  }`}
                >
                  {fac.label}
                </button>
              ))
            ) : (
              genres.map(g => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setSelectedGenre(g.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedGenre === g.id
                      ? 'bg-purple-700 text-white shadow-xs'
                      : 'bg-stone-200/70 dark:bg-stone-800/60 hover:bg-stone-300/70 dark:hover:bg-stone-700/60 text-stone-600 dark:text-stone-300'
                  }`}
                >
                  {g.label}
                </button>
              ))
            )}
          </div>

          <div className="relative w-full sm:w-auto sm:min-w-[260px]">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search faculty books, course codes (FAC-), authors..."
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 focus:outline-none focus:border-purple-500"
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

        {/* Books Shelf Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBooks.map(book => (
            <div 
              key={book.id}
              className="rounded-2xl p-5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-purple-500/50 hover:shadow-xl transition-all flex flex-col justify-between"
            >
              <div className="flex gap-4">
                {/* 3D Book Cover Card */}
                <div 
                  className="w-28 sm:w-32 aspect-2/3 shrink-0 rounded-lg overflow-hidden shadow-lg border border-stone-200 dark:border-stone-800 cursor-pointer group relative"
                  onClick={() => setReadingBook(book)}
                >
                  <img 
                    src={book.coverUrl} 
                    alt={book.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="px-2 py-1 rounded bg-black/70 text-[10px] text-white font-bold">
                      Read Sample
                    </span>
                  </div>
                </div>

                {/* Book Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                      {book.genre}
                    </span>
                    {book.courseCode && (
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                        {book.courseCode}
                      </span>
                    )}
                  </div>

                  <h3 
                    className="text-sm font-bold mt-1 line-clamp-2 cursor-pointer hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                    onClick={() => setReadingBook(book)}
                  >
                    {book.title}
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    by {book.author}
                  </p>

                  {book.faculty && (
                    <div className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-amber-700 dark:text-amber-400">
                      <GraduationCap className="w-3 h-3 shrink-0" />
                      <span className="truncate">{book.faculty}</span>
                    </div>
                  )}

                  {book.syllabusAlignment && (
                    <p className="text-[10px] text-stone-500 dark:text-stone-400 italic mt-0.5 truncate">
                      {book.syllabusAlignment}
                    </p>
                  )}

                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center text-amber-500 text-xs">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span className="font-bold ml-1">{book.rating}</span>
                    </div>
                    <span className="text-[10px] text-stone-400">({book.reviewCount} reviews)</span>
                  </div>

                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-2 line-clamp-2 leading-relaxed">
                    {book.synopsis}
                  </p>
                </div>
              </div>

              {/* Pricing & Reading Actions */}
              <div className="mt-5 pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-stone-400 font-mono block">eBook / EPUB</span>
                  <span className="text-sm font-bold font-mono text-purple-700 dark:text-purple-400">
                    ${book.priceEbook.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setReadingBook(book)}
                    className="px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Sample</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onPurchaseBook(book, 'eBook')}
                    className="px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition-all shadow-xs"
                  >
                    Buy (${book.priceEbook.toFixed(2)})
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>

      {/* Interactive E-Book Reader Modal */}
      {readingBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className={`relative w-full max-w-3xl max-h-[92vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border transition-colors ${
            readerTheme === 'night' 
              ? 'bg-stone-950 text-stone-200 border-stone-800' 
              : readerTheme === 'sepia'
              ? 'bg-[#f8f1e5] text-[#5c4b37] border-[#e8d8c3]'
              : 'bg-white text-stone-900 border-stone-200'
          }`}>
            
            {/* Reader Top Controls */}
            <div className={`px-5 py-3 border-b flex items-center justify-between text-xs transition-colors ${
              readerTheme === 'night' ? 'border-stone-800 bg-stone-900/60' : readerTheme === 'sepia' ? 'border-[#e8d8c3] bg-[#efe2cf]' : 'border-stone-200 bg-stone-50'
            }`}>
              <div className="flex items-center gap-2 min-w-0">
                <BookOpen className="w-4 h-4 shrink-0 text-purple-600" />
                <span className="font-bold truncate max-w-xs">{readingBook.title}</span>
                <span className="opacity-40">·</span>
                <span className="opacity-70 text-[11px] truncate">{readingBook.sampleChapterTitle}</span>
              </div>

              <div className="flex items-center gap-3">
                {/* Font Size controls */}
                <div className="flex items-center gap-1 border rounded-lg px-1.5 py-0.5 text-xs">
                  <button 
                    type="button" 
                    onClick={() => setReaderFontSize(Math.max(13, readerFontSize - 1))}
                    className="px-1 hover:opacity-100 opacity-60 font-bold"
                  >
                    A-
                  </button>
                  <span className="font-mono text-[10px]">{readerFontSize}px</span>
                  <button 
                    type="button" 
                    onClick={() => setReaderFontSize(Math.min(22, readerFontSize + 1))}
                    className="px-1 hover:opacity-100 opacity-60 font-bold"
                  >
                    A+
                  </button>
                </div>

                {/* Theme toggle */}
                <div className="flex items-center gap-1">
                  <button 
                    type="button"
                    onClick={() => setReaderTheme('day')}
                    className={`w-5 h-5 rounded-full bg-white border border-stone-300 shadow-2xs ${readerTheme === 'day' ? 'ring-2 ring-purple-600' : ''}`}
                    title="Light Mode"
                  />
                  <button 
                    type="button"
                    onClick={() => setReaderTheme('sepia')}
                    className={`w-5 h-5 rounded-full bg-[#f8f1e5] border border-[#e8d8c3] shadow-2xs ${readerTheme === 'sepia' ? 'ring-2 ring-purple-600' : ''}`}
                    title="Sepia Mode"
                  />
                  <button 
                    type="button"
                    onClick={() => setReaderTheme('night')}
                    className={`w-5 h-5 rounded-full bg-stone-900 border border-stone-700 shadow-2xs ${readerTheme === 'night' ? 'ring-2 ring-purple-600' : ''}`}
                    title="Night Mode"
                  />
                </div>

                <button 
                  type="button"
                  onClick={() => setReadingBook(null)}
                  className="p-1 hover:opacity-100 opacity-60"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Reader Content Body */}
            <div className="flex-1 overflow-y-auto px-6 sm:px-12 py-8 max-w-2xl mx-auto space-y-6 leading-relaxed">
              <div className="border-b pb-4 mb-6 opacity-60 text-xs font-mono">
                <p>TTG Institutional Publishing · ISBN: {readingBook.isbn}</p>
                <p>First Edition · {readingBook.publicationYear}</p>
              </div>

              <h2 className="text-xl sm:text-2xl font-serif font-bold text-center tracking-tight">
                {readingBook.sampleChapterTitle}
              </h2>

              <div 
                className="font-serif whitespace-pre-line text-justify"
                style={{ fontSize: `${readerFontSize}px`, lineHeight: '1.8' }}
              >
                {readingBook.sampleChapterText}
              </div>

              <div className="p-6 rounded-2xl border text-center space-y-3 mt-12 bg-white/40 dark:bg-stone-900/40">
                <h4 className="text-sm font-bold">Enjoyed this opening sample?</h4>
                <p className="text-xs opacity-70 max-w-md mx-auto">
                  Unlock all {readingBook.pages} pages, diagrams, mathematical proofs, and audiobook narration.
                </p>
                <div className="flex justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      onPurchaseBook(readingBook, 'eBook');
                      setReadingBook(null);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow"
                  >
                    Buy Complete eBook (${readingBook.priceEbook.toFixed(2)})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onPurchaseBook(readingBook, 'Print');
                      setReadingBook(null);
                    }}
                    className="px-5 py-2.5 rounded-xl border border-current text-xs font-bold hover:bg-black/5"
                  >
                    Order Paperback (${readingBook.pricePrint.toFixed(2)})
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Author Publishing Portal Modal */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-600" />
                Publish Your Book with TTG Authors Press
              </h3>
              <button 
                type="button"
                onClick={() => setIsPublishModalOpen(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePublishSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">Book Title</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. The Sovereign Mind"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">Author Name(s)</label>
                  <input
                    type="text"
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    placeholder="e.g. Dr. Evelyn Brand"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">Course Faculty</label>
                  <select
                    value={newFaculty}
                    onChange={(e) => setNewFaculty(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  >
                    {ACADEMIC_FACULTIES.map(f => (
                      <option key={f.id} value={f.name}>{f.number}. {f.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">Primary Discipline</label>
                  <select
                    value={newGenre}
                    onChange={(e) => setNewGenre(e.target.value as BookItem['genre'])}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  >
                    <option value="Cybernetics & AI">Cybernetics & AI</option>
                    <option value="Systems Architecture">Systems Architecture</option>
                    <option value="Law & Commerce">Law & Commerce</option>
                    <option value="Health & Medical Sciences">Health & Medical Sciences</option>
                    <option value="Science & Agriculture">Science & Agriculture</option>
                    <option value="Cognitive Science">Cognitive Science</option>
                    <option value="Education & Pedagogy">Education & Pedagogy</option>
                    <option value="Philosophy">Philosophy</option>
                    <option value="Speculative Fiction">Arts & Speculative</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">Page Count</label>
                  <input
                    type="number"
                    value={newPages}
                    onChange={(e) => setNewPages(e.target.value)}
                    placeholder="320"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">Cover Art URL</label>
                  <input
                    type="url"
                    value={newCoverUrl}
                    onChange={(e) => setNewCoverUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">eBook Price ($)</label>
                  <input
                    type="number"
                    step="0.50"
                    min="4.99"
                    value={newPriceEbook}
                    onChange={(e) => setNewPriceEbook(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">Paperback Price ($)</label>
                  <input
                    type="number"
                    step="1.00"
                    min="14.99"
                    value={newPricePrint}
                    onChange={(e) => setNewPricePrint(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">Book Synopsis</label>
                <textarea
                  value={newSynopsis}
                  onChange={(e) => setNewSynopsis(e.target.value)}
                  rows={2}
                  placeholder="A groundbreaking treatise on stripping away institutional dogmas..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">Chapter 1 Sample Text (For Online Reader)</label>
                <textarea
                  value={newSampleText}
                  onChange={(e) => setNewSampleText(e.target.value)}
                  rows={4}
                  placeholder="Enter sample paragraphs for readers to inspect before buying..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 resize-none"
                />
              </div>

              <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-xl text-xs flex justify-between items-center text-purple-900 dark:text-purple-200">
                <span>Author Direct Royalty (90% Net):</span>
                <span className="font-mono font-bold text-sm">
                  ${((parseFloat(newPriceEbook) || 7.99) * 0.9).toFixed(2)} / eBook sale
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPublishModalOpen(false)}
                  className="px-4 py-2 text-xs text-stone-500 hover:text-stone-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-purple-700 hover:bg-purple-800 text-white shadow"
                >
                  Publish & Register ISBN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
