import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Select, 
  Typography, 
  Space, 
  message,
  Tag,
  Row,
  Col,
  Badge,
  Progress,
  Modal
} from 'antd';
import { 
  UserOutlined, 
  ClockCircleOutlined, 
  EnvironmentOutlined,
  CheckCircleOutlined,
  LogoutOutlined,
  HistoryOutlined,
  CalendarOutlined,
  CloseCircleOutlined,
  ProjectOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { checkInAPI } from '../services/api';
import { attendanceAPI } from '../services/api';
import { authService } from '../services/auth';

const { Title, Text } = Typography;
const { Option } = Select;

const CheckInPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [checkInRecord, setCheckInRecord] = useState(null);
  const [checkInRecords, setCheckInRecords] = useState({
    construction: null,
    travel: null,
    stop: null
  });
  const [currentTime, setCurrentTime] = useState(dayjs());
  const [currentLocation, setCurrentLocation] = useState('获取中...');
  const [currentUser, setCurrentUser] = useState({});
  const [teamStatus, setTeamStatus] = useState(null);
  const [teamRecords, setTeamRecords] = useState([]);
  const [showTeamView, setShowTeamView] = useState(false);
  const [projectList, setProjectList] = useState([]);
  const [projectMap, setProjectMap] = useState({}); // 用于存储ID到名称的映射
  const [selectedProject, setSelectedProject] = useState(null); // 当前选中的项目ID
  const navigate = useNavigate();

  const checkInTypes = [
    { 
      value: 'construction', 
      label: '施工打卡', 
      color: 'blue', 
      icon: '🏗️',
      description: '上下班打卡，记录施工工时'
    },
    { 
      value: 'travel', 
      label: '在途打卡', 
      color: 'orange', 
      icon: '🚗',
      description: '出发/到达/返程/到宁打卡，记录在途工时'
    },
    { 
      value: 'stop', 
      label: '停工打卡', 
      color: 'red', 
      icon: '⏸️',
      description: '停工日上下班打卡，记录停工工时'
    }
  ];

  const travelSubTypes = [
    { value: 'departure', label: '出发打卡', icon: '🚀', description: '从驻地出发' },
    { value: 'arrival', label: '到达打卡', icon: '📍', description: '到达工地' },
    { value: 'return', label: '返程打卡', icon: '🔙', description: '从工地返程' },
    { value: 'backToNing', label: '到宁打卡', icon: '🏠', description: '到达南京' }
  ];

  useEffect(() => {
    const initializeApp = async () => {
      // 检查认证状态
      if (!authService.isAuthenticated()) {
        navigate('/login');
        return;
      }

      // 获取当前用户信息
      const user = await authService.getCurrentUser();
      if (user.success) {
        setCurrentUser(user.user);
        // 设置表单中的用户名
        form.setFieldsValue({
          userName: user.user.realName || user.user.username || '当前用户'
        });
      } else {
        message.error(user.message || '获取用户信息失败');
        navigate('/login');
        return;
      }

      // 获取当前位置
      getCurrentLocation();
      
      // 加载当前签到状态
      loadCurrentCheckInStatus();
      
      // 加载项目列表
      loadProjectList();

      // 如果是队长，加载团队状态
      if (user?.user?.role === '队长') {
        loadTeamStatus();
        loadTeamRecords();
      }
    };

    initializeApp();
    
    // 更新时间
    const timer = setInterval(() => {
      setCurrentTime(dayjs());
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      // 显示定位中状态
      setCurrentLocation('正在获取位置...');
      
      // 首先尝试高精度定位
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const locationString = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          setCurrentLocation(locationString);
          console.log('定位成功:', locationString);
        },
        (error) => {
          console.error('高精度定位失败，尝试低精度定位:', error);
          
          // 如果高精度失败，尝试低精度定位
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              const locationString = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
              setCurrentLocation(locationString);
              console.log('低精度定位成功:', locationString);
              message.success('定位成功（低精度模式）');
            },
            (error) => {
              console.error('所有定位方式都失败:', error);
              let errorMessage = '位置获取失败';
              
              switch(error.code) {
                case error.PERMISSION_DENIED:
                  errorMessage = '位置权限被拒绝，请在浏览器设置中允许位置访问';
                  // 提供用户指导
                  setTimeout(() => {
                    Modal.info({
                      title: '位置权限设置指南',
                      content: (
                        <div>
                          <p>请按以下步骤开启位置权限：</p>
                          <p>1. 点击浏览器地址栏左侧的🔒图标</p>
                          <p>2. 找到"位置"选项</p>
                          <p>3. 选择"允许"</p>
                          <p>4. 刷新页面重试</p>
                        </div>
                      ),
                      width: 400
                    });
                  }, 1000);
                  break;
                case error.POSITION_UNAVAILABLE:
                  errorMessage = '位置信息不可用，请检查GPS或网络连接';
                  break;
                case error.TIMEOUT:
                  errorMessage = '获取位置超时，请重试';
                  break;
                default:
                  errorMessage = `位置获取失败: ${error.message}`;
                  break;
              }
              
              setCurrentLocation(errorMessage);
              message.warning(errorMessage);
            },
            {
              enableHighAccuracy: false,  // 低精度模式
              timeout: 15000,            // 更长的超时时间
              maximumAge: 600000         // 10分钟缓存
            }
          );
        },
        {
          enableHighAccuracy: true,    // 高精度模式
          timeout: 10000,              // 10秒超时
          maximumAge: 300000           // 5分钟缓存
        }
      );
    } else {
      const errorMessage = '浏览器不支持地理定位功能';
      setCurrentLocation(errorMessage);
      message.error(errorMessage);
    }
  };

  // 添加手动重新定位功能
  const refreshLocation = () => {
    message.info('正在重新获取位置...');
    getCurrentLocation();
  };

  // 监听位置变化
  const watchPosition = () => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const locationString = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          setCurrentLocation(locationString);
          console.log('位置更新:', locationString);
        },
        (error) => {
          console.error('位置监听错误:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000 // 1分钟缓存
        }
      );
      
      return watchId;
    }
    return null;
  };

  // 页面加载时自动获取位置
  useEffect(() => {
    // 延迟1秒后自动获取位置，避免页面加载时的权限弹窗干扰
    const timer = setTimeout(() => {
      getCurrentLocation();
    }, 1000);

    // 5秒后开始监听位置变化
    const watchTimer = setTimeout(() => {
      const watchId = watchPosition();
      return () => {
        if (watchId) {
          navigator.geolocation.clearWatch(watchId);
        }
      };
    }, 5000);

    return () => {
      clearTimeout(timer);
      clearTimeout(watchTimer);
    };
  }, []);

  const loadCurrentCheckInStatus = async () => {
    try {
      const response = await checkInAPI.getCurrentStatus();
      if (response.data && response.code === 200) {
        const data = response.data;
        
        // 设置各类型的签到记录
        const records = {
          construction: data.constructionRecord || null,
          travel: data.travelRecord || null,
          stop: data.stopRecord || null
        };
        setCheckInRecords(records);
        
        // 保持向后兼容，设置当前记录为第一个有值的记录
        const firstRecord = records.construction || records.travel || records.stop;
        setCheckInRecord(firstRecord);
      }
    } catch (error) {
      console.error('加载签到状态失败:', error);
    }
  };

  const loadProjectList = async () => {
    try {
      // 获取项目列表
      const projectResponse = await attendanceAPI.getProjectList();
      if (projectResponse.code === 200) {
        const projects = projectResponse.data || [];
        setProjectList(projects);
        
        // 创建ID到名称的映射
        const map = {};
        projects.forEach(project => {
          map[project.id] = project.projectName;
        });
        setProjectMap(map);
      }
    } catch (error) {
      console.error('加载项目列表失败:', error);
    }
  };

  const handleProjectChange = (projectId) => {
    setSelectedProject(projectId);
  };

  const loadTeamStatus = async () => {
    if (currentUser?.role !== '队长') return;
    
    try {
      const response = await checkInAPI.getTeamStatus();
      if (response.code === 200) {
        setTeamStatus(response.data);
      }
    } catch (error) {
      console.error('加载团队状态失败:', error);
      message.error('加载团队状态失败');
    }
  };

  const loadTeamRecords = async () => {
    if (currentUser?.role !== '队长') return;
    
    try {
      const response = await checkInAPI.getTeamRecords();
      if (response.code === 200) {
        setTeamRecords(response.data.records || []);
      }
    } catch (error) {
      console.error('加载团队记录失败:', error);
      message.error('加载团队记录失败');
    }
  };

  const handleCheckIn = async (values) => {
    // 检查该类型是否已经签到
    if (checkInRecords[values.type]) {
      message.error('今日' + (values.type === 'construction' ? '施工打卡' : values.type === 'travel' ? '在途打卡' : '停工打卡') + '已签到，请先签退');
      return;
    }

    setLoading(true);
    try {
      const checkInData = {
        userName: values.userName,
        type: values.type,
        subType: values.subType,
        projectId: values.projectId,
        // projectName: selectedProject ? projectMap[selectedProject] : null,
        location: currentLocation,
        latitude: currentLocation.includes(',') ? parseFloat(currentLocation.split(',')[0]) : null,
        longitude: currentLocation.includes(',') ? parseFloat(currentLocation.split(',')[1]) : null,
        checkInTime: currentTime.format('YYYY-MM-DD HH:mm:ss'),
        date: currentTime.format('YYYY-MM-DD')
      };

      const response = await checkInAPI.checkIn(checkInData);
      if (response.code === 200) {
        message.success('签到成功！');
        loadCurrentCheckInStatus();
        form.resetFields(['workContent', 'projectName']);
      } else {
        message.error(response.message || '签到失败');
      }
    } catch (error) {
      message.error(error.message || '签到失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async (type) => {
    const record = checkInRecords[type];
    if (!record) return;
    
    // 如果是施工打卡且没有项目信息，需要选择项目
    if (type === 'construction' && !record.projectId) {
      Modal.confirm({
        title: '选择项目签退',
        content: (
          <div>
            <p>请选择要签退的项目：</p>
            <Select
                style={{ width: '100%' }}
                placeholder="请选择项目"
                onChange={(value) => {
                  // 保存选择的项目值
                  window.selectedProjectForCheckOut = value;
                }}
              >
                {projectList.map(project => (
                  <Option key={project.id} value={project.id}>
                    {record.projectId}
                  </Option>
                ))}
              </Select>
          </div>
        ),
        onOk: async () => {
          const selectedProject = window.selectedProjectForCheckOut;
          if (!selectedProject) {
            message.error('请选择项目');
            return;
          }
          
          await performCheckOut(type, selectedProject);
          window.selectedProjectForCheckOut = null;
        },
        onCancel: () => {
          window.selectedProjectForCheckOut = null;
        }
      });
    } else {
      // 其他类型或已有项目信息，直接签退
      await performCheckOut(type, record.projectId || null);
    }
  };

  const performCheckOut = async (type, projectId) => {
    setLoading(true);
    try {
      const checkOutData = {
        type: type,
        checkOutTime: currentTime.format('YYYY-MM-DD HH:mm:ss'),
        workContent: '',
        projectId: projectId, // 传递项目ID
        projectName: projectId ? projectMap[projectId] : null // 保留项目名称用于显示
      };

      const response = await checkInAPI.checkOut(checkOutData);
      if (response.code === 200) {
        message.success('签退成功！');
        await loadCurrentCheckInStatus();
      } else {
        message.error(response.message || '签退失败');
      }
    } catch (error) {
      message.error(error.message || '签退失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    form.setFieldsValue({
      type: 'construction'
    });
  }, [form]);

  const calculateWorkDuration = (record) => {
    if (!record?.checkInTime) return 0;
    const start = dayjs(record.checkInTime);
    const now = dayjs();
    const duration = now.diff(start, 'hour', true);
    return duration;
  };

  const formatDuration = (hours) => {
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    return `${h}小时${m}分钟`;
  };

  const getWorkHoursLabel = (type) => {
    switch(type) {
      case 'construction': return '施工工时';
      case 'travel': return '在途工时';
      case 'stop': return '停工工时';
      default: return '工时';
    }
  };

  const getGreeting = () => {
    const hour = currentTime.hour();
    if (hour < 6) return '凌晨好';
    if (hour < 12) return '上午好';
    if (hour < 18) return '下午好';
    return '晚上好';
  };

  return (
    <div className="page-container">
      <div className="header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={2} style={{ color: 'white', margin: 0 }}>
              {getGreeting()}，{currentUser?.realName || currentUser?.username || '用户'}
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.9)' }}>
              {currentTime.format('YYYY年MM月DD日 HH:mm:ss')}
            </Text>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px' }}>👋</div>
          </div>
        </div>
      </div>

      <div className="main-content">
        {/* 团队视图切换按钮（仅队长可见） */}
        {currentUser?.role === '队长' && (
          <Card style={{ marginBottom: 16, textAlign: 'center' }}>
            <Space>
              <Button 
                type={!showTeamView ? 'primary' : 'default'}
                onClick={() => setShowTeamView(false)}
              >
                个人打卡
              </Button>
              <Button 
                type={showTeamView ? 'primary' : 'default'}
                onClick={() => setShowTeamView(true)}
              >
                团队状态
              </Button>
            </Space>
          </Card>
        )}

        {/* 团队状态视图 */}
        {showTeamView && currentUser?.role === '队长' && teamStatus && (
          <Card title="团队打卡状态" style={{ marginBottom: 16 }}>
            {Object.entries(teamStatus).map(([userId, memberStatus]) => {
              const hasAnyCheckIn = Object.values(memberStatus).some(status => 
                typeof status === 'object' && status?.isCheckedIn
              );
              
              return (
                <Card 
                  key={userId}
                  type="inner" 
                  style={{ marginBottom: 8 }}
                  size="small"
                >
                  <Row align="middle" gutter={16}>
                    <Col span={6}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', marginBottom: 4 }}>
                          {hasAnyCheckIn ? '✅' : '⏰'}
                        </div>
                        <Text style={{ fontSize: '12px' }}>
                          {hasAnyCheckIn ? '工作中' : '未签到'}
                        </Text>
                      </div>
                    </Col>
                    <Col span={18}>
                      <div style={{ marginBottom: 4 }}>
                        <Text strong>队员 {userId}</Text>
                        <Badge 
                          status={hasAnyCheckIn ? 'success' : 'default'} 
                          text={hasAnyCheckIn ? '在线' : '离线'}
                          style={{ marginLeft: 8 }}
                        />
                      </div>
                      <div>
                        {checkInTypes.map(type => {
                          const isCheckedIn = memberStatus[type.value + 'CheckedIn'];
                          const record = memberStatus[type.value + 'Record'];
                          return (
                            <Tag 
                              key={type.value}
                              color={isCheckedIn ? type.color : 'default'}
                              style={{ marginBottom: 4, marginRight: 4 }}
                            >
                              {type.icon} {isCheckedIn ? '已' : '未'}{type.label}
                            </Tag>
                          );
                        })}
                      </div>
                      {hasAnyCheckIn && (
                        <div style={{ marginTop: 4 }}>
                          <Text style={{ fontSize: '12px', color: '#666' }}>
                            {Object.values(memberStatus).find(status => 
                              typeof status === 'object' && status?.isCheckedIn && status?.record?.checkInTime
                            )?.record?.checkInTime && 
                              `签到时间: ${dayjs(
                                Object.values(memberStatus).find(status => 
                                  typeof status === 'object' && status?.isCheckedIn && status?.record?.checkInTime
                                )?.record?.checkInTime
                              ).format('HH:mm')}`
                            }
                          </Text>
                        </div>
                      )}
                    </Col>
                  </Row>
                </Card>
              );
            })}
          </Card>
        )}

        {/* 个人打卡视图 */}
        {!showTeamView && (
          <>
            {/* 签到表单卡片 */}
            <Card className="checkin-card" title="签到打卡" style={{ marginBottom: 16 }}>
              <Form
                form={form}
                layout="vertical"
                onFinish={handleCheckIn}
              >
                <Form.Item
                  label="签到人"
                  name="userName"
                  initialValue={currentUser?.realName || currentUser?.username || '当前用户'}
                  rules={[{ required: true, message: '请输入签到人姓名' }]}
                >
                  <Input 
                    prefix={<UserOutlined />} 
                    placeholder="请输入签到人姓名"
                    size="large"
                    disabled={!!currentUser}
                  />
                </Form.Item>

                <Form.Item
                  label="签到类型"
                  name="type"
                  rules={[{ required: true, message: '请选择签到类型' }]}
                >
                  <Select 
                    size="large" 
                    placeholder="请选择签到类型"
                    onChange={(value) => {
                      if (value !== 'travel') {
                        form.setFieldsValue({ subType: undefined });
                      }
                    }}
                  >
                    {checkInTypes.map(type => (
                      <Option key={type.value} value={type.value}>
                        <div style={{ padding: '4px 0' }}>
                          <Space>
                            <span style={{ fontSize: '18px' }}>{type.icon}</span>
                            <div style={{ fontWeight: 'bold' }}>{type.label}</div>
                            <div style={{ fontSize: '12px', color: '#666' }}>{type.description}</div>
                          </Space>
                        </div>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  noStyle
                  shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}
                >
                  {({ getFieldValue }) =>
                    getFieldValue('type') === 'travel' ? (
                      <Form.Item
                        label="在途类型"
                        name="subType"
                        rules={[{ required: true, message: '请选择在途类型' }]}
                      >
                        <Select size="large" placeholder="请选择在途类型">
                          {travelSubTypes.map(subType => (
                            <Option key={subType.value} value={subType.value}>
                              <div style={{ padding: '4px 0' }}>
                                <Space>
                                  <span style={{ fontSize: '16px' }}>{subType.icon}</span>
                                  <div>
                                    <div style={{ fontWeight: 'bold' }}>{subType.label}</div>
                                  </div>
                                  <div style={{ fontSize: '12px', color: '#666' }}>{subType.description}</div>
                                </Space>
                              </div>
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    ) : null
                  }
                </Form.Item>

                <Form.Item
                  noStyle
                  shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}
                >
                  {({ getFieldValue }) =>
                    (getFieldValue('type') === 'construction' || getFieldValue('type') === 'stop') ? (
                      <Form.Item
                        label="项目选择"
                        name="projectId"
                        rules={[{ required: true, message: '请选择项目' }]}
                      >
                        <Select 
                          size="large" 
                          placeholder="请选择项目"
                          prefix={<ProjectOutlined />}
                          onChange={handleProjectChange}
                        >
                          {projectList.map(project => (
                            <Option key={project.id} value={project.id}>
                              <Space>
                                {project.projectName}
                              </Space>
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    ) : null
                  }
                </Form.Item>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label="签到日期时间">
                      <Input
                        prefix={<ClockCircleOutlined />}
                        value={currentTime.format('YYYY-MM-DD HH:mm:ss')}
                        disabled
                        size="large"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="签到地点">
                      <Input
                        prefix={<EnvironmentOutlined />}
                        value={currentLocation.includes(',') ? '已定位' : '定位中...'}
                        disabled
                        size="large"
                        suffix={
                          <Button 
                            type="text" 
                            icon={<EnvironmentOutlined />}
                            onClick={refreshLocation}
                            size="small"
                            title="刷新位置"
                          >
                            刷新
                          </Button>
                        }
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    size="large"
                    block
                    icon={<CheckCircleOutlined />}
                    style={{ height: '50px', fontSize: '16px' }}
                    disabled={!!checkInRecords[form.getFieldValue('type')]}
                  >
                    {checkInRecords[form.getFieldValue('type')] ? '今日已签到' : '立即签到'}
                  </Button>
                </Form.Item>
              </Form>
            </Card>

            {/* 签到状态显示 */}
            <Card title="今日签到状态" style={{ marginBottom: 16 }}>
              {checkInTypes.map(type => {
                const record = checkInRecords[type.value];
                if (!record) {
                  return (
                    <Card key={type.value} type="inner" style={{ marginBottom: 8 }}>
                      <Row align="middle">
                        <Col span={6}>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '24px', marginBottom: 4 }}>{type.icon}</div>
                            <Text style={{ fontSize: '12px' }}>{type.label}</Text>
                          </div>
                        </Col>
                        <Col span={18}>
                          <Tag color="default">未签到</Tag>
                        </Col>
                      </Row>
                    </Card>
                  );
                }

                return (
                  <Card key={type.value} type="inner" style={{ marginBottom: 8 }}>
                    <Row align="middle">
                      <Col span={6}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '24px', marginBottom: 4 }}>{type.icon}</div>
                          <Text style={{ fontSize: '12px' }}>{type.label}</Text>
                        </div>
                      </Col>
                      <Col span={18}>
                        <div style={{ marginBottom: 8 }}>
                          {record.status === 'checked_out' ? (
                            <Tag color="default" icon={<LogoutOutlined />}>
                              已签退
                            </Tag>
                          ) : (
                            <Tag color="success" icon={<CheckCircleOutlined />}>
                              已签到
                            </Tag>
                          )}
                          {record.approved ? (
                            <Tag color="success" icon={<CheckCircleOutlined />}>
                              已审批通过
                            </Tag>
                          ) : record.rejected ? (
                            <Tag color="error" icon={<CloseCircleOutlined />}>
                              已被驳回
                            </Tag>
                          ) : (
                            <Tag color="warning" icon={<ClockCircleOutlined />}>
                              待审批
                            </Tag>
                          )}
                        </div>
                        
                        {/* 显示项目信息 */}
                        {record.projectName && (
                          <div style={{ marginBottom: 4 }}>
                            <Text style={{ fontSize: '12px', color: '#666' }}>
                              {/* <ProjectOutlined />  */}
                              项目：{record.projectName}
                            </Text>
                          </div>
                        )}
                        
                        <div style={{ marginBottom: 4 }}>
                          <Text style={{ fontSize: '12px', color: '#666' }}>
                            签到时间：{dayjs(record.checkInTime).format('HH:mm')}
                          </Text>
                        </div>
                        
                        {record.checkOutTime && (
                          <div style={{ marginBottom: 4 }}>
                            <Text style={{ fontSize: '12px', color: '#666' }}>
                              签退时间：{dayjs(record.checkOutTime).format('HH:mm')}
                            </Text>
                          </div>
                        )}
                        
                        {!record.checkOutTime && record.approved && (
                          <div style={{ marginTop: 8 }}>
                            <Button
                              type="primary"
                              danger
                              onClick={() => handleCheckOut(type.value)}
                              loading={loading}
                              size="small"
                              icon={<LogoutOutlined />}
                            >
                              签退 {type.label}
                            </Button>
                          </div>
                        )}
                      </Col>
                    </Row>
                  </Card>
                );
              })}
            </Card>

            {/* 快捷操作卡片 */}
            <Card className="quick-actions-card">
              <Row gutter={16}>
                <Col span={12}>
                  <Button 
                    type="text" 
                    icon={<HistoryOutlined />}
                    onClick={() => navigate('/attendance')}
                    style={{ width: '100%', height: '60px' }}
                  >
                    考勤记录
                  </Button>
                </Col>
                <Col span={12}>
                  <Button 
                    type="text" 
                    icon={<CalendarOutlined />}
                    onClick={() => navigate('/approval')}
                    style={{ width: '100%', height: '60px' }}
                  >
                    审批管理
                  </Button>
                </Col>
              </Row>
            </Card>
          </>
        )
        }
      </div>

      {/* <div className="bottom-nav">
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
      </div> */}
    </div>
  );
};

export default CheckInPage;