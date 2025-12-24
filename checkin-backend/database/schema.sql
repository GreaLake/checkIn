-- 创建数据库
CREATE DATABASE IF NOT EXISTS checkin_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE checkin_db;

-- 删除外键约束（如果存在）
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for user
-- ----------------------------
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `username` varchar(255) DEFAULT NULL COMMENT '用户名',
  `password` varchar(255) DEFAULT NULL COMMENT '密码',
  `real_name` varchar(255) DEFAULT NULL COMMENT '真实姓名',
  `phone` varchar(255) DEFAULT NULL COMMENT '电话',
  `email` varchar(255) DEFAULT NULL COMMENT '邮箱',
  `role` varchar(255) DEFAULT NULL COMMENT '角色：队员、队长、管理员',
  `department` varchar(255) DEFAULT NULL COMMENT '部门',
  `team_id` bigint DEFAULT NULL COMMENT '团队ID',
  `created_at` datetime DEFAULT NULL COMMENT '创建时间',
  `updated_at` datetime DEFAULT NULL COMMENT '更新时间',
  `deleted` int DEFAULT '0' COMMENT '逻辑删除：0-未删除，1-已删除',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- ----------------------------
-- Table structure for team
-- ----------------------------
DROP TABLE IF EXISTS `team`;
CREATE TABLE `team` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '团队ID',
  `team_name` varchar(255) DEFAULT NULL COMMENT '团队名称',
  `leader_id` bigint DEFAULT NULL COMMENT '队长ID',
  `leader_name` varchar(255) DEFAULT NULL COMMENT '队长姓名',
  `description` varchar(255) DEFAULT NULL COMMENT '描述',
  `status` varchar(255) DEFAULT NULL COMMENT '状态：active-活跃，inactive-非活跃',
  `created_at` datetime DEFAULT NULL COMMENT '创建时间',
  `updated_at` datetime DEFAULT NULL COMMENT '更新时间',
  `deleted` int DEFAULT '0' COMMENT '逻辑删除：0-未删除，1-已删除',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='团队表';

-- ----------------------------
-- Table structure for project
-- ----------------------------
DROP TABLE IF EXISTS `project`;
CREATE TABLE `project` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '项目ID',
  `project_name` varchar(255) DEFAULT NULL COMMENT '项目名称',
  `project_code` varchar(255) DEFAULT NULL COMMENT '项目编码',
  `location` varchar(255) DEFAULT NULL COMMENT '位置',
  `description` varchar(255) DEFAULT NULL COMMENT '描述',
  `status` varchar(255) DEFAULT NULL COMMENT '状态：active-活跃，completed-已完成，suspended-已暂停',
  `start_date` datetime DEFAULT NULL COMMENT '开始日期',
  `end_date` datetime DEFAULT NULL COMMENT '结束日期',
  `manager_id` bigint DEFAULT NULL COMMENT '管理者ID',
  `created_at` datetime DEFAULT NULL COMMENT '创建时间',
  `updated_at` datetime DEFAULT NULL COMMENT '更新时间',
  `deleted` int DEFAULT '0' COMMENT '逻辑删除：0-未删除，1-已删除',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='项目表';

-- ----------------------------
-- Table structure for checkin_record
-- ----------------------------
DROP TABLE IF EXISTS `checkin_record`;
CREATE TABLE `checkin_record` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '签到记录ID',
  `user_id` bigint DEFAULT NULL COMMENT '用户ID',
  `user_name` varchar(255) DEFAULT NULL COMMENT '用户名',
  `check_in_time` datetime DEFAULT NULL COMMENT '签到时间',
  `check_out_time` datetime DEFAULT NULL COMMENT '签退时间',
  `location` varchar(255) DEFAULT NULL COMMENT '位置',
  `latitude` double DEFAULT NULL COMMENT '纬度',
  `longitude` double DEFAULT NULL COMMENT '经度',
  `type` varchar(255) DEFAULT NULL COMMENT '类型：construction-施工，travel-差旅，stop-停工',
  `sub_type` varchar(255) DEFAULT NULL COMMENT '子类型：departure-出发，arrival-到达，return-返回，backToNing-返宁',
  `status` varchar(255) DEFAULT NULL COMMENT '状态：checked_in-已签到，checked_out-已签退',
  `work_content` text COMMENT '工作内容',
  `approved` tinyint(1) DEFAULT NULL COMMENT '是否批准：0-未批准，1-已批准',
  `approved_by` varchar(255) DEFAULT NULL COMMENT '批准人',
  `approval_time` datetime DEFAULT NULL COMMENT '批准时间',
  `rejected` tinyint(1) DEFAULT NULL COMMENT '是否拒绝：0-未拒绝，1-已拒绝',
  `rejected_by` varchar(255) DEFAULT NULL COMMENT '拒绝人',
  `rejection_time` datetime DEFAULT NULL COMMENT '拒绝时间',
  `rejection_reason` varchar(255) DEFAULT NULL COMMENT '拒绝原因',
  `project_id` bigint DEFAULT NULL COMMENT '项目ID',
  `work_hours` double DEFAULT NULL COMMENT '工时',
  `created_at` datetime DEFAULT NULL COMMENT '创建时间',
  `updated_at` datetime DEFAULT NULL COMMENT '更新时间',
  `deleted` int DEFAULT '0' COMMENT '逻辑删除：0-未删除，1-已删除',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='签到记录表';

-- 重新启用外键约束检查
SET FOREIGN_KEY_CHECKS = 1;