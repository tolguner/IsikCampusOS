package com.isik.campusos.event.dto;

import lombok.Data;
import com.isik.campusos.event.model.Event;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class UpdateEventRequest {
    private String title;
    private String description;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String location;
    private Event.EventMode eventMode;
    private String onlinePlatform;
    private String onlineMeetingUrl;
    private String locationName;
    private String locationDetail;
    private Double latitude;
    private Double longitude;
    private String posterImageUrl;
    private boolean hasCapacityLimit;
    private boolean capacityLimited;
    private int capacity;
    private boolean hasWaitlistLimit;
    private int waitlistCapacity;
    private boolean qrCheckInEnabled;
    private boolean certificateEnabled;
    private String certificateTitle;
    private boolean paid;
    private BigDecimal feeAmount;
    private String iban;
    private String paymentInstructions;
    private boolean reminderEnabled;
    private List<Integer> reminderOffsetsMinutes;
}
