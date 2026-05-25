package com.isik.campusos.event.repository;

import com.isik.campusos.event.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, String> {
    List<AuditLog> findByEntityTypeAndEntityIdOrderByCreatedAtDesc(AuditLog.EntityType entityType, String entityId);
}
