
import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

interface AudioMessageProps {
  src: string;
  isMe: boolean;
}

const AudioMessage: React.FC<AudioMessageProps> = ({ src, isMe }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

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
      const prog = (audio.currentTime / audio.duration) * 100;
      setProgress(prog || 0);
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
    setProgress(0);
  };

  const formatTime = (time: number) => {
    if (!time) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center space-x-3 min-w-[200px] py-1">
      <button 
        onClick={togglePlay}
        className={`p-2 rounded-full transition-colors flex-shrink-0 ${
            isMe ? 'text-blue-600 bg-white' : 'text-gray-600 bg-gray-200'
        }`}
      >
        {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
      </button>

      <div className="flex-1 flex flex-col justify-center">
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={(e) => {
             const audio = audioRef.current;
             if(audio) {
                const newTime = (Number(e.target.value) / 100) * audio.duration;
                audio.currentTime = newTime;
                setProgress(Number(e.target.value));
             }
          }}
          className="w-full h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-gray-500"
          style={{ accentColor: isMe ? 'white' : '#4B5563' }}
        />
        <div className={`flex justify-between text-[10px] mt-1 ${isMe ? 'text-blue-100' : 'text-gray-500'}`}>
            <span>{formatTime(audioRef.current?.currentTime || 0)}</span>
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
