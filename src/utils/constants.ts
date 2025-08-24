export const CATEGORY_GRADIENTS = {
  'Programming': 'from-blue-500 to-purple-600',
  'Design': 'from-pink-500 to-rose-500',
  'Technology': 'from-gray-700 to-gray-900',
  'Science': 'from-green-500 to-teal-600',
  'Art': 'from-purple-500 to-indigo-600',
  'Travel': 'from-orange-500 to-yellow-500',
  'Food': 'from-red-500 to-pink-500',
  'Music': 'from-violet-500 to-purple-600',
  'Gaming': 'from-cyan-500 to-blue-600',
  'Sports': 'from-lime-500 to-green-600',
  'Business': 'from-slate-600 to-gray-800',
  'Health': 'from-emerald-500 to-teal-600',
} as const;

export const CATEGORIES = [
  'Programming', 'Design', 'Technology', 'Science', 'Art', 'Travel',
  'Food', 'Music', 'Gaming', 'Sports', 'Business', 'Health'
] as const;

export const MOCK_MUSIC_TRACKS = [
  { id: '1', title: 'Coding Vibes', artist: 'TechBeats', duration: '3:42' },
  { id: '2', title: 'Creative Flow', artist: 'DesignMusic', duration: '4:15' },
  { id: '3', title: 'Focus Mode', artist: 'ProductivitySounds', duration: '3:28' },
  { id: '4', title: 'Reading Time', artist: 'ChillBeats', duration: '4:03' },
  { id: '5', title: 'Deep Work', artist: 'ConcentrationTunes', duration: '3:55' },
] as const;

export type CategoryType = keyof typeof CATEGORY_GRADIENTS;