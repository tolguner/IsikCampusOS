package com.isik.campusos.event.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class AcademicStaffSyncResponse {
    private Instant syncedAt;
    private int scannedPageCount;
    private int rawRecordCount;
    private int uniqueRecordCount;
    private long activeRecordCount;
}
