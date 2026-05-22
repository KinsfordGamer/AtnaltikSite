import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor to automatically add Authorization header
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const AuthAPI = {
  getMe: () => api.get('/auth/me'),
};

export const AnimeAPI = {
  getAnimes: (search?: string, genre?: string) => 
    api.get('/animes/', { params: { search, genre } }),
  
  getAnime: (id: number) => 
    api.get(`/animes/${id}`),
  
  getGenres: () => 
    api.get('/animes/genres/'),

  getStats: () => 
    api.get('/stats'),

  createAnime: (data: any) => 
    api.post('/animes/', data),

  updateAnime: (id: number, data: any) => 
    api.put(`/animes/${id}`, data),

  deleteAnime: (id: number) => 
    api.delete(`/animes/${id}`),

  addEpisode: (data: any) => 
    api.post('/animes/episodes/', data),

  deleteEpisode: (id: number) => 
    api.delete(`/animes/episodes/${id}`),
  
  getStreamUrl: (episodeId: number) => {
    const token = localStorage.getItem('token');
    return token ? `${API_BASE_URL}/stream/${episodeId}?token=${token}` : `${API_BASE_URL}/stream/${episodeId}`;
  },

  rateAnime: (animeId: number, score: number) =>
    api.post(`/animes/${animeId}/rate`, { score }),
};

export const PaymentsAPI = {
  deposit: (username: string, amount: number, provider: string) =>
    api.post('/payments/deposit', { username, amount, provider }),
  
  subscribe: (planType: string) =>
    api.post('/subscribe', { plan_type: planType }),
};

export const CommentsAPI = {
  getComments: (episodeId: number) =>
    api.get(`/episodes/${episodeId}/comments`),
  
  addComment: (episodeId: number, content: string) =>
    api.post(`/episodes/${episodeId}/comments`, { content }),
  
  likeComment: (commentId: number) =>
    api.post(`/comments/${commentId}/like`),
};

export default api;

