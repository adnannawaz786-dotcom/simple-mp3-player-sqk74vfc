import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Music, Plus, Trash2 } from 'lucide-react';

const PlaylistManager = ({ 
  playlist, 
  onPlaylistUpdate, 
  currentTrack, 
  onTrackSelect 
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    // Load playlist from localStorage on component mount
    const savedPlaylist = localStorage.getItem('mp3-player-playlist');
    if (savedPlaylist) {
      try {
        const parsedPlaylist = JSON.parse(savedPlaylist);
        onPlaylistUpdate(parsedPlaylist);
      } catch (error) {
        console.error('Error loading playlist from localStorage:', error);
      }
    }
  }, [onPlaylistUpdate]);

  const savePlaylistToStorage = (newPlaylist) => {
    try {
      localStorage.setItem('mp3-player-playlist', JSON.stringify(newPlaylist));
      onPlaylistUpdate(newPlaylist);
    } catch (error) {
      console.error('Error saving playlist to localStorage:', error);
    }
  };

  const handleFileUpload = async (files) => {
    setIsUploading(true);
    const newTracks = [];

    for (const file of files) {
      if (file.type.startsWith('audio/')) {
        const audioUrl = URL.createObjectURL(file);
        const track = {
          id: Date.now() + Math.random(),
          name: file.name.replace(/\.[^/.]+$/, ''),
          file: file,
          url: audioUrl,
          duration: 0,
          addedAt: new Date().toISOString()
        };

        // Get audio duration
        try {
          const audio = new Audio(audioUrl);
          await new Promise((resolve) => {
            audio.addEventListener('loadedmetadata', () => {
              track.duration = audio.duration;
              resolve();
            });
          });
        } catch (error) {
          console.error('Error loading audio metadata:', error);
        }

        newTracks.push(track);
      }
    }

    const updatedPlaylist = [...playlist, ...newTracks];
    savePlaylistToStorage(updatedPlaylist);
    setIsUploading(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    handleFileUpload(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFileInput = (e) => {
    const files = Array.from(e.target.files);
    handleFileUpload(files);
    e.target.value = '';
  };

  const removeTrack = (trackId) => {
    const updatedPlaylist = playlist.filter(track => track.id !== trackId);
    savePlaylistToStorage(updatedPlaylist);
  };

  const clearPlaylist = () => {
    localStorage.removeItem('mp3-player-playlist');
    onPlaylistUpdate([]);
  };

  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-semibold text-lg">Playlist</h2>
          {playlist.length > 0 && (
            <button
              onClick={clearPlaylist}
              className="text-white/80 hover:text-white transition-colors"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
        <p className="text-white/80 text-sm mt-1">
          {playlist.length} {playlist.length === 1 ? 'track' : 'tracks'}
        </p>
      </div>

      {/* Upload Area */}
      <motion.div
        className={`p-4 border-2 border-dashed transition-colors ${
          isDragOver 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 bg-gray-50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <input
          type="file"
          multiple
          accept="audio/*"
          onChange={handleFileInput}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className="flex flex-col items-center justify-center cursor-pointer"
        >
          <motion.div
            animate={isUploading ? { rotate: 360 } : {}}
            transition={{ duration: 1, repeat: isUploading ? Infinity : 0 }}
          >
            {isUploading ? (
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className="text-gray-400 mb-2" size={32} />
            )}
          </motion.div>
          <p className="text-gray-600 text-center text-sm">
            {isUploading ? 'Uploading...' : 'Drop MP3 files here or click to browse'}
          </p>
        </label>
      </motion.div>

      {/* Playlist */}
      <div className="max-h-64 overflow-y-auto">
        <AnimatePresence>
          {playlist.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-8 text-center"
            >
              <Music className="mx-auto text-gray-300 mb-3" size={48} />
              <p className="text-gray-500">No tracks in playlist</p>
              <p className="text-gray-400 text-sm mt-1">Add some MP3 files to get started</p>
            </motion.div>
          ) : (
            playlist.map((track, index) => (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  currentTrack?.id === track.id ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <button
                  onClick={() => onTrackSelect(track)}
                  className="flex-1 flex items-center text-left"
                >
                  <div className={`w-2 h-2 rounded-full mr-3 ${
                    currentTrack?.id === track.id ? 'bg-blue-500' : 'bg-gray-300'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium truncate ${
                      currentTrack?.id === track.id ? 'text-blue-700' : 'text-gray-900'
                    }`}>
                      {track.name}
                    </p>
                    <p className="text-gray-500 text-sm">
                      {formatDuration(track.duration)}
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => removeTrack(track.id)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X size={16} />
                </button>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PlaylistManager;
