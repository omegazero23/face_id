// src/services/auth.js
import axios from 'axios'

class AuthService {
  async validateToken(token) {
    try {
      await axios.post('/verify-token', { token })
      // Si la validación es exitosa, devuelve true
      return true
    } catch (error) {
      // Si la validación falla, devuelve false o lanza una excepción
      return false
    }
  }
}

export default new AuthService()