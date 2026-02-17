import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });
        
        localStorage.setItem('auth_token', response.data.token);
        api.defaults.headers.common.Authorization = `Bearer ${response.data.token}`;
        originalRequest.headers.Authorization = `Bearer ${response.data.token}`;
        
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  refresh: (token) => api.post('/auth/refresh', { refreshToken: token }),
  me: () => api.get('/auth/me'),
};

export const studentsAPI = {
  getAll: (params) => api.get('/students', { params }),
  getById: (id) => api.get(`/students/${id}`),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  delete: (id) => api.delete(`/students/${id}`),
  bulkCreate: (data) => api.post('/students/bulk', data),
};

export const attendanceAPI = {
  getToday: (params) => api.get('/attendance/today', { params }),
  mark: (data) => api.post('/attendance/mark', data),
  bulkMark: (data) => api.post('/attendance/bulk-mark', data),
  getHistory: (params) => api.get('/attendance/history', { params }),
  getStats: (params) => api.get('/attendance/stats', { params }),
  export: (params) => api.get('/attendance/export', { params, responseType: 'blob' }),
};

export const assignmentsAPI = {
  getAll: (params) => api.get('/assignments', { params }),
  getById: (id) => api.get(`/assignments/${id}`),
  create: (data) => api.post('/assignments', data),
  update: (id, data) => api.put(`/assignments/${id}`, data),
  delete: (id) => api.delete(`/assignments/${id}`),
  submit: (id, data) => api.post(
    `/assignments/${id}/submit`,
    data,
    data instanceof FormData
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : undefined
  ),
  grade: (id, data) => api.post(`/assignments/${id}/grade`, data),
};

export const examsAPI = {
  getAll: (params) => api.get('/exams', { params }),
  getById: (id) => api.get(`/exams/${id}`),
  create: (data) => api.post('/exams', data),
  update: (id, data) => api.put(`/exams/${id}`, data),
  delete: (id) => api.delete(`/exams/${id}`),
  publishResults: (id, data) => api.post(`/exams/${id}/publish`, data),
};

export const marksheetsAPI = {
  getAll: (params) => api.get('/marksheets', { params }),
  getById: (id) => api.get(`/marksheets/${id}`),
  create: (data) => api.post('/marksheets', data),
  update: (id, data) => api.put(`/marksheets/${id}`, data),
  delete: (id) => api.delete(`/marksheets/${id}`),
  download: (id) => api.get(`/marksheets/${id}/download`, { responseType: 'blob' }),
};

export const certificatesAPI = {
  getAll: (params) => api.get('/certificates', { params }),
  getById: (id) => api.get(`/certificates/${id}`),
  create: (data) => api.post('/certificates', data),
  update: (id, data) => api.put(`/certificates/${id}`, data),
  delete: (id) => api.delete(`/certificates/${id}`),
  issue: (id) => api.post(`/certificates/${id}/issue`),
  download: (id) => api.get(`/certificates/${id}/download`, { responseType: 'blob' }),
  sendEmail: (id) => api.post(`/certificates/${id}/email`),
};

export const reportsAPI = {
  getAttendanceReport: (params) => api.get('/reports/attendance', { params }),
  getPerformanceReport: (params) => api.get('/reports/performance', { params }),
  getDemographics: (params) => api.get('/reports/demographics', { params }),
  exportReport: (type, params) => api.get(`/reports/export/${type}`, { params, responseType: 'blob' }),
};

export default api;
