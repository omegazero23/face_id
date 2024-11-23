module.exports = {
  devServer: {
    // Configuración HTTPS para desarrollo
    https: process.env.NODE_ENV === 'production' ? false : true,

    // Configuración del proxy para redirigir las solicitudes al backend
    proxy: {
      '/api': {
        target: process.env.VUE_APP_API_URL, // Utiliza la URL base del backend
        changeOrigin: true,
        secure: false, // Permite certificados auto-firmados en desarrollo
      },
    },
    port: 8080, // Configura el puerto del servidor de desarrollo
    open: true, // Abre el navegador automáticamente
  },
};
