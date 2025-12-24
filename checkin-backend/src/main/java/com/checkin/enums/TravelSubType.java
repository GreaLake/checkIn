package com.checkin.enums;

public enum TravelSubType {
    DEPARTURE("departure", "出发打卡"),
    ARRIVAL("arrival", "到达打卡"),
    RETURN("return", "返程打卡"),
    BACK_TO_NING("backToNing", "到宁打卡");

    private final String code;
    private final String description;

    TravelSubType(String code, String description) {
        this.code = code;
        this.description = description;
    }

    public String getCode() {
        return code;
    }

    public String getDescription() {
        return description;
    }

    public static TravelSubType fromCode(String code) {
        for (TravelSubType type : values()) {
            if (type.getCode().equals(code)) {
                return type;
            }
        }
        return null;
    }
}