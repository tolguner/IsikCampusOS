package com.isik.campusos.event.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class CertificateIssueResponse {
    private String eventId;
    private int eligibleParticipantCount;
    private int issuedCertificateCount;
}
