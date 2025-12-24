package com.checkin.service;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.checkin.entity.CheckInRecord;
import com.checkin.entity.User;
import com.checkin.mapper.CheckInRecordMapper;
import com.checkin.mapper.UserMapper;
import com.checkin.mapper.ProjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AttendanceService extends ServiceImpl<CheckInRecordMapper, CheckInRecord> {

    @Autowired
    private CheckInRecordMapper checkInRecordMapper;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private ProjectMapper projectMapper;

    public List<CheckInRecord> getAttendanceRecords(LocalDateTime startDate, LocalDateTime endDate, 
                                                   Long userId, String type) {
        List<CheckInRecord> records = lambdaQuery()
                .eq(CheckInRecord::getApproved, true)
                .isNotNull(CheckInRecord::getCheckOutTime)
                .orderByDesc(CheckInRecord::getCheckInTime)
                .list();
        
        // 过滤条件
        if (startDate != null) {
            records = records.stream()
                    .filter(record -> record.getCheckInTime().isAfter(startDate))
                    .collect(Collectors.toList());
        }
        
        if (endDate != null) {
            records = records.stream()
                    .filter(record -> record.getCheckInTime().isBefore(endDate))
                    .collect(Collectors.toList());
        }
        
        if (userId != null) {
            records = records.stream()
                    .filter(record -> record.getUserId().equals(userId))
                    .collect(Collectors.toList());
        }
        
        if (type != null && !type.equals("all")) {
            records = records.stream()
                    .filter(record -> type.equals(record.getType()))
                    .collect(Collectors.toList());
        }
        
        return records;
    }

    public Map<String, Object> getAttendanceStatistics(LocalDateTime startDate, LocalDateTime endDate, 
                                                      Long userId) {
        List<CheckInRecord> records = getAttendanceRecords(startDate, endDate, userId, null);
        
        Map<String, Object> statistics = new HashMap<>();
        statistics.put("totalRecords", records.size());
        
        double totalHours = 0;
        double constructionHours = 0;
        double travelHours = 0;
        double stopHours = 0;
        
        Map<String, Map<String, Object>> userStats = new HashMap<>();
        
        for (CheckInRecord record : records) {
            double hours = calculateWorkHours(record.getCheckInTime(), record.getCheckOutTime());
            totalHours += hours;
            
            // 按类型统计工时
            switch (record.getType()) {
                case "construction":
                    constructionHours += hours;
                    break;
                case "travel":
                    travelHours += hours;
                    break;
                case "stop":
                    stopHours += hours;
                    break;
            }
            
            // 按用户统计
            String userName = record.getUserName();
            if (!userStats.containsKey(userName)) {
                userStats.put(userName, new HashMap<>());
                userStats.get(userName).put("totalHours", 0.0);
                userStats.get(userName).put("constructionHours", 0.0);
                userStats.get(userName).put("travelHours", 0.0);
                userStats.get(userName).put("stopHours", 0.0);
                userStats.get(userName).put("recordCount", 0);
            }
            
            Map<String, Object> userStat = userStats.get(userName);
            userStat.put("totalHours", (Double) userStat.get("totalHours") + hours);
            userStat.put("recordCount", (Integer) userStat.get("recordCount") + 1);
            
            switch (record.getType()) {
                case "construction":
                    userStat.put("constructionHours", (Double) userStat.get("constructionHours") + hours);
                    break;
                case "travel":
                    userStat.put("travelHours", (Double) userStat.get("travelHours") + hours);
                    break;
                case "stop":
                    userStat.put("stopHours", (Double) userStat.get("stopHours") + hours);
                    break;
            }
        }
        
        statistics.put("totalHours", totalHours);
        statistics.put("constructionHours", constructionHours);
        statistics.put("travelHours", travelHours);
        statistics.put("stopHours", stopHours);
        statistics.put("userStats", userStats);
        
        return statistics;
    }

    public Map<String, Object> getUserStatistics(Long userId) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime monthStart = now.withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
        
        List<CheckInRecord> monthRecords = getAttendanceRecords(monthStart, now, userId, null);
        List<CheckInRecord> allRecords = getAttendanceRecords(null, null, userId, null);
        
        Map<String, Object> statistics = new HashMap<>();
        
        // 本月统计
        double monthTotalHours = monthRecords.stream()
                .mapToDouble(record -> calculateWorkHours(record.getCheckInTime(), record.getCheckOutTime()))
                .sum();
        
        // 总统计
        double totalHours = allRecords.stream()
                .mapToDouble(record -> calculateWorkHours(record.getCheckInTime(), record.getCheckOutTime()))
                .sum();
        
        statistics.put("monthRecords", monthRecords.size());
        statistics.put("monthHours", monthTotalHours);
        statistics.put("totalRecords", allRecords.size());
        statistics.put("totalHours", totalHours);
        
        return statistics;
    }

    public Map<String, Object> getMonthlySummary(Integer year, Integer month) {
        LocalDateTime monthStart = LocalDateTime.of(year, month, 1, 0, 0);
        LocalDateTime monthEnd = monthStart.plusMonths(1).minusSeconds(1);
        
        List<CheckInRecord> records = getAttendanceRecords(monthStart, monthEnd, null, null);
        
        Map<String, Object> summary = new HashMap<>();
        summary.put("year", year);
        summary.put("month", month);
        summary.put("totalRecords", records.size());
        
        double totalHours = records.stream()
                .mapToDouble(record -> calculateWorkHours(record.getCheckInTime(), record.getCheckOutTime()))
                .sum();
        summary.put("totalHours", totalHours);
        
        // 按天统计
        Map<String, Long> dailyRecords = records.stream()
                .collect(Collectors.groupingBy(
                        record -> record.getCheckInTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")),
                        Collectors.counting()
                ));
        summary.put("dailyRecords", dailyRecords);
        
        // 按用户统计
        Map<String, Long> userRecords = records.stream()
                .collect(Collectors.groupingBy(CheckInRecord::getUserName, Collectors.counting()));
        summary.put("userRecords", userRecords);
        
        return summary;
    }

    public Map<String, Object> exportAttendanceData(LocalDateTime startDate, LocalDateTime endDate, 
                                                  Long userId, String type) {
        List<CheckInRecord> records = getAttendanceRecords(startDate, endDate, userId, type);
        
        Map<String, Object> exportData = new HashMap<>();
        exportData.put("records", records);
        exportData.put("totalCount", records.size());
        
        // CSV格式的表头和数据
        List<String> headers = Arrays.asList(
                "签到人", "签到类型", "签到时间", "签退时间", "工作时长(小时)", 
                "签到地点", "工作内容", "审批时间"
        );
        
        List<List<String>> csvData = new ArrayList<>();
        for (CheckInRecord record : records) {
            List<String> row = Arrays.asList(
                    record.getUserName(),
                    getTypeLabel(record.getType(), record.getSubType()),
                    record.getCheckInTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")),
                    record.getCheckOutTime() != null ? 
                            record.getCheckOutTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")) : "",
                            String.format("%.2f", calculateWorkHours(record.getCheckInTime(), record.getCheckOutTime())),
                            record.getLocation(),
                            record.getWorkContent() != null ? record.getWorkContent() : "",
                            record.getApprovalTime() != null ? 
                                    record.getApprovalTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")) : ""
            );
            csvData.add(row);
        }
        
        exportData.put("headers", headers);
        exportData.put("csvData", csvData);
        
        return exportData;
    }

    public List<Map<String, Object>> getProjectList() {
        // 从Project表中获取所有启用的项目信息，包含ID、编码和名称
        return projectMapper.selectList(
                new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<com.checkin.entity.Project>()
                        .eq("status", "active")
        ).stream()
                .filter(project -> project.getProjectCode() != null && project.getProjectName() != null)
                .map(project -> {
                    Map<String, Object> projectInfo = new HashMap<>();
                    projectInfo.put("id", project.getId());
                    projectInfo.put("projectCode", project.getProjectCode());
                    projectInfo.put("projectName", project.getProjectName());
                    return projectInfo;
                })
                .distinct()
                .sorted(Comparator.comparing(p -> (String) p.get("projectCode")))
                .collect(Collectors.toList());
    }

    public Map<String, Object> getProjectStatistics(String projectName) {
        Map<String, Object> statistics = new HashMap<>();
        
        try {
            // 1. 先根据项目名称查询项目ID
            com.checkin.entity.Project project = projectMapper.selectOne(
                new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<com.checkin.entity.Project>()
                        .eq("project_name", projectName)
                        .eq("status", "active")
            );
            
            if (project == null) {
                statistics.put("projectName", projectName);
                statistics.put("totalRecords", 0);
                statistics.put("totalHours", 0.0);
                statistics.put("constructionHours", 0.0);
                statistics.put("travelHours", 0.0);
                statistics.put("stopHours", 0.0);
                statistics.put("userStats", new HashMap<>());
                statistics.put("dailyRecords", new HashMap<>());
                return statistics;
            }
            
            Long projectId = project.getId();
            
            // 2. 获取指定项目的所有考勤记录（通过project_id查询）
            List<CheckInRecord> records = lambdaQuery()
                    .eq(CheckInRecord::getApproved, true)
                    .eq(CheckInRecord::getProjectId, projectId)
                    .list();
            
            statistics.put("projectName", projectName);
            statistics.put("totalRecords", records.size());
            
            double totalHours = 0;
            double constructionHours = 0;
            double travelHours = 0;
            double stopHours = 0;
            
            Map<String, Map<String, Object>> userStats = new HashMap<>();
            Map<String, Long> dailyRecords = new HashMap<>();
            
            for (CheckInRecord record : records) {
                double hours = calculateWorkHours(record.getCheckInTime(), record.getCheckOutTime());
                totalHours += hours;
                
                // 按类型统计工时
                switch (record.getType()) {
                    case "construction":
                        constructionHours += hours;
                        break;
                    case "travel":
                        travelHours += hours;
                        break;
                    case "stop":
                        stopHours += hours;
                        break;
                }
                
                // 按用户统计
                String userName = record.getUserName();
                if (!userStats.containsKey(userName)) {
                    userStats.put(userName, new HashMap<>());
                    userStats.get(userName).put("totalHours", 0.0);
                    userStats.get(userName).put("constructionHours", 0.0);
                    userStats.get(userName).put("travelHours", 0.0);
                    userStats.get(userName).put("stopHours", 0.0);
                    userStats.get(userName).put("recordCount", 0);
                }
                
                Map<String, Object> userStat = userStats.get(userName);
                userStat.put("totalHours", (Double) userStat.get("totalHours") + hours);
                userStat.put("recordCount", (Integer) userStat.get("recordCount") + 1);
                
                switch (record.getType()) {
                    case "construction":
                        userStat.put("constructionHours", (Double) userStat.get("constructionHours") + hours);
                        break;
                    case "travel":
                        userStat.put("travelHours", (Double) userStat.get("travelHours") + hours);
                        break;
                    case "stop":
                        userStat.put("stopHours", (Double) userStat.get("stopHours") + hours);
                        break;
                }
                
                // 按天统计
                String date = record.getCheckInTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
                dailyRecords.put(date, dailyRecords.getOrDefault(date, 0L) + 1);
            }
            
            statistics.put("totalHours", totalHours);
            statistics.put("constructionHours", constructionHours);
            statistics.put("travelHours", travelHours);
            statistics.put("stopHours", stopHours);
            statistics.put("userStats", userStats);
            statistics.put("dailyRecords", dailyRecords);
            
        } catch (Exception e) {
            e.printStackTrace();
            // 返回默认值
            statistics.put("projectName", projectName);
            statistics.put("totalRecords", 0);
            statistics.put("totalHours", 0.0);
            statistics.put("constructionHours", 0.0);
            statistics.put("travelHours", 0.0);
            statistics.put("stopHours", 0.0);
            statistics.put("userStats", new HashMap<>());
            statistics.put("dailyRecords", new HashMap<>());
        }
        
        return statistics;
    }

    public List<CheckInRecord> getTodayUserCheckIns(Long userId, LocalDateTime date) {
        return lambdaQuery()
                .eq(CheckInRecord::getUserId, userId)
                .apply("DATE(check_in_time) = DATE({0})", date)
                .orderByAsc(CheckInRecord::getCheckInTime)
                .list();
    }

    private double calculateWorkHours(LocalDateTime checkInTime, LocalDateTime checkOutTime) {
        if (checkInTime == null || checkOutTime == null) {
            return 0;
        }
        
        return java.time.Duration.between(checkInTime, checkOutTime).toMinutes() / 60.0;
    }

    private String getTypeLabel(String type, String subType) {
        Map<String, String> typeMap = new HashMap<>();
        typeMap.put("construction", "施工打卡");
        typeMap.put("travel", "在途打卡");
        typeMap.put("stop", "停工打卡");
        
        Map<String, String> subTypeMap = new HashMap<>();
        subTypeMap.put("departure", "出发");
        subTypeMap.put("arrival", "到达");
        subTypeMap.put("return", "返程");
        subTypeMap.put("backToNing", "到宁");

        String label = typeMap.getOrDefault(type, type);
        if ("travel".equals(type) && subType != null) {
            label += "（" + subTypeMap.getOrDefault(subType, subType) + "）";
        }
        
        return label;
    }
}