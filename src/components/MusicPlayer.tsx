import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Shuffle, Repeat, Heart, Search, Music, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Slider } from './ui/slider';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner@2.0.3';
import { DolphinSpinner } from './LoadingScreen';

interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: { 
    name: string; 
    images: { url: string; width: number; height: number }[];
  };
  duration_ms: number;
  preview_url?: string;
  external_urls: { spotify: string };
  popularity: number;
}

interface SpotifySearchResponse {
  tracks: {
    items: SpotifyTrack[];
    total: number;
  };
}

export const MusicPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null);
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [volume, setVolume] = useState(75);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'one' | 'all'>('off');
  const [currentTime, setCurrentTime] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const progressIntervalRef = useRef<NodeJS.Timeout>();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Spotify API configuration
  const CLIENT_ID = '83721f40f91c46bcae3379a3762f114e'; // Replace with your Spotify Client ID
  const REDIRECT_URI = window.location.origin;
  const SCOPES = [
    'streaming',
    'user-read-email',
    'user-read-private',
    'user-read-playback-state',
    'user-modify-playback-state',
    'playlist-read-private',
    'playlist-read-collaborative'
  ].join(' ');

  // Initialize Spotify Web Playback SDK
  useEffect(() => {
    if (!window.Spotify) {
      const script = document.createElement('script');
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.async = true;
      document.head.appendChild(script);
    }

    // Check for access token in URL hash (after Spotify redirect)
    const hash = window.location.hash;
    if (hash) {
      const token = hash.split('&')[0].split('=')[1];
      if (token) {
        setAccessToken(token);
        window.location.hash = '';
        localStorage.setItem('spotify_access_token', token);
      }
    } else {
      // Check localStorage for existing token
      const savedToken = localStorage.getItem('spotify_access_token');
      if (savedToken) {
        setAccessToken(savedToken);
      }
    }
  }, []);

  // Initialize with popular tracks when token is available
  useEffect(() => {
    if (accessToken) {
      searchSpotifyTracks('top hits 2024');
    }
  }, [accessToken]);

  // Audio progress tracking for preview
  useEffect(() => {
    if (isPlaying && currentTrack && audioRef.current) {
      progressIntervalRef.current = setInterval(() => {
        if (audioRef.current) {
          const current = audioRef.current.currentTime * 1000;
          setCurrentTime(current);
          
          if (current >= (audioRef.current.duration * 1000) || current >= 30000) {
            handleNext();
          }
        }
      }, 1000);
    } else {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isPlaying, currentTrack]);

  const connectToSpotify = () => {
    setIsConnecting(true);
    const authUrl = `https://accounts.spotify.com/authorize?` +
      `client_id=${CLIENT_ID}&` +
      `response_type=token&` +
      `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
      `scope=${encodeURIComponent(SCOPES)}`;
    
    window.location.href = authUrl;
  };

  const searchSpotifyTracks = async (query: string): Promise<void> => {
    if (!accessToken) {
      toast.error('Please connect to Spotify first');
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=20`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (response.status === 401) {
        // Token expired
        localStorage.removeItem('spotify_access_token');
        setAccessToken(null);
        toast.error('Session expired. Please reconnect to Spotify');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to search tracks');
      }

      const data: SpotifySearchResponse = await response.json();
      
      if (searchQuery === query) {
        setSearchResults(data.tracks.items);
        if (!showSearch && query !== 'top hits 2024') {
          setShowSearch(true);
        }
        
        // Initialize playlist with search results if empty
        if (tracks.length === 0 && data.tracks.items.length > 0) {
          setTracks(data.tracks.items);
          setCurrentTrack(data.tracks.items[0]);
        }
      }
      
      toast.success(`Found ${data.tracks.items.length} tracks`);
    } catch (error) {
      console.error('Spotify search error:', error);
      toast.error('Failed to search tracks');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    searchSpotifyTracks(searchQuery);
  };

  const handlePlayPause = () => {
    if (!currentTrack) {
      toast.error('No track selected');
      return;
    }

    if (!currentTrack.preview_url) {
      toast.warning('Preview not available for this track');
      // Open in Spotify
      window.open(currentTrack.external_urls.spotify, '_blank');
      return;
    }

    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      if (!audioRef.current) {
        audioRef.current = new Audio(currentTrack.preview_url);
        audioRef.current.volume = (isMuted ? 0 : volume) / 100;
        
        audioRef.current.onended = () => {
          handleNext();
        };
      }
      
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        toast.success(`Now playing: ${currentTrack.name} by ${currentTrack.artists[0].name}`);
      }).catch(error => {
        console.error('Audio play error:', error);
        toast.error('Failed to play audio');
      });
    }
  };

  const handleNext = () => {
    if (tracks.length === 0) return;

    if (repeatMode === 'one') {
      setCurrentTime(0);
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }
      return;
    }

    let nextIndex;
    if (isShuffled) {
      nextIndex = Math.floor(Math.random() * tracks.length);
    } else {
      nextIndex = currentTrackIndex + 1;
      if (nextIndex >= tracks.length) {
        nextIndex = repeatMode === 'all' ? 0 : currentTrackIndex;
      }
    }
    
    setCurrentTrackIndex(nextIndex);
    setCurrentTrack(tracks[nextIndex]);
    setCurrentTime(0);
    
    // Stop current audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
  };

  const handlePrevious = () => {
    if (currentTime > 3000) {
      setCurrentTime(0);
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }
      return;
    }

    let prevIndex = currentTrackIndex - 1;
    if (prevIndex < 0) {
      prevIndex = tracks.length - 1;
    }
    
    setCurrentTrackIndex(prevIndex);
    setCurrentTrack(tracks[prevIndex]);
    setCurrentTime(0);
    
    // Stop current audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
  };

  const handleTrackSelect = (track: SpotifyTrack, fromSearch = false) => {
    if (fromSearch) {
      if (!tracks.find(t => t.id === track.id)) {
        setTracks(prev => [...prev, track]);
      }
    }
    
    const trackIndex = tracks.findIndex(t => t.id === track.id);
    if (trackIndex !== -1) {
      setCurrentTrackIndex(trackIndex);
      setCurrentTrack(track);
      setCurrentTime(0);
      setShowSearch(false);
      
      // Stop current audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsPlaying(false);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (newVolume > 0) setIsMuted(false);
    
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
    }
  };

  const handleVolumeToggle = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? volume / 100 : 0;
    }
  };

  const handleRepeatToggle = () => {
    const modes: ('off' | 'one' | 'all')[] = ['off', 'all', 'one'];
    const currentIndex = modes.indexOf(repeatMode);
    setRepeatMode(modes[(currentIndex + 1) % modes.length]);
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getAlbumImage = (track: SpotifyTrack) => {
    return track.album.images.find(img => img.width >= 64)?.url || 
           track.album.images[0]?.url || 
           'https://via.placeholder.com/64x64/1ed760/000000?text=♪';
  };

  if (!accessToken) {
    return (
      <motion.div 
        className="fixed bottom-4 right-4 z-50 w-80"
        initial={{ x: 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: "spring", duration: 0.6, delay: 0.5 }}
      >
        <Card className="bg-gray-900 backdrop-blur-lg border-gray-700 shadow-2xl">
          <CardContent className="p-6 text-center">
            <div className="flex flex-col items-center space-y-4">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Music className="w-12 h-12 text-green-400" />
              </motion.div>
              <div>
                <h3 className="text-white font-medium mb-2">Connect to Spotify</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Get access to millions of songs
                </p>
              </div>
              <Button
                onClick={connectToSpotify}
                disabled={isConnecting}
                className="w-full bg-green-500 hover:bg-green-600 text-black font-medium"
              >
                {isConnecting ? (
                  <DolphinSpinner size={16} />
                ) : (
                  <>
                    <Music className="mr-2 w-4 h-4" />
                    Connect Spotify
                  </>
                )}
              </Button>
              <p className="text-xs text-gray-500 text-center">
                Free Spotify account required. Only 30-second previews available.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const progressPercentage = currentTrack 
    ? Math.min((currentTime / Math.min(currentTrack.duration_ms, 30000)) * 100, 100)
    : 0;

  if (isMinimized) {
    return (
      <motion.div 
        className="fixed bottom-4 right-4 z-50"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.5 }}
      >
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Button
            onClick={() => setIsMinimized(false)}
            className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 shadow-2xl"
          >
            <motion.div
              animate={isPlaying ? { scale: [1, 1.1, 1] } : { scale: 1 }}
              transition={{ duration: 0.6, repeat: isPlaying ? Infinity : 0 }}
            >
              {isPlaying ? <Pause className="w-6 h-6 text-black" /> : <Play className="w-6 h-6 text-black ml-0.5" />}
            </motion.div>
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className={`fixed bottom-4 right-4 z-50 ${isExpanded ? 'w-96' : 'w-80'}`}
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring", duration: 0.6, delay: 0.5 }}
    >
      <Card className="bg-gray-900 backdrop-blur-lg border-gray-700 shadow-2xl overflow-hidden">
        <CardContent className="p-0">
          {/* Spotify Header */}
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-600 to-green-500 text-black">
            <motion.div 
              className="flex items-center space-x-2"
              animate={{ opacity: [1, 0.8, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Music className="w-4 h-4" />
              <h3 className="text-sm font-bold">Spotify Player</h3>
            </motion.div>
            <div className="flex items-center space-x-1">
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSearch(!showSearch)}
                  className="w-6 h-6 text-black hover:text-black/80 p-0 hover:bg-white/20"
                >
                  <Search className="w-3 h-3" />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMinimized(true)}
                  className="w-6 h-6 text-black hover:text-black/80 p-0 hover:bg-white/20"
                >
                  ×
                </Button>
              </motion.div>
            </div>
          </div>

          {/* Search Section */}
          <AnimatePresence>
            {showSearch && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="border-b border-gray-700"
              >
                <div className="p-4 space-y-3">
                  <div className="flex space-x-2">
                    <Input
                      type="text"
                      placeholder="Search songs, artists, albums..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      className="flex-1 bg-gray-800 border-gray-600 text-white"
                      disabled={isSearching}
                    />
                    <Button
                      onClick={handleSearch}
                      disabled={isSearching || !searchQuery.trim()}
                      className="bg-green-600 hover:bg-green-700 text-black"
                    >
                      {isSearching ? <DolphinSpinner size={16} /> : <Search className="w-4 h-4" />}
                    </Button>
                  </div>
                  
                  {searchResults.length > 0 && (
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {searchResults.map((track) => (
                        <motion.button
                          key={track.id}
                          onClick={() => handleTrackSelect(track, true)}
                          className="w-full text-left p-2 rounded text-xs hover:bg-gray-700 transition-colors text-white"
                          whileHover={{ scale: 1.02, x: 4 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-center space-x-2">
                            <img 
                              src={getAlbumImage(track)} 
                              alt={track.album.name} 
                              className="w-6 h-6 rounded" 
                            />
                            <div className="flex-1 min-w-0">
                              <div className="truncate font-medium">{track.name}</div>
                              <div className="text-xs opacity-70 truncate">{track.artists[0].name}</div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(track.external_urls.spotify, '_blank');
                              }}
                              className="w-6 h-6 p-0"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Current Track */}
          {currentTrack && (
            <div className="p-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTrack.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center space-x-3 mb-4"
                >
                  <motion.div
                    className="relative"
                    animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
                    transition={{ duration: 10, repeat: isPlaying ? Infinity : 0, ease: "linear" }}
                  >
                    <img 
                      src={getAlbumImage(currentTrack)} 
                      alt={currentTrack.album.name}
                      className="w-12 h-12 rounded-lg shadow-lg"
                    />
                    {isPlaying && (
                      <motion.div
                        className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center"
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <div className="w-2 h-2 bg-green-400 rounded-full" />
                      </motion.div>
                    )}
                  </motion.div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-medium text-sm truncate">{currentTrack.name}</h4>
                    <p className="text-gray-400 text-xs truncate">{currentTrack.artists[0].name}</p>
                  </div>

                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(currentTrack.external_urls.spotify, '_blank')}
                      className="w-8 h-8 p-0"
                    >
                      <ExternalLink className="w-4 h-4 text-green-400" />
                    </Button>
                  </motion.div>
                </motion.div>
              </AnimatePresence>

              {/* Progress Bar */}
              <div className="space-y-2 mb-4">
                <div className="relative">
                  <Slider
                    value={[progressPercentage]}
                    onValueChange={(value) => {
                      if (currentTrack && audioRef.current) {
                        const newTime = (value[0] / 100) * Math.min(currentTrack.duration_ms, 30000);
                        audioRef.current.currentTime = newTime / 1000;
                        setCurrentTime(newTime);
                      }
                    }}
                    max={100}
                    step={0.1}
                    className="w-full"
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(Math.min(currentTrack.duration_ms, 30000))}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center space-x-4 mb-4">
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsShuffled(!isShuffled)}
                    className={`w-8 h-8 p-0 ${isShuffled ? 'text-green-400' : 'text-gray-400 hover:text-white'}`}
                  >
                    <Shuffle className="w-4 h-4" />
                  </Button>
                </motion.div>

                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePrevious}
                    className="w-8 h-8 p-0 text-gray-400 hover:text-white"
                  >
                    <SkipBack className="w-4 h-4" />
                  </Button>
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.1 }} 
                  whileTap={{ scale: 0.9 }}
                  className="relative"
                >
                  <Button
                    onClick={handlePlayPause}
                    className="w-10 h-10 rounded-full bg-green-500 hover:bg-green-600 text-black p-0"
                  >
                    <motion.div
                      animate={isPlaying ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                      transition={{ duration: 0.6, repeat: isPlaying ? Infinity : 0 }}
                    >
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                    </motion.div>
                  </Button>
                </motion.div>

                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleNext}
                    className="w-8 h-8 p-0 text-gray-400 hover:text-white"
                  >
                    <SkipForward className="w-4 h-4" />
                  </Button>
                </motion.div>

                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRepeatToggle}
                    className={`w-8 h-8 p-0 relative ${
                      repeatMode !== 'off' ? 'text-green-400' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Repeat className="w-4 h-4" />
                    {repeatMode === 'one' && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full" />
                    )}
                  </Button>
                </motion.div>
              </div>

              {/* Volume Control */}
              <div className="flex items-center space-x-2">
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleVolumeToggle}
                    className="w-6 h-6 p-0 text-gray-400 hover:text-white"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </Button>
                </motion.div>
                <Slider
                  value={[isMuted ? 0 : volume]}
                  onValueChange={handleVolumeChange}
                  max={100}
                  step={1}
                  className="flex-1"
                />
                <span className="text-xs text-gray-400 w-8 text-right">
                  {isMuted ? 0 : volume}
                </span>
              </div>

              {!currentTrack.preview_url && (
                <p className="text-xs text-yellow-400 text-center mt-2">
                  Preview not available - click play to open in Spotify
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
