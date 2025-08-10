// Utility functions for audio file handling and validation

/**
 * Validates if a file is an audio file
 * @param {File} file - The file to validate
 * @returns {boolean} - True if file is audio
 */
export const isAudioFile = (file) => {
  if (!file || !file.type) return false;
  
  const audioTypes = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'audio/aac',
    'audio/flac',
    'audio/m4a',
    'audio/webm'
  ];
  
  return audioTypes.includes(file.type) || file.name.toLowerCase().endsWith('.mp3');
};

/**
 * Formats time duration from seconds to MM:SS format
 * @param {number} seconds - Duration in seconds
 * @returns {string} - Formatted time string
 */
export const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

/**
 * Extracts file name without extension
 * @param {string} fileName - Full file name
 * @returns {string} - File name without extension
 */
export const getTrackTitle = (fileName) => {
  if (!fileName) return 'Unknown Track';
  
  return fileName.replace(/\.[^/.]+$/, '');
};

/**
 * Creates a unique ID for audio tracks
 * @param {string} fileName - File name
 * @param {number} fileSize - File size in bytes
 * @returns {string} - Unique track ID
 */
export const generateTrackId = (fileName, fileSize) => {
  const timestamp = Date.now();
  const hash = btoa(`${fileName}-${fileSize}-${timestamp}`).slice(0, 8);
  return `track-${hash}`;
};

/**
 * Validates audio duration and file size
 * @param {File} file - Audio file
 * @returns {Promise<Object>} - Validation result with duration
 */
export const validateAudioFile = async (file) => {
  return new Promise((resolve) => {
    if (!isAudioFile(file)) {
      resolve({ 
        valid: false, 
        error: 'Invalid audio file format',
        duration: 0 
      });
      return;
    }

    // Check file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      resolve({ 
        valid: false, 
        error: 'File too large (max 50MB)',
        duration: 0 
      });
      return;
    }

    // Create audio element to get duration
    const audio = new Audio();
    const url = URL.createObjectURL(file);
    
    audio.addEventListener('loadedmetadata', () => {
      URL.revokeObjectURL(url);
      resolve({
        valid: true,
        duration: audio.duration || 0,
        error: null
      });
    });

    audio.addEventListener('error', () => {
      URL.revokeObjectURL(url);
      resolve({
        valid: false,
        error: 'Could not load audio file',
        duration: 0
      });
    });

    audio.src = url;
  });
};

/**
 * Creates audio track object from file
 * @param {File} file - Audio file
 * @param {number} duration - Track duration in seconds
 * @returns {Object} - Track object
 */
export const createTrackObject = (file, duration = 0) => {
  return {
    id: generateTrackId(file.name, file.size),
    title: getTrackTitle(file.name),
    fileName: file.name,
    duration: duration,
    url: URL.createObjectURL(file),
    size: file.size,
    type: file.type,
    addedAt: new Date().toISOString()
  };
};

/**
 * Shuffles array using Fisher-Yates algorithm
 * @param {Array} array - Array to shuffle
 * @returns {Array} - Shuffled array copy
 */
export const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Gets next track index based on current index and mode
 * @param {number} currentIndex - Current track index
 * @param {Array} playlist - Current playlist
 * @param {string} repeatMode - 'none', 'one', 'all'
 * @returns {number} - Next track index or -1 if none
 */
export const getNextTrackIndex = (currentIndex, playlist, repeatMode = 'none') => {
  if (!playlist || playlist.length === 0) return -1;
  
  if (repeatMode === 'one') {
    return currentIndex;
  }
  
  const nextIndex = currentIndex + 1;
  
  if (nextIndex >= playlist.length) {
    return repeatMode === 'all' ? 0 : -1;
  }
  
  return nextIndex;
};

/**
 * Gets previous track index
 * @param {number} currentIndex - Current track index
 * @param {Array} playlist - Current playlist
 * @returns {number} - Previous track index
 */
export const getPreviousTrackIndex = (currentIndex, playlist) => {
  if (!playlist || playlist.length === 0) return -1;
  
  if (currentIndex <= 0) {
    return playlist.length - 1;
  }
  
  return currentIndex - 1;
};

/**
 * Cleans up object URLs to prevent memory leaks
 * @param {Array} tracks - Array of track objects
 */
export const cleanupTrackUrls = (tracks) => {
  if (!tracks || !Array.isArray(tracks)) return;
  
  tracks.forEach(track => {
    if (track.url && track.url.startsWith('blob:')) {
      URL.revokeObjectURL(track.url);
    }
  });
};

/**
 * Formats file size in human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};