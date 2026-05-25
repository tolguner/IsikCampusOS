package com.isik.campusos.profile.service;

import com.isik.campusos.profile.dto.ProfileChangeRequestDto;
import com.isik.campusos.profile.dto.ProfileChangeReviewDto;
import com.isik.campusos.profile.dto.ProfileDto;
import com.isik.campusos.profile.model.Profile;
import com.isik.campusos.profile.model.ProfileChangeRequest;
import com.isik.campusos.profile.model.ProfileChangeRequestStatus;
import com.isik.campusos.profile.repository.ProfileChangeRequestRepository;
import com.isik.campusos.profile.repository.ProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private static final Set<String> USER_REQUESTABLE_FIELDS = Set.of("phoneNumber", "residenceAddress", "bloodType");

    private final ProfileRepository profileRepository;
    private final ProfileChangeRequestRepository changeRequestRepository;

    public Profile getProfileByUserId(String userId) {
        return profileRepository.findByUserId(userId)
                .orElseGet(() -> profileRepository.save(Profile.builder()
                        .userId(userId)
                        .build()));
    }

    public Profile updateProfile(String userId, ProfileDto updateDto) {
        Profile profile = getProfileByUserId(userId);
        
        if (updateDto.getFirstName() != null) profile.setFirstName(updateDto.getFirstName());
        if (updateDto.getLastName() != null) profile.setLastName(updateDto.getLastName());
        if (updateDto.getDepartment() != null) profile.setDepartment(updateDto.getDepartment());
        if (updateDto.getProfilePictureUrl() != null) profile.setProfilePictureUrl(updateDto.getProfilePictureUrl());
        if (updateDto.getBio() != null) profile.setBio(updateDto.getBio());
        if (updateDto.getSkills() != null) profile.setSkills(updateDto.getSkills());
        
        return profileRepository.save(profile);
    }

    public List<ProfileChangeRequest> getMyChangeRequests(String userId) {
        return changeRequestRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public ProfileChangeRequest requestProfileChange(String userId, ProfileChangeRequestDto requestDto) {
        if (requestDto.getFieldName() == null || !USER_REQUESTABLE_FIELDS.contains(requestDto.getFieldName())) {
            throw new RuntimeException("Bu alan kullanıcı tarafından değişiklik talebine açılamaz.");
        }

        if (requestDto.getRequestedValue() == null || requestDto.getRequestedValue().trim().isEmpty()) {
            throw new RuntimeException("Talep edilen değer boş olamaz.");
        }

        Profile profile = getProfileByUserId(userId);
        String fieldName = requestDto.getFieldName();
        String requestedValue = requestDto.getRequestedValue().trim();

        return changeRequestRepository.save(ProfileChangeRequest.builder()
                .userId(userId)
                .fieldName(fieldName)
                .currentValue(readChangeableField(profile, fieldName))
                .requestedValue(requestedValue)
                .build());
    }

    public List<ProfileChangeRequest> getPendingChangeRequests(String roles) {
        ensureReviewer(roles);
        return changeRequestRepository.findByStatusOrderByCreatedAtDesc(ProfileChangeRequestStatus.PENDING);
    }

    public ProfileChangeRequest approveChangeRequest(String requestId, String reviewerId, String roles) {
        ensureReviewer(roles);
        ProfileChangeRequest request = getPendingRequest(requestId);
        Profile profile = getProfileByUserId(request.getUserId());

        applyChange(profile, request.getFieldName(), request.getRequestedValue());
        profileRepository.save(profile);

        request.setStatus(ProfileChangeRequestStatus.APPROVED);
        request.setReviewedBy(reviewerId);
        request.setReviewedAt(LocalDateTime.now());
        return changeRequestRepository.save(request);
    }

    public ProfileChangeRequest rejectChangeRequest(String requestId, String reviewerId, String roles, ProfileChangeReviewDto reviewDto) {
        ensureReviewer(roles);
        ProfileChangeRequest request = getPendingRequest(requestId);
        request.setStatus(ProfileChangeRequestStatus.REJECTED);
        request.setReviewedBy(reviewerId);
        request.setReviewedAt(LocalDateTime.now());
        request.setFeedback(reviewDto != null ? reviewDto.getFeedback() : null);
        return changeRequestRepository.save(request);
    }

    private ProfileChangeRequest getPendingRequest(String requestId) {
        ProfileChangeRequest request = changeRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Profil değişiklik talebi bulunamadı."));
        if (request.getStatus() != ProfileChangeRequestStatus.PENDING) {
            throw new RuntimeException("Bu talep daha önce incelenmiş.");
        }
        return request;
    }

    private void ensureReviewer(String roles) {
        if (roles == null || (!roles.contains("ROLE_REGISTRAR") && !roles.contains("ROLE_ADMIN"))) {
            throw new RuntimeException("Profil değişiklik taleplerini onaylama yetkiniz yok.");
        }
    }

    private String readChangeableField(Profile profile, String fieldName) {
        return switch (fieldName) {
            case "phoneNumber" -> profile.getPhoneNumber();
            case "residenceAddress" -> profile.getResidenceAddress();
            case "bloodType" -> profile.getBloodType();
            default -> null;
        };
    }

    private void applyChange(Profile profile, String fieldName, String value) {
        switch (fieldName) {
            case "phoneNumber" -> profile.setPhoneNumber(value);
            case "residenceAddress" -> profile.setResidenceAddress(value);
            case "bloodType" -> profile.setBloodType(value);
            default -> throw new RuntimeException("Desteklenmeyen profil alanı.");
        }
    }
}
