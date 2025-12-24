-- 使用数据库
USE checkin_db;

-- 插入初始用户数据
INSERT INTO `user` (`id`, `username`, `password`, `real_name`, `phone`, `email`, `role`, `department`, `team_id`, `created_at`, `updated_at`, `deleted`) VALUES
(1, 'admin', '$2a$10$xyzXYZxyzXYZxyzXYZxyzX.XYZxyzXYZxyzXYZxyzXYZxyzXYZ.', '管理员', '13800000000', 'admin@example.com', '管理员', 'IT部', NULL, NOW(), NOW(), 0),
(2, 'leader', '$2a$10$xyzXYZxyzXYZxyzXYZxyzX.XYZxyzXYZxyzXYZxyzXYZxyzXYZ.', '队长', '13800000001', 'leader@example.com', '队长', '工程部', 1, NOW(), NOW(), 0),
(3, 'member', '$2a$10$xyzXYZxyzXYZxyzXYZxyzX.XYZxyzXYZxyzXYZxyzXYZxyzXYZ.', '队员', '13800000002', 'member@example.com', '队员', '工程部', 1, NOW(), NOW(), 0);

-- 插入初始团队数据
INSERT INTO `team` (`id`, `team_name`, `leader_id`, `leader_name`, `description`, `status`, `created_at`, `updated_at`, `deleted`) VALUES
(1, '第一工程队', 2, '队长', '负责一号项目的施工', 'active', NOW(), NOW(), 0);

-- 插入初始项目数据
INSERT INTO `project` (`id`, `project_name`, `project_code`, `location`, `description`, `status`, `start_date`, `end_date`, `manager_id`, `created_at`, `updated_at`, `deleted`) VALUES
(1, '一号项目', 'PROJ001', '北京市朝阳区', '一号项目的建设', 'active', '2023-01-01 00:00:00', '2023-12-31 23:59:59', 2, NOW(), NOW(), 0);

-- 更新用户表中的团队ID
UPDATE `user` SET `team_id` = 1 WHERE `id` IN (2, 3);