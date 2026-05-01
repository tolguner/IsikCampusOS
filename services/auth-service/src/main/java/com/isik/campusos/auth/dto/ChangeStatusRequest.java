package com.isik.campusos.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChangeStatusRequest {
    private String newStatus; // ACTIVE, INACTIVE, GRADUATED, EXPELLED
    private String reason;
}
