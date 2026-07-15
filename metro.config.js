const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const config = {
  resolver: {
    assetExts: [...getDefaultConfig(__dirname).resolver.assetExts, 'webp'],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);