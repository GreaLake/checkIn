package com.checkin.enums;

public enum CheckInType {
    CONSTRUCTION("construction", "施工打卡"),
    TRAVEL("travel", "在途打卡"),
    STOP("stop", "停工打卡");

    private final String code;
    private final String description;

    CheckInType(String code, String description) {
        this.code = code;
        this.description = description;
    }

    public String getCode() {
        return code;
    }

    public String getDescription() {
        return description;
    }

    public static CheckInType fromCode(String code) {
        for (CheckInType type : values()) {
            if (type.getCode().equals(code)) {
                return type;
            }
        }
        return CONSTRUCTION; // 默认返回施工打卡
    }
}