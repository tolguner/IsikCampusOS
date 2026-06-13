package com.isik.kampusos.bildirim.repository;

import com.isik.kampusos.bildirim.model.BildirimOkuma;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BildirimOkumaDeposu extends JpaRepository<BildirimOkuma, String> {
    boolean existsByBildirimIdAndKullaniciId(String bildirimId, String kullaniciId);
    Optional<BildirimOkuma> findByBildirimIdAndKullaniciId(String bildirimId, String kullaniciId);
}
