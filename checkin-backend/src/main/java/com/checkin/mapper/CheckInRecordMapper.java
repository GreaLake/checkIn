package com.checkin.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.checkin.entity.CheckInRecord;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface CheckInRecordMapper extends BaseMapper<CheckInRecord> {

    @Select("SELECT * FROM checkin_record WHERE user_id = #{userId} AND type = #{type} AND DATE(check_in_time) = DATE(#{date}) AND status = 'checked_in' AND deleted = 0")
    CheckInRecord findTodayCheckInByType(@Param("userId") Long userId, @Param("type") String type, @Param("date") LocalDateTime date);

    @Select("SELECT * FROM checkin_record WHERE user_id = #{userId} AND type = #{type} AND deleted = 0 AND DATE(check_in_time) = CURDATE() ORDER BY check_in_time DESC LIMIT 1")
    CheckInRecord findLastCheckInByType(@Param("userId") Long userId, @Param("type") String type);

    @Select("SELECT * FROM checkin_record WHERE user_id = #{userId} AND status = 'checked_in' AND deleted = 0 ORDER BY check_in_time DESC LIMIT 1")
    CheckInRecord findLastCheckIn(@Param("userId") Long userId);

    @Select("SELECT * FROM checkin_record WHERE approved = false AND rejected = false AND deleted = 0")
    List<CheckInRecord> findPendingApprovals();

    @Select("SELECT * FROM checkin_record WHERE user_id = #{userId} AND check_in_time >= #{startDate} AND check_in_time <= #{endDate} AND deleted = 0")
    List<CheckInRecord> findByUserIdAndDateRange(@Param("userId") Long userId, 
                                                   @Param("startDate") LocalDateTime startDate, 
                                                   @Param("endDate") LocalDateTime endDate);
}