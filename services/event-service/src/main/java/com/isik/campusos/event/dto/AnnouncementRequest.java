package com.isik.campusos.event.dto;

import lombok.Data;

@Data
public class AnnouncementRequest {
    private String title;
    private String message;
    private String linkUrl;
    private String linkLabel;
    private String imageUrl;
    private String createdByName;
    private String targetAudience;
}
