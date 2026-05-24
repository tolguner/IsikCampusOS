package com.isik.campusos.event.repository;

import com.isik.campusos.event.model.Club;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClubRepository extends JpaRepository<Club, String> {
    List<Club> findByAdminUserIdAndIsDeletedFalse(String adminUserId);
    List<Club> findAllByIsDeletedFalseOrderByNameAsc();
    List<Club> findByIsActiveTrueAndIsDeletedFalseOrderByNameAsc();
    boolean existsByNameIgnoreCaseAndIsDeletedFalse(String name);
    boolean existsByNameIgnoreCaseAndIsDeletedFalseAndIdNot(String name, String id);
    boolean existsByAdminUserIdAndIsDeletedFalse(String adminUserId);
    boolean existsByAdminUserIdIgnoreCaseAndIsDeletedFalse(String adminUserId);
    boolean existsByAdminUserIdAndIsDeletedFalseAndIdNot(String adminUserId, String id);
    boolean existsByAdvisorAcademicStaffIdAndIsDeletedFalse(String advisorAcademicStaffId);
    boolean existsByAdvisorAcademicStaffIdAndIsDeletedFalseAndIdNot(String advisorAcademicStaffId, String id);
    Optional<Club> findByNameIgnoreCaseAndIsDeletedFalse(String name);
    Optional<Club> findByIdAndIsDeletedFalse(String id);
}
