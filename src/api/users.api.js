import apiClient from './client';



export const usersApi = {
 
  async getProfileData() {
    const res = await apiClient.get('/users/profile-data');
    return res.data;
  },

  /**
   * @param {File|Blob} file
   */
  async uploadPhoto(file) {
    const formData = new FormData();
    formData.append('photo', file);

    const res = await apiClient.put('/users/upload-photo', formData, {
  
      headers: {
        'Content-Type': undefined,
      },
    });
    return res.data;
  },

  /**

   * @param {Object} params
   */
  async getFollowSuggestions({ page = 1, limit = 10 } = {}) {
    const res = await apiClient.get('/users/suggestions', {
      params: { page, limit },
    });
    return res.data;
  },

  /**
   * @param {string} userId
   */
  async getUserProfile(userId) {
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      throw new Error('A valid User ID is required.');
    }
    const safeUserId = encodeURIComponent(userId.trim());
    const res = await apiClient.get(`/users/${safeUserId}/profile`);
    return res.data;
  },

  /**
   * @param {string} userId
   */
  async followUser(userId) {
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      throw new Error('A valid User ID is required.');
    }
    const safeUserId = encodeURIComponent(userId.trim());
    const res = await apiClient.put(`/users/${safeUserId}/follow`);
    return res.data;
  },

  /**
   * @param {string} userId
   */
  async getUserPosts(userId) {
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      throw new Error('A valid User ID is required.');
    }
    const safeUserId = encodeURIComponent(userId.trim());
    const res = await apiClient.get(`/users/${safeUserId}/posts`);
    return res.data;
  },

  /**
   */
  async getBookmarks() {
    const res = await apiClient.get('/users/bookmarks');
    return res.data;
  },
};


export const notificationsApi = {
  /**
 
   * @param {Object} params
   */
  async getNotifications({ page = 1, limit = 20 } = {}) {
    const res = await apiClient.get('/notifications', {
      params: { page, limit },
    });
    return res.data;
  },

  
  async getUnreadCount() {
    const res = await apiClient.get('/notifications/unread-count');
    return res.data;
  },

  /**

   * @param {string} notificationId
   */
  async markAsRead(notificationId) {
    const safeId = encodeURIComponent(notificationId);
    const res = await apiClient.patch(`/notifications/${safeId}/read`);
    return res.data;
  },

  async markAllAsRead() {
    const res = await apiClient.patch('/notifications/read-all');
    return res.data;
  },
};

export default usersApi;
