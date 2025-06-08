import axios from 'axios';
import { API_CONFIG } from '../config/apiConfig';
import type {
  User, Team, Tournament, Match,
  CreateUserDto, UpdateUserDto,
  CreateTeamDto, UpdateTeamDto,
  CreateTournamentDto, UpdateTournamentDto,
  RecordMatchResultDto
} from '../types';

const API_BASE_URL = API_CONFIG.BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      // Redirect to login or trigger auth refresh
    }
    return Promise.reject(error);
  }
);

// User API
export const userApi = {
  getById: (id: string) => api.get<User>(`/users/${id}`),
  getByEmail: (email: string) => api.get<User>(`/users/email/${email}`),
  getByExternalId: (provider: string, externalId: string) => 
    api.get<User>(`/users/external/${provider}/${externalId}`),
  create: (data: CreateUserDto) => api.post<User>('/users', data),
  update: (id: string, data: UpdateUserDto) => api.put<User>(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
};

// Team API
export const teamApi = {
  getAll: () => api.get<Team[]>('/teams'),
  getById: (id: string) => api.get<Team>(`/teams/${id}`),
  getMyTeam: () => api.get<Team>('/teams/my-team'),
  hasTeam: () => api.get<boolean>('/teams/has-team'),
  getByUserId: (_userId: string) => {
    // Since backend doesn't have this endpoint, we'll use getMyTeam for current user
    return api.get<Team>('/teams/my-team').then(response => ({ data: [response.data] }));
  },
  create: (data: CreateTeamDto) => api.post<Team>('/teams', data),
  update: (id: string, data: UpdateTeamDto) => api.put<Team>(`/teams/${id}`, data),
  delete: (id: string) => api.delete(`/teams/${id}`),
  addMember: (teamId: string, userId: string) => 
    api.post(`/teams/${teamId}/members`, { userId }),
  removeMember: (teamId: string, userId: string) => 
    api.delete(`/teams/${teamId}/members/${userId}`),
};

// Tournament API
export const tournamentApi = {
  getAll: () => api.get<Tournament[]>('/tournaments'),
  getById: (id: string) => api.get<Tournament>(`/tournaments/${id}`),
  getByUserId: (_userId: string) => api.get<Tournament[]>('/tournaments/my-tournaments'),
  create: (data: CreateTournamentDto) => api.post<Tournament>('/tournaments', data),
  update: (id: string, data: UpdateTournamentDto) => api.put<Tournament>(`/tournaments/${id}`, data),
  delete: (id: string) => api.delete(`/tournaments/${id}`),
  joinTeam: (tournamentId: string, _teamId: string) => 
    api.post(`/tournaments/${tournamentId}/join`),
  leaveTeam: (tournamentId: string, teamId: string) => 
    api.delete(`/tournaments/${tournamentId}/teams/${teamId}`),
  start: (id: string) => api.post(`/tournaments/${id}/start`),
  getBracket: (id: string) => api.get(`/tournaments/${id}/bracket`),
};

// Match API
export const matchApi = {
  getAll: () => api.get<Match[]>('/matches'),
  getById: (id: string) => api.get<Match>(`/matches/${id}`),
  getByTournamentId: (tournamentId: string) => api.get<Match[]>(`/tournaments/${tournamentId}/matches`),
  recordResult: (id: string, data: RecordMatchResultDto) => api.post<Match>(`/matches/${id}/result`, data),
};

export default api;
