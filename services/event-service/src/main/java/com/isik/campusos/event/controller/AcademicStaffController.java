package com.isik.campusos.event.controller;

import com.isik.campusos.event.dto.AcademicStaffAdvisorResponse;
import com.isik.campusos.event.dto.AcademicStaffSyncResponse;
import com.isik.campusos.event.service.AcademicStaffService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/academic-staff")
@RequiredArgsConstructor
public class AcademicStaffController {
    private final AcademicStaffService academicStaffService;

    /**
     * Akademik kadro arama — giriş yapmış tüm kullanıcılar erişebilir.
     * Salt okunur veri olduğu için ek rol kısıtlaması gerekmez;
     * SecurityConfig zaten tüm isteklerin authenticated olmasını zorunlu kılar.
     */
    @GetMapping("/advisors")
    public ResponseEntity<List<AcademicStaffAdvisorResponse>> searchAdvisors(
            @RequestParam(required = false, defaultValue = "") String query,
            @RequestParam(required = false, defaultValue = "12") int limit) {
        return ResponseEntity.ok(academicStaffService.searchAdvisors(query, limit));
    }

    /**
     * Akademik kadro senkronizasyonu — yalnızca SKS yöneticileri çalıştırabilir.
     */
    @PostMapping("/sync")
    @PreAuthorize("hasAnyAuthority('ROLE_SKS_ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<AcademicStaffSyncResponse> syncAcademicStaff() {
        return ResponseEntity.ok(academicStaffService.refreshFromOfficialSite());
    }
}
