/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Suppress Webpack warnings from onnxruntime-web dynamically requiring dependencies
    config.ignoreWarnings = [
      { module: /node_modules\/onnxruntime-web/ },
      { message: /Critical dependency: require function is used in a way/ }
    ];

    // Ignore the warning about onnxruntime-node
    config.resolve.alias = {
      ...config.resolve.alias,
      "onnxruntime-node$": false,
    };
    
    // Copy/Ignore WASM issues in Webpack
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    
    return config;
  },
};

export default nextConfig;
