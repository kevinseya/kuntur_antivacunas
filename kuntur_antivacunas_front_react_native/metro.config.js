const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configuración para manejar streams de video
config.resolver.assetExts.push(
  // Video extensions
  'mp4',
  'mov',
  'avi',
  'mkv',
  'wmv',
  'flv',
  'webm',
  'mjpeg'
);

// Configuración para resolver módulos de red
config.resolver.platforms = ['ios', 'android', 'web'];

module.exports = config;