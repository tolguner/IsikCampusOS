package com.isik.campusos.auth.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class CertificateVerificationResponse {
    private boolean valid;
    private String certificateCode;
    private String recipientName;
    private String eventTitle;
    private String clubName;
    private String certificateTitle;
    private LocalDateTime issuedAt;
    private LocalDateTime sentAt;
}
