package com.isik.campusos.auth.repository;

import com.isik.campusos.auth.model.VerificationCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VerificationCodeRepository extends JpaRepository<VerificationCode, String> {
    Optional<VerificationCode> findByEmailAndCodeAndCodeTypeAndUsedFalse(
            String email, String code, String codeType);

    void deleteByUserIdAndCodeType(String userId, String codeType);
}
