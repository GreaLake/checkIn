package com.checkin.controller;

import com.checkin.common.Result;
import com.checkin.entity.CheckInRecord;
import com.checkin.service.ApprovalService;
import com.checkin.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/approval")
@CrossOrigin
public class ApprovalController {

    @Autowired
    private ApprovalService approvalService;

    @Autowired
    private JwtUtil jwtUtil;

    private String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication.getName();
    }

    @GetMapping("/pending")
    public Result<List<CheckInRecord>> getPendingApprovals() {
        try {
            List<CheckInRecord> records = approvalService.getPendingApprovals();
            return Result.success(records);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/approve/{recordId}")
    public Result<CheckInRecord> approve(@PathVariable Long recordId, @RequestBody Map<String, String> request) {
        try {
            String workContent = request.get("workContent");
            String approvedBy = getCurrentUsername();
            
            CheckInRecord record = approvalService.approve(recordId, workContent, approvedBy);
            return Result.success(record);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/reject/{recordId}")
    public Result<CheckInRecord> reject(@PathVariable Long recordId, @RequestBody Map<String, String> request) {
        try {
            String rejectionReason = request.get("rejectionReason");
            String rejectedBy = getCurrentUsername();
            
            CheckInRecord record = approvalService.reject(recordId, rejectionReason, rejectedBy);
            return Result.success(record);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/approved")
    public Result<List<CheckInRecord>> getApprovedRecords() {
        try {
            List<CheckInRecord> records = approvalService.getApprovedRecords();
            return Result.success(records);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/rejected")
    public Result<List<CheckInRecord>> getRejectedRecords() {
        try {
            List<CheckInRecord> records = approvalService.getRejectedRecords();
            return Result.success(records);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/statistics")
    public Result<Map<String, Object>> getApprovalStatistics() {
        try {
            List<CheckInRecord> pending = approvalService.getPendingApprovals();
            List<CheckInRecord> approved = approvalService.getApprovedRecords();
            List<CheckInRecord> rejected = approvalService.getRejectedRecords();

            Map<String, Object> statistics = new HashMap<>();
            statistics.put("pendingCount", pending.size());
            statistics.put("approvedCount", approved.size());
            statistics.put("rejectedCount", rejected.size());

            return Result.success(statistics);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }
}