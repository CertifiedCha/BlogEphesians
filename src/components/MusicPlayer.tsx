import React, { useState, useEffect } from 'react';
import { Search, Music, ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { motion, AnimatePresence } from 'framer-motion'; // Replaced 'motion/react' with 'framer-motion'
import { toast } from 'sonner';
import { DolphinSpinner } from './LoadingScreen'; // Assuming this is a custom spinner component

interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string; width: number; height: number }[];
  };
  external_urls: { spotify: string };
}

interface SpotifySearchResponse {
  tracks: {
    items: SpotifyTrack[];
    total: number;
  };
}

export const MusicPlayer: React.FC = () => {
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null);
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [iframeUri, setIframeUri] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);

  // Spotify API configuration
  const CLIENT_ID = 'YOUR_SPOTIFY_CLIENT_ID'; // ⚠️ IMPORTANT: Replace with your actual Client ID
  const REDIRECT_URI = window.location.origin;
  const SCOPES = 'user-read-private user-read-email';

  // Handles Spotify authentication after redirect
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const token = hash.split('&').find(s => s.startsWith('access_token'))?.split('=')[1];
      if (token) {
        setAccessToken(token);
        window.location.hash = ''; // Clear hash from URL for cleaner look
        localStorage.setItem('spotify_access_token', token);
        toast.success('Successfully connected to Spotify!');
      }
    } else {
      const savedToken = localStorage.getItem('spotify_access_token');
      if (savedToken) {
        setAccessToken(savedToken);
      }
    }
  }, []);

  // Fetch initial popular tracks on component mount if an access token exists
  useEffect(() => {
    if (accessToken) {
      searchSpotifyTracks('top hits 2024');
    }
  }, [accessToken]);

  const connectToSpotify = () => {
    setIsConnecting(true);
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES)}`;
    window.location.href = authUrl;
  };

  const searchSpotifyTracks = async (query: string): Promise<void> => {
    if (!accessToken) {
      toast.error('Please connect to Spotify first.');
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
        localStorage.removeItem('spotify_access_token');
        setAccessToken(null);
        toast.error('Session expired. Please reconnect to Spotify.');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to search tracks.');
      }

      const data: SpotifySearchResponse = await response.json();
      setSearchResults(data.tracks.items);
      
      // If no track is currently playing, select the first one from the search results
      if (!currentTrack && data.tracks.items.length > 0) {
        handleTrackSelect(data.tracks.items[0]);
      }
      
      toast.success(`Found ${data.tracks.items.length} tracks.`);
    } catch (error) {
      console.error('Spotify search error:', error);
      toast.error('Failed to search tracks.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    searchSpotifyTracks(searchQuery);
  };

  const handleTrackSelect = (track: SpotifyTrack) => {
    setCurrentTrack(track);
    // Use the track's ID to construct the Spotify embed URI
    setIframeUri(`https://open.spotify.com/embed/track/${track.id}?utm_source=generator`);
    setShowSearch(false);
    toast.success(`Now playing: ${track.name} by ${track.artists[0].name}`);
  };

  const getAlbumImage = (track: SpotifyTrack) => {
    return track.album.images.find(img => img.width >= 64)?.url ||
      track.album.images[0]?.url ||
      'https://via.placeholder.com/64x64/1ed760/000000?text=♪';
  };

  // Render the "Connect to Spotify" screen if no access token exists
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
              <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                <Music className="w-12 h-12 text-green-400" />
              </motion.div>
              <div>
                <h3 className="text-white font-medium mb-2">Connect to Spotify</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Log in to get full playback and access to your playlists.
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
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Render the minimized player button
  if (isMinimized) {
    return (
      <motion.div
        className="fixed bottom-4 right-4 z-50"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.5 }}
      >
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <Button
            onClick={() => setIsMinimized(false)}
            className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 shadow-2xl text-black"
          >
            <Music className="w-6 h-6" />
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="fixed bottom-4 right-4 z-50 w-80"
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring", duration: 0.6, delay: 0.5 }}
    >
      <Card className="bg-gray-900 backdrop-blur-lg border-gray-700 shadow-2xl overflow-hidden">
        <CardContent className="p-0">
          {/* Spotify Header */}
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-600 to-green-500 text-black">
            <div className="flex items-center space-x-2">
              <Music className="w-4 h-4" />
              <h3 className="text-sm font-bold">Spotify Player</h3>
            </div>
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
                          onClick={() => handleTrackSelect(track)}
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
          
          {/* Main Iframe Player */}
          {iframeUri && (
            <motion.div 
              key={iframeUri}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="w-full h-80"
            >
              <iframe
                title="Spotify Embed Player"
                src={iframeUri}
                width="100%"
                height="100%"
                style={{ minHeight: '320px', border: 'none' }}
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
              />
            </motion.div>
          )}

          {/* Fallback Message */}
          {!iframeUri && (
            <div className="p-4 text-center">
              <p className="text-gray-400 text-sm">
                Search for a song to begin playing!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
