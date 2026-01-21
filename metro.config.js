const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// allow requiring .txt files as assets
config.resolver.assetExts = [...config.resolver.assetExts, "txt"];

module.exports = config;
