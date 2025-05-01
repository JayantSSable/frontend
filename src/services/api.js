import axios from 'axios';

// Use environment variable for API URL in production, fallback to localhost for development
const API_BASE_URL = process.env.REACT_APP_API_URL 
  ? `${process.env.REACT_APP_API_URL}/api`
  : 'http://localhost:8080/api';

console.log('Using API URL:', API_BASE_URL);

// Create axios instance with enhanced configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Add timeout to prevent hanging requests
  timeout: 10000,
});

// Add request interceptor for debugging
api.interceptors.request.use(config => {
  console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`, config.data || '');
  return config;
});

// Add response interceptor for debugging
api.interceptors.response.use(
  response => {
    console.log(`API Response: ${response.status} from ${response.config.url}`, response.data);
    return response;
  },
  error => {
    if (error.response) {
      console.error(`API Error ${error.response.status} from ${error.config.url}:`, error.response.data);
    } else if (error.request) {
      console.error(`No response received from ${error.config.url}:`, error.request);
    } else {
      console.error(`Error setting up request to ${error.config?.url}:`, error.message);
    }
    return Promise.reject(error);
  }
);

// Department API
export const getDepartments = () => api.get('/departments');
export const getDepartmentById = (id) => api.get(`/departments/${id}`);
export const createDepartment = (data) => api.post('/departments', data);
export const updateDepartment = (id, data) => api.put(`/departments/${id}`, data);
export const deleteDepartment = (id) => api.delete(`/departments/${id}`);

// Queue API
export const getQueues = () => api.get('/queues');
export const getQueuesByDepartment = (departmentId) => api.get(`/queues/department/${departmentId}`);
export const getQueueDetails = (id) => api.get(`/queues/${id}`);
export const createQueue = (data) => api.post('/queues', data);
export const updateQueue = (id, data) => api.put(`/queues/${id}`, data);
export const deleteQueue = (id) => api.delete(`/queues/${id}`);

// Patient API
export const getPatients = () => api.get('/patients');
export const getPatientById = (id) => api.get(`/patients/${id}`);
export const registerPatient = (data) => api.post('/patients/register', data);
export const registerToTestQueue = (data) => api.post('/registration/test', data);
export const updatePatientStatus = (id, status) => api.patch(`/patients/${id}/status`, { status });
export const updatePatientQueuePosition = (id, queuePosition) => api.patch(`/patients/${id}/position`, { queuePosition });

export default api;
