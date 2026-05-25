package com.isik.campusos.event.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class AuditLogResponse {
    private String id;
    private String entityType;
    private String entityId;
    private String action;
    private String actorId;
    private String actorRole;
    private String message;
    private String metadata;
    private LocalDateTime createdAt;
}
