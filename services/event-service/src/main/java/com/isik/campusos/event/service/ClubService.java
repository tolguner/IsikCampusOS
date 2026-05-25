package com.isik.campusos.event.service;

import com.isik.campusos.event.dto.AssignClubPresidentRequest;
import com.isik.campusos.event.dto.ClubAnnouncementRequest;
import com.isik.campusos.event.dto.ClubProfileChangeRequestResponse;
import com.isik.campusos.event.dto.ClubResponse;
import com.isik.campusos.event.dto.ClubStatusRequest;
import com.isik.campusos.event.dto.CreateClubRequest;
import com.isik.campusos.event.dto.EventFeedbackRequest;
import com.isik.campusos.event.dto.UpdateClubProfileRequest;
import com.isik.campusos.event.model.AcademicStaff;
import com.isik.campusos.event.model.AuditLog;
import com.isik.campusos.event.model.Club;
import com.isik.campusos.event.model.ClubMember;
import com.isik.campusos.event.model.ClubProfileChangeRequest;
import com.isik.campusos.event.model.Notification;
import com.isik.campusos.event.repository.ClubMemberRepository;
import com.isik.campusos.event.repository.ClubProfileChangeRequestRepository;
import com.isik.campusos.event.repository.ClubRepository;
import com.isik.campusos.event.repository.EventRepository;
import com.isik.campusos.event.repository.ClubAnnouncementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ClubService {
    private static final int SHORT_DESCRIPTION_MIN_LENGTH = 20;
    private static final int SHORT_DESCRIPTION_MAX_LENGTH = 180;
    private static final int VISION_MIN_LENGTH = 80;
    private static final int VISION_MAX_LENGTH = 3000;
    private static final List<ClubMember.MemberStatus> ACTIVE_LIKE_MEMBER_STATUSES = List.of(
            ClubMember.MemberStatus.ACTIVE,
            ClubMember.MemberStatus.PENDING);

    private final ClubRepository clubRepository;
    private final ClubMemberRepository clubMemberRepository;
    private final ClubProfileChangeRequestRepository clubProfileChangeRequestRepository;
    private final EventRepository eventRepository;
    private final ClubAnnouncementRepository clubAnnouncementRepository;
    private final NotificationService notificationService;
    private final AcademicStaffService academicStaffService;
    private final AuditLogService auditLogService;

    public List<ClubResponse> listActiveClubs(String userId) {
        return clubRepository.findByIsActiveTrueAndIsDeletedFalseOrderByNameAsc().stream()
                .map(club -> toResponse(club, userId))
                .toList();
    }

    public List<ClubResponse> listAllClubs(String userId) {
        return clubRepository.findAllByIsDeletedFalseOrderByNameAsc().stream()
                .map(club -> toResponse(club, userId))
                .toList();
    }

    public List<ClubResponse> listManagedClubs(String userId) {
        return clubRepository.findByAdminUserIdAndIsDeletedFalse(userId).stream()
                .map(club -> toResponse(club, userId))
                .toList();
    }

    public ClubResponse getClub(String userId, String clubId) {
        Club club = clubRepository.findByIdAndIsDeletedFalse(clubId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Club not found"));
        if (!club.isActive() && !isClubAdmin(club, userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Club is not active");
        }
        return toResponse(club, userId);
    }

    public ClubResponse getClubForAdminOrManager(String userId, String roles, String clubId) {
        Club club = clubRepository.findByIdAndIsDeletedFalse(clubId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Club not found"));
        if (!club.isActive() && !isClubAdmin(club, userId) && !isSystemAdmin(roles)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Club is not active");
        }
        return toResponse(club, userId);
    }

    @Transactional
    public ClubResponse createClub(CreateClubRequest request) {
        AdvisorSnapshot advisor = resolveAdvisor(
                request.getAdvisorAcademicStaffId(),
                request.getAdvisorTitle(),
                request.getAdvisorFullName(),
                request.getAdvisorEmail(),
                request.getAdvisorDepartment());

        validateProfileFields(
                request.getName(),
                request.getShortDescription(),
                resolveVision(request.getVision(), request.getDescription()),
                advisor.fullName(),
                advisor.email(),
                advisor.department());
        if (request.getAdminUserId() == null || request.getAdminUserId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Club president student id is required");
        }
        if (request.getPresidentFullName() == null || request.getPresidentFullName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Club president full name is required");
        }
        if (request.getPresidentEmail() == null || request.getPresidentEmail().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Club president email is required");
        }
        if (clubRepository.existsByNameIgnoreCaseAndIsDeletedFalse(request.getName())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A club with this name already exists");
        }
        validatePresidentAvailable(request.getAdminUserId(), null);
        validateAdvisorAvailable(advisor.academicStaffId(), null);

        String vision = resolveVision(request.getVision(), request.getDescription()).trim();

        Club club = clubRepository.save(Club.builder()
                .name(request.getName().trim())
                .shortDescription(request.getShortDescription().trim())
                .description(vision)
                .adminUserId(request.getAdminUserId().trim())
                .presidentFullName(request.getPresidentFullName().trim())
                .presidentEmail(request.getPresidentEmail().trim())
                .logoUrl(request.getLogoUrl() != null ? request.getLogoUrl().trim() : null)
                .advisorAcademicStaffId(advisor.academicStaffId())
                .advisorTitle(advisor.title())
                .advisorFullName(advisor.fullName())
                .advisorEmail(advisor.email())
                .advisorDepartment(advisor.department())
                .isActive(true)
                .requiresApproval(false)
                .isDeleted(false)
                .build());

        ClubMember adminMembership = ClubMember.builder()
                .clubId(club.getId())
                .userId(club.getAdminUserId())
                .role(ClubMember.MemberRole.ADMIN)
                .status(ClubMember.MemberStatus.ACTIVE)
                .build();
        clubMemberRepository.save(adminMembership);
        auditLogService.record(AuditLog.EntityType.CLUB, club.getId(), "CLUB_CREATED", club.getAdminUserId(), "SKS",
                club.getName() + " kulübü oluşturuldu.");

        return toResponse(club, club.getAdminUserId());
    }

    @Transactional
    public ClubResponse updateClubProfile(String clubId, UpdateClubProfileRequest request, String currentUserId) {
        Club club = clubRepository.findByIdAndIsDeletedFalse(clubId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Club not found"));

        AdvisorSnapshot advisor = resolveAdvisor(
                request.getAdvisorAcademicStaffId(),
                request.getAdvisorTitle(),
                request.getAdvisorFullName(),
                request.getAdvisorEmail(),
                request.getAdvisorDepartment());

        validateProfileFields(
                request.getName(),
                request.getShortDescription(),
                resolveVision(request.getVision(), request.getDescription()),
                advisor.fullName(),
                advisor.email(),
                advisor.department());
        if (clubRepository.existsByNameIgnoreCaseAndIsDeletedFalseAndIdNot(request.getName(), clubId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A club with this name already exists");
        }
        validateAdvisorAvailable(advisor.academicStaffId(), clubId);
        if (request.getAdminUserId() != null && !request.getAdminUserId().isBlank()) {
            validatePresidentFields(request.getAdminUserId(), request.getPresidentFullName(),
                    request.getPresidentEmail());
            validatePresidentAvailable(request.getAdminUserId(), clubId);
        }

        String vision = resolveVision(request.getVision(), request.getDescription()).trim();

        club.setName(request.getName().trim());
        club.setShortDescription(request.getShortDescription().trim());
        club.setDescription(vision);
        club.setLogoUrl(request.getLogoUrl() != null ? request.getLogoUrl().trim() : null);
        club.setRequiresApproval(false);
        club.setAdvisorAcademicStaffId(advisor.academicStaffId());
        club.setAdvisorTitle(advisor.title());
        club.setAdvisorFullName(advisor.fullName());
        club.setAdvisorEmail(advisor.email());
        club.setAdvisorDepartment(advisor.department());
        if (request.getAdminUserId() != null && !request.getAdminUserId().isBlank()) {
            updatePresident(club, request.getAdminUserId(), request.getPresidentFullName(),
                    request.getPresidentEmail());
        }

        return toResponse(clubRepository.save(club), currentUserId);
    }

    @Transactional
    public ClubResponse changeClubStatus(String clubId, ClubStatusRequest request, String currentUserId) {
        Club club = clubRepository.findByIdAndIsDeletedFalse(clubId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Club not found"));

        club.setActive(request.isActive());
        Club saved = clubRepository.save(club);
        auditLogService.record(AuditLog.EntityType.CLUB, clubId,
                request.isActive() ? "CLUB_ACTIVATED" : "CLUB_DEACTIVATED",
                currentUserId, "SKS",
                saved.getName() + " kulübü " + (request.isActive() ? "aktif" : "pasif") + " duruma alındı.");
        return toResponse(saved, currentUserId);
    }

    @Transactional
    public ClubResponse assignPresident(String clubId, AssignClubPresidentRequest request, String currentUserId) {
        Club club = clubRepository.findByIdAndIsDeletedFalse(clubId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Club not found"));

        validatePresidentFields(request.getStudentId(), request.getFullName(), request.getEmail());
        String newPresidentId = request.getStudentId().trim();
        validatePresidentAvailable(newPresidentId, clubId);
        updatePresident(club, newPresidentId, request.getFullName(), request.getEmail());

        Club saved = clubRepository.save(club);
        auditLogService.record(AuditLog.EntityType.CLUB, clubId, "PRESIDENT_ASSIGNED", currentUserId, "SKS",
                saved.getName() + " kulübü başkanı güncellendi.");
        return toResponse(saved, currentUserId);
    }

    @Transactional
    public ClubMember joinClub(String userId, String clubId) {
        Club club = clubRepository.findByIdAndIsDeletedFalse(clubId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Club not found"));
        if (!club.isActive()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Inactive clubs cannot accept new members");
        }

        ClubMember existingMembership = clubMemberRepository.findByClubIdAndUserId(clubId, userId).orElse(null);
        if (existingMembership != null) {
            if (existingMembership.getStatus() != ClubMember.MemberStatus.ACTIVE
                    && existingMembership.getRole() != ClubMember.MemberRole.ADMIN) {
                existingMembership.setStatus(ClubMember.MemberStatus.ACTIVE);
                return clubMemberRepository.save(existingMembership);
            }
            throw new ResponseStatusException(HttpStatus.CONFLICT, "User is already a member of this club");
        }

        ClubMember membership = ClubMember.builder()
                .clubId(clubId)
                .userId(userId)
                .role(ClubMember.MemberRole.MEMBER)
                .status(ClubMember.MemberStatus.ACTIVE)
                .build();

        return clubMemberRepository.save(membership);
    }

    @Transactional
    public void leaveClub(String userId, String clubId) {
        ClubMember membership = clubMemberRepository.findByClubIdAndUserId(clubId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Club membership not found"));

        if (membership.getRole() == ClubMember.MemberRole.ADMIN) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Club admin cannot leave the club before assigning another admin");
        }

        clubMemberRepository.delete(membership);
    }

    @Transactional
    public ClubProfileChangeRequestResponse requestProfileUpdate(String userId, String clubId,
            UpdateClubProfileRequest request) {
        Club club = clubRepository.findByIdAndIsDeletedFalse(clubId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Club not found"));

        if (!userId.trim().equalsIgnoreCase(club.getAdminUserId().trim())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only club president can request profile update");
        }

        validateClubProfileContentFields(
                request.getName(),
                request.getShortDescription(),
                resolveVision(request.getVision(), request.getDescription()));

        clubProfileChangeRequestRepository.findFirstByClub_IdAndStatusOrderByCreatedAtDesc(
                clubId,
                ClubProfileChangeRequest.ChangeStatus.PENDING).ifPresent(existing -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT,
                            "This club already has a pending profile update request");
                });

        ClubProfileChangeRequest changeRequest = clubProfileChangeRequestRepository.save(
                ClubProfileChangeRequest.builder()
                        .club(club)
                        .requestedBy(userId)
                        .name(request.getName().trim())
                        .shortDescription(request.getShortDescription().trim())
                        .vision(resolveVision(request.getVision(), request.getDescription()).trim())
                        .logoUrl(request.getLogoUrl() != null ? request.getLogoUrl().trim() : null)
                        .status(ClubProfileChangeRequest.ChangeStatus.PENDING)
                        .build());
        auditLogService.record(AuditLog.EntityType.CLUB, clubId, "PROFILE_UPDATE_REQUESTED", userId, "CLUB_ADMIN",
                club.getName() + " kulübü için profil güncelleme talebi oluşturuldu.");

        String message = String.format("""
                %s kulübü için profil güncelleme talebi oluşturuldu.

                Yeni ad: %s
                Kısa açıklama: %s
                Vizyon: %s
                Logo: %s
                """,
                club.getName(),
                request.getName(),
                request.getShortDescription(),
                resolveVision(request.getVision(), request.getDescription()),
                request.getLogoUrl() == null || request.getLogoUrl().isBlank() ? "Değişiklik yok / boş"
                        : request.getLogoUrl());

        notificationService.notifySksProfileApprovalRequest(
                "Kulüp profil güncelleme talebi",
                message.trim(),
                userId,
                club.getName());

        return toProfileChangeResponse(changeRequest, userId);
    }

    public List<ClubProfileChangeRequestResponse> getProfileChangeQueue(String currentUserId) {
        return clubProfileChangeRequestRepository.findByStatusInOrderByCreatedAtDesc(List.of(
                ClubProfileChangeRequest.ChangeStatus.PENDING,
                ClubProfileChangeRequest.ChangeStatus.REVISION_REQUESTED)).stream()
                .map(request -> toProfileChangeResponse(request, currentUserId))
                .toList();
    }

    @Transactional
    public ClubProfileChangeRequestResponse approveProfileChange(String changeRequestId, String reviewedBy) {
        ClubProfileChangeRequest request = clubProfileChangeRequestRepository.findById(changeRequestId)
                .orElseThrow(
                        () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Profile change request not found"));
        if (request.getStatus() != ClubProfileChangeRequest.ChangeStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Profile change request is not pending");
        }

        Club club = request.getClub();
        if (clubRepository.existsByNameIgnoreCaseAndIsDeletedFalseAndIdNot(request.getName(), club.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A club with this name already exists");
        }

        club.setName(request.getName().trim());
        club.setShortDescription(request.getShortDescription().trim());
        club.setDescription(request.getVision().trim());
        club.setLogoUrl(request.getLogoUrl() != null ? request.getLogoUrl().trim() : null);
        clubRepository.save(club);

        request.setStatus(ClubProfileChangeRequest.ChangeStatus.APPROVED);
        request.setReviewedBy(reviewedBy);
        request.setReviewedAt(java.time.LocalDateTime.now());
        ClubProfileChangeRequest saved = clubProfileChangeRequestRepository.save(request);
        auditLogService.record(AuditLog.EntityType.CLUB, club.getId(), "PROFILE_UPDATE_APPROVED", reviewedBy, "SKS",
                club.getName() + " kulübü profil güncellemesi onaylandı.");

        notificationService.notifyUserWithType(
                club.getAdminUserId(),
                "Kulüp profil talebi onaylandı",
                club.getName() + " kulübü profil güncellemesi SKS tarafından onaylandı.",
                club.getId(),
                Notification.NotificationType.PROFILE_APPROVAL_REQUEST);

        return toProfileChangeResponse(saved, reviewedBy);
    }

    @Transactional
    public ClubProfileChangeRequestResponse requestProfileChangeRevision(
            String changeRequestId,
            String reviewedBy,
            EventFeedbackRequest feedbackRequest) {
        return reviewProfileChange(changeRequestId, reviewedBy, feedbackRequest,
                ClubProfileChangeRequest.ChangeStatus.REVISION_REQUESTED,
                "Kulüp profil talebi için düzenleme istendi");
    }

    @Transactional
    public ClubProfileChangeRequestResponse rejectProfileChange(
            String changeRequestId,
            String reviewedBy,
            EventFeedbackRequest feedbackRequest) {
        return reviewProfileChange(changeRequestId, reviewedBy, feedbackRequest,
                ClubProfileChangeRequest.ChangeStatus.REJECTED,
                "Kulüp profil talebi reddedildi");
    }

    public void createClubAnnouncement(String userId, String clubId, ClubAnnouncementRequest request) {
        Club club = clubRepository.findByIdAndIsDeletedFalse(clubId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Club not found"));

        if (!userId.trim().equalsIgnoreCase(club.getAdminUserId().trim())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only club president can create announcement");
        }
        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Announcement title is required");
        }
        if (request.getMessage() == null || request.getMessage().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Announcement message is required");
        }
        if (request.getLinkLabel() != null && !request.getLinkLabel().isBlank()
                && (request.getLinkUrl() == null || request.getLinkUrl().isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Announcement link URL is required when link label is provided");
        }

        List<ClubMember> members = clubMemberRepository.findByClubId(clubId);
        if (members.isEmpty()) {
            notificationService.notifyUserAnnouncement(
                    userId,
                    request.getTitle().trim(),
                    request.getMessage().trim(),
                    request.getLinkUrl(),
                    request.getLinkLabel(),
                    request.getImageUrl(),
                    userId,
                    club.getName());
            return;
        }

        members.forEach(member -> notificationService.notifyUserAnnouncement(
                member.getUserId(),
                request.getTitle().trim(),
                request.getMessage().trim(),
                request.getLinkUrl(),
                request.getLinkLabel(),
                request.getImageUrl(),
                userId,
                club.getName()));
        auditLogService.record(AuditLog.EntityType.CLUB, clubId, "ANNOUNCEMENT_SENT", userId, "CLUB_ADMIN",
                club.getName() + " kulübü duyuru gönderdi: " + request.getTitle().trim());
    }

    private ClubResponse toResponse(Club club, String currentUserId) {
        ClubMember membership = currentUserId == null ? null
                : clubMemberRepository.findByClubIdAndUserId(club.getId(), currentUserId).orElse(null);

        return ClubResponse.builder()
                .id(club.getId())
                .name(club.getName())
                .shortDescription(club.getShortDescription())
                .vision(club.getDescription())
                .description(club.getDescription())
                .adminUserId(club.getAdminUserId())
                .presidentFullName(club.getPresidentFullName())
                .presidentEmail(club.getPresidentEmail())
                .logoUrl(club.getLogoUrl())
                .advisorAcademicStaffId(club.getAdvisorAcademicStaffId())
                .advisorTitle(club.getAdvisorTitle())
                .advisorFullName(club.getAdvisorFullName())
                .advisorEmail(club.getAdvisorEmail())
                .advisorDepartment(club.getAdvisorDepartment())
                .active(club.isActive())
                .requiresApproval(false)
                .memberCount(clubMemberRepository.countByClubIdAndStatusIn(club.getId(), ACTIVE_LIKE_MEMBER_STATUSES))
                .eventCount(eventRepository.countByClub_Id(club.getId()))
                .currentUserMember(membership != null && (membership.getStatus() == ClubMember.MemberStatus.ACTIVE
                        || membership.getStatus() == ClubMember.MemberStatus.PENDING))
                .currentUserRole(membership != null ? membership.getRole().name() : null)
                .currentUserStatus(membership != null && membership.getStatus() == ClubMember.MemberStatus.PENDING
                        ? ClubMember.MemberStatus.ACTIVE.name()
                        : membership != null ? membership.getStatus().name() : null)
                .build();
    }

    private ClubProfileChangeRequestResponse toProfileChangeResponse(
            ClubProfileChangeRequest request,
            String currentUserId) {
        return ClubProfileChangeRequestResponse.builder()
                .id(request.getId())
                .club(toResponse(request.getClub(), currentUserId))
                .requestedBy(request.getRequestedBy())
                .name(request.getName())
                .shortDescription(request.getShortDescription())
                .vision(request.getVision())
                .logoUrl(request.getLogoUrl())
                .status(request.getStatus())
                .feedback(request.getFeedback())
                .reviewedBy(request.getReviewedBy())
                .reviewedAt(request.getReviewedAt())
                .createdAt(request.getCreatedAt())
                .updatedAt(request.getUpdatedAt())
                .build();
    }

    private ClubProfileChangeRequestResponse reviewProfileChange(
            String changeRequestId,
            String reviewedBy,
            EventFeedbackRequest feedbackRequest,
            ClubProfileChangeRequest.ChangeStatus nextStatus,
            String title) {
        ClubProfileChangeRequest request = clubProfileChangeRequestRepository.findById(changeRequestId)
                .orElseThrow(
                        () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Profile change request not found"));
        if (request.getStatus() != ClubProfileChangeRequest.ChangeStatus.PENDING
                && request.getStatus() != ClubProfileChangeRequest.ChangeStatus.REVISION_REQUESTED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Profile change request cannot be reviewed");
        }
        if (feedbackRequest == null || feedbackRequest.getFeedback() == null
                || feedbackRequest.getFeedback().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Feedback is required");
        }

        request.setStatus(nextStatus);
        request.setFeedback(feedbackRequest.getFeedback().trim());
        request.setReviewedBy(reviewedBy);
        request.setReviewedAt(java.time.LocalDateTime.now());
        ClubProfileChangeRequest saved = clubProfileChangeRequestRepository.save(request);
        auditLogService.record(AuditLog.EntityType.CLUB, saved.getClub().getId(),
                nextStatus == ClubProfileChangeRequest.ChangeStatus.REJECTED
                        ? "PROFILE_UPDATE_REJECTED"
                        : "PROFILE_UPDATE_REVISION_REQUESTED",
                reviewedBy, "SKS",
                saved.getClub().getName() + " kulübü profil talebi için SKS notu: " + saved.getFeedback());

        notificationService.notifyUserWithType(
                saved.getClub().getAdminUserId(),
                title,
                saved.getClub().getName() + " kulübü profil talebi için SKS notu: " + saved.getFeedback(),
                saved.getClub().getId(),
                Notification.NotificationType.PROFILE_APPROVAL_REQUEST);

        return toProfileChangeResponse(saved, reviewedBy);
    }

    private boolean isClubAdmin(Club club, String userId) {
        return club.getAdminUserId() != null && userId != null
                && club.getAdminUserId().trim().equalsIgnoreCase(userId.trim());
    }

    private boolean isSystemAdmin(String roles) {
        return roles != null && (roles.contains("ROLE_SKS_ADMIN") || roles.contains("ROLE_ADMIN"));
    }

    private void validateProfileFields(
            String name,
            String shortDescription,
            String vision,
            String advisorFullName,
            String advisorEmail,
            String advisorDepartment) {
        validateClubProfileContentFields(name, shortDescription, vision);
        validateAdvisorFields(advisorFullName, advisorEmail, advisorDepartment);
    }

    private void validateClubProfileContentFields(String name, String shortDescription, String vision) {
        if (name == null || name.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Club name is required");
        }
        if (shortDescription == null || shortDescription.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Club short description is required");
        }
        validateTextLength(
                shortDescription.trim(),
                SHORT_DESCRIPTION_MIN_LENGTH,
                SHORT_DESCRIPTION_MAX_LENGTH,
                "Club short description");
        if (vision == null || vision.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Club vision is required");
        }
        validateTextLength(
                vision.trim(),
                VISION_MIN_LENGTH,
                VISION_MAX_LENGTH,
                "Club vision");
    }

    private void validateAdvisorFields(String advisorFullName, String advisorEmail, String advisorDepartment) {
        if (advisorFullName == null || advisorFullName.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Advisor full name is required");
        }
        if (advisorEmail == null || advisorEmail.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Advisor email is required");
        }
        if (!advisorEmail.trim().toLowerCase().endsWith("@isikun.edu.tr")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Advisor email must use @isikun.edu.tr");
        }
        if (advisorDepartment == null || advisorDepartment.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Advisor department is required");
        }
    }

    private void validateTextLength(String value, int minLength, int maxLength, String fieldName) {
        if (value.length() < minLength || value.length() > maxLength) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    fieldName + " must be between " + minLength + " and " + maxLength + " characters");
        }
    }

    private String resolveVision(String vision, String description) {
        if (vision != null && !vision.isBlank()) {
            return vision;
        }
        return description;
    }

    private AdvisorSnapshot resolveAdvisor(
            String academicStaffId,
            String advisorTitle,
            String advisorFullName,
            String advisorEmail,
            String advisorDepartment) {
        if (academicStaffId != null && !academicStaffId.isBlank()) {
            AcademicStaff staff = academicStaffService.findActiveById(academicStaffId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Selected advisor academic staff was not found"));
            return new AdvisorSnapshot(
                    staff.getId(),
                    trimToEmpty(staff.getAcademicTitle()),
                    trimToEmpty(staff.getFullName()),
                    trimToEmpty(staff.getEmail()),
                    trimToEmpty(staff.getDepartment()));
        }

        return new AdvisorSnapshot(
                null,
                trimToEmpty(advisorTitle),
                trimToEmpty(advisorFullName),
                trimToEmpty(advisorEmail),
                trimToEmpty(advisorDepartment));
    }

    private void validatePresidentAvailable(String studentId, String currentClubId) {
        if (studentId == null || studentId.isBlank()) {
            return;
        }

        boolean alreadyPresident = currentClubId == null
                ? clubRepository.existsByAdminUserIdAndIsDeletedFalse(studentId.trim())
                : clubRepository.existsByAdminUserIdAndIsDeletedFalseAndIdNot(studentId.trim(), currentClubId);
        if (alreadyPresident) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This student is already president of another club");
        }
    }

    private void validatePresidentFields(String studentId, String fullName, String email) {
        if (studentId == null || studentId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Student id is required");
        }
        if (fullName == null || fullName.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "President full name is required");
        }
        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "President email is required");
        }
    }

    private void updatePresident(Club club, String studentId, String fullName, String email) {
        String newPresidentId = studentId.trim();
        String oldPresidentId = club.getAdminUserId();

        if (oldPresidentId != null && !oldPresidentId.trim().equalsIgnoreCase(newPresidentId.trim())) {
            clubMemberRepository.findByClubIdAndUserId(club.getId(), oldPresidentId)
                    .ifPresent(oldMembership -> {
                        oldMembership.setRole(ClubMember.MemberRole.MEMBER);
                        clubMemberRepository.save(oldMembership);
                    });
        }

        ClubMember presidentMembership = clubMemberRepository.findByClubIdAndUserId(club.getId(), newPresidentId)
                .orElse(ClubMember.builder()
                        .clubId(club.getId())
                        .userId(newPresidentId)
                        .build());
        presidentMembership.setRole(ClubMember.MemberRole.ADMIN);
        presidentMembership.setStatus(ClubMember.MemberStatus.ACTIVE);
        clubMemberRepository.save(presidentMembership);

        club.setAdminUserId(newPresidentId);
        club.setPresidentFullName(fullName.trim());
        club.setPresidentEmail(email.trim());
    }

    private void validateAdvisorAvailable(String academicStaffId, String currentClubId) {
        if (academicStaffId == null || academicStaffId.isBlank()) {
            return;
        }

        boolean alreadyAdvisor = currentClubId == null
                ? clubRepository.existsByAdvisorAcademicStaffIdAndIsDeletedFalse(academicStaffId.trim())
                : clubRepository.existsByAdvisorAcademicStaffIdAndIsDeletedFalseAndIdNot(academicStaffId.trim(),
                        currentClubId);
        if (alreadyAdvisor) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This academic advisor is already assigned to another club");
        }
    }

    private String trimToEmpty(String value) {
        return value == null ? "" : value.trim();
    }

    private record AdvisorSnapshot(
            String academicStaffId,
            String title,
            String fullName,
            String email,
            String department) {
    }

    public List<com.isik.campusos.event.dto.ClubAnnouncementResponse> getClubAnnouncements(String clubId) {
        return clubAnnouncementRepository.findByClubIdOrderByCreatedAtDesc(clubId)
                .stream()
                .map(a -> com.isik.campusos.event.dto.ClubAnnouncementResponse.builder()
                        .id(a.getId())
                        .clubId(a.getClubId())
                        .clubName("")
                        .title(a.getTitle())
                        .message(a.getMessage())
                        .linkUrl(a.getLinkUrl())
                        .linkLabel(a.getLinkLabel())
                        .imageUrl(a.getImageUrl())
                        .createdByUserId(a.getCreatedByUserId())
                        .createdAt(a.getCreatedAt())
                        .build())
                .toList();
    }

    public List<com.isik.campusos.event.dto.ClubMemberResponse> getClubMembers(String userId, String roles,
            String clubId) {
        Club club = clubRepository.findByIdAndIsDeletedFalse(clubId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Club not found"));
        if (!userId.trim().equalsIgnoreCase(club.getAdminUserId().trim()) && !isSystemAdmin(roles)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Only club admin or SKS admin can view members list");
        }
        return clubMemberRepository.findByClubId(clubId).stream()
                .map(m -> com.isik.campusos.event.dto.ClubMemberResponse.builder()
                        .id(m.getId())
                        .clubId(m.getClubId())
                        .userId(m.getUserId())
                        .fullName("") // Frontend enriches from auth-service /users/batch
                        .role(m.getRole().name())
                        .status(m.getStatus().name())
                        .joinedAt(m.getJoinedAt())
                        .build())
                .toList();
    }

    @Transactional
    public void updateMemberRole(String currentUserId, String roles, String clubId, String targetUserId,
            com.isik.campusos.event.dto.ClubMemberRoleUpdateRequest request) {
        Club club = clubRepository.findByIdAndIsDeletedFalse(clubId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Club not found"));
        if (!isSystemAdmin(roles)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only SKS admin can change member roles");
        }
        ClubMember targetMember = clubMemberRepository.findByClubIdAndUserId(clubId, targetUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Member not found"));
        ClubMember.MemberRole requestedRole = parseMemberRole(request.getRole());
        if (targetUserId.trim().equalsIgnoreCase(club.getAdminUserId().trim())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Club president role cannot be changed here");
        }
        if (requestedRole == ClubMember.MemberRole.ADMIN) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Use the president assignment flow to transfer club presidency");
        }
        targetMember.setRole(requestedRole);
        clubMemberRepository.save(targetMember);
    }

    @Transactional
    public void updateMemberStatus(String currentUserId, String roles, String clubId, String targetUserId,
            com.isik.campusos.event.dto.ClubMemberStatusUpdateRequest request) {
        Club club = clubRepository.findByIdAndIsDeletedFalse(clubId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Club not found"));
        if (!isSystemAdmin(roles)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only SKS admin can change member statuses");
        }
        ClubMember targetMember = clubMemberRepository.findByClubIdAndUserId(clubId, targetUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Member not found"));
        ClubMember.MemberStatus requestedStatus = parseMemberStatus(request.getStatus());
        if (targetUserId.trim().equalsIgnoreCase(club.getAdminUserId().trim())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Club president status cannot be changed");
        }
        targetMember.setStatus(requestedStatus);
        clubMemberRepository.save(targetMember);
    }

    private ClubMember.MemberRole parseMemberRole(String role) {
        if (role == null || role.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Member role is required");
        }
        try {
            return ClubMember.MemberRole.valueOf(role.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid member role");
        }
    }

    private ClubMember.MemberStatus parseMemberStatus(String status) {
        if (status == null || status.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Member status is required");
        }
        try {
            return ClubMember.MemberStatus.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid member status");
        }
    }

    @Transactional
    public void removeMember(String currentUserId, String roles, String clubId, String targetUserId) {
        Club club = clubRepository.findByIdAndIsDeletedFalse(clubId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Club not found"));
        if (!isSystemAdmin(roles)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only SKS admin can remove members");
        }
        if (targetUserId.trim().equalsIgnoreCase(club.getAdminUserId().trim())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot remove the club president");
        }
        ClubMember targetMember = clubMemberRepository.findByClubIdAndUserId(clubId, targetUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Member not found"));
        clubMemberRepository.delete(targetMember);
    }

    @Transactional
    public void deleteClub(String clubId, String currentUserId) {
        Club club = clubRepository.findByIdAndIsDeletedFalse(clubId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Club not found"));
        club.setDeleted(true);
        club.setDeletedAt(java.time.LocalDateTime.now());
        clubRepository.save(club);
    }
}
