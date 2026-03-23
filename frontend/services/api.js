import axios from 'axios';
import { io } from 'socket.io-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:8001';

// Axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// Auth
export const authAPI = {
    signup: (data) => api.post('/api/auth/signup', data),
    login: (data) => api.post('/api/auth/login', data),
    getMe: () => api.get('/api/auth/me'),
};

// Interviews
export const interviewsAPI = {
    getAll: () => api.get('/api/interviews'),
    getOne: (id) => api.get(`/api/interviews/${id}`),
    getForCandidate: (candidateId) => api.get(`/api/interviews/candidate/${candidateId}`),
    create: (data) => api.post('/api/interviews', data),
    complete: (id, durationSeconds) => api.post(`/api/interviews/${id}/complete`, { duration_seconds: durationSeconds }),
    updateStatus: (id, status) => api.patch(`/api/interviews/${id}/status?status=${status}`),
    saveAnswer: (interviewId, data) => api.post(`/api/interviews/${interviewId}/answers`, data),
    uploadRecording: (interviewId, blob) => {
        const formData = new FormData();
        formData.append('file', blob, `${interviewId}.webm`);
        return api.post(`/api/interviews/${interviewId}/recording`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    triggerAi: (id) => api.patch(`/api/interviews/${id}/trigger-ai`),
    setLive: (id) => api.patch(`/api/interviews/${id}/set-live`),
    getBookedSlots: (date) => api.get(`/api/interviews/booked-slots?date=${date}`),
};

// Questions
export const questionsAPI = {
    getByInterview: (interviewId) => api.get(`/api/questions/${interviewId}`),
    create: (data) => api.post('/api/questions/', data),
};

// Answers
export const answersAPI = {
    submit: (data) => api.post('/api/answers/', data),
    getByInterview: (interviewId) => api.get(`/api/answers/${interviewId}`),
};

// Reports
export const reportsAPI = {
    getAll: () => api.get('/api/reports/'),
    getOne: (interviewId) => api.get(`/api/reports/${interviewId}`),
};

// Candidates
export const candidatesAPI = {
    getAll: () => api.get('/api/candidates'),
};

// Profiles
export const profileAPI = {
    get: (userId) => api.get(`/api/profile/${userId}`),
    update: (userId, data) => {
        return api.post(`/api/profile/${userId}`, data);
    },
    uploadResume: (userId, file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post(`/api/profile/${userId}/resume`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    uploadPhoto: (userId, file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post(`/api/profile/${userId}/photo`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
};

// Roles
export const rolesAPI = {
    getAll: (activeOnly = false) => api.get(`/api/roles?active_only=${activeOnly}`),
    create: (data) => api.post('/api/roles', data),
    update: (id, data) => api.put(`/api/roles/${id}`, data),
    delete: (id) => api.delete(`/api/roles/${id}`),
};

// Applications
export const applicationsAPI = {
    apply: (data) => api.post('/api/applications', data),
    getAll: () => api.get('/api/applications'),
    getForCandidate: (candidateId) => api.get(`/api/applications/candidate/${candidateId}`),
    updateStatus: (appId, data) => api.patch(`/api/applications/${appId}/status`, data),
};

// Notifications
export const notificationsAPI = {
    getForUser: (userId) => api.get(`/api/notifications/${userId}`),
    markRead: (id) => api.patch(`/api/notifications/${id}/read`),
};

// Stats
export const statsAPI = {
    get: () => api.get('/api/stats/'),
};

// Users
export const usersAPI = {
    updateAdmin: (data) => api.post('/api/users/update_admin', data, {
        headers: { 'Content-Type': 'multipart/form-data' } // Important for sending Form() data
    }),
};

// Socket.IO
let socket = null;

export const getSocket = () => {
    if (!socket) {
        socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            autoConnect: false,
        });
    }
    return socket;
};

export const connectSocket = () => {
    const s = getSocket();
    if (!s.connected) {
        s.connect();
    }
    return s;
};

export const disconnectSocket = () => {
    if (socket && socket.connected) {
        socket.disconnect();
    }
};

export default api;
