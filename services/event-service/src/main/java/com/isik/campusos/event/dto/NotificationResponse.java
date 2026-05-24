package com.isik.campusos.event.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class NotificationResponse {
    private String id;
    private String title;
    private String message;
    private String linkUrl;
    private String linkLabel;
    private String imageUrl;
    private String type;
    private String targetAudience;
    private String relatedEventId;
    private String createdBy;
    private String createdByName;
    private boolean read;
    private LocalDateTime createdAt;
}
