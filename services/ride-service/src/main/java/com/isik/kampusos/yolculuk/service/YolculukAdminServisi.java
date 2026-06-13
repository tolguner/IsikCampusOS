package com.isik.kampusos.yolculuk.service;

import com.isik.kampusos.yolculuk.dto.AdminIncelemeTalebi;
import com.isik.kampusos.yolculuk.model.YolculukSikayeti;
import com.isik.kampusos.yolculuk.repository.YolculukSikayetiDeposu;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class YolculukAdminServisi {

    private final YolculukSikayetiDeposu sikayetDeposu;

    public List<YolculukSikayeti> sikayetler() {
        return sikayetDeposu.findAllByOrderByOlusturulmaTarihiDesc();
    }

    @Transactional
    public YolculukSikayeti sikayetIncele(String adminId, String id, AdminIncelemeTalebi talep) {
        YolculukSikayeti sikayet = sikayetDeposu.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Şikayet bulunamadı."));
        YolculukSikayeti.SikayetDurumu durum;
        try {
            durum = YolculukSikayeti.SikayetDurumu.valueOf(talep.getDurum().trim().toUpperCase(Locale.ROOT));
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Geçersiz şikayet durumu.");
        }
        sikayet.setDurum(durum);
        sikayet.setAdminNotu(talep.getNot());
        sikayet.setInceleyenKullaniciId(adminId);
        sikayet.setIncelenmeTarihi(LocalDateTime.now());
        return sikayetDeposu.save(sikayet);
    }
}
