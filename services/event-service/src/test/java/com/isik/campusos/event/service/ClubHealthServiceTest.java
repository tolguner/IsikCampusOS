package com.isik.campusos.event.service;

import com.isik.campusos.event.dto.ClubHealthActionRequest;
import com.isik.campusos.event.model.Club;
import com.isik.campusos.event.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ClubHealthServiceTest {

    @Mock private ClubRepository clubRepository;
    @Mock private ClubMemberRepository clubMemberRepository;
    @Mock private EventRepository eventRepository;
    @Mock private ClubAnnouncementRepository clubAnnouncementRepository;
    @Mock private ClubProfileChangeRequestRepository profileChangeRequestRepository;
    @Mock private ClubHealthRecordRepository clubHealthRecordRepository;
    @Mock private NotificationService notificationService;
    @Mock private AuditLogService auditLogService;

    private ClubHealthService clubHealthService;

    @BeforeEach
    void setUp() {
        clubHealthService = new ClubHealthService(
                clubRepository,
                clubMemberRepository,
                eventRepository,
                clubAnnouncementRepository,
                profileChangeRequestRepository,
                clubHealthRecordRepository,
                notificationService,
                auditLogService);
    }

    @Test
    void healthMarksSmallClubAsRisky() {
        Club club = activeClub();
        when(clubRepository.findAllByIsDeletedFalseOrderByNameAsc()).thenReturn(List.of(club));
        when(clubMemberRepository.countByClubIdAndStatusIn(org.mockito.ArgumentMatchers.eq("club-1"), org.mockito.ArgumentMatchers.any())).thenReturn(3L);
        when(eventRepository.findByClub_Id("club-1")).thenReturn(List.of());
        when(clubAnnouncementRepository.findByClubIdOrderByCreatedAtDesc("club-1")).thenReturn(List.of());
        when(profileChangeRequestRepository.findByStatusInOrderByCreatedAtDesc(org.mockito.ArgumentMatchers.any())).thenReturn(List.of());
        when(clubHealthRecordRepository.findByClubId("club-1")).thenReturn(Optional.empty());

        assertThat(clubHealthService.listHealth().get(0).getHealthStatus()).isEqualTo("Riskli");
    }

    @Test
    void actionRequestNotifiesClubPresident() {
        Club club = activeClub();
        ClubHealthActionRequest request = new ClubHealthActionRequest();
        request.setMessage("Lütfen dönem planını paylaş.");

        when(clubRepository.findByIdAndIsDeletedFalse("club-1")).thenReturn(Optional.of(club));
        when(clubMemberRepository.countByClubIdAndStatusIn(org.mockito.ArgumentMatchers.eq("club-1"), org.mockito.ArgumentMatchers.any())).thenReturn(10L);
        when(eventRepository.findByClub_Id("club-1")).thenReturn(List.of());
        when(clubAnnouncementRepository.findByClubIdOrderByCreatedAtDesc("club-1")).thenReturn(List.of());
        when(profileChangeRequestRepository.findByStatusInOrderByCreatedAtDesc(org.mockito.ArgumentMatchers.any())).thenReturn(List.of());
        when(clubHealthRecordRepository.findByClubId("club-1")).thenReturn(Optional.empty());

        clubHealthService.requestAction("club-1", "sks-1", request);

        verify(notificationService).notifyUserAnnouncement(
                org.mockito.ArgumentMatchers.eq("president-1"),
                org.mockito.ArgumentMatchers.eq("SKS kulübünden aksiyon bekliyor"),
                org.mockito.ArgumentMatchers.eq("Lütfen dönem planını paylaş."),
                org.mockito.ArgumentMatchers.eq("/club-management"),
                org.mockito.ArgumentMatchers.eq("Kulüp yönetimini aç"),
                org.mockito.ArgumentMatchers.isNull(),
                org.mockito.ArgumentMatchers.eq("sks-1"),
                org.mockito.ArgumentMatchers.eq("SKS Yönetimi"));
    }

    private Club activeClub() {
        return Club.builder()
                .id("club-1")
                .name("IT&MIS Kulübü")
                .adminUserId("president-1")
                .isActive(true)
                .isDeleted(false)
                .build();
    }
}
