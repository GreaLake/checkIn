package com.checkin.controller;

import com.checkin.common.Result;
import com.checkin.entity.CheckInRecord;
import com.checkin.entity.User;
import com.checkin.service.CheckInService;
import com.checkin.service.UserService;
import com.checkin.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/checkin")
@CrossOrigin
public class CheckInController {

    @Autowired
    private CheckInService checkInService;

    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtil jwtUtil;

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return (Long) authentication.getDetails();
    }

    @PostMapping("/checkin")
    public Result<CheckInRecord> checkIn(@RequestBody Map<String, Object> checkInRequest) {
        try {
            Long userId = getCurrentUserId();
            String userName = (String) checkInRequest.get("userName");
            String type = (String) checkInRequest.get("type");
            String subType = (String) checkInRequest.get("subType");
            String location = (String) checkInRequest.get("location");
            
            Object latitudeObj = checkInRequest.get("latitude");
            Object longitudeObj = checkInRequest.get("longitude");
            
            Double latitude = latitudeObj != null ? Double.valueOf(latitudeObj.toString()) : null;
            Double longitude = longitudeObj != null ? Double.valueOf(longitudeObj.toString()) : null;
            Long projectId = checkInRequest.get("projectId") != null ? Long.valueOf(checkInRequest.get("projectId").toString()) : null;

            CheckInRecord record = checkInService.checkIn(userId, userName, type, subType, location, latitude, longitude, projectId);
            return Result.success(record);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/checkout")
    public Result<CheckInRecord> checkOut(@RequestBody Map<String, Object> request) {
        try {
            Long userId = getCurrentUserId();
            String type = request.get("type") != null ? request.get("type").toString() : null;
            String checkOutTime = request.get("checkOutTime") != null ? request.get("checkOutTime").toString() : null;
            String workContent = request.get("workContent") != null ? request.get("workContent").toString() : null;
            Long projectId = null;
            
            // 处理projectId参数
            Object projectIdObj = request.get("projectId");
            if (projectIdObj != null) {
                if (projectIdObj instanceof Integer) {
                    projectId = ((Integer) projectIdObj).longValue();
                } else if (projectIdObj instanceof Long) {
                    projectId = (Long) projectIdObj;
                } else if (projectIdObj instanceof String) {
                    try {
                        projectId = Long.parseLong((String) projectIdObj);
                    } catch (NumberFormatException e) {
                        // 忽略无效的ID
                    }
                }
            }
            
            if (type == null || type.isEmpty()) {
                return Result.error("打卡类型不能为空");
            }
            
            CheckInRecord record = checkInService.checkOut(userId, type, checkOutTime, workContent, projectId);
            return Result.success(record);
        } catch (Exception e) {
            return Result.error("签退失败: " + e.getMessage());
        }
    }

    @GetMapping("/status")
    public Result<Map<String, Object>> getCurrentStatus() {
        try {
            Long userId = getCurrentUserId();
            
            // 获取所有类型的签到状态
            Map<String, Object> data = new HashMap<>();
            String[] types = {"construction", "travel", "stop"};
            
            for (String type : types) {
                CheckInRecord currentRecord = checkInService.getCurrentCheckInStatus(userId, type);
                data.put(type + "Record", currentRecord);
                data.put(type + "CheckedIn", currentRecord != null && "checked_in".equals(currentRecord.getStatus()));
            }
            
            return Result.success(data);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/status/{type}")
    public Result<Map<String, Object>> getCurrentStatusByType(@PathVariable String type) {
        try {
            Long userId = getCurrentUserId();
            CheckInRecord currentRecord = checkInService.getCurrentCheckInStatus(userId, type);
            
            Map<String, Object> data = new HashMap<>();
            data.put("currentRecord", currentRecord);
            data.put("isCheckedIn", currentRecord != null && "checked_in".equals(currentRecord.getStatus()));
            
            return Result.success(data);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/team-records")
    @PreAuthorize("hasRole('ROLE_队长')")
    public Result<Map<String, Object>> getTeamCheckInRecords(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String userId) {
        try {
            Long currentUserId = getCurrentUserId();
            User currentUser = userService.getById(currentUserId);
            
            if (currentUser == null || !"队长".equals(currentUser.getRole())) {
                return Result.error("无权限查看团队打卡记录");
            }
            
            // 获取团队成员列表
            List<User> teamMembers = userService.getTeamMembers(currentUser.getTeamId());
            
            // 获取团队成员的打卡记录
            List<CheckInRecord> teamRecords = checkInService.getTeamCheckInRecords(
                currentUser.getTeamId(), startDate, endDate, userId);
            
            Map<String, Object> data = new HashMap<>();
            data.put("teamMembers", teamMembers);
            data.put("records", teamRecords);
            
            return Result.success(data);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/team-status")
    @PreAuthorize("hasRole('ROLE_队长')")
    public Result<Map<String, Object>> getTeamCurrentStatus() {
        try {
            Long currentUserId = getCurrentUserId();
            User currentUser = userService.getById(currentUserId);
            
            if (currentUser == null || !"队长".equals(currentUser.getRole())) {
                return Result.error("无权限查看团队状态");
            }
            
            // 获取团队成员的当前签到状态
            Map<String, Object> teamStatus = checkInService.getTeamCurrentStatus(currentUser.getTeamId());
            
            return Result.success(teamStatus);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }
}