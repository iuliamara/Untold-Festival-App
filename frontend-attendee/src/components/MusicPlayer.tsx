import React, { useState, useRef, useEffect } from 'react';

const TRACKS = [
  { title: "Dimitri Vegas & Like Mike - Melody", src: "/assets/music/Dimitri Vegas & Like Mike, Steve Aoki vs Ummet Ozcan - Melody.mp3" },
  { title: "J Balvin - Mi Gente (Steve Aoki Remix)", src: "/assets/music/J Balvin & Willy William - Mi Gente (Steve Aoki Remix) [Official Music Video].mp3" },
  { title: "Marshmello - Alone", src: "/assets/music/Marshmello - Alone (Official Music Video).mp3" },
  { title: "Marshmello ft. Bastille - Happier", src: "/assets/music/Marshmello ft. Bastille - Happier (Official Music Video).mp3" },
  { title: "Martin Garrix - In The Name Of Love", src: "/assets/music/Martin Garrix & Bebe Rexha - In The Name Of Love (Official Video).mp3" },
  { title: "Martin Garrix - Ocean", src: "/assets/music/Martin Garrix feat. Khalid - Ocean (Official Video).mp3" }
];

export const MusicPlayer: React.FC = () => {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [volume, setVolume] = useState(0.5); // Default volume to 50%
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationRef = useRef<number | null>(null);

  const initAudio = () => {
    if (!audioContextRef.current && audioRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = ctx.createMediaElementSource(audioRef.current);
      sourceRef.current = source;

      source.connect(analyser);
      analyser.connect(ctx.destination);
    }
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    const updateBackground = () => {
      if (analyserRef.current && isPlaying) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);

        // Calculate average volume focusing on lower frequencies (bass)
        let sum = 0;
        const limit = Math.min(20, dataArray.length); // first 20 bins
        for (let i = 0; i < limit; i++) {
          sum += dataArray[i];
        }
        const average = sum / limit;
        const intensity = average / 255; // 0 to 1

        document.documentElement.style.setProperty('--music-intensity', intensity.toString());
      } else {
        document.documentElement.style.setProperty('--music-intensity', '0');
      }

      if (isPlaying) {
        animationRef.current = requestAnimationFrame(updateBackground);
      }
    };

    if (isPlaying) {
      initAudio();
      audioRef.current?.play().catch(e => {
        console.warn("Autoplay prevented:", e);
        setIsPlaying(false);
      });
      updateBackground();
    } else {
      audioRef.current?.pause();
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      document.documentElement.style.setProperty('--music-intensity', '0');
    }

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, currentTrackIndex]);

  const togglePlay = () => {
    if (!isPlaying) initAudio();
    setIsPlaying(!isPlaying);
  };

  const playNext = () => {
    initAudio();
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    setIsPlaying(true);
  };

  const playPrev = () => {
    initAudio();
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    setIsPlaying(true);
  };

  const handleEnded = () => {
    playNext();
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-3">
      {/* Audio Element */}
      <audio 
        ref={audioRef} 
        src={TRACKS[currentTrackIndex].src} 
        onEnded={handleEnded} 
        preload="auto"
        crossOrigin="anonymous"
      />

      {isExpanded && (
        <div className="glass-panel p-4 rounded-2xl flex items-center gap-4 w-[320px] shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_15px_rgba(255,255,255,0.2)] border border-white/20 transform transition-all duration-500 origin-bottom-right">
          
          {/* Spinning Disc */}
          <div 
            className={`w-12 h-12 rounded-full bg-surface-container-highest border-2 border-primary/50 flex-shrink-0 flex items-center justify-center shadow-[0_0_10px_rgba(112,0,255,0.5)] ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''}`}
          >
            <div className="w-3 h-3 bg-background rounded-full border border-primary/30"></div>
          </div>
          
          <div className="flex-grow overflow-hidden flex flex-col justify-center">
            <p className="font-label-sm text-[10px] text-tertiary uppercase tracking-widest mb-1 flex items-center gap-1">
              {isPlaying && <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse"></span>}
              {isPlaying ? 'Now Playing' : 'Paused'}
            </p>
            <div className="w-full overflow-hidden relative group">
              <p className="font-body-sm text-white text-sm whitespace-nowrap overflow-hidden text-ellipsis relative pr-4">
                {TRACKS[currentTrackIndex].title}
              </p>
            </div>
            
            {/* Volume Control */}
            <div className="flex items-center gap-2 mt-2 w-full">
              <span className="material-symbols-outlined text-[14px] text-outline">volume_down</span>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01" 
                value={volume} 
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full h-1 bg-surface-container rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col items-center justify-center">
            <div className="flex items-center gap-1">
              <button onClick={playPrev} className="text-on-surface hover:text-white transition-colors active:scale-90">
                <span className="material-symbols-outlined text-[24px]" style={{fontVariationSettings: "'FILL' 1"}}>skip_previous</span>
              </button>
              <button onClick={togglePlay} className="text-primary hover:text-white transition-colors active:scale-90 drop-shadow-[0_0_8px_rgba(112,0,255,0.6)]">
                <span className="material-symbols-outlined text-[36px]" style={{fontVariationSettings: "'FILL' 1"}}>{isPlaying ? 'pause_circle' : 'play_circle'}</span>
              </button>
              <button onClick={playNext} className="text-on-surface hover:text-white transition-colors active:scale-90">
                <span className="material-symbols-outlined text-[24px]" style={{fontVariationSettings: "'FILL' 1"}}>skip_next</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-14 h-14 rounded-full glass-panel border border-primary/50 flex items-center justify-center text-primary hover:bg-primary/20 transition-all shadow-[0_5px_15px_rgba(0,0,0,0.5),0_0_15px_rgba(112,0,255,0.4)] relative group"
      >
        <span className="material-symbols-outlined text-[28px]">
          {isExpanded ? 'close' : 'queue_music'}
        </span>
        {!isExpanded && isPlaying && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-tertiary rounded-full animate-pulse border-2 border-background"></span>
        )}
      </button>
    </div>
  );
};
