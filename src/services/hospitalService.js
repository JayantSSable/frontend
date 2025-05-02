import api from './api';

// Hospital API
export const getHospitals = () => api.get('/hospitals');
export const getHospitalById = (id) => api.get(`/hospitals/${id}`);
export const createHospital = (data) => api.post('/hospitals', data);
export const updateHospital = (id, data) => api.put(`/hospitals/${id}`, data);
export const deleteHospital = (id) => api.delete(`/hospitals/${id}`);

// Get departments by hospital
export const getDepartmentsByHospital = (hospitalId) => 
  api.get(`/hospitals/${hospitalId}/departments`);

// Create department within a hospital
export const createDepartmentInHospital = (hospitalId, data) => 
  api.post(`/hospitals/${hospitalId}/departments`, data);

export default {
  getHospitals,
  getHospitalById,
  createHospital,
  updateHospital,
  deleteHospital,
  getDepartmentsByHospital,
  createDepartmentInHospital
};
