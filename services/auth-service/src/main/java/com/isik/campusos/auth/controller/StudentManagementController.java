package com.isik.campusos.auth.controller;

import com.isik.campusos.auth.dto.*;
import com.isik.campusos.auth.service.StudentManagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/students")
@RequiredArgsConstructor
public class StudentManagementController {

    private final StudentManagementService studentService;

    /**
     * Yeni öğrenci ekle — ROLE_REGISTRAR yetkisi gerekli.
     */
    @PostMapping
    public ResponseEntity<StudentResponse> createStudent(@RequestBody CreateStudentRequest request) {
        return ResponseEntity.ok(studentService.createStudent(request));
    }

    /**
     * Öğrenci listesi — sayfalı, filtrelenebilir.
     */
    @GetMapping
    public ResponseEntity<Page<StudentResponse>> listStudents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String faculty) {
        return ResponseEntity.ok(studentService.listStudents(page, size, search, status, faculty));
    }

    /**
     * Tekil öğrenci detayı.
     */
    @GetMapping("/{id}")
    public ResponseEntity<StudentResponse> getStudent(@PathVariable String id) {
        return ResponseEntity.ok(studentService.getStudent(id));
    }

    /**
     * Öğrenci bilgilerini güncelle.
     */
    @PutMapping("/{id}")
    public ResponseEntity<StudentResponse> updateStudent(
            @PathVariable String id,
            @RequestBody UpdateStudentRequest request) {
        return ResponseEntity.ok(studentService.updateStudent(id, request));
    }

    /**
     * Öğrenci durumunu değiştir (ACTIVE, INACTIVE, GRADUATED, EXPELLED).
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<StudentResponse> changeStatus(
            @PathVariable String id,
            @RequestBody ChangeStatusRequest request) {
        return ResponseEntity.ok(studentService.changeStatus(id, request));
    }

    /**
     * Öğrenci şifresini sıfırla (TC Kimlik No'ya geri döndür).
     */
    @PostMapping("/{id}/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        studentService.resetPassword(id, body.get("tcKimlikNo"));
        return ResponseEntity.ok(Map.of("message", "Öğrenci şifresi başarıyla sıfırlandı."));
    }
}
