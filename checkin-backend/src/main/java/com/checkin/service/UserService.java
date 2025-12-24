package com.checkin.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.checkin.entity.User;
import com.checkin.mapper.UserMapper;
import com.checkin.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService extends ServiceImpl<UserMapper, User> {

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    public User findByUsername(String username) {
        return getOne(new QueryWrapper<User>().eq("username", username));
    }

    public String login(String username, String password) {
        User user = findByUsername(username);
        if (user == null || !passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("用户名或密码错误");
        }
        
        return jwtUtil.generateToken(username, user.getId(), user.getRole());
    }

    public User register(User user) {
        if (findByUsername(user.getUsername()) != null) {
            throw new RuntimeException("用户名已存在");
        }
        
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        if (user.getRole() == null) {
            user.setRole("队员");
        }
        
        save(user);
        return user;
    }

    public User getCurrentUser(String token) {
        String username = jwtUtil.getUsernameFromToken(token);
        return findByUsername(username);
    }

    public List<User> getTeamMembers(Long teamId) {
        if (teamId == null) {
            return list(new QueryWrapper<User>().isNull("team_id"));
        }
        return list(new QueryWrapper<User>().eq("team_id", teamId).ne("role", "队长"));
    }
}