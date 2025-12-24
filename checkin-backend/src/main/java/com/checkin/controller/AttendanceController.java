package com.checkin.controller;

import com.checkin.common.Result;
import com.checkin.entity.CheckInRecord;
import com.checkin.service.AttendanceService;
import com.checkin.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/attendance")
@CrossOrigin
public class AttendanceController {

    @Autowired
    private AttendanceService attendanceService;

    @Autowired
    private JwtUtil jwtUtil;

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return (Long) authentication.getDetails();
    }

    @GetMapping("/records")
    public Result<List<CheckInRecord>> getAttendanceRecords(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String type) {
        try {
            LocalDateTime start = startDate != null ? LocalDateTime.parse(startDate) : null;
            LocalDateTime end = endDate != null ? LocalDateTime.parse(endDate) : null;
            Long userIdLong = userId != null ? Long.valueOf(userId) : null;
            
            List<CheckInRecord> records = attendanceService.getAttendanceRecords(start, end, userIdLong, type);
            return Result.success(records);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/statistics")
    public Result<Map<String, Object>> getAttendanceStatistics(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String userId) {
        try {
            LocalDateTime start = startDate != null ? LocalDateTime.parse(startDate) : null;
            LocalDateTime end = endDate != null ? LocalDateTime.parse(endDate) : null;
            Long userIdLong = userId != null ? Long.valueOf(userId) : null;
            
            Map<String, Object> statistics = attendanceService.getAttendanceStatistics(start, end, userIdLong);
            return Result.success(statistics);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/user-statistics")
    public Result<Map<String, Object>> getUserStatistics() {
        try {
            Long userId = getCurrentUserId();
            Map<String, Object> statistics = attendanceService.getUserStatistics(userId);
            return Result.success(statistics);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/monthly-summary")
    public Result<Map<String, Object>> getMonthlySummary(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {
        try {
            if (year == null) {
                year = java.time.Year.now().getValue();
            }
            if (month == null) {
                month = java.time.LocalDateTime.now().getMonthValue();
            }
            
            Map<String, Object> summary = attendanceService.getMonthlySummary(year, month);
            return Result.success(summary);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/projects")
    public Result<List<Map<String, Object>>> getProjectList() {
        try {
            List<Map<String, Object>> projects = attendanceService.getProjectList();
            return Result.success(projects);
        } catch (Exception e) {
            return Result.error("获取项目列表失败: " + e.getMessage());
        }
    }

    @GetMapping("/project-statistics")
    public Result<Map<String, Object>> getProjectStatistics(@RequestParam String projectName) {
        try {
            Map<String, Object> statistics = attendanceService.getProjectStatistics(projectName);
            return Result.success(statistics);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/export")
    public Result<Map<String, Object>> exportAttendanceData(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String type) {
        try {
            LocalDateTime start = startDate != null ? LocalDateTime.parse(startDate) : null;
            LocalDateTime end = endDate != null ? LocalDateTime.parse(endDate) : null;
            Long userIdLong = userId != null ? Long.valueOf(userId) : null;
            
            Map<String, Object> exportData = attendanceService.exportAttendanceData(start, end, userIdLong, type);
            return Result.success(exportData);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }
}