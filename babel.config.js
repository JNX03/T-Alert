module.exports = (api) => {
    api.cache(true)
    return {
      presets: ["babel-preset-expo"],
      plugins: [
        // Add any additional babel plugins here if needed
      ],
    }
  }
  
  