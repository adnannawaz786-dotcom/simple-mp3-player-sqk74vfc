```javascript
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Mp3Player from '../components/Mp3Player';
import PlaylistManager from '../components/PlaylistManager';

export default function Home() {
  const [playlist, setPlaylist] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Load playlist from localStorage on mount
  useEffect(() => {
    try {
      const savedPlaylist = localStorage.getItem('mp3-playlist');
      if (savedPlaylist) {
        const parsedPlaylist = JSON.parse(savedPlaylist);
        setPlaylist(parsedPlaylist);
        if (parsedPlaylist.length > 0) {
          setCurrentTrack(parsedPlaylist[0]);
          setCurrentIndex(0);
        }
      }
    } catch (error) {
      console.error('Error loading playlist:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save playlist to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem('mp3-playlist', JSON.stringify(playlist));
      } catch (error) {
        console.error('Error saving playlist:', error);
      }
    }
  }, [playlist, isLoading]);

  const addToPlaylist = (files) => {
    const newTracks = Array.from(files).map((file, index) => ({
      id: Date.now() + index,
      name: file.name.replace('.mp3', ''),
      file: file,
      url: URL.createObjectURL(file),
      duration: null,
      artist: 'Unknown Artist'
    }));

    setPlaylist(prev => {
      const updated = [...prev, ...newTracks];
      // Set first track as current if no track is selected
      if (!currentTrack && updated.length > 0) {
        setCurrentTrack(updated[0]);
        setCurrentIndex(0);
      }
      return updated;
    });
  };

  const removeFromPlaylist = (trackId) => {
    setPlaylist(prev => {
      const updated = prev.filter(track => track.id !== trackId);
      
      // Update current track if the removed track was playing
      if (currentTrack && currentTrack.id === trackId) {
        if (updated.length > 0) {
          const newIndex = Math.min(currentIndex, updated.length - 1);
          setCurrentTrack(updated[newIndex]);
          setCurrentIndex(newIndex);
        } else {
          setCurrentTrack(null);
          setCurrentIndex(0);
        }
      } else if (currentTrack) {
        // Update current index if needed
        const newIndex = updated.findIndex(track => track.id === currentTrack.id);
        if (newIndex !== -1) {
          setCurrentIndex(newIndex);
        }
      }
      
      return updated;
    });
  };

  const selectTrack = (track) => {
    const index = playlist.findIndex(t => t.id === track.id);
    setCurrentTrack(track);
    setCurrentIndex(index);
  };

  const playNext = () => {
    if (playlist.length === 0) return;
    
    const nextIndex = (currentIndex + 1) % playlist.length;
    setCurrentTrack(playlist[nextIndex]);
    setCurrentIndex(nextIndex);
  };

  const playPrevious = () => {
    if (playlist.length === 0) return;
    
    const prevIndex = currentIndex === 0 ? playlist.length - 1 : currentIndex - 1;
    setCurrentTrack(playlist[prevIndex]);
    setCurrentIndex(prevIndex);
  };

  const clearPlaylist = () => {
    // Revoke object URLs to prevent memory leaks
    playlist.forEach(track => {
      if (track.url) {
        URL.revokeObjectURL(track.url);
      }
    });
    
    setPlaylist([]);
    setCurrentTrack(null);
    setCurrentIndex(0);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-white text-xl"
        >
          Loading...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-6 max-w-md">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">MP3 Player</h1>
          <p className="text-blue-200">Simple & Clean</p>
        </motion.header>

        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {currentTrack ? (
              <motion.div
                key="player"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              >
                <Mp3Player
                  track={currentTrack}
                  onNext={playNext}
                  onPrevious={playPrevious}
                  hasNext={playlist.length > 1}
                  hasPrevious={playlist.length > 1}
                />
              </motion.div>
            ) : (
              <motion.div
                key="no-track"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center"
              >
                <div className="text-white/70 mb-4">
                  <svg className="w-16 h-16 mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                  </svg>
                  <p className="text-lg">No track selected</p>
                  <p className="text-sm mt-2">Add some MP3 files to get started</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <PlaylistManager
              playlist={playlist}
              currentTrack={currentTrack}
              onAddFiles={addToPlaylist}
              onRemoveTrack={removeFromPlaylist}
              onSelectTrack={selectTrack}
              onClearPlaylist={clearPlaylist}
            />
          </motion.div>
        </div>

        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mt-8 text-white/50 text-sm"
        >
          <p>Your playlist is saved locally</p>
        </motion.footer>
      </div>
    </div>
  );
}
```