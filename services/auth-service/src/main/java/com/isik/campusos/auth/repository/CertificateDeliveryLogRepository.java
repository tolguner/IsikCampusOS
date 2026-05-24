package com.isik.campusos.auth.repository;

import com.isik.campusos.auth.model.CertificateDeliveryLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CertificateDeliveryLogRepository extends JpaRepository<CertificateDeliveryLog, String> {
    Optional<CertificateDeliveryLog> findByCertificateCode(String certificateCode);
}
