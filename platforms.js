/**
 * Destination Platform Compatibility Database
 * Specifications for 20+ major platforms across Audio, Video, Image, Document, and 3D.
 */

export const PLATFORM_CATEGORIES = [
  { id: 'all', label: 'All Destinations' },
  { id: 'social', label: 'Social & Short Video' },
  { id: 'audio', label: 'Audio & Podcasts' },
  { id: 'creative', label: 'Design & Web' },
  { id: 'document', label: 'Documents & Print' },
  { id: '3d', label: '3D & Spatial' }
];

export const PLATFORMS_DB = [
  // --- Social & Short Video ---
  {
    id: 'instagram_reels',
    name: 'Instagram Reels',
    category: 'social',
    icon: '📸',
    badgeColor: '#e1306c',
    description: 'Meta vertical short-form video platform',
    primaryType: 'video',
    preferredOutputFormat: 'mp4',
    acceptedContainers: ['mp4', 'mov'],
    preferredCodec: 'H.264 / AVC',
    maxSizeMB: 4000,
    videoRequirements: {
      aspectRatio: '9:16',
      resolution: '1080x1920',
      minResolution: '720x1280',
      maxFps: 60,
      minFps: 30,
      codec: 'h264',
      bitrateRange: '3.5 - 8 Mbps',
      colorSpace: 'Rec. 709'
    },
    audioRequirements: {
      codec: 'aac',
      sampleRate: '48000 Hz',
      channels: 2,
      bitrate: '128 - 256 kbps'
    },
    notes: 'Requires 9:16 vertical ratio. Horizontal 16:9 will be padded or heavily cropped.'
  },
  {
    id: 'tiktok',
    name: 'TikTok Video',
    category: 'social',
    icon: '🎵',
    badgeColor: '#ff0050',
    description: 'ByteDance short video feed',
    primaryType: 'video',
    preferredOutputFormat: 'mp4',
    acceptedContainers: ['mp4', 'mov', 'webm'],
    preferredCodec: 'H.264',
    maxSizeMB: 500,
    videoRequirements: {
      aspectRatio: '9:16',
      resolution: '1080x1920',
      maxFps: 60,
      codec: 'h264',
      bitrateRange: '4 - 10 Mbps',
      colorSpace: 'sRGB / Rec. 709'
    },
    audioRequirements: {
      codec: 'aac',
      sampleRate: '44100 Hz or 48000 Hz',
      channels: 2,
      bitrate: '192 kbps'
    },
    notes: 'Max length 10m for standard uploads. Vertical video strongly prioritized.'
  },
  {
    id: 'youtube_shorts',
    name: 'YouTube Shorts',
    category: 'social',
    icon: '▶️',
    badgeColor: '#ff0000',
    description: 'Google YouTube vertical format',
    primaryType: 'video',
    preferredOutputFormat: 'mp4',
    acceptedContainers: ['mp4', 'mov'],
    preferredCodec: 'H.264 or VP9',
    maxSizeMB: 2048,
    videoRequirements: {
      aspectRatio: '9:16 (or 1:1)',
      resolution: '1080x1920',
      maxFps: 60,
      codec: 'h264',
      bitrateRange: '8 - 12 Mbps',
      colorSpace: 'Standard Rec. 709'
    },
    audioRequirements: {
      codec: 'aac',
      sampleRate: '48000 Hz',
      channels: 2,
      bitrate: '384 kbps'
    },
    notes: 'Must be <= 60 seconds duration and square or vertical.'
  },
  {
    id: 'twitter_x',
    name: 'X (formerly Twitter)',
    category: 'social',
    icon: '𝕏',
    badgeColor: '#ffffff',
    description: 'Social microblogging video and images',
    primaryType: 'video',
    preferredOutputFormat: 'mp4',
    acceptedContainers: ['mp4', 'mov', 'jpg', 'png', 'webp', 'gif'],
    preferredCodec: 'H.264 / AAC',
    maxSizeMB: 512,
    videoRequirements: {
      aspectRatio: '1:1, 16:9, or 9:16',
      resolution: '1920x1080 (max)',
      maxFps: 60,
      codec: 'h264',
      bitrateRange: '5 - 8 Mbps'
    },
    audioRequirements: {
      codec: 'aac',
      sampleRate: '44100 Hz',
      channels: 2,
      bitrate: '128 kbps'
    },
    notes: 'Free accounts limited to 140s. X Premium accounts allow up to 1080p 3hr.'
  },

  // --- Audio & Podcasts ---
  {
    id: 'spotify_podcasters',
    name: 'Spotify for Podcasters',
    category: 'audio',
    icon: '🎧',
    badgeColor: '#1db954',
    description: 'Global podcast distribution platform',
    primaryType: 'audio',
    preferredOutputFormat: 'mp3',
    acceptedContainers: ['mp3', 'm4a', 'wav'],
    preferredCodec: 'MP3 or AAC',
    maxSizeMB: 250,
    audioRequirements: {
      format: 'mp3 or m4a',
      sampleRate: '44100 Hz',
      channels: 2,
      bitrate: '128 - 320 kbps (128 kbps recommended)',
      maxDurationMinutes: 180,
      targetLoudness: '-14 LUFS'
    },
    notes: 'Standard podcast spec. High-res 96kHz or 192kHz is downsampled by Spotify.'
  },
  {
    id: 'apple_podcasts',
    name: 'Apple Podcasts',
    category: 'audio',
    icon: '🎙️',
    badgeColor: '#a855f7',
    description: 'Apple podcast directory & Apple Music feed',
    primaryType: 'audio',
    preferredOutputFormat: 'm4a',
    acceptedContainers: ['mp3', 'm4a', 'wav', 'flac'],
    preferredCodec: 'AAC-LC or MP3',
    maxSizeMB: 500,
    audioRequirements: {
      format: 'm4a or mp3',
      sampleRate: '44100 Hz or 48000 Hz',
      channels: 2,
      bitrate: '160 - 256 kbps',
      targetLoudness: '-16 LUFS (±1 LUFS)'
    },
    notes: 'Prefers AAC in M4A container for highest fidelity to bandwidth ratio.'
  },
  {
    id: 'discord_audio',
    name: 'Discord Soundboard / Voice',
    category: 'audio',
    icon: '👾',
    badgeColor: '#5865f2',
    description: 'Discord voice channels and soundboard clips',
    primaryType: 'audio',
    preferredOutputFormat: 'mp3',
    acceptedContainers: ['mp3', 'ogg', 'wav'],
    preferredCodec: 'Opus or MP3',
    maxSizeMB: 25,
    audioRequirements: {
      format: 'mp3 or ogg',
      sampleRate: '48000 Hz',
      channels: 2,
      bitrate: '96 - 128 kbps',
      maxDurationMinutes: 0.1,
      strictLimitMB: 0.512
    },
    notes: 'Soundboard uploads must be under 5 seconds and under 512KB.'
  },
  {
    id: 'broadcast_wav',
    name: 'Pro Audio Master (WAV)',
    category: 'audio',
    icon: '🎚️',
    badgeColor: '#06b6d4',
    description: 'DAWs, Avid Pro Tools, Ableton Live',
    primaryType: 'audio',
    preferredOutputFormat: 'wav',
    acceptedContainers: ['wav', 'aiff'],
    preferredCodec: 'Linear PCM Uncompressed',
    maxSizeMB: 4000,
    audioRequirements: {
      format: 'wav',
      sampleRate: '44100 Hz or 48000 Hz',
      channels: 2,
      bitDepth: '16-bit or 24-bit',
      bitrate: '1411 - 2304 kbps'
    },
    notes: 'Lossless uncompressed master format. 100% transparent studio delivery.'
  },

  // --- Design & Creative Platforms ---
  {
    id: 'figma',
    name: 'Figma Canvas',
    category: 'creative',
    icon: '🎨',
    badgeColor: '#f24e1e',
    description: 'UI/UX collaborative vector design tool',
    primaryType: 'image',
    preferredOutputFormat: 'png',
    acceptedContainers: ['png', 'jpg', 'svg', 'webp', 'gif'],
    preferredCodec: 'PNG (with Alpha) or SVG Vector',
    maxSizeMB: 50,
    imageRequirements: {
      formats: ['png', 'svg', 'webp', 'jpg'],
      maxDimension: 4096,
      supportsAlpha: true,
      colorSpace: 'sRGB',
      dpi: 72
    },
    notes: 'Images larger than 4096px will be downscaled automatically by Figma.'
  },
  {
    id: 'canva',
    name: 'Canva Design',
    category: 'creative',
    icon: '✨',
    badgeColor: '#00c4cc',
    description: 'Online graphic design and presentations',
    primaryType: 'image',
    preferredOutputFormat: 'png',
    acceptedContainers: ['png', 'jpg', 'svg', 'mp4', 'gif'],
    preferredCodec: 'PNG or JPG',
    maxSizeMB: 25,
    imageRequirements: {
      formats: ['png', 'jpg', 'svg'],
      maxDimension: 5000,
      supportsAlpha: true,
      colorSpace: 'sRGB'
    },
    notes: 'Vector SVGs must have clean paths and no embedded bitmaps.'
  },
  {
    id: 'webflow',
    name: 'Webflow Assets',
    category: 'creative',
    icon: '🌐',
    badgeColor: '#4353ff',
    description: 'Responsive web builder asset manager',
    primaryType: 'image',
    preferredOutputFormat: 'webp',
    acceptedContainers: ['webp', 'svg', 'png', 'jpg', 'lottie'],
    preferredCodec: 'WEBP (High Compression)',
    maxSizeMB: 10,
    imageRequirements: {
      formats: ['webp', 'svg', 'png'],
      maxDimension: 2560,
      supportsAlpha: true,
      colorSpace: 'sRGB'
    },
    notes: 'WEBP is highly recommended for optimal Google PageSpeed Core Web Vitals.'
  },

  // --- Documents & Print ---
  {
    id: 'commercial_print',
    name: 'Commercial Print (Press PDF)',
    category: 'document',
    icon: '🖨️',
    badgeColor: '#3b82f6',
    description: 'High-res offset & digital print standard',
    primaryType: 'document',
    preferredOutputFormat: 'pdf',
    acceptedContainers: ['pdf', 'tiff'],
    preferredCodec: 'PDF/X-1a or PDF/X-4',
    maxSizeMB: 250,
    documentRequirements: {
      format: 'pdf',
      colorSpace: 'CMYK (or high-gamut RGB with profile)',
      dpi: 300,
      bleed: '3mm / 0.125in',
      fontsEmbedded: true
    },
    notes: 'Requires 300 DPI resolution. Transparency must be flattened or PDF/X-4 compliant.'
  },
  {
    id: 'slack_files',
    name: 'Slack Workspace',
    category: 'document',
    icon: '💬',
    badgeColor: '#4a154b',
    description: 'Team messaging file attachments',
    primaryType: 'document',
    preferredOutputFormat: 'csv',
    acceptedContainers: ['pdf', 'png', 'jpg', 'csv', 'json', 'txt', 'zip'],
    preferredCodec: 'Universal',
    maxSizeMB: 1000,
    documentRequirements: {
      format: 'any',
      inlinePreviewable: ['pdf', 'png', 'jpg', 'csv']
    },
    notes: 'Files under 25MB render instant rich inline previews.'
  },

  // --- 3D & Spatial ---
  {
    id: 'threejs_webgl',
    name: 'Three.js / WebGL Web',
    category: '3d',
    icon: '🧊',
    badgeColor: '#10b981',
    description: 'Interactive 3D on the web',
    primaryType: '3d',
    preferredOutputFormat: 'glb',
    acceptedContainers: ['gltf', 'glb', 'obj'],
    preferredCodec: 'GLTF / GLB with Draco compression',
    maxSizeMB: 25,
    modelRequirements: {
      formats: ['glb', 'gltf', 'obj'],
      maxPolyCount: 150000,
      textureResolution: 2048,
      materials: 'PBR Metallic-Roughness'
    },
    notes: 'GLB is the JPEG of 3D for the web. Self-contained binary mesh + textures.'
  },
  {
    id: 'stl_3d_print',
    name: '3D Printing Slicer (STL)',
    category: '3d',
    icon: '📐',
    badgeColor: '#f59e0b',
    description: 'PrusaSlicer, Cura, Bambu Studio',
    primaryType: '3d',
    preferredOutputFormat: 'stl',
    acceptedContainers: ['stl', 'step', '3mf'],
    preferredCodec: 'Binary STL (Watertight Manifold)',
    maxSizeMB: 200,
    modelRequirements: {
      formats: ['stl', '3mf'],
      isManifold: true,
      units: 'Millimeters'
    },
    notes: 'STL only stores triangulated surfaces. Color, materials, and rigs are stripped.'
  }
];

/**
 * Find platform by ID
 */
export function getPlatformById(id) {
  return PLATFORMS_DB.find(p => p.id === id) || null;
}
