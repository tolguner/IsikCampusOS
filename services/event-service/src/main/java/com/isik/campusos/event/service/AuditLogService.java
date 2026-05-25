package com.isik.campusos.event.service;

import com.isik.campusos.event.dto.AuditLogResponse;
import com.isik.campusos.event.model.AuditLog;
import com.isik.campusos.event.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public void record(AuditLog.EntityType entityType,
                       String entityId,
                       String action,
                       String actorId,
                       String actorRole,
                       String message) {
        auditLogRepository.save(AuditLog.builder()
                .entityType(entityType)
                .entityId(entityId)
                .action(action)
                .actorId(actorId)
                .actorRole(actorRole)
                .message(message)
                .build());
    }

    public List<AuditLogResponse> list(AuditLog.EntityType entityType,
                                       String entityId,
                                       String action,
                                       String actorId,
                                       LocalDate from,
                                       LocalDate to,
                                       String search) {
        String normalizedSearch = normalize(search);
        return auditLogRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(entityType, entityId)
                .stream()
                .filter(log -> action == null || action.isBlank() || action.equalsIgnoreCase(log.getAction()))
                .filter(log -> actorId == null || actorId.isBlank() || actorId.equalsIgnoreCase(log.getActorId()))
                .filter(log -> from == null || !log.getCreatedAt().toLocalDate().isBefore(from))
                .filter(log -> to == null || !log.getCreatedAt().toLocalDate().isAfter(to))
                .filter(log -> normalizedSearch == null
                        || normalize(log.getMessage()).contains(normalizedSearch)
                        || normalize(log.getAction()).contains(normalizedSearch)
                        || normalize(log.getActorId()).contains(normalizedSearch))
                .map(this::toResponse)
                .toList();
    }

    private AuditLogResponse toResponse(AuditLog log) {
        return AuditLogResponse.builder()
                .id(log.getId())
                .entityType(log.getEntityType().name())
                .entityId(log.getEntityId())
                .action(log.getAction())
                .actorId(log.getActorId())
                .actorRole(log.getActorRole())
                .message(log.getMessage())
                .metadata(log.getMetadata())
                .createdAt(log.getCreatedAt())
                .build();
    }

    private String normalize(String value) {
        return value == null || value.isBlank()
                ? null
                : value.toLowerCase(java.util.Locale.forLanguageTag("tr-TR")).trim();
    }
}
