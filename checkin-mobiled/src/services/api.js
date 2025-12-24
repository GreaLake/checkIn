import axios from 'axios';

const API_BASE_URL = 'http://localhost:7778/api';

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理错误
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

// 认证相关API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getCurrentUser: () => api.get('/auth/current'),
};

// 签到相关API
export const checkInAPI = {
  checkIn: (data) => api.post('/checkin/checkin', data),
  checkOut: (data) => api.post('/checkin/checkout', data),

  getCurrentStatusByType: (type) => api.get(`/checkin/status/${type}`),
  getCurrentStatus: () => api.get('/checkin/status'),
  getTodayRecords: () => api.get('/checkin/today'),
  
  // 团队打卡记录
  getTeamRecords: (params = {}) => api.get('/checkin/team-records', { params }),
  getTeamStatus: () => api.get('/checkin/team-status'),
};

// 审批相关API
export const approvalAPI = {
  getPendingApprovals: () => api.get('/approval/pending'),
  approve: (recordId, workContent) => api.post(`/approval/approve/${recordId}`, { workContent }),
  reject: (recordId, rejectionReason) => api.post(`/approval/reject/${recordId}`, { rejectionReason }),
  getApprovedRecords: () => api.get('/approval/approved'),
  getRejectedRecords: () => api.get('/approval/rejected'),
  getStatistics: () => api.get('/approval/statistics'),
};

// 考勤统计API
export const attendanceAPI = {
  // 获取项目列表
  getProjectList: () => {
    return api.get('/attendance/projects');
  },
  
  // 获取考勤记录
  getAttendanceRecords: (params = {}) => {
    return api.get('/attendance/records', { params });
  },
  
  // 获取考勤统计
  getAttendanceStatistics: (params = {}) => {
    return api.get('/attendance/statistics', { params });
  },
  
  // 获取用户统计
  getUserStatistics: () => {
    return api.get('/attendance/user-statistics');
  },
  
  // 获取月度汇总
  getMonthlySummary: (params = {}) => {
    return api.get('/attendance/monthly-summary', { params });
  },
  
  // 导出考勤数据
  exportAttendanceData: (params = {}) => {
    return api.get('/attendance/export', { params });
  },
  
  // 获取用户考勤记录
  getUserAttendance: (userId, startDate, endDate) => 
    api.get(`/attendance/user/${userId}`, { params: { startDate, endDate } }),
  
  // 获取团队考勤记录
  getTeamAttendance: (teamId, startDate, endDate) => 
    api.get(`/attendance/team/${teamId}`, { params: { startDate, endDate } }),
  
  // 获取月度统计
  getMonthlyStats: (userId, year, month) => 
    api.get(`/attendance/monthly/${userId}`, { params: { year, month } })
};

export default api;