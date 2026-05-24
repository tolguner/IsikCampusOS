package com.isik.campusos.profile.repository;

import com.isik.campusos.profile.model.ProfileChangeRequest;
import com.isik.campusos.profile.model.ProfileChangeRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProfileChangeRequestRepository extends JpaRepository<ProfileChangeRequest, String> {
    List<ProfileChangeRequest> findByUserIdOrderByCreatedAtDesc(String userId);
    List<ProfileChangeRequest> findByStatusOrderByCreatedAtDesc(ProfileChangeRequestStatus status);
}
