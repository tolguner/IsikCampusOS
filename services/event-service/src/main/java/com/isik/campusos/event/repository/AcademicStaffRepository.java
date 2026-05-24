package com.isik.campusos.event.repository;

import com.isik.campusos.event.model.AcademicStaff;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AcademicStaffRepository extends JpaRepository<AcademicStaff, String> {
    Optional<AcademicStaff> findByEmailIgnoreCase(String email);
    Optional<AcademicStaff> findByProfileUrl(String profileUrl);

    List<AcademicStaff> findByActiveTrueOrderByFullNameAsc(Pageable pageable);

    @Query("""
            select staff from AcademicStaff staff
            where staff.active = true
              and (
                lower(staff.fullName) like lower(concat('%', :query, '%'))
                or lower(coalesce(staff.academicTitle, '')) like lower(concat('%', :query, '%'))
                or lower(coalesce(staff.email, '')) like lower(concat('%', :query, '%'))
                or lower(coalesce(staff.department, '')) like lower(concat('%', :query, '%'))
                or lower(coalesce(staff.facultyOrUnit, '')) like lower(concat('%', :query, '%'))
              )
            order by staff.fullName asc
            """)
    List<AcademicStaff> searchActive(@Param("query") String query, Pageable pageable);

    long countByActiveTrue();

    @Modifying
    @Query("update AcademicStaff staff set staff.active = false")
    void markAllInactive();
}
