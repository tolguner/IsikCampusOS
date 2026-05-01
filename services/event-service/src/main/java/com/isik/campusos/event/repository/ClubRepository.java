package com.isik.campusos.event.repository;

import com.isik.campusos.event.model.Club;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClubRepository extends JpaRepository<Club, String> {
    List<Club> findByAdminUserId(String adminUserId);
}
