import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  DatePicker, 
  Select, 
  Button, 
  Space, 
  Typography, 
  Tag, 
  Statistic, 
  Row, 
  Col,
  Divider,
  Empty,
  Modal,
  List,
  message
} from 'antd';
import { 
  DownloadOutlined, 
  CalendarOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
  HistoryOutlined,
  UserOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { attendanceAPI } from '../services/api';
import { authService } from '../services/auth';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const AttendancePage = () => {
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [dateRange, setDateRange] = useState([
    dayjs().startOf('month'),
    dayjs().endOf('month')
  ]);
  const [selectedUser, setSelectedUser] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedProject, setSelectedProject] = useState('all');
  const [userList, setUserList] = useState([]);
  const [projectList, setProjectList] = useState([]);
  const [statisticsModalVisible, setStatisticsModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statisticsData, setStatisticsData] = useState(null);

  useEffect(() => {
    loadRecords();
  }, []);

  useEffect(() => {
    filterRecords();
  }, [records, dateRange, selectedUser, selectedType, selectedProject]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const response = await attendanceAPI.getAttendanceRecords();
      if (response.data && response.data.code === 200) {
        const approvedRecords = response.data.data.filter(record => 
          record.approved === true && record.checkOutTime
        );
        setRecords(approvedRecords);
        
        // 提取用户列表
        const users = [...new Set(approvedRecords.map(record => record.userName))];
        setUserList(users);
        
        // 提取项目列表
        const projects = [...new Set(approvedRecords
          .filter(record => record.projectName)
          .map(record => record.projectName))];
        setProjectList(projects);
      } else {
        message.error('获取考勤记录失败');
      }
    } catch (error) {
      console.error('加载考勤记录失败:', error);
      message.error('加载考勤记录失败');
    } finally {
      setLoading(false);
    }
  };

  const filterRecords = () => {
    let filtered = [...records];

    // 按日期范围筛选
    if (dateRange && dateRange[0] && dateRange[1]) {
      filtered = filtered.filter(record => {
        const recordDate = dayjs(record.checkInTime);
        return recordDate.isAfter(dateRange[0].subtract(1, 'day')) && 
               recordDate.isBefore(dateRange[1].add(1, 'day'));
      });
    }

    // 按用户筛选
    if (selectedUser !== 'all') {
      filtered = filtered.filter(record => record.userName === selectedUser);
    }

    // 按类型筛选
    if (selectedType !== 'all') {
      filtered = filtered.filter(record => record.type === selectedType);
    }

    // 按项目筛选
    if (selectedProject !== 'all') {
      filtered = filtered.filter(record => record.projectName === selectedProject);
    }

    setFilteredRecords(filtered);
  };

  const calculateWorkHours = (checkInTime, checkOutTime) => {
    if (!checkInTime || !checkOutTime) return 0;
    
    const start = dayjs(checkInTime);
    const end = dayjs(checkOutTime);
    return end.diff(start, 'hour', true);
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

  const generateStatistics = () => {
    const stats = {
      totalRecords: filteredRecords.length,
      totalHours: 0,
      constructionHours: 0,
      travelHours: 0,
      stopHours: 0,
      userStats: {}
    };

    filteredRecords.forEach(record => {
      const hours = calculateWorkHours(record.checkInTime, record.checkOutTime);
      stats.totalHours += hours;

      // 按类型统计工时
      switch (record.type) {
        case 'construction':
          stats.constructionHours += hours;
          break;
        case 'travel':
          stats.travelHours += hours;
          break;
        case 'stop':
          stats.stopHours += hours;
          break;
      }

      // 按用户统计
      if (!stats.userStats[record.userName]) {
        stats.userStats[record.userName] = {
          totalHours: 0,
          constructionHours: 0,
          travelHours: 0,
          stopHours: 0,
          recordCount: 0
        };
      }
      
      const userStat = stats.userStats[record.userName];
      userStat.totalHours += hours;
      userStat.recordCount += 1;
      
      switch (record.type) {
        case 'construction':
          userStat.constructionHours += hours;
          break;
        case 'travel':
          userStat.travelHours += hours;
          break;
        case 'stop':
          userStat.stopHours += hours;
          break;
      }
    });

    return stats;
  };

  const loadStatistics = async () => {
    setLoading(true);
    try {
      const params = {};
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.startDate = dateRange[0].format('YYYY-MM-DD');
        params.endDate = dateRange[1].format('YYYY-MM-DD');
      }
      if (selectedUser !== 'all') {
        params.userId = selectedUser;
      }
      if (selectedType !== 'all') {
        params.type = selectedType;
      }

      const response = await attendanceAPI.getAttendanceStatistics(params);
      if (response.data && response.data.code === 200) {
        return response.data.data;
      }
    } catch (error) {
      console.error('加载统计数据失败:', error);
      message.error('加载统计数据失败');
    } finally {
      setLoading(false);
    }
    return null;
  };

  const handleStatisticsModal = async () => {
    const stats = await loadStatistics();
    if (stats) {
      setStatisticsData(stats);
      setStatisticsModalVisible(true);
    }
  };

  const exportToCSV = () => {
    const headers = [
      '签到人', '签到类型', '项目', '签到时间', '签退时间', '工时类型', '工作时长', 
      '签到地点', '工作内容', '审批时间'
    ];
    
    const csvContent = [
      headers.join(','),
      ...filteredRecords.map(record => [
        record.userName,
        getTypeLabel(record.type, record.subType),
        record.projectName || '',
        record.checkInTime,
        record.checkOutTime,
        getWorkHoursLabel(record.type),
        formatDuration(calculateWorkHours(record.checkInTime, record.checkOutTime)),
        record.location,
        record.workContent || '',
        record.approvalTime || ''
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `考勤表_${dayjs().format('YYYY-MM-DD')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns = [
    {
      title: '签到人',
      dataIndex: 'userName',
      key: 'userName',
      width: 80,
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type, record) => (
        <Tag color={getTypeColor(type)}>
          {getTypeLabel(type, record.subType)}
        </Tag>
      )
    },
    {
      title: '项目',
      dataIndex: 'projectName',
      key: 'projectName',
      width: 120,
      render: (projectName) => projectName || '-',
    },
    {
      title: '签到时间',
      dataIndex: 'checkInTime',
      key: 'checkInTime',
      width: 120,
      render: (time) => dayjs(time).format('MM-DD HH:mm')
    },
    {
      title: '签退时间',
      dataIndex: 'checkOutTime',
      key: 'checkOutTime',
      width: 120,
      render: (time) => dayjs(time).format('MM-DD HH:mm')
    },
    {
      title: '工作时长',
      key: 'workHours',
      width: 100,
      render: (_, record) => (
        <div>
          <Text strong>{getWorkHoursLabel(record.type)}:</Text>
          <br />
          <Text>{formatDuration(calculateWorkHours(record.checkInTime, record.checkOutTime))}</Text>
        </div>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_, record) => (
        <Button 
          type="link" 
          size="small"
          onClick={() => {
            setSelectedRecord(record);
            setDetailModalVisible(true);
          }}
        >
          详情
        </Button>
      )
    }
  ];

  const stats = generateStatistics();

  return (
    <div className="page-container">
      <div className="header">
        <Title level={2} style={{ color: 'white', margin: 0 }}>考勤统计</Title>
        <Text style={{ color: 'rgba(255,255,255,0.9)' }}>
          工时统计与考勤表生成
        </Text>
      </div>

      <div className="main-content">
        <Card style={{ marginBottom: 16 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>时间范围：</Text>
              <RangePicker
                value={dateRange}
                onChange={setDateRange}
                style={{ width: '100%', marginTop: 8 }}
                format="YYYY-MM-DD"
              />
            </div>
            
            <Row gutter={8}>
              <Col span={6}>
                <div>
                  <Text strong>签到人：</Text>
                  <Select
                    value={selectedUser}
                    onChange={setSelectedUser}
                    style={{ width: '100%', marginTop: 4 }}
                  >
                    <Option value="all">全部</Option>
                    {userList.map(user => (
                      <Option key={user} value={user}>{user}</Option>
                    ))}
                  </Select>
                </div>
              </Col>
              <Col span={6}>
                <div>
                  <Text strong>类型：</Text>
                  <Select
                    value={selectedType}
                    onChange={setSelectedType}
                    style={{ width: '100%', marginTop: 4 }}
                  >
                    <Option value="all">全部</Option>
                    <Option value="construction">施工打卡</Option>
                    <Option value="travel">在途打卡</Option>
                    <Option value="stop">停工打卡</Option>
                  </Select>
                </div>
              </Col>
              <Col span={6}>
                <div>
                  <Text strong>项目：</Text>
                  <Select
                    value={selectedProject}
                    onChange={setSelectedProject}
                    style={{ width: '100%', marginTop: 4 }}
                  >
                    <Option value="all">全部</Option>
                    {projectList.map(project => (
                      <Option key={project} value={project}>{project}</Option>
                    ))}
                  </Select>
                </div>
              </Col>
              <Col span={6}>
                <div>
                  <Text strong>快速筛选：</Text>
                  <Space style={{ marginTop: 4 }} wrap>
                    <Button size="small" onClick={() => {
                      setSelectedUser('all');
                      setSelectedType('all');
                      setSelectedProject('all');
                    }}>重置</Button>
                  </Space>
                </div>
              </Col>
            </Row>

            <Space>
              <Button 
                type="primary" 
                icon={<BarChartOutlined />}
                onClick={handleStatisticsModal}
                loading={loading}
              >
                统计分析
              </Button>
              <Button 
                icon={<DownloadOutlined />}
                onClick={exportToCSV}
                disabled={filteredRecords.length === 0}
              >
                导出CSV
              </Button>
            </Space>
          </Space>
        </Card>

        <Card>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={8}>
              <Statistic 
                title="总记录数" 
                value={filteredRecords.length} 
                prefix={<CalendarOutlined />}
              />
            </Col>
            <Col span={8}>
              <Statistic 
                title="总工时" 
                value={stats.totalHours.toFixed(1)} 
                suffix="小时"
                prefix={<ClockCircleOutlined />}
              />
            </Col>
            <Col span={8}>
              <Statistic 
                title="平均工时" 
                value={filteredRecords.length > 0 ? (stats.totalHours / filteredRecords.length).toFixed(1) : 0} 
                suffix="小时"
              />
            </Col>
          </Row>

          <Divider />

          {filteredRecords.length > 0 ? (
            <Table
              columns={columns}
              dataSource={filteredRecords}
              rowKey="id"
              pagination={{ pageSize: 10, size: 'small' }}
              scroll={{ x: 600 }}
              size="small"
            />
          ) : (
            <Empty description="暂无考勤记录" />
          )}
        </Card>
      </div>

      {/* 统计分析模态框 */}
      <Modal
        title="统计分析"
        open={statisticsModalVisible}
        onCancel={() => setStatisticsModalVisible(false)}
        footer={null}
        width="90%"
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Row gutter={16}>
            <Col span={8}>
              <Card size="small">
                <Statistic 
                  title="施工工时" 
                  value={statisticsData?.constructionHours?.toFixed(1) || stats.constructionHours.toFixed(1)} 
                  suffix="小时"
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small">
                <Statistic 
                  title="在途工时" 
                  value={statisticsData?.travelHours?.toFixed(1) || stats.travelHours.toFixed(1)} 
                  suffix="小时"
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small">
                <Statistic 
                  title="停工工时" 
                  value={statisticsData?.stopHours?.toFixed(1) || stats.stopHours.toFixed(1)} 
                  suffix="小时"
                  valueStyle={{ color: '#f5222d' }}
                />
              </Card>
            </Col>
          </Row>

          <Divider />

          <Title level={4}>个人统计</Title>
          <List
            size="small"
            dataSource={Object.entries(statisticsData?.userStats || stats.userStats)}
            renderItem={([userName, userStat]) => (
              <List.Item>
                <List.Item.Meta
                  avatar={<UserOutlined />}
                  title={userName}
                  description={
                    <Space wrap>
                      <span>总工时: {formatDuration(userStat.totalHours)}</span>
                      <span>施工: {formatDuration(userStat.constructionHours)}</span>
                      <span>在途: {formatDuration(userStat.travelHours)}</span>
                      <span>停工: {formatDuration(userStat.stopHours)}</span>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </Space>
      </Modal>

      {/* 详情模态框 */}
      <Modal
        title="打卡详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width="90%"
      >
        {selectedRecord && (
          <Space direction="vertical" style={{ width: '100%' }}>
            <div><strong>签到人：</strong>{selectedRecord.userName}</div>
            <div>
              <strong>类型：</strong>
              <Tag color={getTypeColor(selectedRecord.type)}>
                {getTypeLabel(selectedRecord.type, selectedRecord.subType)}
              </Tag>
            </div>
            {selectedRecord.projectName && (
              <div><strong>项目：</strong>{selectedRecord.projectName}</div>
            )}
            <div><strong>签到时间：</strong>{selectedRecord.checkInTime}</div>
            <div><strong>签退时间：</strong>{selectedRecord.checkOutTime}</div>
            <div>
              <strong>工作时长：</strong>
              <Text type="secondary">
                {getWorkHoursLabel(selectedRecord.type)}: {formatDuration(calculateWorkHours(selectedRecord.checkInTime, selectedRecord.checkOutTime))}
              </Text>
            </div>
            <div><strong>签到地点：</strong>{selectedRecord.location}</div>
            {selectedRecord.workContent && (
              <div>
                <strong>工作内容：</strong>
                <div style={{ marginTop: 8, padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
                  {selectedRecord.workContent}
                </div>
              </div>
            )}
            <div><strong>审批时间：</strong>{selectedRecord.approvalTime}</div>
          </Space>
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

export default AttendancePage;