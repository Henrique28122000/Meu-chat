
import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

interface AudioMessageProps {
  src: string;
  isMe: boolean;
}

const AudioMessage: React.FC<AudioMessageProps> = ({ src, isMe }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Generate random heights for fake waveform visualization
  const [bars] = useState(() => Array.from({ length: 24 }, () => Math.floor(Math.random() * 60) + 20));

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const onTimeUpdate = () => {
    const audio = audioRef.current;
    if (audio) {
      setCurrentTime(audio.currentTime);
    }
  };

  const onLoadedMetadata = () => {
    const audio = audioRef.current;
    if (audio) {
      setDuration(audio.duration);
    }
  };

  const onEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const formatTime = (time: number) => {
    if (!time) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`flex items-center gap-3 p-1 min-w-[220px] max-w-[280px]`}>
      {/* Play/Pause Button */}
      <button 
        onClick={togglePlay}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm active:scale-95 flex-shrink-0 ${
            isMe ? 'bg-white text-teal-600 dark:bg-teal-900 dark:text-teal-200' : 'bg-teal-500 text-white'
        }`}
      >
        {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
      </button>

      <div className="flex-1 flex flex-col justify-center">
        {/* Fake Waveform Visualizer */}
        <div className="h-8 flex items-center gap-[2px] w-full mb-1 opacity-90">
             {bars.map((height, i) => {
                 // Calculate if this bar has been played
                 const progress = (currentTime / duration) || 0;
                 const isPlayed = (i / bars.length) < progress;
                 
                 return (
                    <div 
                        key={i}
                        className={`w-1.5 rounded-full transition-all duration-200 ${
                            isMe 
                                ? (isPlayed ? 'bg-teal-800 dark:bg-teal-300' : 'bg-teal-200/60 dark:bg-teal-900/40') 
                                : (isPlayed ? 'bg-teal-500' : 'bg-gray-300 dark:bg-gray-600')
                        } ${isPlaying ? 'animate-pulse' : ''}`}
                        style={{ 
                            height: isPlaying ? `${Math.max(height * Math.random(), 20)}%` : `${height}%`,
                            animationDelay: `${i * 0.05}s`
                        }}
                    ></div>
                 )
             })}
        </div>

        {/* Timer */}
        <div className={`flex justify-between text-[10px] font-medium px-0.5 ${isMe ? 'text-teal-900/70 dark:text-teal-200/70' : 'text-gray-500 dark:text-gray-400'}`}>
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
        </div>
      </div>

      <audio 
        ref={audioRef}
        src={src}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onEnded={onEnded}
        className="hidden"
      />
    </div>
  );
};

export default AudioMessage;