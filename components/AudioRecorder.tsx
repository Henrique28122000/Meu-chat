
import React, { useState, useRef } from 'react';
import { Mic, Square, Send, Trash2 } from 'lucide-react';

interface AudioRecorderProps {
  onSend: (audioBlob: Blob) => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onSend }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/mp4' }); 
        setAudioBlob(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Erro microfone:", err);
      alert("Acesso ao microfone negado.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleSend = () => {
    if (audioBlob) {
      onSend(audioBlob);
      setAudioBlob(null);
    }
  };

  const handleCancel = () => {
    setAudioBlob(null);
  };

  if (audioBlob) {
    return (
      <div className="flex items-center space-x-2 bg-gray-100 p-1.5 rounded-full absolute bottom-16 right-4 z-50 shadow-lg border border-gray-200">
        <button onClick={handleCancel} className="p-2 text-red-500 hover:bg-red-100 rounded-full">
          <Trash2 size={20} />
        </button>
        <audio src={URL.createObjectURL(audioBlob)} controls className="h-8 w-32" />
        <button onClick={handleSend} className="p-2 bg-[#008069] text-white rounded-full hover:bg-[#006e5a]">
          <Send size={20} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={isRecording ? stopRecording : startRecording}
      className={`p-3 rounded-full transition-colors flex items-center justify-center ${
        isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-[#008069] text-white hover:bg-[#006e5a]'
      }`}
    >
      {isRecording ? <Square size={24} /> : <Mic size={24} />}
    </button>
  );
};

export default AudioRecorder;
