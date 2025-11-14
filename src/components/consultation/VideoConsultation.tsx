import { useState, useEffect } from 'react';
import { Video, VideoOff, Mic, MicOff, Phone, Signal } from 'lucide-react';
import { Appointment } from '../../types';

interface VideoConsultationProps {
  appointment: Appointment;
  onEnd: () => void;
}

export function VideoConsultation({ appointment, onEnd }: VideoConsultationProps) {
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'fair' | 'poor'>('good');
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  function formatDuration(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  function getConnectionColor() {
    switch (connectionQuality) {
      case 'excellent':
        return 'text-green-600';
      case 'good':
        return 'text-blue-600';
      case 'fair':
        return 'text-yellow-600';
      case 'poor':
        return 'text-red-600';
    }
  }

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      <div className="flex-1 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="w-32 h-32 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Video className="w-16 h-16" />
            </div>
            <p className="text-xl font-medium mb-2">
              {appointment.doctor?.full_name || appointment.patient?.full_name}
            </p>
            <p className="text-gray-400">Connected</p>
          </div>
        </div>

        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2 text-white">
          <div className="flex items-center gap-2 text-sm">
            <Signal className={`w-4 h-4 ${getConnectionColor()}`} />
            <span className="capitalize">{connectionQuality}</span>
            <span className="ml-2">•</span>
            <span className="ml-2">{formatDuration(duration)}</span>
          </div>
        </div>

        <div className="absolute bottom-24 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-700">
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center">
              {isVideoEnabled ? (
                <Video className="w-8 h-8 text-gray-400" />
              ) : (
                <VideoOff className="w-8 h-8 text-gray-400" />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 border-t border-gray-700 p-6">
        <div className="max-w-md mx-auto flex items-center justify-center gap-4">
          <button
            onClick={() => setIsVideoEnabled(!isVideoEnabled)}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
              isVideoEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
            }`}
            aria-label={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
          >
            {isVideoEnabled ? (
              <Video className="w-6 h-6 text-white" />
            ) : (
              <VideoOff className="w-6 h-6 text-white" />
            )}
          </button>

          <button
            onClick={() => setIsAudioEnabled(!isAudioEnabled)}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
              isAudioEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
            }`}
            aria-label={isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
          >
            {isAudioEnabled ? (
              <Mic className="w-6 h-6 text-white" />
            ) : (
              <MicOff className="w-6 h-6 text-white" />
            )}
          </button>

          <button
            onClick={onEnd}
            className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors"
            aria-label="End call"
          >
            <Phone className="w-6 h-6 text-white transform rotate-135" />
          </button>

          <button
            onClick={() => {
              const qualities: Array<'excellent' | 'good' | 'fair' | 'poor'> = [
                'excellent',
                'good',
                'fair',
                'poor',
              ];
              const currentIndex = qualities.indexOf(connectionQuality);
              const nextIndex = (currentIndex + 1) % qualities.length;
              setConnectionQuality(qualities[nextIndex]);
            }}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-white transition-colors"
          >
            Adjust Quality
          </button>
        </div>
      </div>
    </div>
  );
}
