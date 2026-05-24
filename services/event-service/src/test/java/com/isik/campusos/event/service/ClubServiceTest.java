package com.isik.campusos.event.service;

import com.isik.campusos.event.dto.ClubMemberRoleUpdateRequest;
import com.isik.campusos.event.dto.ClubMemberStatusUpdateRequest;
import com.isik.campusos.event.model.Club;
import com.isik.campusos.event.model.ClubMember;
import com.isik.campusos.event.repository.ClubAnnouncementRepository;
import com.isik.campusos.event.repository.ClubMemberRepository;
import com.isik.campusos.event.repository.ClubProfileChangeRequestRepository;
import com.isik.campusos.event.repository.ClubRepository;
import com.isik.campusos.event.repository.EventRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ClubServiceTest {

    @Mock
    private ClubRepository clubRepository;
    @Mock
    private ClubMemberRepository clubMemberRepository;
    @Mock
    private ClubProfileChangeRequestRepository profileChangeRequestRepository;
    @Mock
    private EventRepository eventRepository;
    @Mock
    private ClubAnnouncementRepository clubAnnouncementRepository;
    @Mock
    private NotificationService notificationService;
    @Mock
    private AcademicStaffService academicStaffService;

    private ClubService clubService;

    @BeforeEach
    void setUp() {
        clubService = new ClubService(
                clubRepository,
                clubMemberRepository,
                profileChangeRequestRepository,
                eventRepository,
                clubAnnouncementRepository,
                notificationService,
                academicStaffService);
    }

    @Test
    void updateMemberStatusDoesNotAllowChangingPresidentStatus() {
        Club club = activeClub();
        ClubMember president = member("president-1", ClubMember.MemberRole.ADMIN, ClubMember.MemberStatus.ACTIVE);
        ClubMemberStatusUpdateRequest request = new ClubMemberStatusUpdateRequest();
        request.setStatus("REJECTED");

        when(clubRepository.findByIdAndIsDeletedFalse("club-1")).thenReturn(Optional.of(club));
        when(clubMemberRepository.findByClubIdAndUserId("club-1", "president-1")).thenReturn(Optional.of(president));

        assertThatThrownBy(() -> clubService.updateMemberStatus("sks-1", "ROLE_SKS_ADMIN", "club-1", "president-1", request))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(ex -> ((ResponseStatusException) ex).getStatusCode())
                .isEqualTo(HttpStatus.CONFLICT);

        verify(clubMemberRepository, never()).save(any());
    }

    @Test
    void updateMemberStatusReturnsBadRequestForInvalidStatus() {
        Club club = activeClub();
        ClubMember member = member("member-1", ClubMember.MemberRole.MEMBER, ClubMember.MemberStatus.ACTIVE);
        ClubMemberStatusUpdateRequest request = new ClubMemberStatusUpdateRequest();
        request.setStatus("NOT_A_STATUS");

        when(clubRepository.findByIdAndIsDeletedFalse("club-1")).thenReturn(Optional.of(club));
        when(clubMemberRepository.findByClubIdAndUserId("club-1", "member-1")).thenReturn(Optional.of(member));

        assertThatThrownBy(() -> clubService.updateMemberStatus("sks-1", "ROLE_SKS_ADMIN", "club-1", "member-1", request))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(ex -> ((ResponseStatusException) ex).getStatusCode())
                .isEqualTo(HttpStatus.BAD_REQUEST);

        verify(clubMemberRepository, never()).save(any());
    }

    @Test
    void updateMemberRoleDoesNotAllowPromotingThroughMemberRoleEndpoint() {
        Club club = activeClub();
        ClubMember member = member("member-1", ClubMember.MemberRole.MEMBER, ClubMember.MemberStatus.ACTIVE);
        ClubMemberRoleUpdateRequest request = new ClubMemberRoleUpdateRequest();
        request.setRole("ADMIN");

        when(clubRepository.findByIdAndIsDeletedFalse("club-1")).thenReturn(Optional.of(club));
        when(clubMemberRepository.findByClubIdAndUserId("club-1", "member-1")).thenReturn(Optional.of(member));

        assertThatThrownBy(() -> clubService.updateMemberRole("sks-1", "ROLE_SKS_ADMIN", "club-1", "member-1", request))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(ex -> ((ResponseStatusException) ex).getStatusCode())
                .isEqualTo(HttpStatus.CONFLICT);

        verify(clubMemberRepository, never()).save(any());
    }

    @Test
    void joinClubReopensRejectedMembership() {
        Club club = activeClub();
        club.setRequiresApproval(false);
        ClubMember rejected = member("member-1", ClubMember.MemberRole.MEMBER, ClubMember.MemberStatus.REJECTED);

        when(clubRepository.findByIdAndIsDeletedFalse("club-1")).thenReturn(Optional.of(club));
        when(clubMemberRepository.findByClubIdAndUserId("club-1", "member-1")).thenReturn(Optional.of(rejected));
        when(clubMemberRepository.save(rejected)).thenReturn(rejected);

        ClubMember result = clubService.joinClub("member-1", "club-1");

        assertThat(result.getStatus()).isEqualTo(ClubMember.MemberStatus.ACTIVE);
        verify(clubMemberRepository).save(rejected);
    }

    @Test
    void toResponseCountsOnlyActiveMembers() {
        Club club = activeClub();

        when(clubRepository.findByIdAndIsDeletedFalse("club-1")).thenReturn(Optional.of(club));
        when(clubMemberRepository.findByClubIdAndUserId("club-1", "member-1")).thenReturn(Optional.empty());
        when(clubMemberRepository.countByClubIdAndStatus("club-1", ClubMember.MemberStatus.ACTIVE)).thenReturn(3L);
        when(eventRepository.countByClub_Id("club-1")).thenReturn(2L);

        assertThat(clubService.getClub("member-1", "club-1").getMemberCount()).isEqualTo(3L);
    }

    private Club activeClub() {
        return Club.builder()
                .id("club-1")
                .name("IT&MIS Kulübü")
                .shortDescription("short")
                .description("description")
                .adminUserId("president-1")
                .isActive(true)
                .isDeleted(false)
                .build();
    }

    private ClubMember member(String userId, ClubMember.MemberRole role, ClubMember.MemberStatus status) {
        return ClubMember.builder()
                .clubId("club-1")
                .userId(userId)
                .role(role)
                .status(status)
                .build();
    }
}
