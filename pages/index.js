import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Volume2, Upload, Music, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

export default function Home() {
  const [playlist, setPlaylist] = useState([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const audioRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load playlist from localStorage on component mount
  useEffect(() => {
    const savedPlaylist = localStorage.getItem('mp3-player-playlist');
    if (savedPlaylist) {
      try {
        const parsed = JSON.parse(savedPlaylist);
        setPlaylist(parsed);
      } catch (error) {
        console.error('Error loading playlist from localStorage:', error);
      }
    }
  }, []);

  // Save playlist to localStorage whenever it changes
  useEffect(() => {
    if (playlist.length > 0) {
      localStorage.setItem('mp3-player-playlist', JSON.stringify(playlist));
    }
  }, [playlist]);

  // Update current time
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      if (currentTrackIndex < playlist.length - 1) {
        setCurrentTrackIndex(currentTrackIndex + 1);
      }
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentTrackIndex, playlist.length]);

  // Auto-play when track changes
  useEffect(() => {
    if (playlist.length > 0 && audioRef.current) {
      audioRef.current.load();
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      }
    }
  }, [currentTrackIndex, playlist]);

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const mp3Files = files.filter(file => file.type === 'audio/mpeg' || file.name.endsWith('.mp3'));
    
    const newTracks = mp3Files.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name.replace('.mp3', ''),
      file: file,
      url: URL.createObjectURL(file)
    }));

    setPlaylist(prev => [...prev, ...newTracks]);
  };

  const togglePlayPause = () => {
    if (!audioRef.current || playlist.length === 0) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(console.error);
    }
    setIsPlaying(!isPlaying);
  };

  const previousTrack = () => {
    if (currentTrackIndex > 0) {
      setCurrentTrackIndex(currentTrackIndex - 1);
    }
  };

  const nextTrack = () => {
    if (currentTrackIndex < playlist.length - 1) {
      setCurrentTrackIndex(currentTrackIndex + 1);
    }
  };

  const selectTrack = (index) => {
    setCurrentTrackIndex(index);
    setIsPlaying(true);
  };

  const removeTrack = (index) => {
    const newPlaylist = playlist.filter((_, i) => i !== index);
    setPlaylist(newPlaylist);
    
    if (index === currentTrackIndex) {
      setIsPlaying(false);
      setCurrentTrackIndex(0);
    } else if (index < currentTrackIndex) {
      setCurrentTrackIndex(currentTrackIndex - 1);
    }
  };

  const handleSeek = (e) => {
    if (!audioRef.current) return;
    const progressBar = e.currentTarget;
    const clickX = e.clientX - progressBar.offsetLeft;
    const width = progressBar.offsetWidth;
    const newTime = (clickX / width) * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">MP3 Player</h1>
          <p className="text-purple-200">Simple & Clean Music Player</p>
        </motion.div>

        {/* Upload Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader className="pb-4">
              <CardTitle className="text-white flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Add Music
              </CardTitle>
            </CardHeader>
            <CardContent>
              <input
                ref={fileInputRef}
                type="file"
                accept=".mp3,audio/mpeg"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-purple-600 hover:bg-purple-700"
                size="lg"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload MP3 Files
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Player Section */}
        {playlist.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardContent className="p-6">
                {/* Current Track Info */}
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Music className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-1">
                    {currentTrack?.name || 'No track selected'}
                  </h3>
                  <Badge variant="secondary" className="bg-white/20 text-purple-100">
                    {currentTrackIndex + 1} of {playlist.length}
                  </Badge>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div
                    className="w-full h-2 bg-white/20 rounded-full cursor-pointer mb-2"
                    onClick={handleSeek}
                  >
                    <div
                      className="h-full bg-purple-500 rounded-full transition-all duration-300"
                      style={{
                        width: duration ? `${(currentTime / duration) * 100}%` : '0%'
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-sm text-purple-200">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-4 mb-6">
                  <Button
                    onClick={previousTrack}
                    disabled={currentTrackIndex === 0}
                    variant="ghost"
                    size="lg"
                    className="text-white hover:bg-white/20 disabled:opacity-50"
                  >
                    <SkipBack className="w-6 h-6" />
                  </Button>

                  <Button
                    onClick={togglePlayPause}
                    size="lg"
                    className="bg-purple-600 hover:bg-purple-700 w-16 h-16 rounded-full"
                  >
                    {isPlaying ? (
                      <Pause className="w-8 h-8" />
                    ) : (
                      <Play className="w-8 h-8 ml-1" />
                    )}
                  </Button>

                  <Button
                    onClick={nextTrack}
                    disabled={currentTrackIndex === playlist.length - 1}
                    variant="ghost"
                    size="lg"
                    className="text-white hover:bg-white/20 disabled:opacity-50"
                  >
                    <SkipForward className="w-6 h-6" />
                  </Button>
                </div>

                {/* Volume Control */}
                <div className="flex items-center gap-3">
                  <Volume2 className="w-5 h-5 text-purple-200" />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="flex-1 h-2 bg-white/20 rounded-full appearance-none cursor-pointer"
                  />
                </div>

                {/* Audio Element */}
                {currentTrack && (
                  <audio
                    ref={audioRef}
                    src={currentTrack.url}
                    preload="metadata"
                  />
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Playlist */}
        {playlist.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white">
                  Playlist ({playlist.length} tracks)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  <AnimatePresence>
                    {playlist.map((track, index) => (
                      <motion.div
                        key={track.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                          index === currentTrackIndex
                            ? 'bg-purple-600/50'
                            : 'bg-white/5 hover:bg-white/10'
                        }`}
                        onClick={() => selectTrack(index)}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                            {index === currentTrackIndex && isPlaying ? (
                              <Pause className="w-4 h-4 text-white" />
                            ) : (
                              <Play className="w-4 h-4 text-white ml-0.5" />
                            )}
                          </div>
                          <span className="text-white truncate">{track.name}</span>
                        </div>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeTrack(index);
                          }}
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/20 flex-shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Empty State */}
        {playlist.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center py-12"
          >
            <Music className="w-16 h-16 text-purple-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No music yet</h3>
            <p className="text-purple-200 mb-6">
              Upload your MP3 files to start listening
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}