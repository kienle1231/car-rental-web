import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
});

API.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

// Auth
export const loginAPI = (data) => API.post('/auth/login', data);
export const registerAPI = (data) => API.post('/auth/register', data);
export const googleLoginAPI = (data) => API.post('/auth/google', data);
export const getUsersAPI = () => API.get('/auth/users');
export const deleteUserAPI = (id) => API.delete(`/auth/users/${id}`);
export const toggleUserStatusAPI = (id) => API.put(`/auth/users/${id}/status`);
export const confirmPaymentAPI = (data) => API.post('/payments/confirm', data);

// Cars
export const getCarsAPI = (params) => API.get('/cars', { params });
export const getCarByIdAPI = (id) => API.get(`/cars/${id}`);
export const getCarPricingAPI = (id, params) => API.get(`/cars/${id}/pricing`, { params });
export const createCarAPI = (data) => API.post('/cars', data);
export const updateCarAPI = (id, data) => API.put(`/cars/${id}`, data);
export const deleteCarAPI = (id) => API.delete(`/cars/${id}`);

// Bookings
export const createBookingAPI = (data) => API.post('/bookings', data);
export const getMyBookingsAPI = () => API.get('/bookings/my-bookings');
export const getBookingByIdAPI = (id) => API.get(`/bookings/${id}`);
export const getAllBookingsAPI = () => API.get('/bookings/admin');
export const updateBookingStatusAPI = (id, status) => API.put(`/bookings/admin/${id}`, { status });
export const deleteBookingAPI = (id) => API.delete(`/bookings/admin/${id}`);
export const getStatsAPI = () => API.get('/bookings/admin/stats');
export const getAvailabilityByCarAPI = (carId) => API.get(`/bookings/availability/${carId}`);
export const getAvailabilityCalendarAPI = () => API.get('/bookings/admin/availability');
export const getPricingSurgesAPI = () => API.get('/analytics/pricing-surges');
export const chatAIAPI = (data) => API.post('/ai/chat', data);