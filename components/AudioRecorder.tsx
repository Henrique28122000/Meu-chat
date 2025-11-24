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
        const blob = new Blob(chunksRef.current, { type: 'audio/mp4' }); // Using mp4/m4a as per API hint
        setAudioBlob(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access denied or not available.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      // Stop all tracks
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
      <div className="flex items-center space-x-2 bg-gray-100 p-2 rounded-full w-full">
        <button onClick={handleCancel} className="p-2 text-red-500 hover:bg-red-100 rounded-full">
          <Trash2 size={20} />
        </button>
        <audio src={URL.createObjectURL(audioBlob)} controls className="h-8 w-32 md:w-48" />
        <button onClick={handleSend} className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600">
          <Send size={20} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={isRecording ? stopRecording : startRecording}
      className={`p-3 rounded-full transition-colors ${
        isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
      }`}
    >
      {isRecording ? <Square size={24} /> : <Mic size={24} />}
    </button>
  );
};

export default AudioRecorder;
