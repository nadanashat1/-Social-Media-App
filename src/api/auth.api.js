import apiClient from './client';



export const authApi = {
  /**
  
   * @param {Object} payload
   * @param {string} payload.name
   * @param {string} payload.username
   * @param {string} payload.email
   * @param {string} payload.dateOfBirth 
   * @param {string} payload.gender 
   * @param {string} payload.password
   * @param {string} payload.rePassword
   */
  async signup(payload) {
    const res = await apiClient.post('/users/signup', payload);
    return res.data;
  },

  /**
   * @param {Object} payload
   */
  async signin(payload) {
    const res = await apiClient.post('/users/signin', payload);
    return res.data;
  },

  /**
   * @param {Object} payload
   * @param {string} payload.password
   * @param {string} payload.newPassword
   */
  async changePassword(payload) {
    const res = await apiClient.patch('/users/change-password', payload);
    return res.data;
  },

  
  async healthCheck() {
    try {
      const res = await apiClient.get('/api/health');
      return res.data;
    } catch {
      const res = await apiClient.get('/');
      return res.data;
    }
  },
};

export default authApi;
