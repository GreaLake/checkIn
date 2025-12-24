import { authAPI } from './api';

// 认证工具类
export const authService = {
  // 登录
  async login(username, password) {
    try {
      const response = await authAPI.login({ username, password });
      if (response.code === 200) {
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('username', user.username);
        return { success: true, user };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      return { success: false, message: error.message || '登录失败' };
    }
  },

  // 注册
  async register(userData) {
    try {
      const response = await authAPI.register(userData);
      if (response.code === 200) {
        return { success: true, message: '注册成功' };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      return { success: false, message: error.message || '注册失败' };
    }
  },

  // 获取当前用户信息
  async getCurrentUser() {
    try {
      const response = await authAPI.getCurrentUser();
      if (response.code === 200) {
        return { success: true, user: response.data };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  // 检查是否已登录
  isAuthenticated() {
    const token = localStorage.getItem('token');
    return !!token;
  },

  // 获取存储的用户信息
  getStoredUser() {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
  },

  // 获取用户名
  getUsername() {
    return localStorage.getItem('username') || '当前用户';
  },

  // 退出登录
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('username');
  },

  // 获取token
  getToken() {
    return localStorage.getItem('token');
  }
};

export default authService;