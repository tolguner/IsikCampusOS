package com.isik.campusos.auth.controller;

import com.isik.campusos.auth.dto.UserSummaryResponse;
import com.isik.campusos.auth.model.User;
import com.isik.campusos.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Internal API — Diğer mikroservisler tarafından toplu kullanıcı bilgisi almak
 * için kullanılır. Gateway'deki AuthenticationFilter JWT doğrulaması yapar,
 * dolayısıyla bu endpoint'e yalnızca doğrulanmış servis-içi çağrılarla erişilir.
 */
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserLookupController {

    private final UserRepository userRepository;

    /**
     * Toplu kullanıcı bilgisi döner.
     * Body: { "userIds": ["id1", "id2", ...] }
     * Bilinmeyen ID'ler sessizce atlanır.
     */
    @PostMapping("/batch")
    public ResponseEntity<List<UserSummaryResponse>> getUsersByIds(@RequestBody Map<String, List<String>> body) {
        List<String> userIds = body.getOrDefault("userIds", List.of());
        if (userIds.isEmpty()) {
            return ResponseEntity.ok(List.of());
        }

        List<UserSummaryResponse> results = userRepository.findAllById(userIds).stream()
                .map(this::toSummary)
                .collect(Collectors.toList());

        return ResponseEntity.ok(results);
    }

    private UserSummaryResponse toSummary(User user) {
        return UserSummaryResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .studentNumber(user.getStudentNumber())
                .department(user.getDepartment())
                .faculty(user.getFaculty())
                .email(user.getEmail())
                .build();
    }
}
