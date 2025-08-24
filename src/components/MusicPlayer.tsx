import React, { useState, useEffect } from 'react';
import { Music, Search, X, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string; width: number; height: number }[];
  };
}

export const MusicPlayer: React.FC = () => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(true);
  const [loadingContent, setLoadingContent] = useState(false);
  const [iframeUri, setIframeUri] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // ⚠️ IMPORTANT: Replace with your actual Spotify Client ID and Redirect URI.
  // The Redirect URI MUST be an exact match to what's in your Dashboard.
  const CLIENT_ID = '83721f40f91c46bcae3379a3762f114e';
  const REDIRECT_URI = 'https://blogephesians.onrender.com';
  const SCOPES = 'user-top-read playlist-modify-private playlist-modify-public';

  // Handles redirect after authentication and exchanges code for token
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
      const codeVerifier = localStorage.getItem('code_verifier');

      const getToken = async () => {
        try {
          const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              client_id: CLIENT_ID,
              grant_type: 'authorization_code',
              code,
              redirect_uri: REDIRECT_URI,
              code_verifier: codeVerifier,
            }),
          });
          const data = await response.json();
          if (data.access_token) {
            setAccessToken(data.access_token);
            localStorage.setItem('spotify_access_token', data.access_token);
            // Clean up the URL
            window.history.pushState({}, document.title, REDIRECT_URI);
          } else {
            toast.error('Failed to get access token.');
          }
        } catch (error) {
          console.error('Error exchanging code for token:', error);
          toast.error('Authentication failed.');
        }
      };
      getToken();
    } else {
      const savedToken = localStorage.getItem('spotify_access_token');
      if (savedToken) {
        setAccessToken(savedToken);
      }
    }
  }, [CLIENT_ID, REDIRECT_URI]);


  // Fetch top tracks and create a playlist when access token is available
  useEffect(() => {
    if (accessToken) {
      handleGetTopTracksAndCreatePlaylist();
    }
  }, [accessToken]);

  async function fetchWebApi(endpoint: string, method: string, body?: any) {
    const res = await fetch(`https://api.spotify.com/v1/${endpoint}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      method,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status === 401) {
      localStorage.removeItem('spotify_access_token');
      setAccessToken(null);
      toast.error('Session expired. Please reconnect.');
      throw new Error('Session expired.');
    }
    return await res.json();
  }

  async function getTopTracks(): Promise<SpotifyTrack[]> {
    return (await fetchWebApi('me/top/tracks?time_range=long_term&limit=5', 'GET')).items;
  }

  async function createPlaylist(tracksUri: string[]): Promise<string> {
    const { id: user_id } = await fetchWebApi('me', 'GET');
    const playlist = await fetchWebApi(
      `users/${user_id}/playlists`, 'POST', {
        "name": "My Top Tracks",
        "description": "Playlist of my all-time top tracks, created automatically.",
        "public": false
      });
    
    await fetchWebApi(
      `playlists/${playlist.id}/tracks?uris=${tracksUri.join(',')}`,
      'POST'
    );
    return playlist.id;
  }

  async function handleGetTopTracksAndCreatePlaylist() {
    if (!accessToken) return;
    setLoadingContent(true);
    try {
      toast.promise(
        new Promise(async (resolve, reject) => {
          try {
            const topTracks = await getTopTracks();
            if (topTracks.length === 0) {
              setIframeUri(null);
              toast.info('No top tracks found for your account.');
              resolve(null);
              return;
            }
            const tracksUri = topTracks.map(track => `spotify:track:${track.id}`);
            const playlistId = await createPlaylist(tracksUri);
            
            setTimeout(() => {
              setIframeUri(`https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator`);
              resolve(null);
            }, 2000);
          } catch (e) {
            reject(e);
          }
        }),
        {
          loading: 'Fetching top tracks and creating a playlist...',
          success: 'Your personal playlist is ready!',
          error: (err) => `Failed to create playlist: ${err.message}`,
        }
      );
    } catch (e) {
      // Handled by toast.promise
    } finally {
      setLoadingContent(false);
    }
  }
  
  const connectToSpotify = async () => {
    // PKCE helper functions
    const generateRandomString = (length: number) => {
      const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      const values = crypto.getRandomValues(new Uint8Array(length));
      return values.map(x => possible[x % possible.length]).join('');
    };

    const sha256 = async (plain: string) => {
      const encoder = new TextEncoder();
      const data = encoder.encode(plain);
      return window.crypto.subtle.digest('SHA-256', data);
    };

    const base64encode = (input: ArrayBuffer) => {
      return btoa(String.fromCharCode(...new Uint8Array(input)))
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
    };

    const codeVerifier = generateRandomString(128);
    const hashed = await sha256(codeVerifier);
    const codeChallenge = base64encode(hashed);

    localStorage.setItem('code_verifier', codeVerifier);

    const authUrl = new URL('https://accounts.spotify.com/authorize');
    const params = {
      response_type: 'code',
      client_id: CLIENT_ID,
      scope: SCOPES,
      redirect_uri: REDIRECT_URI,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
    };
    authUrl.search = new URLSearchParams(params).toString();
    window.location.href = authUrl.toString();
  };

  const searchSpotifyTracks = async (query: string): Promise<void> => {
    if (!accessToken) {
      toast.error('Please connect to Spotify first.');
      return;
    }
    setIsSearching(true);
    try {
      const response = await fetchWebApi(`search?q=${encodeURIComponent(query)}&type=track&limit=10`, 'GET');
      setSearchResults(response.tracks.items);
      toast.success(`Found ${response.tracks.items.length} tracks.`);
    } catch (error) {
      console.error('Spotify search error:', error);
      toast.error('Failed to search tracks.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim() !== '') {
      searchSpotifyTracks(searchQuery);
    }
  };

  const handleTrackSelect = (track: SpotifyTrack) => {
    setIframeUri(`https://open.spotify.com/embed/track/${track.id}?utm_source=generator`);
    setShowSearch(false);
    toast.success(`Now playing: ${track.name} by ${track.artists[0].name}`);
  };

  const getAlbumImage = (track: SpotifyTrack) => {
    return track.album.images.find(img => img.width >= 64)?.url ||
      track.album.images[0]?.url ||
      'https://via.placeholder.com/64x64/1ed760/000000?text=♪';
  };

  if (!accessToken) {
    return (
      <motion.div
        className="fixed bottom-4 left-4 z-50 w-80"
        initial={{ x: -400, opacity: 0 }}
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
                  Log in to get full playback and access to your personal music.
                </p>
              </div>
              <Button onClick={connectToSpotify} className="w-full bg-green-500 hover:bg-green-600 text-black font-medium">
                Connect Spotify
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <AnimatePresence>
        {isMinimized ? (
          <motion.div
            key="minimized-button"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", duration: 0.5 }}
          >
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                onClick={() => setIsMinimized(false)}
                className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 shadow-2xl text-black"
                aria-label="Open Spotify Player"
              >
                <Music className="w-6 h-6" />
              </Button>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="full-player"
            initial={{ y: 200, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 200, opacity: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            className="w-80"
          >
            <Card className="bg-gray-900 backdrop-blur-lg border-gray-700 shadow-2xl overflow-hidden">
              <CardContent className="p-0">
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
                        aria-label="Toggle Search"
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
                        aria-label="Minimize Spotify Player"
                      >
                        <X className="w-4 h-4" />
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
                            placeholder="Search songs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            className="flex-1 bg-gray-800 border-gray-600 text-white"
                            disabled={isSearching}
                          />
                          <Button onClick={handleSearch} disabled={isSearching || !searchQuery.trim()} className="bg-green-600 hover:bg-green-700 text-black">
                            {isSearching ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}><RefreshCw className="w-4 h-4" /></motion.div> : <Search className="w-4 h-4" />}
                          </Button>
                        </div>
                        {searchResults.length > 0 && (
                          <div className="max-h-32 overflow-y-auto space-y-1">
                            {searchResults.map((track) => (
                              <motion.button key={track.id} onClick={() => handleTrackSelect(track)} className="w-full text-left p-2 rounded text-xs hover:bg-gray-700 transition-colors text-white" whileHover={{ scale: 1.02, x: 4 }} whileTap={{ scale: 0.98 }}>
                                <div className="flex items-center space-x-2">
                                  <img src={getAlbumImage(track)} alt={track.album.name} className="w-6 h-6 rounded" />
                                  <div className="flex-1 min-w-0">
                                    <div className="truncate font-medium">{track.name}</div>
                                    <div className="text-xs opacity-70 truncate">{track.artists[0].name}</div>
                                  </div>
                                </div>
                              </motion.button>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {loadingContent ? (
                  <div className="flex flex-col items-center justify-center p-8 space-y-4 text-center">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}><RefreshCw className="w-8 h-8 text-green-400" /></motion.div>
                    <p className="text-gray-400">Creating your personal playlist...</p>
                  </div>
                ) : (
                  iframeUri && (
                    <motion.div key={iframeUri} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="w-full h-80">
                      <iframe
                        title="Spotify Embed: Recommendation Playlist"
                        src={iframeUri}
                        width="100%"
                        height="100%"
                        style={{ minHeight: '320px', border: 'none' }}
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        loading="lazy"
                      />
                    </motion.div>
                  )
                )}

                {!iframeUri && !loadingContent && (
                  <div className="p-4 text-center">
                    <p className="text-gray-400 text-sm">
                      No playlist loaded. Search for a song to play or reconnect.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
