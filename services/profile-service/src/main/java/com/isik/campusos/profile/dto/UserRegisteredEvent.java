package com.isik.campusos.profile.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class UserRegisteredEvent {
    private String userId;
    private String email;
    private String firstName;
    private String lastName;
    private String studentNumber;
}

