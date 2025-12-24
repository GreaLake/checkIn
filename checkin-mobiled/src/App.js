import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import CheckInPage from './pages/CheckInPage';
import ApprovalPage from './pages/ApprovalPage';
import AttendancePage from './pages/AttendancePage';
import LoginPage from './pages/LoginPage';
import { authService } from './services/auth';
import './App.css';

function App() {
  // 检查是否需要登录
  const requireAuth = (component) => {
    if (!authService.isAuthenticated()) {
      return <LoginPage />;
    }
    return component;
  };

  return (
    <ConfigProvider locale={zhCN}>
      <Router>
        <div className="mobile-container">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={requireAuth(<CheckInPage />)} />
            <Route path="/approval" element={requireAuth(<ApprovalPage />)} />
            <Route path="/attendance" element={requireAuth(<AttendancePage />)} />
          </Routes>
        </div>
      </Router>
    </ConfigProvider>
  );
}

export default App;