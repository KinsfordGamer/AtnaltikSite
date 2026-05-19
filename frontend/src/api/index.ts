import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
});

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
