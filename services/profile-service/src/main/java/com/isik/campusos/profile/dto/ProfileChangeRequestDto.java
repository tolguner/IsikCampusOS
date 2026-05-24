package com.isik.campusos.profile.dto;

import lombok.Data;

@Data
public class ProfileChangeRequestDto {
    private String fieldName;
    private String requestedValue;
}
