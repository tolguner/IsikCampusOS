package com.isik.campusos.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CertificateIssueRequestedEvent {
    private String eventId;
    private String eventTitle;
    private String clubName;
    private String userId;
    private String certificateTitle;
    private String certificateCode;
    private String issuedAt;
    private String eventDate;
    private String eventLocation;
    private String clubPresidentName;
}
