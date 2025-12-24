package com.checkin.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.checkin.entity.CheckInRecord;
import com.checkin.entity.User;
import com.checkin.mapper.CheckInRecordMapper;
import com.checkin.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class CheckInService extends ServiceImpl<CheckInRecordMapper, CheckInRecord> {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtil jwtUtil;

    public CheckInRecord checkIn(Long userId, String userName, String type, String subType,
                                 String location, Double latitude, Double longitude, Long projectId) {
        // 检查该类型今天是否已经签到
        CheckInRecord todayCheckIn = baseMapper.findTodayCheckInByType(userId, type, LocalDateTime.now());
        if (todayCheckIn != null) {
            throw new RuntimeException("今日" + getTypeLabel(type) + "已签到，请先签退");
        }

        CheckInRecord record = new CheckInRecord();
        record.setUserId(userId);
        record.setUserName(userName);
        record.setCheckInTime(LocalDateTime.now());
        record.setLocation(location);
        record.setLatitude(latitude);
        record.setLongitude(longitude);
        record.setType(type);
        record.setSubType(subType);
        record.setStatus("checked_in");
        record.setProjectId(projectId);
        record.setApproved(false);
        record.setRejected(false);

        save(record);
        return record;
    }

    public CheckInRecord checkOut(Long userId, String type, String checkOutTime, String workContent, Long projectId) {
        CheckInRecord lastCheckIn = baseMapper.findLastCheckInByType(userId, type);
        if (lastCheckIn == null || !"checked_in".equals(lastCheckIn.getStatus())) {
            throw new RuntimeException("没有找到有效的" + getTypeLabel(type) + "签到记录");
        }

        // 检查审批状态
        if (lastCheckIn.getApproved() == null || !lastCheckIn.getApproved()) {
            throw new RuntimeException("签到记录尚未审批通过，无法签退");
        }

        if (lastCheckIn.getRejected() != null && lastCheckIn.getRejected()) {
            throw new RuntimeException("签到记录已被驳回，无法签退");
        }

        lastCheckIn.setCheckOutTime(LocalDateTime.parse(checkOutTime, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        lastCheckIn.setWorkContent(workContent);
        lastCheckIn.setStatus("checked_out");

        // 如果是施工打卡且提供了项目信息，则更新项目ID
        if ("construction".equals(type) && projectId != null) {
            lastCheckIn.setProjectId(projectId);
        }

        // 计算工作时长
        Duration duration = Duration.between(lastCheckIn.getCheckInTime(), lastCheckIn.getCheckOutTime());
        double workHours = duration.toMinutes() / 60.0;
        lastCheckIn.setWorkHours(workHours);

        updateById(lastCheckIn);
        return lastCheckIn;
    }

    public CheckInRecord getCurrentCheckInStatus(Long userId, String type) {
        return baseMapper.findLastCheckInByType(userId, type);
    }

    public List<CheckInRecord> getTeamCheckInRecords(Long teamId, String startDate, String endDate, String userId) {
        QueryWrapper<CheckInRecord> queryWrapper = new QueryWrapper<>();

        // 查询团队成员的记录
        queryWrapper.inSql("user_id", "SELECT id FROM user WHERE team_id = " + teamId + " AND role != '队长'");

        // 时间范围过滤
        if (startDate != null && !startDate.isEmpty()) {
            queryWrapper.ge("check_in_time", LocalDateTime.parse(startDate + " 00:00:00", DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        }
        if (endDate != null && !endDate.isEmpty()) {
            queryWrapper.le("check_in_time", LocalDateTime.parse(endDate + " 23:59:59", DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        }

        // 特定用户过滤
        if (userId != null && !userId.isEmpty()) {
            queryWrapper.eq("user_id", Long.valueOf(userId));
        }

        queryWrapper.orderByDesc("check_in_time");
        return list(queryWrapper);
    }

    public Map<String, Object> getTeamCurrentStatus(Long teamId) {
        List<User> teamMembers = userService.getTeamMembers(teamId);
        Map<String, Object> teamStatus = new HashMap<>();

        for (User member : teamMembers) {
            Map<String, Object> memberStatus = new HashMap<>();

            // 获取各类型的当前状态
            String[] types = {"construction", "travel", "stop"};
            for (String type : types) {
                CheckInRecord currentRecord = getCurrentCheckInStatus(member.getId(), type);
                memberStatus.put(type + "Record", currentRecord);
                memberStatus.put(type + "CheckedIn", currentRecord != null && "checked_in".equals(currentRecord.getStatus()));
            }

            teamStatus.put(member.getId().toString(), memberStatus);
        }

        return teamStatus;
    }

    private String getTypeLabel(String type) {
        switch (type) {
            case "construction":
                return "施工打卡";
            case "travel":
                return "在途打卡";
            case "stop":
                return "停工打卡";
            default:
                return type;
        }
    }
}