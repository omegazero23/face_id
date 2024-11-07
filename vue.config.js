const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    proxy: {
      '/process_and_validate_ine': {
        target: 'https://127.0.0.1:443',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})