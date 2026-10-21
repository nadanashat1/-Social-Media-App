import apiClient from './client';


export const postsApi = {
  /**
   * @param {Object} params
   * @param {number} [params.limit=15]
   * @param {number} [params.page=1]
   */
  async getPosts({ limit = 15, page = 1 } = {}) {
    const res = await apiClient.get('/posts', {
      params: { limit, page },
    });
    return res.data;
  },

  /**
   * @param {Object} opts
   * @param {string} [opts.body]
   * @param {File|null} [opts.image]
   */
  async createPost({ body, image } = {}) {
    if (image) {
      const form = new FormData();
      if (body && body.trim()) form.append('body', body.trim());
      form.append('image', image);
      const res = await apiClient.post('/posts', form);
      return res.data;
    }
    const res = await apiClient.post('/posts', { body: body?.trim() });
    return res.data;
  },

  /**
  
   * @param {string} postId
   */
  async getPost(postId) {
    const safeId = encodeURIComponent(postId);
    const res = await apiClient.get(`/posts/${safeId}`);
    return res.data;
  },

  /**
   
   * @param {string} postId
   */
  async toggleLike(postId) {
    const safeId = encodeURIComponent(postId);
    const res = await apiClient.put(`/posts/${safeId}/like`);
    return res.data;
  },

  /**

   * @param {string} postId
   * @param {Object} [params]
   * @param {number} [params.page=1]
   * @param {number} [params.limit=20]
   */
  async getPostLikes(postId, { page = 1, limit = 20 } = {}) {
    const safeId = encodeURIComponent(postId);
    const res = await apiClient.get(`/posts/${safeId}/likes`, {
      params: { page, limit },
    });
    return res.data;
  },

  /**
   
   * @param {string} postId
   */
  async toggleBookmark(postId) {
    const safeId = encodeURIComponent(postId);
    const res = await apiClient.put(`/posts/${safeId}/bookmark`);
    return res.data;
  },

  /**

   * @param {string} postId
   * @param {Object} params
   */
  async getComments(postId, { page = 1, limit = 20 } = {}) {
    const safeId = encodeURIComponent(postId);
    const res = await apiClient.get(`/posts/${safeId}/comments`, {
      params: { page, limit },
    });
    return res.data;
  },

  /**
 
   * @param {string} postId
   * @param {Object} opts
   * @param {string} [opts.content]
   * @param {File|null} [opts.image]
   */
  async createComment(postId, { content, image } = {}) {
    const safeId = encodeURIComponent(postId);
    if (image) {
      const form = new FormData();
      if (content && content.trim()) form.append('content', content.trim());
      form.append('image', image);
      const res = await apiClient.post(`/posts/${safeId}/comments`, form);
      return res.data;
    }
    const res = await apiClient.post(`/posts/${safeId}/comments`, {
      content: content?.trim(),
    });
    return res.data;
  },

  /**
  
   * @param {string} postId
   * @param {string} commentId
   */
  async getReplies(postId, commentId, { page = 1, limit = 20 } = {}) {
    const safePost = encodeURIComponent(postId);
    const safeComment = encodeURIComponent(commentId);
    const res = await apiClient.get(
      `/posts/${safePost}/comments/${safeComment}/replies`,
      { params: { page, limit } }
    );
    return res.data;
  },
};

export default postsApi;
