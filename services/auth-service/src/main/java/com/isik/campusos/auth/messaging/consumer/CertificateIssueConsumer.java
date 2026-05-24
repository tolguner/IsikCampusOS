package com.isik.campusos.auth.messaging.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.isik.campusos.auth.dto.CertificateIssueRequestedEvent;
import com.isik.campusos.auth.model.CertificateDeliveryLog;
import com.isik.campusos.auth.model.User;
import com.isik.campusos.auth.repository.CertificateDeliveryLogRepository;
import com.isik.campusos.auth.repository.UserRepository;
import com.isik.campusos.auth.service.CertificatePdfService;
import com.isik.campusos.auth.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class CertificateIssueConsumer {

    private final ObjectMapper objectMapper;
    private final UserRepository userRepository;
    private final CertificateDeliveryLogRepository deliveryLogRepository;
    private final CertificatePdfService certificatePdfService;
    private final EmailService emailService;

    @KafkaListener(topics = "event.certificate.issue-requested", groupId = "auth-service-certificate-mailer")
    public void consumeCertificateIssueRequested(String message) {
        log.info("Received event.certificate.issue-requested: {}", message);
        CertificateIssueRequestedEvent event = parse(message);

        Optional<CertificateDeliveryLog> existingDelivery = deliveryLogRepository.findByCertificateCode(event.getCertificateCode());
        if (existingDelivery
                .filter(delivery -> delivery.getStatus() == CertificateDeliveryLog.DeliveryStatus.SENT)
                .isPresent()) {
            log.info("Certificate already sent. Skipping duplicate message. Certificate code: {}", event.getCertificateCode());
            return;
        }

        String email = event.getUserId() == null ? "unknown" : event.getUserId();
        try {
            User user = userRepository.findById(event.getUserId())
                    .orElseThrow(() -> new IllegalArgumentException("User not found: " + event.getUserId()));
            email = user.getEmail();

            byte[] pdf = certificatePdfService.generateCertificate(user, event);
            emailService.sendCertificateEmail(
                    user.getEmail(),
                    user.getFullName(),
                    event.getEventTitle(),
                    pdf,
                    certificateFilename(event)
            );

            saveDeliveryLog(event, user.getEmail(), CertificateDeliveryLog.DeliveryStatus.SENT, null, LocalDateTime.now());
        } catch (Exception e) {
            saveDeliveryLog(
                    event,
                    email,
                    CertificateDeliveryLog.DeliveryStatus.FAILED,
                    e.getMessage(),
                    null
            );
            log.error("Certificate delivery failed. Certificate code: {}", event.getCertificateCode(), e);
            throw new RuntimeException("Certificate delivery failed", e);
        }
    }

    private CertificateIssueRequestedEvent parse(String message) {
        try {
            CertificateIssueRequestedEvent event = objectMapper.readValue(message, CertificateIssueRequestedEvent.class);
            if (isBlank(event.getCertificateCode()) || isBlank(event.getUserId()) || isBlank(event.getEventId())) {
                throw new IllegalArgumentException("Certificate event must include certificateCode, userId and eventId");
            }
            return event;
        } catch (Exception e) {
            log.error("Certificate event could not be parsed: {}", message, e);
            throw new RuntimeException("Certificate event could not be parsed", e);
        }
    }

    private void saveDeliveryLog(CertificateIssueRequestedEvent event,
                                 String email,
                                 CertificateDeliveryLog.DeliveryStatus status,
                                 String errorMessage,
                                 LocalDateTime sentAt) {
        CertificateDeliveryLog log = deliveryLogRepository.findByCertificateCode(event.getCertificateCode())
                .orElseGet(() -> CertificateDeliveryLog.builder()
                        .certificateCode(event.getCertificateCode())
                        .userId(event.getUserId())
                        .eventId(event.getEventId())
                        .build());
        log.setUserId(event.getUserId());
        log.setEmail(email);
        log.setEventId(event.getEventId());
        log.setRecipientName(resolveRecipientName(event, email));
        log.setEventTitle(event.getEventTitle());
        log.setClubName(event.getClubName());
        log.setCertificateTitle(event.getCertificateTitle());
        log.setIssuedAt(parseIssuedAt(event.getIssuedAt()));
        log.setStatus(status);
        log.setErrorMessage(trim(errorMessage));
        log.setSentAt(sentAt);
        deliveryLogRepository.save(log);
    }

    private String resolveRecipientName(CertificateIssueRequestedEvent event, String email) {
        return userRepository.findById(event.getUserId())
                .map(User::getFullName)
                .orElse(email);
    }

    private LocalDateTime parseIssuedAt(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return LocalDateTime.parse(value);
        } catch (Exception ignored) {
            return null;
        }
    }

    private String certificateFilename(CertificateIssueRequestedEvent event) {
        String code = event.getCertificateCode().replaceAll("[^A-Za-z0-9_-]", "_");
        return "isikcampusos-sertifika-" + code + ".pdf";
    }

    private String trim(String value) {
        if (value == null) {
            return null;
        }
        return value.length() <= 2000 ? value : value.substring(0, 2000);
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
