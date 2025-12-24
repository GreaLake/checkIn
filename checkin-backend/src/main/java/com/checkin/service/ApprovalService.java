package com.checkin.service;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.checkin.entity.CheckInRecord;
import com.checkin.mapper.CheckInRecordMapper;
import com.checkin.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ApprovalService extends ServiceImpl<CheckInRecordMapper, CheckInRecord> {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtil jwtUtil;

    public List<CheckInRecord> getPendingApprovals() {
        return baseMapper.findPendingApprovals();
    }

    public CheckInRecord approve(Long recordId, String workContent, String approvedBy) {
        CheckInRecord record = getById(recordId);
        if (record == null) {
            throw new RuntimeException("记录不存在");
        }

        if (record.getApproved() != null && record.getApproved()) {
            throw new RuntimeException("该记录已经审批通过");
        }

        if (record.getRejected() != null && record.getRejected()) {
            throw new RuntimeException("该记录已被驳回，无法审批");
        }

        record.setApproved(true);
        record.setWorkContent(workContent);
        record.setApprovedBy(approvedBy);
        record.setApprovalTime(LocalDateTime.now());

        updateById(record);
        return record;
    }

    public CheckInRecord reject(Long recordId, String rejectionReason, String rejectedBy) {
        CheckInRecord record = getById(recordId);
        if (record == null) {
            throw new RuntimeException("记录不存在");
        }

        if (record.getApproved() != null && record.getApproved()) {
            throw new RuntimeException("该记录已经审批通过，无法驳回");
        }

        record.setRejected(true);
        record.setRejectionReason(rejectionReason);
        record.setRejectedBy(rejectedBy);
        record.setRejectionTime(LocalDateTime.now());

        updateById(record);
        return record;
    }

    public List<CheckInRecord> getApprovedRecords() {
        return lambdaQuery()
                .eq(CheckInRecord::getApproved, true)
                .orderByDesc(CheckInRecord::getApprovalTime)
                .list();
    }

    public List<CheckInRecord> getRejectedRecords() {
        return lambdaQuery()
                .eq(CheckInRecord::getRejected, true)
                .orderByDesc(CheckInRecord::getRejectionTime)
                .list();
    }
}