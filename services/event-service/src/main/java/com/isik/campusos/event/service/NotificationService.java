package com.isik.campusos.event.service;

import com.isik.campusos.event.dto.AnnouncementRequest;
import com.isik.campusos.event.dto.NotificationResponse;
import com.isik.campusos.event.model.Notification;
import com.isik.campusos.event.model.NotificationRead;
import com.isik.campusos.event.repository.ClubRepository;
import com.isik.campusos.event.repository.NotificationReadRepository;
import com.isik.campusos.event.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationReadRepository notificationReadRepository;
    private final ClubRepository clubRepository;

    public NotificationResponse createAnnouncement(String createdBy, AnnouncementRequest request) {
        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Announcement title is required");
        }
        if (request.getMessage() == null || request.getMessage().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Announcement message is required");
        }
        if (request.getLinkLabel() != null && !request.getLinkLabel().isBlank() &&
                (request.getLinkUrl() == null || request.getLinkUrl().isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Announcement link URL is required when link label is provided");
        }

        Notification.TargetAudience audience = parseAudience(request.getTargetAudience());
        Notification notification = Notification.builder()
                .title(request.getTitle().trim())
                .message(request.getMessage().trim())
                .linkUrl(normalizeOptional(request.getLinkUrl()))
                .linkLabel(normalizeOptional(request.getLinkLabel()))
                .imageUrl(normalizeOptional(request.getImageUrl()))
                .type(Notification.NotificationType.ANNOUNCEMENT)
                .targetAudience(audience)
                .createdBy(createdBy)
                .createdByName(normalizeOptional(request.getCreatedByName()))
                .build();

        return toResponse(notificationRepository.save(notification), false);
    }

    public NotificationResponse notifyUser(String userId, String title, String message, String relatedEventId) {
        Notification notification = Notification.builder()
                .title(title)
                .message(message)
                .type(Notification.NotificationType.EVENT_REVISION_REQUEST)
                .targetAudience(Notification.TargetAudience.USER)
                .recipientUserId(userId)
                .relatedEventId(relatedEventId)
                .build();
        return toResponse(notificationRepository.save(notification), false);
    }

    public NotificationResponse notifyUserCertificate(String userId,
                                                       String title,
                                                       String message,
                                                       String relatedEventId) {
        Notification notification = Notification.builder()
                .title(title)
                .message(message)
                .type(Notification.NotificationType.CERTIFICATE)
                .targetAudience(Notification.TargetAudience.USER)
                .recipientUserId(userId)
                .relatedEventId(relatedEventId)
                .linkUrl("/notifications")
                .linkLabel("Sertifikayı görüntüle")
                .build();
        return toResponse(notificationRepository.save(notification), false);
    }

    public NotificationResponse notifyAudience(Notification.TargetAudience audience,
                                               String title,
                                               String message,
                                               String createdBy,
                                               String createdByName,
                                               String relatedEventId) {
        Notification notification = Notification.builder()
                .title(title)
                .message(message)
                .type(Notification.NotificationType.ANNOUNCEMENT)
                .targetAudience(audience)
                .createdBy(createdBy)
                .createdByName(createdByName)
                .relatedEventId(relatedEventId)
                .build();
        return toResponse(notificationRepository.save(notification), false);
    }

    public NotificationResponse notifyUserAnnouncement(String userId,
                                                       String title,
                                                       String message,
                                                       String linkUrl,
                                                       String linkLabel,
                                                       String imageUrl,
                                                       String createdBy,
                                                       String createdByName) {
        Notification notification = Notification.builder()
                .title(title)
                .message(message)
                .linkUrl(normalizeOptional(linkUrl))
                .linkLabel(normalizeOptional(linkLabel))
                .imageUrl(normalizeOptional(imageUrl))
                .type(Notification.NotificationType.ANNOUNCEMENT)
                .targetAudience(Notification.TargetAudience.USER)
                .recipientUserId(userId)
                .createdBy(createdBy)
                .createdByName(createdByName)
                .build();
        return toResponse(notificationRepository.save(notification), false);
    }

    public List<NotificationResponse> listVisibleNotifications(String userId, String authorities) {
        List<Notification.TargetAudience> audiences = visibleAudiences(userId, authorities);

        return notificationRepository
                .findByRecipientUserIdOrTargetAudienceInOrderByCreatedAtDesc(userId, audiences)
                .stream()
                .map(notification -> toResponse(notification, isReadByUser(notification, userId)))
                .toList();
    }

    public NotificationResponse markAsRead(String userId, String authorities, String notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));

        if (!isVisibleToUser(notification, userId, visibleAudiences(userId, authorities))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot access this notification");
        }

        notificationReadRepository.findByNotificationIdAndUserId(notificationId, userId)
                .orElseGet(() -> notificationReadRepository.save(NotificationRead.builder()
                        .notificationId(notificationId)
                        .userId(userId)
                        .build()));

        return toResponse(notification, true);
    }

    private List<Notification.TargetAudience> visibleAudiences(String userId, String authorities) {
        List<Notification.TargetAudience> audiences = new ArrayList<>();
        if (authorities.contains("ROLE_STUDENT")) {
            audiences.add(Notification.TargetAudience.ALL_STUDENTS);
        }
        if (authorities.contains("ROLE_SKS_ADMIN") || authorities.contains("ROLE_ADMIN")) {
            audiences.add(Notification.TargetAudience.SKS_ADMINS);
        }
        if (clubRepository.findByAdminUserIdAndIsDeletedFalse(userId).size() > 0) {
            audiences.add(Notification.TargetAudience.CLUB_PRESIDENTS);
        }

        return audiences;
    }

    private boolean isVisibleToUser(Notification notification, String userId, List<Notification.TargetAudience> audiences) {
        return userId.equals(notification.getRecipientUserId()) || audiences.contains(notification.getTargetAudience());
    }

    private boolean isReadByUser(Notification notification, String userId) {
        return notificationReadRepository.existsByNotificationIdAndUserId(notification.getId(), userId);
    }

    private Notification.TargetAudience parseAudience(String value) {
        if ("CLUB_PRESIDENTS".equalsIgnoreCase(value)) {
            return Notification.TargetAudience.CLUB_PRESIDENTS;
        }
        if ("ALL_STUDENTS".equalsIgnoreCase(value)) {
            return Notification.TargetAudience.ALL_STUDENTS;
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid announcement target audience");
    }

    private NotificationResponse toResponse(Notification notification, boolean read) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .linkUrl(notification.getLinkUrl())
                .linkLabel(notification.getLinkLabel())
                .imageUrl(notification.getImageUrl())
                .type(notification.getType().name())
                .targetAudience(notification.getTargetAudience().name())
                .relatedEventId(notification.getRelatedEventId())
                .createdBy(notification.getCreatedBy())
                .createdByName(notification.getCreatedByName())
                .read(read)
                .createdAt(notification.getCreatedAt())
                .build();
    }

    private String normalizeOptional(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
