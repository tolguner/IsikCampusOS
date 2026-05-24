package com.isik.campusos.event.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ClubAnnouncementResponse {
    private String id;
    private String clubId;
    private String clubName;
    private String title;
    private String message;
    private String linkUrl;
    private String linkLabel;
    private String imageUrl;
    private String createdByUserId;
    private LocalDateTime createdAt;
}
