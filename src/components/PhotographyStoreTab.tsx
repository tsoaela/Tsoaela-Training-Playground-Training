import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  Download, 
  Heart, 
  Sparkles, 
  Search, 
  X, 
  Upload, 
  Sliders, 
  DollarSign, 
  Eye, 
  CheckCircle2, 
  ShieldCheck, 
  Info, 
  Maximize2 
} from 'lucide-react';
import { PhotoItem, UserProfile } from '../types';
import { INITIAL_PHOTOS } from '../data/storesData';

interface PhotographyStoreTabProps {
  user: UserProfile;
  isAuthenticated: boolean;
  onRequireAuth: (action: () => void, message: string) => void;
  onPurchasePhoto: (photo: PhotoItem, licenseType: 'Personal' | 'Commercial' | 'Extended') => void;
}

export const PhotographyStoreTab: React.FC<PhotographyStoreTabProps> = ({
  user,
  isAuthenticated,
  onRequireAuth,
  onPurchasePhoto,
}) => {
  const [photos, setPhotos] = useState<PhotoItem[]>(() => {
    try {
      const saved = localStorage.getItem('ttg_photos');
      return saved ? JSON.parse(saved) : INITIAL_PHOTOS;
    } catch {
      return INITIAL_PHOTOS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('ttg_photos', JSON.stringify(photos));
    } catch (e) {
      console.error(e);
    }
  }, [photos]);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activePhoto, setActivePhoto] = useState<PhotoItem | null>(null);
  const [selectedLicense, setSelectedLicense] = useState<'Personal' | 'Commercial' | 'Extended'>('Personal');
  const [likedPhotoIds, setLikedPhotoIds] = useState<Set<string>>(new Set(['photo_01']));

  // Photographer Upload Modal
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPhotographer, setNewPhotographer] = useState(user.name || '');
  const [newCategory, setNewCategory] = useState<PhotoItem['category']>('Landscape');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newCamera, setNewCamera] = useState('Sony A7R V');
  const [newLens, setNewLens] = useState('24-70mm f/2.8 GM');
  const [newPricePersonal, setNewPricePersonal] = useState('9.99');
  const [newPriceCommercial, setNewPriceCommercial] = useState('29.99');

  const filteredPhotos = photos.filter(p => {
    if (selectedCategory !== 'all' && p.category.toLowerCase() !== selectedCategory.toLowerCase()) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return p.title.toLowerCase().includes(q) || p.photographer.toLowerCase().includes(q) || p.tags.some(t => t.toLowerCase().includes(q));
    }
    return true;
  });

  const handleToggleLike = (id: string) => {
    setLikedPhotoIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleOpenUploadModal = () => {
    onRequireAuth(() => {
      setIsUploadModalOpen(true);
    }, 'Sign in or register as a Photographer to showcase and sell fine-art photography prints and commercial licenses.');
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newImageUrl.trim()) return;

    const newPhoto: PhotoItem = {
      id: `photo_${Date.now()}`,
      title: newTitle.trim(),
      photographer: newPhotographer.trim() || user.name || 'Anonymous Artist',
      category: newCategory,
      imageUrl: newImageUrl.trim(),
      resolution: '8256 × 5504 (45 MP)',
      megapixels: 45,
      dpi: 300,
      camera: newCamera.trim(),
      lens: newLens.trim(),
      focalLength: '35mm',
      aperture: 'f/2.8',
      iso: 100,
      shutterSpeed: '1/250s',
      pricePersonal: parseFloat(newPricePersonal) || 9.99,
      priceCommercial: parseFloat(newPriceCommercial) || 29.99,
      priceExtended: 79.99,
      orientation: 'landscape',
      downloads: 0,
      likes: 1,
      tags: ['Gallery', 'High-Res', 'RAW', newCategory]
    };

    setPhotos(prev => [newPhoto, ...prev]);
    setIsUploadModalOpen(false);
    setNewTitle('');
    setNewImageUrl('');
  };

  const categories = [
    { id: 'all', label: 'All Photographs' },
    { id: 'landscape', label: 'Landscapes & Nature' },
    { id: 'architecture', label: 'Architecture & Urban' },
    { id: 'aerial & drone', label: 'Drone & Aerial' },
    { id: 'street & urban', label: 'Street & Neon' },
  ];

  return (
    <div className="bg-stone-50 dark:bg-stone-950 min-h-screen pb-24 text-stone-900 dark:text-stone-100 transition-colors">
      
      {/* Header Banner */}
      <div className="border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/60 px-4 sm:px-8 py-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1 uppercase tracking-wider">
              <Camera className="w-3.5 h-3.5" />
              <span>Fine Art Photography Store & Licensing Marketplace</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              High-Resolution Visual Assets
            </h1>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-1 max-w-2xl">
              Curated medium-format and full-frame imagery captured by institutional artists. Available in RAW, TIFF, and high-DPI prints.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleOpenUploadModal}
              className="px-4 py-2.5 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-bold flex items-center gap-2 hover:bg-stone-800 dark:hover:bg-stone-200 transition-all shadow-sm cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Sell Your Photography</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        
        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {categories.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === c.id
                    ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-xs'
                    : 'bg-stone-200/70 dark:bg-stone-800/60 hover:bg-stone-300/70 dark:hover:bg-stone-700/60 text-stone-600 dark:text-stone-300'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-auto sm:min-w-[260px]">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search photographs, cameras, tags..."
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 focus:outline-none focus:border-amber-500"
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

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPhotos.map(photo => {
            const isLiked = likedPhotoIds.has(photo.id);

            return (
              <div 
                key={photo.id}
                className="group rounded-2xl overflow-hidden bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:shadow-xl transition-all flex flex-col justify-between"
              >
                <div 
                  className="relative aspect-4/3 overflow-hidden bg-stone-100 dark:bg-stone-950 cursor-pointer"
                  onClick={() => setActivePhoto(photo)}
                >
                  <img 
                    src={photo.imageUrl} 
                    alt={photo.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />

                  {/* Badges Overlay */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-mono text-white font-semibold">
                      {photo.megapixels} MP RAW
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/90 text-[10px] font-mono text-stone-950 font-bold">
                      {photo.dpi} DPI
                    </span>
                  </div>

                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleLike(photo.id);
                      }}
                      className="p-1.5 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition-colors"
                    >
                      <Heart className={`w-3.5 h-3.5 ${isLiked ? 'text-rose-500 fill-current' : ''}`} />
                    </button>
                  </div>

                  <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <span className="text-white text-xs font-semibold flex items-center gap-1.5">
                      <Maximize2 className="w-3.5 h-3.5" />
                      View High-Res EXIF & Licenses
                    </span>
                  </div>
                </div>

                {/* Details Footer */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="text-sm font-bold truncate">
                      {photo.title}
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                      by <span className="font-semibold text-stone-800 dark:text-stone-200">{photo.photographer}</span>
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 border-t border-stone-100 dark:border-stone-800 pt-2 font-mono">
                    <span>{photo.camera}</span>
                    <span>{photo.lens}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <span className="text-[10px] text-stone-400 uppercase tracking-wider block">License from</span>
                      <span className="text-sm font-bold font-mono text-amber-600 dark:text-amber-400">
                        ${photo.pricePersonal.toFixed(2)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActivePhoto(photo)}
                      className="px-3 py-1.5 rounded-xl bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 text-xs font-bold transition-all shadow-2xs"
                    >
                      Buy License
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Photo Detail & Purchase Modal */}
      {activePhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
            
            {/* Left: Image Preview */}
            <div className="flex-1 bg-stone-950 flex items-center justify-center relative p-4 min-h-[300px]">
              <img 
                src={activePhoto.imageUrl} 
                alt={activePhoto.title}
                className="max-h-[75vh] w-auto object-contain rounded-lg shadow-2xl" 
              />
              <div className="absolute bottom-6 left-6 px-3 py-1.5 rounded-lg bg-black/70 backdrop-blur-md text-[11px] font-mono text-white flex items-center gap-3">
                <span>{activePhoto.resolution}</span>
                <span>·</span>
                <span>{activePhoto.megapixels} Megapixels</span>
              </div>
            </div>

            {/* Right: EXIF & Licensing Panel */}
            <div className="w-full md:w-80 p-6 flex flex-col justify-between overflow-y-auto border-t md:border-t-0 md:border-l border-stone-200 dark:border-stone-800">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-mono uppercase font-bold text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800">
                    {activePhoto.category}
                  </span>
                  <button 
                    type="button"
                    onClick={() => setActivePhoto(null)}
                    className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <h2 className="text-lg font-bold">
                  {activePhoto.title}
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                  Photographed by {activePhoto.photographer}
                </p>

                {/* Technical EXIF Sheet */}
                <div className="mt-4 p-3 rounded-xl bg-stone-100 dark:bg-stone-800/50 space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between text-stone-600 dark:text-stone-300">
                    <span>Camera:</span>
                    <span className="font-semibold text-stone-900 dark:text-stone-100">{activePhoto.camera}</span>
                  </div>
                  <div className="flex justify-between text-stone-600 dark:text-stone-300">
                    <span>Lens:</span>
                    <span>{activePhoto.lens || 'Prime'}</span>
                  </div>
                  <div className="flex justify-between text-stone-600 dark:text-stone-300">
                    <span>Shutter / ISO:</span>
                    <span>{activePhoto.shutterSpeed} · ISO {activePhoto.iso}</span>
                  </div>
                  <div className="flex justify-between text-stone-600 dark:text-stone-300">
                    <span>Aperture:</span>
                    <span>{activePhoto.aperture}</span>
                  </div>
                </div>

                {/* License Options */}
                <div className="mt-5 space-y-2.5">
                  <span className="text-xs font-bold text-stone-700 dark:text-stone-300 block">
                    Select Digital License Tier:
                  </span>

                  <label 
                    onClick={() => setSelectedLicense('Personal')}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      selectedLicense === 'Personal' 
                        ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30' 
                        : 'border-stone-200 dark:border-stone-800'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold block">Personal Fine Art License</span>
                      <span className="text-[10px] text-stone-500">Wall art print, personal display</span>
                    </div>
                    <span className="text-xs font-bold font-mono text-amber-600 dark:text-amber-400">
                      ${activePhoto.pricePersonal.toFixed(2)}
                    </span>
                  </label>

                  <label 
                    onClick={() => setSelectedLicense('Commercial')}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      selectedLicense === 'Commercial' 
                        ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30' 
                        : 'border-stone-200 dark:border-stone-800'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold block">Commercial Media License</span>
                      <span className="text-[10px] text-stone-500">Websites, books, digital advertising</span>
                    </div>
                    <span className="text-xs font-bold font-mono text-amber-600 dark:text-amber-400">
                      ${activePhoto.priceCommercial.toFixed(2)}
                    </span>
                  </label>

                  <label 
                    onClick={() => setSelectedLicense('Extended')}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      selectedLicense === 'Extended' 
                        ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30' 
                        : 'border-stone-200 dark:border-stone-800'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold block">Extended Unlimited License</span>
                      <span className="text-[10px] text-stone-500">Merchandise, physical packaging, resale</span>
                    </div>
                    <span className="text-xs font-bold font-mono text-amber-600 dark:text-amber-400">
                      ${activePhoto.priceExtended.toFixed(2)}
                    </span>
                  </label>
                </div>
              </div>

              {/* Purchase Action Button */}
              <div className="mt-6 pt-4 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => {
                    onPurchasePhoto(activePhoto, selectedLicense);
                    setActivePhoto(null);
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>
                    Buy & Download {selectedLicense} License ($
                    {selectedLicense === 'Personal' 
                      ? activePhoto.pricePersonal.toFixed(2)
                      : selectedLicense === 'Commercial'
                      ? activePhoto.priceCommercial.toFixed(2)
                      : activePhoto.priceExtended.toFixed(2)}
                    )
                  </span>
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Photographer Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Camera className="w-4 h-4 text-amber-500" />
                Upload Photo & Set License Rates
              </h3>
              <button 
                type="button" 
                onClick={() => setIsUploadModalOpen(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Photograph Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Solitude Over Fjordland Mist"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Image URL (High-Res 300 DPI)
                </label>
                <input
                  type="url"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Landscape">Landscape</option>
                    <option value="Architecture">Architecture</option>
                    <option value="Aerial & Drone">Aerial & Drone</option>
                    <option value="Street & Urban">Street & Urban</option>
                    <option value="Fine Art">Fine Art</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Camera Body
                  </label>
                  <input
                    type="text"
                    value={newCamera}
                    onChange={(e) => setNewCamera(e.target.value)}
                    placeholder="Sony A7R V"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Personal License ($)
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    min="5.00"
                    value={newPricePersonal}
                    onChange={(e) => setNewPricePersonal(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Commercial License ($)
                  </label>
                  <input
                    type="number"
                    step="1.00"
                    min="15.00"
                    value={newPriceCommercial}
                    onChange={(e) => setNewPriceCommercial(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 text-xs text-stone-500 hover:text-stone-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow"
                >
                  Publish Photo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
