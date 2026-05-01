package com.isik.campusos.profile.messaging.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.isik.campusos.profile.dto.UserRegisteredEvent;
import com.isik.campusos.profile.model.Profile;
import com.isik.campusos.profile.repository.ProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserEventConsumer {

    private final ProfileRepository profileRepository;
    private final ObjectMapper objectMapper;

    @KafkaListener(topics = "user.registered", groupId = "profile-service-group")
    public void consumeUserRegisteredEvent(String message) {
        log.info("Received user.registered event: {}", message);
        try {
            UserRegisteredEvent event = objectMapper.readValue(message, UserRegisteredEvent.class);

            // Idempotency — aynı kullanıcı için iki kez profil oluşturma
            if (profileRepository.findByUserId(event.getUserId()).isEmpty()) {
                Profile profile = Profile.builder()
                        .userId(event.getUserId())
                        .email(event.getEmail())
                        .firstName(event.getFirstName())
                        .lastName(event.getLastName())
                        .build();
                profileRepository.save(profile);
                log.info("Created profile for userId: {} ({} {})",
                        event.getUserId(), event.getFirstName(), event.getLastName());
            } else {
                log.info("Profile already exists for userId: {}, skipping.", event.getUserId());
            }
        } catch (Exception e) {
            log.error("Error processing user.registered event: {}", message, e);
        }
    }
}

