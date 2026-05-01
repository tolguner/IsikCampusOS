package com.isik.campusos.profile.service;

import com.isik.campusos.profile.dto.ProfileDto;
import com.isik.campusos.profile.model.Profile;
import com.isik.campusos.profile.repository.ProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final ProfileRepository profileRepository;

    public Profile getProfileByUserId(String userId) {
        return profileRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Profile not found for userId: " + userId));
    }

    public Profile updateProfile(String userId, ProfileDto updateDto) {
        Profile profile = getProfileByUserId(userId);
        
        if (updateDto.getFirstName() != null) profile.setFirstName(updateDto.getFirstName());
        if (updateDto.getLastName() != null) profile.setLastName(updateDto.getLastName());
        if (updateDto.getDepartment() != null) profile.setDepartment(updateDto.getDepartment());
        if (updateDto.getBio() != null) profile.setBio(updateDto.getBio());
        if (updateDto.getSkills() != null) profile.setSkills(updateDto.getSkills());
        
        return profileRepository.save(profile);
    }
}
