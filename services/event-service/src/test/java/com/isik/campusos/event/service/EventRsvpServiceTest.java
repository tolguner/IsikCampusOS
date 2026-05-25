package com.isik.campusos.event.service;

import com.isik.campusos.event.model.Club;
import com.isik.campusos.event.model.Event;
import com.isik.campusos.event.model.Rsvp;
import com.isik.campusos.event.repository.EventRepository;
import com.isik.campusos.event.repository.RsvpRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EventRsvpServiceTest {

    @Mock
    private EventRepository eventRepository;
    @Mock
    private RsvpRepository rsvpRepository;
    @Mock
    private KafkaTemplate<String, String> kafkaTemplate;
    @Mock
    private NotificationService notificationService;
    @Mock
    private AuditLogService auditLogService;

    private EventRsvpService eventRsvpService;

    @BeforeEach
    void setUp() {
        eventRsvpService = new EventRsvpService(
                eventRepository,
                rsvpRepository,
                kafkaTemplate,
                notificationService,
                auditLogService);
    }

    @Test
    void qrCheckInRejectsBeforeOneHourPreEventWindow() {
        Event event = publishedEvent(LocalDateTime.now().plusHours(2), LocalDateTime.now().plusHours(3));

        when(eventRepository.findById("event-1")).thenReturn(Optional.of(event));

        assertThatThrownBy(() -> eventRsvpService.checkInWithQrToken("president-1", "", "event-1", "token-1"))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(ex -> ((ResponseStatusException) ex).getStatusCode())
                .isEqualTo(HttpStatus.CONFLICT);

        verify(rsvpRepository, never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void qrCheckInAllowsUntilOneHourAfterEventEnds() {
        Event event = publishedEvent(LocalDateTime.now().minusHours(2), LocalDateTime.now().minusMinutes(30));
        Rsvp rsvp = confirmedRsvp();

        when(eventRepository.findById("event-1")).thenReturn(Optional.of(event));
        when(rsvpRepository.findByEventIdAndCheckInToken("event-1", "token-1")).thenReturn(Optional.of(rsvp));
        when(rsvpRepository.save(rsvp)).thenReturn(rsvp);

        Rsvp result = eventRsvpService.checkInWithQrToken("president-1", "", "event-1", "token-1");

        assertThat(result.getStatus()).isEqualTo(Rsvp.RsvpStatus.ATTENDED);
        assertThat(result.getCheckedInBy()).isEqualTo("president-1");
        assertThat(result.getCheckedInAt()).isNotNull();
    }

    private Event publishedEvent(LocalDateTime startTime, LocalDateTime endTime) {
        return Event.builder()
                .id("event-1")
                .club(Club.builder()
                        .id("club-1")
                        .name("IT&MIS Kulübü")
                        .adminUserId("president-1")
                        .isActive(true)
                        .build())
                .title("Test Etkinliği")
                .startTime(startTime)
                .endTime(endTime)
                .status(Event.EventStatus.PUBLISHED)
                .qrCheckInEnabled(true)
                .build();
    }

    private Rsvp confirmedRsvp() {
        return Rsvp.builder()
                .id("rsvp-1")
                .eventId("event-1")
                .userId("student-1")
                .checkInToken("token-1")
                .status(Rsvp.RsvpStatus.CONFIRMED)
                .build();
    }
}
