package com.isik.campusos.auth.service;

import com.isik.campusos.auth.dto.CertificateVerificationResponse;
import com.isik.campusos.auth.model.CertificateDeliveryLog;
import com.isik.campusos.auth.repository.CertificateDeliveryLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CertificateVerificationService {

    private final CertificateDeliveryLogRepository deliveryLogRepository;

    public CertificateVerificationResponse verify(String certificateCode) {
        String normalizedCode = certificateCode == null ? "" : certificateCode.trim();
        return deliveryLogRepository.findByCertificateCode(normalizedCode)
                .filter(log -> log.getStatus() == CertificateDeliveryLog.DeliveryStatus.SENT)
                .map(log -> CertificateVerificationResponse.builder()
                        .valid(true)
                        .certificateCode(log.getCertificateCode())
                        .recipientName(log.getRecipientName())
                        .eventTitle(log.getEventTitle())
                        .clubName(log.getClubName())
                        .certificateTitle(log.getCertificateTitle())
                        .issuedAt(log.getIssuedAt())
                        .sentAt(log.getSentAt())
                        .build())
                .orElseGet(() -> CertificateVerificationResponse.builder()
                        .valid(false)
                        .certificateCode(normalizedCode)
                        .build());
    }
}
