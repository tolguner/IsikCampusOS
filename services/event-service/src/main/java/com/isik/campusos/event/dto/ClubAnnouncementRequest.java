package com.isik.campusos.event.dto;

import lombok.Data;

@Data
public class ClubAnnouncementRequest {
    private String title;
    private String message;
    private String linkUrl;
    private String linkLabel;
    private String imageUrl;
}
