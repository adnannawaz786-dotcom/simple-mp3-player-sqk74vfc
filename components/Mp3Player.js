'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Upload } from 'lucide-react';

const Mp3Player = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playlist, setPlaylist] = useState([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const audioRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load playlist from localStorage on component mount
  useEffect(() => {
    const savedPlaylist = localStorage.getItem('mp3-playlist');
    if (savedPlaylist) {
      try {
        const parsedPlaylist = JSON.parse(savedPlaylist);
        setPlaylist(parsedPlaylist);
      } catch (error) {
        console.error('Error parsing saved playlist:', error);
      }
    }
  }, []);

  // Save playlist to localStorage whenever it changes
  useEffect(() => {
    if (playlist.length > 0) {
      localStorage.setItem('mp3-playlist', JSON.stringify(playlist));
    }
  }, [playlist]);

  // Handle audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => handleNext();
    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [currentTrackIndex]);

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const mp3Files = files.filter(file => file.type === 'audio/mpeg' || file.name.endsWith('.mp3'));
    
    const newTracks = mp3Files.map((file, index) => ({
      id: Date.now() + index,
      name: file.name.replace('.mp3', ''),
      url: URL.createObjectURL(file),
      file: file
    }));

    setPlaylist(prev => [...prev, ...newTracks]);
  };

  const togglePlayPause = () => {
    if (!audioRef.current || playlist.length === 0) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    if (playlist.length === 0) return;
    const nextIndex = (currentTrackIndex + 1) % playlist.length;
    setCurrentTrackIndex(nextIndex);
    setIsPlaying(false);
  };

  const handlePrevious = () => {
    if (playlist.length === 0) return;
    const prevIndex = currentTrackIndex === 0 ? playlist.length - 1 : currentTrackIndex - 1;
    setCurrentTrackIndex(prevIndex);
    setIsPlaying(false);
  };

  const handleSeek = (e) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newVolume = Math.max(0, Math.min(1, percent));
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const currentTrack = playlist[currentTrackIndex];

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Audio Element */}
      {currentTrack && (
        <audio
          ref={audioRef}
          src={currentTrack.url}
          volume={volume}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      )}

      {/* File Upload */}
      <div className="p-6 border-b border-gray-100">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="audio/mp3,audio/mpeg"
          onChange={handleFileUpload}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors"
        >
          <Upload size={20} />
          <span>Upload MP3 Files</span>
        </button>
      </div>

      {/* Track Info */}
      <div className="p-6 text-center">
        <AnimatePresence mode="wait">
          {currentTrack ? (
            <motion.div
              key={currentTrack.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {currentTrack.name}
              </h3>
              <div className="text-sm text-gray-500">
                Track {currentTrackIndex + 1} of {playlist.length}
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-gray-500"
            >
              No tracks loaded
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Progress Bar */}
      <div className="px-6 mb-4">
        <div
          className="w-full h-2 bg-gray-200 rounded-full cursor-pointer"
          onClick={handleSeek}
        >
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-100"
            style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="px-6 pb-6">
        <div className="flex items-center justify-center gap-4 mb-4">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handlePrevious}
            disabled={playlist.length === 0}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SkipBack size={20} />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={togglePlayPause}
            disabled={playlist.length === 0 || isLoading}
            className="p-4 rounded-full bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause size={24} />
            ) : (
              <Play size={24} />
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleNext}
            disabled={playlist.length === 0}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SkipForward size={20} />
          </motion.button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-2">
          <button onClick={toggleMute} className="p-1">
            {isMuted || volume === 0 ? (
              <VolumeX size={16} className="text-gray-500" />
            ) : (
              <Volume2 size={16} className="text-gray-500" />
            )}
          </button>
          <div
            className="flex-1 h-1 bg-gray-200 rounded-full cursor-pointer"
            onClick={handleVolumeChange}
          >
            <div
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${isMuted ? 0 : volume * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Mp3Player;
