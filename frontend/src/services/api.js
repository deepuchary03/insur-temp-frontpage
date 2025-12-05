import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8081/api/v1";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken } = response.data;
        localStorage.setItem("accessToken", accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// Auth Services
export const authService = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  logout: (refreshToken) => api.post("/auth/logout", { refreshToken }),
  refreshToken: (refreshToken) => api.post("/auth/refresh", { refreshToken }),
  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),
  resetPassword: (token, newPassword) =>
    api.post("/auth/reset-password", { token, newPassword }),
  verifyEmail: (token) => api.get(`/auth/verify-email?token=${token}`),
  resendVerification: (email) =>
    api.post("/auth/resend-verification", { email }),
};

// Agent Services
export const agentService = {
  getAllAgents: () => api.get("/agents"),
  getAvailableAgents: () => api.get("/agents/available"),
  getTopAgents: () => api.get("/agents/top"),
  getAgentById: (id) => api.get(`/agents/${id}`),
  getAgentByUserId: (userId) => api.get(`/agents/user/${userId}`),
  getAgentsBySpecialization: (specialization) =>
    api.get(`/agents/specialization/${specialization}`),
  createAgent: (data) => api.post("/agents", data),
  updateAgent: (id, data) => api.put(`/agents/${id}`, data),
  deleteAgent: (id) => api.delete(`/agents/${id}`),
};

// Availability Services
export const availabilityService = {
  getAgentAvailability: (agentId) => api.get(`/availability/agent/${agentId}`),
  getAvailableSlots: (agentId, fromDate) =>
    api.get(`/availability/agent/${agentId}/available`, {
      params: { fromDate },
    }),
  getAgentAvailabilityByDate: (agentId, date) =>
    api.get(`/availability/agent/${agentId}/date/${date}`),
  getAgentAvailabilityByDateRange: (agentId, startDate, endDate) =>
    api.get(`/availability/agent/${agentId}/range`, {
      params: { startDate, endDate },
    }),
  createAvailability: (data) => api.post("/availability", data),
  updateAvailability: (id, data) => api.put(`/availability/${id}`, data),
  deleteAvailability: (id) => api.delete(`/availability/${id}`),
};

// Appointment Services
export const appointmentService = {
  getAllAppointments: () => api.get("/appointments"),
  getAppointmentById: (id) => api.get(`/appointments/${id}`),
  getCustomerAppointments: (customerId) =>
    api.get(`/appointments/customer/${customerId}`),
  getAgentAppointments: (agentId) => api.get(`/appointments/agent/${agentId}`),
  getAppointmentsByDateRange: (startDate, endDate) =>
    api.get("/appointments/range", { params: { startDate, endDate } }),
  createAppointment: (data) => api.post("/appointments", data),
  updateAppointmentStatus: (id, status, reason) =>
    api.put(`/appointments/${id}/status`, { status, reason }),
  deleteAppointment: (id) => api.delete(`/appointments/${id}`),
};

// AI Services
export const aiService = {
  processQuery: (data) => api.post("/ai/query", data),
  getAvailableAgents: () => api.get("/agents/available"),
  bookAppointmentWithAgent: (data) => api.post("/appointments", data),
};

// Admin Services
export const adminService = {
  getAnalytics: () => api.get("/admin/analytics"),
  getMonthlyAnalytics: () => api.get("/admin/analytics/monthly"),
  getAllUsers: () => api.get("/admin/users"),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  updateUserRole: (userId, role) =>
    api.put(`/admin/users/${userId}/role`, { role }),
};

// Health Check
export const healthCheck = () => api.get("/health");
