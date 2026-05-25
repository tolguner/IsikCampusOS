package com.isik.campusos.event.repository;

import com.isik.campusos.event.model.ClubHealthRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ClubHealthRecordRepository extends JpaRepository<ClubHealthRecord, String> {
    Optional<ClubHealthRecord> findByClubId(String clubId);
}
