package com.isik.campusos.event.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ClubHealthResponse {
    private String clubId;
    private String clubName;
    private boolean active;
    private long memberCount;
    private long activeEventCount;
    private long upcomingEventCount;
    private long pendingEventCount;
    private long pendingProfileRequestCount;
    private LocalDateTime lastEventAt;
    private LocalDateTime lastAnnouncementAt;
    private double attendanceAverage;
    private String healthStatus;
    private boolean watchlisted;
    private String latestNote;
    private String latestNoteBy;
    private LocalDateTime latestNoteAt;
}
