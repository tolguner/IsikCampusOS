package com.isik.campusos.auth.repository;

import com.isik.campusos.auth.model.User;
import com.isik.campusos.auth.model.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String>, JpaSpecificationExecutor<User> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByStudentNumber(String studentNumber);
    Optional<User> findByStudentNumber(String studentNumber);

    @Query("SELECT u FROM User u WHERE u.roles LIKE '%ROLE_STUDENT%' " +
           "AND (:search IS NULL OR LOWER(u.firstName) LIKE LOWER(CONCAT('%',:search,'%')) " +
           "OR LOWER(u.lastName) LIKE LOWER(CONCAT('%',:search,'%')) " +
           "OR LOWER(u.studentNumber) LIKE LOWER(CONCAT('%',:search,'%')) " +
           "OR LOWER(u.email) LIKE LOWER(CONCAT('%',:search,'%'))) " +
           "AND (:status IS NULL OR u.status = :status) " +
           "AND (:faculty IS NULL OR u.faculty = :faculty) " +
           "ORDER BY u.createdAt DESC")
    Page<User> findStudents(
            @Param("search") String search,
            @Param("status") UserStatus status,
            @Param("faculty") String faculty,
            Pageable pageable
    );
}
