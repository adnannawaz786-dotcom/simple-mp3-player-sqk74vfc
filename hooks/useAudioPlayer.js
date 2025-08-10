```javascript
import { useState, useRef, useEffect, useCallback } from 'react';

const useAudioPlayer = () => {
  const audioRef = useRef(null);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [playlist, setPlaylist] = useState([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio();
    const audio = audioRef.current;

    // Audio event listeners
    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => {
      setIsPlaying(false);
      nextTrack();
    };
    const handleError = () => {
      setError('Failed to load audio file');
      setIsLoading(false);
    };

    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.pause();
    };
  }, []);

  // Load playlist from localStorage on mount
  useEffect(() => {
    const savedPlaylist = localStorage.getItem('mp3-player-playlist');
    if (savedPlaylist) {
      try {
        const parsedPlaylist = JSON.parse(savedPlaylist);
        setPlaylist(parsedPlaylist);
        if (parsedPlaylist.length > 0) {
          setCurrentTrack(parsedPlaylist[0]);
        }
      } catch (err) {
        console.error('Failed to parse playlist from localStorage:', err);
      }
    }
  }, []);

  // Save playlist to localStorage whenever it changes
  useEffect(() => {
    if (playlist.length > 0) {
      localStorage.setItem('mp3-player-playlist', JSON.stringify(playlist));
    }
  }, [playlist]);

  // Update audio source when current track changes
  useEffect(() => {
    if (currentTrack && audioRef.current) {
      audioRef.current.src = currentTrack.url;
      audioRef.current.volume = volume;
      setError(null);
    }
  }, [currentTrack, volume]);

  const play = useCallback(async () => {
    if (!audioRef.current || !currentTrack) return;

    try {
      await audioRef.current.play();
      setIsPlaying(true);
      setError(null);
    } catch (err) {
      setError('Failed to play audio');
      setIsPlaying(false);
    }
  }, [currentTrack]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const seek = useCallback((time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const changeVolume = useCallback((newVolume) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolume(clampedVolume);
    if (audioRef.current) {
      audioRef.current.volume = clampedVolume;
    }
  }, []);

  const nextTrack = useCallback(() => {
    if (playlist.length === 0) return;
    
    const nextIndex = (currentTrackIndex + 1) % playlist.length;
    setCurrentTrackIndex(nextIndex);
    setCurrentTrack(playlist[nextIndex]);
    setIsPlaying(false);
  }, [playlist, currentTrackIndex]);

  const previousTrack = useCallback(() => {
    if (playlist.length === 0) return;
    
    const prevIndex = currentTrackIndex === 0 ? playlist.length - 1 : currentTrackIndex - 1;
    setCurrentTrackIndex(prevIndex);
    setCurrentTrack(playlist[prevIndex]);
    setIsPlaying(false);
  }, [playlist, currentTrackIndex]);

  const selectTrack = useCallback((track, index) => {
    setCurrentTrack(track);
    setCurrentTrackIndex(index);
    setIsPlaying(false);
  }, []);

  const addToPlaylist = useCallback((files) => {
    const newTracks = Array.from(files).map((file, index) => ({
      id: Date.now() + index,
      name: file.name.replace(/\.[^/.]+$/, ''),
      url: URL.createObjectURL(file),
      file: file
    }));

    setPlaylist(prev => {
      const updated = [...prev, ...newTracks];
      if (prev.length === 0 && updated.length > 0) {
        setCurrentTrack(updated[0]);
        setCurrentTrackIndex(0);
      }
      return updated;
    });
  }, []);

  const removeFromPlaylist = useCallback((trackId) => {
    setPlaylist(prev => {
      const updated = prev.filter(track => track.id !== trackId);
      const removedTrackIndex = prev.findIndex(track => track.id === trackId);
      
      if (currentTrack && currentTrack.id === trackId) {
        if (updated.length > 0) {
          const newIndex = Math.min(removedTrackIndex, updated.length - 1);
          setCurrentTrack(updated[newIndex]);
          setCurrentTrackIndex(newIndex);
        } else {
          setCurrentTrack(null);
          setCurrentTrackIndex(0);
        }
      } else if (removedTrackIndex < currentTrackIndex) {
        setCurrentTrackIndex(prev => prev - 1);
      }
      
      return updated;
    });
  }, [currentTrack, currentTrackIndex]);

  const clearPlaylist = useCallback(() => {
    setPlaylist([]);
    setCurrentTrack(null);
    setCurrentTrackIndex(0);
    setIsPlaying(false);
    localStorage.removeItem('mp3-player-playlist');
  }, []);

  const formatTime = useCallback((time) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  return {
    // State
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isLoading,
    error,
    playlist,
    currentTrackIndex,
    
    // Actions
    play,
    pause,
    togglePlayPause,
    seek,
    changeVolume,
    nextTrack,
    previousTrack,
    selectTrack,
    addToPlaylist,
    removeFromPlaylist,
    clearPlaylist,
    
    // Utilities
    formatTime
  };
};

export default useAudioPlayer;
```