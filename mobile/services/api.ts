import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const getBaseURL = () => {
  const envURL = process.env.EXPO_PUBLIC_API_URL;
  
  if ((Platform.OS as any) === 'web') {
    return 'http://localhost:5000/api';
  }
  
  return envURL || 'http://172.20.10.3:5000/api';
};

const API = axios.create({
  baseURL: getBaseURL(),
});

API.interceptors.request.use(async (config) => {
  const stored = await AsyncStorage.getItem('user');
  if (stored) {
    const user = JSON.parse(stored);
    if (user?.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
  }
  return config;
});

export const loginAPI = (data: { email: string; password: string }) => API.post('/auth/login', data);
export const registerAPI = (data: { name: string; email: string; password: string }) => API.post('/auth/register', data);
export const googleLoginAPI = (data: { credential: string }) => API.post('/auth/google', data);
export const forgotPasswordAPI = (email: string) => API.post('/auth/forgot-password', { email });
export const resetPasswordAPI = (data: any) => API.post('/auth/reset-password', data);

export const getCarsAPI = (params?: Record<string, string>) => API.get('/cars', { params });
export const getCarByIdAPI = (id: string) => API.get(`/cars/${id}`);
export const getCarPricingAPI = (id: string, params: { startDate: string; endDate: string }) => API.get(`/cars/${id}/pricing`, { params });

export const createBookingAPI = (data: any) => API.post('/bookings', data);
export const getMyBookingsAPI = () => API.get('/bookings/my-bookings');
export const confirmPaymentAPI = (data: { bookingId: string }) => API.post('/payments/confirm', data);
export const getAvailabilityByCarAPI = (carId: string) => API.get(`/bookings/availability/${carId}`);
export const extendBookingAPI = (id: string, newReturnDate: string) => API.post(`/bookings/${id}/extend`, { newReturnDate });
export const cancelBookingAPI = (id: string) => API.patch(`/bookings/${id}/cancel`);
export const chatAIAPI = (message: string, chatHistory: any[]) => API.post('/ai/chat', { message, chatHistory });

// Review APIs
export const getReviewsByCarAPI = (carId: string) => API.get(`/reviews/car/${carId}`);
export const createReviewAPI = (data: { car: string; rating: number; comment: string }) => API.post('/reviews', data);
export const deleteReviewAPI = (id: string) => API.delete(`/reviews/${id}`);

// Admin APIs
export const getStatsAPI = () => API.get('/bookings/admin/stats');
export const getAvailabilityCalendarAPI = () => API.get('/bookings/admin/availability');
export const getAllBookingsAPI = () => API.get('/bookings/admin');
export const updateBookingStatusAPI = (id: string, status: string) => API.put(`/bookings/admin/${id}`, { status });
export const completeBookingAPI = (id: string) => API.patch(`/bookings/admin/${id}/complete`);
export const deleteBookingAPI = (id: string) => API.delete(`/bookings/admin/${id}`);

export const getUsersAPI = () => API.get('/auth/users');
export const deleteUserAPI = (id: string) => API.delete(`/auth/users/${id}`);
export const toggleUserStatusAPI = (id: string) => API.put(`/auth/users/${id}/status`);

export const createCarAPI = (data: any) => API.post('/cars', data);
export const updateCarAPI = (id: string, data: any) => API.put(`/cars/${id}`, data);
export const deleteCarAPI = (id: string) => API.delete(`/cars/${id}`);

export const getPricingSurgesAPI = () => API.get('/analytics/pricing-surges');

export default API;
