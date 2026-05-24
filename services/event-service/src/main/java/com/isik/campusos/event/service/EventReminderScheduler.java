package com.isik.campusos.event.service;

import com.isik.campusos.event.model.Event;
import com.isik.campusos.event.model.Rsvp;
import com.isik.campusos.event.repository.EventRepository;
import com.isik.campusos.event.repository.RsvpRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class EventReminderScheduler {

    private final EventRepository eventRepository;
    private final RsvpRepository rsvpRepository;
    private final NotificationService notificationService;

    @Scheduled(fixedDelay = 60_000)
    @Transactional
    public void sendDueEventReminders() {
        LocalDateTime now = LocalDateTime.now();
        List<Event> events = eventRepository.findByStatusAndReminderEnabledTrue(Event.EventStatus.PUBLISHED);

        for (Event event : events) {
            if (event.getStartTime() == null || event.getStartTime().isBefore(now)) {
                continue;
            }

            long minutesUntilStart = Duration.between(now, event.getStartTime()).toMinutes();
            Set<Integer> sentOffsets = parseOffsets(event.getSentReminderOffsetsMinutes());
            boolean changed = false;

            for (Integer offset : parseOffsets(event.getReminderOffsetsMinutes())) {
                if (sentOffsets.contains(offset)) {
                    continue;
                }
                if (minutesUntilStart <= offset && minutesUntilStart >= Math.max(0, offset - 1)) {
                    sendReminder(event, offset);
                    sentOffsets.add(offset);
                    changed = true;
                }
            }

            if (changed) {
                event.setSentReminderOffsetsMinutes(joinOffsets(sentOffsets));
                eventRepository.save(event);
            }
        }
    }

    private void sendReminder(Event event, int offsetMinutes) {
        List<Rsvp> recipients = rsvpRepository.findByEventIdAndStatusInOrderByCreatedAtAsc(
                event.getId(),
                List.of(Rsvp.RsvpStatus.CONFIRMED, Rsvp.RsvpStatus.PENDING_PAYMENT)
        );

        String timeText = offsetMinutes >= 60 && offsetMinutes % 60 == 0
                ? (offsetMinutes / 60) + " saat"
                : offsetMinutes + " dakika";
        String location = event.getEventMode() == Event.EventMode.ONLINE
                ? "Online: " + nullToText(event.getOnlinePlatform())
                : nullToText(event.getLocationName() != null ? event.getLocationName() : event.getLocation());

        for (Rsvp rsvp : recipients) {
            notificationService.notifyUserAnnouncement(
                    rsvp.getUserId(),
                    "Etkinlik hatırlatması: " + event.getTitle(),
                    event.getTitle() + " etkinliği yaklaşık " + timeText + " sonra başlayacak.\n\nBaşlangıç: "
                            + event.getStartTime() + "\nKonum: " + location,
                    event.getOnlineMeetingUrl(),
                    event.getEventMode() == Event.EventMode.ONLINE ? "Toplantıya katıl" : null,
                    event.getPosterImageUrl(),
                    "system",
                    event.getClub().getName()
            );
        }
    }

    private Set<Integer> parseOffsets(String value) {
        if (value == null || value.isBlank()) {
            return new HashSet<>();
        }
        return Arrays.stream(value.split(","))
                .map(String::trim)
                .filter(item -> !item.isBlank())
                .map(Integer::parseInt)
                .filter(item -> item > 0)
                .collect(Collectors.toCollection(HashSet::new));
    }

    private String joinOffsets(Set<Integer> offsets) {
        return offsets.stream()
                .sorted((left, right) -> Integer.compare(right, left))
                .map(String::valueOf)
                .collect(Collectors.joining(","));
    }

    private String nullToText(String value) {
        return value == null || value.isBlank() ? "Bilgi bekleniyor" : value;
    }
}
