import React, { useState, useEffect } from 'react';
import { 
  Card, 
  List, 
  Button, 
  Input, 
  Modal, 
  Form, 
  Tag, 
  Typography, 
  Space, 
  message,
  Divider,
  Select,
  Empty,
  Tabs
} from 'antd';
import { 
  CheckOutlined, 
  CloseOutlined, 
  ClockCircleOutlined,
  EnvironmentOutlined,
  UserOutlined,
  EditOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { approvalAPI } from '../services/api';
import { authService } from '../services/auth';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const ApprovalPage = () => {
  const [pendingRecords, setPendingRecords] = useState([]);
  const [approvedRecords, setApprovedRecords] = useState([]);
  const [rejectedRecords, setRejectedRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [approvalModalVisible, setApprovalModalVisible] = useState(false);
  const [rejectionModalVisible, setRejectionModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [rejectionForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const [pendingResponse, approvedResponse, rejectedResponse] = await Promise.all([
        approvalAPI.getPendingApprovals(),
        approvalAPI.getApprovedRecords(),
        approvalAPI.getRejectedRecords()
      ]);

      if (pendingResponse.code === 200) {
        setPendingRecords(pendingResponse.data || []);
      }
      if (approvedResponse.code === 200) {
        setApprovedRecords(approvedResponse.data || []);
      }
      if (rejectedResponse.code === 200) {
        setRejectedRecords(rejectedResponse.data || []);
      }
    } catch (error) {
      message.error('加载记录失败');
      console.error('加载记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (values) => {
    if (!selectedRecord) return;
    
    setLoading(true);
    try {
      const response = await approvalAPI.approve(selectedRecord.id, values.workContent);
      if (response.code === 200) {
        message.success('审批通过！');
        setApprovalModalVisible(false);
        form.resetFields();
        loadRecords();
      } else {
        message.error(response.message || '审批失败');
      }
    } catch (error) {
      message.error(error.message || '审批失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (values) => {
    if (!selectedRecord) return;
    
    setLoading(true);
    try {
      const response = await approvalAPI.reject(selectedRecord.id, values.rejectionReason);
      if (response.code === 200) {
        message.success('已驳回！');
        setRejectionModalVisible(false);
        rejectionForm.resetFields();
        loadRecords();
      } else {
        message.error(response.message || '驳回失败');
      }
    } catch (error) {
      message.error(error.message || '驳回失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const openRejectionModal = (record) => {
    setSelectedRecord(record);
    setRejectionModalVisible(true);
    rejectionForm.resetFields();
  };

  const openApprovalModal = (record) => {
    setSelectedRecord(record);
    setApprovalModalVisible(true);
    form.setFieldsValue({
      workContent: record.workContent || ''
    });
  };

  const getTypeLabel = (type, subType) => {
    const typeMap = {
      'construction': '施工打卡',
      'travel': '在途打卡',
      'stop': '停工打卡'
    };
    
    const subTypeMap = {
      'departure': '出发打卡',
      'arrival': '到达打卡',
      'return': '返程打卡',
      'backToNing': '到宁打卡'
    };

    let label = typeMap[type] || type;
    if (type === 'travel' && subType) {
      label += `（${subTypeMap[subType]}）`;
    }
    
    return label;
  };

  const getTypeColor = (type) => {
    const colorMap = {
      'construction': 'blue',
      'travel': 'orange',
      'stop': 'red'
    };
    return colorMap[type] || 'default';
  };

  const getWorkHoursLabel = (type) => {
    const labelMap = {
      'construction': '施工工时',
      'travel': '在途工时',
      'stop': '停工工时'
    };
    return labelMap[type] || '工时';
  };

  const formatDuration = (hours) => {
    if (!hours || hours <= 0) return '0小时0分钟';
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours}小时${minutes}分钟`;
  };

  const calculateWorkHours = (checkInTime, checkOutTime) => {
    if (!checkInTime || !checkOutTime) return '0小时';
    
    const start = dayjs(checkInTime);
    const end = dayjs(checkOutTime);
    const hours = end.diff(start, 'hour', true);
    return hours;
  };

  const renderRecord = (record) => (
    <Card 
      key={record.id} 
      size="small" 
      style={{ marginBottom: 12 }}
      actions={
        activeTab === 'pending' ? [
          <Button 
            type="primary" 
            icon={<CheckOutlined />} 
            onClick={() => openApprovalModal(record)}
            size="small"
          >
            通过
          </Button>,
          <Button 
            danger 
            icon={<CloseOutlined />} 
            onClick={() => openRejectionModal(record)}
            size="small"
          >
            驳回
          </Button>
        ] : undefined
      }
    >
      <div style={{ marginBottom: 8 }}>
        <Space>
          <UserOutlined />
          <Text strong>{record.userName}</Text>
          <Tag color={getTypeColor(record.type)}>
            {getTypeLabel(record.type, record.subType)}
          </Tag>
        </Space>
      </div>
      
      <div style={{ marginBottom: 8 }}>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <div>
            <ClockCircleOutlined /> 
            <Text type="secondary" style={{ marginLeft: 4 }}>
              {record.checkInTime} - {record.checkOutTime || '未签退'}
            </Text>
          </div>
          {record.checkOutTime && (
            <Text type="secondary">
              {getWorkHoursLabel(record.type)}: {formatDuration(calculateWorkHours(record.checkInTime, record.checkOutTime))}
            </Text>
          )}
          <div>
            <EnvironmentOutlined />
            <Text type="secondary" style={{ marginLeft: 4 }}>
              {record.location}
            </Text>
          </div>
        </Space>
      </div>

      {record.workContent && (
        <div style={{ marginTop: 8, padding: '8px', background: '#f5f5f5', borderRadius: '4px' }}>
          <Text strong>工作内容：</Text>
          <div>{record.workContent}</div>
        </div>
      )}

      {activeTab === 'approved' && record.approvalTime && (
        <div style={{ marginTop: 8 }}>
          <Text type="success" strong>
            ✓ 已通过审批 ({record.approvalTime})
          </Text>
        </div>
      )}

      {activeTab === 'rejected' && record.rejectionTime && (
        <div style={{ marginTop: 8 }}>
          <Text type="danger" strong>
            ✗ 已驳回 ({record.rejectionTime})
          </Text>
        </div>
      )}
    </Card>
  );

  const getCurrentRecords = () => {
    switch (activeTab) {
      case 'pending': return pendingRecords;
      case 'approved': return approvedRecords;
      case 'rejected': return rejectedRecords;
      default: return pendingRecords;
    }
  };

  return (
    <div className="page-container">
      <div className="header">
        <Title level={2} style={{ color: 'white', margin: 0 }}>审批管理</Title>
        <Text style={{ color: 'rgba(255,255,255,0.9)' }}>
          队员打卡审批
        </Text>
      </div>

      <div className="main-content">
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            <Button 
              type={activeTab === 'pending' ? 'primary' : 'text'}
              onClick={() => setActiveTab('pending')}
            >
              待审批 ({pendingRecords.length})
            </Button>
            <Button 
              type={activeTab === 'approved' ? 'primary' : 'text'}
              onClick={() => setActiveTab('approved')}
            >
              已通过 ({approvedRecords.length})
            </Button>
            <Button 
              type={activeTab === 'rejected' ? 'primary' : 'text'}
              onClick={() => setActiveTab('rejected')}
            >
              已驳回 ({rejectedRecords.length})
            </Button>
          </div>
        </Card>

        <div>
          {getCurrentRecords().length > 0 ? (
            getCurrentRecords().map(renderRecord)
          ) : (
            <Empty 
              description={
                activeTab === 'pending' ? '暂无待审批记录' : 
                activeTab === 'approved' ? '暂无已通过记录' : '暂无已驳回记录'
              }
              style={{ marginTop: 40 }}
            />
          )}
        </div>
      </div>

      <Modal
        title="审批通过"
        open={approvalModalVisible}
        onCancel={() => setApprovalModalVisible(false)}
        footer={null}
        width="90%"
      >
        {selectedRecord && (
          <div>
            <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
              <Space direction="vertical" size="small">
                <div><strong>签到人：</strong>{selectedRecord.userName}</div>
                <div><strong>类型：</strong>{getTypeLabel(selectedRecord.type, selectedRecord.subType)}</div>
                <div><strong>时间：</strong>{selectedRecord.checkInTime} - {selectedRecord.checkOutTime}</div>
                <div><strong>工时：</strong>{getWorkHoursLabel(selectedRecord.type)}: {formatDuration(calculateWorkHours(selectedRecord.checkInTime, selectedRecord.checkOutTime))}</div>
              </Space>
            </div>
            
            <Form form={form} onFinish={handleApprove}>
              <Form.Item
                label="工作内容"
                name="workContent"
                rules={[{ required: true, message: '请填写工作内容' }]}
              >
                <TextArea 
                  rows={4} 
                  placeholder="请详细描述工作内容..."
                  maxLength={500}
                  showCount
                />
              </Form.Item>
              
              <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                <Space>
                  <Button onClick={() => setApprovalModalVisible(false)}>
                    取消
                  </Button>
                  <Button type="primary" htmlType="submit">
                    通过审批
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      <Modal
        title="驳回审批"
        open={rejectionModalVisible}
        onCancel={() => setRejectionModalVisible(false)}
        footer={null}
        width="90%"
      >
        {selectedRecord && (
          <div>
            <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
              <Space direction="vertical" size="small">
                <div><strong>签到人：</strong>{selectedRecord.userName}</div>
                <div><strong>类型：</strong>{getTypeLabel(selectedRecord.type, selectedRecord.subType)}</div>
                <div><strong>时间：</strong>{selectedRecord.checkInTime} - {selectedRecord.checkOutTime}</div>
                <div><strong>工时：</strong>{getWorkHoursLabel(selectedRecord.type)}: {formatDuration(calculateWorkHours(selectedRecord.checkInTime, selectedRecord.checkOutTime))}</div>
              </Space>
            </div>
            
            <Form form={rejectionForm} onFinish={handleReject}>
              <Form.Item
                label="驳回原因"
                name="rejectionReason"
                rules={[{ required: true, message: '请填写驳回原因' }]}
              >
                <TextArea 
                  rows={4} 
                  placeholder="请详细说明驳回原因..."
                  maxLength={500}
                  showCount
                />
              </Form.Item>
              
              <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                <Space>
                  <Button onClick={() => setRejectionModalVisible(false)}>
                    取消
                  </Button>
                  <Button danger htmlType="submit">
                    确认驳回
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
      <div className="bottom-nav">
        <a href="/" className="nav-item active">
          <span className="nav-icon">📍</span>
          签到
        </a>
        <a href="/approval" className="nav-item">
          <span className="nav-icon">📋</span>
          审批
        </a>
        <a href="/attendance" className="nav-item">
          <span className="nav-icon">📊</span>
          考勤
        </a>
      </div>
    </div>
  );
};

export default ApprovalPage;