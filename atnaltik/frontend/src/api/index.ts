import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

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
  getAnimes: (search?: string) => 
    api.get('/animes/', { params: { search } }),
  
  getAnime: (id: number) => 
    api.get(`/animes/${id}`),
  
  getGenres: () => 
    api.get('/animes/genres/'),

  createAnime: (data: any) => 
    api.post('/animes/', data),

  addEpisode: (data: any) => 
    api.post('/animes/episodes/', data),
  
  getStreamUrl: (episodeId: number) => 
    `${API_BASE_URL}/stream/${episodeId}`,
};

export default api;
