package com.checkin.enums;

public enum CheckInStatus {
    CHECKED_IN("checked_in", "已签到"),
    CHECKED_OUT("checked_out", "已签退");

    private final String code;
    private final String description;

    CheckInStatus(String code, String description) {
        this.code = code;
        this.description = description;
    }

    public String getCode() {
        return code;
    }

    public String getDescription() {
        return description;
    }

    public static CheckInStatus fromCode(String code) {
        for (CheckInStatus status : values()) {
            if (status.getCode().equals(code)) {
                return status;
            }
        }
        return CHECKED_IN;
    }
}