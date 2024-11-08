const { defineConfig } = require('@vue/cli-service')

module.exports = {
  devServer: {
    https: true,  // Activa HTTPS en el servidor de desarrollo de Vue
    proxy: {
      '/api': {
        target: 'https://127.0.0.1',  // Ajusta a tu backend en Docker
        changeOrigin: true,
        secure: false,  // Esto es útil para certificados auto-firmados
      },
      '/login': {
        target: 'https://127.0.0.1',  // Ajusta a tu backend en Docker
        changeOrigin: true,
        secure: false,  // Esto es útil para certificados auto-firmados
      },
    },
  },
};