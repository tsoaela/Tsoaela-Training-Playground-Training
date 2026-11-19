import React, { useState, useEffect } from 'react';
import { Disc3 } from 'lucide-react';

interface MusicArtworkProps {
  src?: string;
  alt: string;
  artist?: string;
  className?: string;
  imgClassName?: string;
}

export const MusicArtwork: React.FC<MusicArtworkProps> = ({
  src,
  alt,
  artist,
  className = '',
  imgClassName = '',
}) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  const showFallback = !src || hasError;

  return (
    <div className={`relative overflow-hidden bg-stone-900 ${className}`}>
      {!showFallback ? (
        <img
          src={src}
          alt={alt}
          referrerPolicy="no-referrer"
          onError={() => setHasError(true)}
          className={`w-full h-full object-cover ${imgClassName}`}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-linear-to-br from-stone-800 via-stone-900 to-emerald-950/60 p-3 text-center select-none">
          <div className="w-10 h-10 rounded-full border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center mb-1.5">
            <Disc3 className="w-5 h-5 text-emerald-400" />
          </div>
          <span className="text-[10px] font-semibold text-stone-200 line-clamp-1 max-w-full">
            {alt}
          </span>
          {artist && (
            <span className="text-[9px] text-stone-400 truncate max-w-full">
              {artist}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
