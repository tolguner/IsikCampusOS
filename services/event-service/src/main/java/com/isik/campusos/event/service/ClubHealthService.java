package com.isik.campusos.event.service;

import com.isik.campusos.event.dto.ClubHealthActionRequest;
import com.isik.campusos.event.dto.ClubHealthResponse;
import com.isik.campusos.event.model.AuditLog;
import com.isik.campusos.event.model.Club;
import com.isik.campusos.event.model.ClubHealthRecord;
import com.isik.campusos.event.model.ClubMember;
import com.isik.campusos.event.model.ClubProfileChangeRequest;
import com.isik.campusos.event.model.Event;
import com.isik.campusos.event.repository.ClubAnnouncementRepository;
import com.isik.campusos.event.repository.ClubHealthRecordRepository;
import com.isik.campusos.event.repository.ClubMemberRepository;
import com.isik.campusos.event.repository.ClubProfileChangeRequestRepository;
import com.isik.campusos.event.repository.ClubRepository;
import com.isik.campusos.event.repository.EventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ClubHealthService {
    private static final List<ClubMember.MemberStatus> ACTIVE_LIKE_MEMBER_STATUSES = List.of(
            ClubMember.MemberStatus.ACTIVE,
            ClubMember.MemberStatus.PENDING);

    private final ClubRepository clubRepository;
    private final ClubMemberRepository clubMemberRepository;
    private final EventRepository eventRepository;
    private final ClubAnnouncementRepository clubAnnouncementRepository;
    private final ClubProfileChangeRequestRepository profileChangeRequestRepository;
    private final ClubHealthRecordRepository clubHealthRecordRepository;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;

    public List<ClubHealthResponse> listHealth() {
        return clubRepository.findAllByIsDeletedFalseOrderByNameAsc().stream()
                .map(this::toHealthResponse)
                .toList();
    }

    @Transactional
    public ClubHealthResponse addNote(String clubId, String actorId, ClubHealthActionRequest request) {
        Club club = getClub(clubId);
        String message = requiredMessage(request);
        ClubHealthRecord record = recordFor(clubId);
        record.setLatestNote(message);
        record.setLatestNoteBy(actorId);
        record.setLatestNoteAt(LocalDateTime.now());
        clubHealthRecordRepository.save(record);
        auditLogService.record(AuditLog.EntityType.CLUB, clubId, "HEALTH_NOTE_ADDED", actorId, "SKS",
                "SKS kulüp sağlık notu ekledi: " + message);
        return toHealthResponse(club);
    }

    @Transactional
    public ClubHealthResponse watchlist(String clubId, String actorId, ClubHealthActionRequest request) {
        Club club = getClub(clubId);
        String message = optionalMessage(request, "Kulüp SKS takip listesine alındı.");
        ClubHealthRecord record = recordFor(clubId);
        record.setWatchlisted(true);
        record.setLatestNote(message);
        record.setLatestNoteBy(actorId);
        record.setLatestNoteAt(LocalDateTime.now());
        clubHealthRecordRepository.save(record);
        auditLogService.record(AuditLog.EntityType.CLUB, clubId, "WATCHLISTED", actorId, "SKS", message);
        notificationService.notifyUserAnnouncement(
                club.getAdminUserId(),
                "Kulübün SKS takip listesine alındı",
                message,
                "/club-management",
                "Kulüp yönetimini aç",
                null,
                actorId,
                "SKS Yönetimi");
        return toHealthResponse(club);
    }

    @Transactional
    public ClubHealthResponse requestAction(String clubId, String actorId, ClubHealthActionRequest request) {
        Club club = getClub(clubId);
        String message = requiredMessage(request);
        auditLogService.record(AuditLog.EntityType.CLUB, clubId, "ACTION_REQUESTED", actorId, "SKS", message);
        notificationService.notifyUserAnnouncement(
                club.getAdminUserId(),
                "SKS kulübünden aksiyon bekliyor",
                message,
                "/club-management",
                "Kulüp yönetimini aç",
                null,
                actorId,
                "SKS Yönetimi");
        return toHealthResponse(club);
    }

    private ClubHealthResponse toHealthResponse(Club club) {
        String clubId = club.getId();
        List<Event> events = eventRepository.findByClub_Id(clubId);
        LocalDateTime now = LocalDateTime.now();
        long memberCount = clubMemberRepository.countByClubIdAndStatusIn(clubId, ACTIVE_LIKE_MEMBER_STATUSES);
        long activeEvents = events.stream().filter(event -> event.getStatus() == Event.EventStatus.PUBLISHED).count();
        long upcomingEvents = events.stream()
                .filter(event -> event.getStatus() == Event.EventStatus.PUBLISHED)
                .filter(event -> event.getStartTime() != null && !event.getStartTime().isBefore(now))
                .count();
        long pendingEvents = events.stream().filter(event -> event.getStatus() == Event.EventStatus.PENDING_SKS_APPROVAL).count();
        long pendingProfiles = profileChangeRequestRepository.findByStatusInOrderByCreatedAtDesc(List.of(
                        ClubProfileChangeRequest.ChangeStatus.PENDING,
                        ClubProfileChangeRequest.ChangeStatus.REVISION_REQUESTED))
                .stream()
                .filter(request -> request.getClub().getId().equals(clubId))
                .count();
        LocalDateTime lastEventAt = events.stream()
                .map(Event::getStartTime)
                .filter(value -> value != null)
                .max(Comparator.naturalOrder())
                .orElse(null);
        LocalDateTime lastAnnouncementAt = clubAnnouncementRepository.findByClubIdOrderByCreatedAtDesc(clubId)
                .stream()
                .map(announcement -> announcement.getCreatedAt())
                .findFirst()
                .orElse(null);
        double attendanceAverage = events.stream()
                .filter(event -> event.getCurrentRsvpCount() > 0)
                .mapToDouble(event -> event.getCurrentRsvpCount())
                .average()
                .orElse(0);
        ClubHealthRecord record = clubHealthRecordRepository.findByClubId(clubId).orElse(null);
        boolean watchlisted = record != null && record.isWatchlisted();
        String healthStatus = resolveHealthStatus(club, memberCount, upcomingEvents, lastEventAt, watchlisted);

        return ClubHealthResponse.builder()
                .clubId(clubId)
                .clubName(club.getName())
                .active(club.isActive())
                .memberCount(memberCount)
                .activeEventCount(activeEvents)
                .upcomingEventCount(upcomingEvents)
                .pendingEventCount(pendingEvents)
                .pendingProfileRequestCount(pendingProfiles)
                .lastEventAt(lastEventAt)
                .lastAnnouncementAt(lastAnnouncementAt)
                .attendanceAverage(attendanceAverage)
                .healthStatus(healthStatus)
                .watchlisted(watchlisted)
                .latestNote(record != null ? record.getLatestNote() : null)
                .latestNoteBy(record != null ? record.getLatestNoteBy() : null)
                .latestNoteAt(record != null ? record.getLatestNoteAt() : null)
                .build();
    }

    private String resolveHealthStatus(Club club, long memberCount, long upcomingEvents, LocalDateTime lastEventAt, boolean watchlisted) {
        if (!club.isActive()) {
            return "Pasifleşmeye Aday";
        }
        if (watchlisted || memberCount < 5) {
            return "Riskli";
        }
        if (upcomingEvents == 0 || lastEventAt == null || lastEventAt.isBefore(LocalDateTime.now().minusMonths(3))) {
            return "Takip Edilmeli";
        }
        return "Sağlıklı";
    }

    private Club getClub(String clubId) {
        return clubRepository.findByIdAndIsDeletedFalse(clubId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Club not found"));
    }

    private ClubHealthRecord recordFor(String clubId) {
        return clubHealthRecordRepository.findByClubId(clubId)
                .orElseGet(() -> ClubHealthRecord.builder().clubId(clubId).build());
    }

    private String requiredMessage(ClubHealthActionRequest request) {
        String message = request == null ? null : request.getMessage();
        if (message == null || message.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Message is required");
        }
        return message.trim();
    }

    private String optionalMessage(ClubHealthActionRequest request, String fallback) {
        String message = request == null ? null : request.getMessage();
        return message == null || message.isBlank() ? fallback : message.trim();
    }
}
