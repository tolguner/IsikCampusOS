package com.isik.campusos.event.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class CreateEventRequest {
    private String clubId;
    private String title;
    private String description;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String location;
    
    private boolean hasCapacityLimit;
    private int capacity;
    
    private boolean hasWaitlistLimit;
    private int waitlistCapacity;
}
