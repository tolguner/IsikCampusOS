package com.isik.kampusos.kimlik.service;
 
import com.isik.kampusos.kimlik.dto.SertifikaDogrulamaYaniti;
import com.isik.kampusos.kimlik.model.SertifikaTeslimatGunlugu;
import com.isik.kampusos.kimlik.repository.SertifikaTeslimatGunluguDeposu;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
 
@Service
@RequiredArgsConstructor
public class SertifikaDogrulamaServisi {
 
    private final SertifikaTeslimatGunluguDeposu sertifikaTeslimatGunluguDeposu;
 
    public SertifikaDogrulamaYaniti dogrula(String sertifikaKodu) {
        String normalizeKod = sertifikaKodu == null ? "" : sertifikaKodu.trim();
        return sertifikaTeslimatGunluguDeposu.findBySertifikaKodu(normalizeKod)
                .filter(gunluk -> gunluk.getDurum() == SertifikaTeslimatGunlugu.TeslimatDurumu.GONDERILDI)
                .map(gunluk -> SertifikaDogrulamaYaniti.builder()
                        .gecerli(true)
                        .sertifikaKodu(gunluk.getSertifikaKodu())
                        .aliciAdi(gunluk.getAliciAdi())
                        .etkinlikBasligi(gunluk.getEtkinlikBasligi())
                        .kulupAdi(gunluk.getKulupAdi())
                        .sertifikaBasligi(gunluk.getSertifikaBasligi())
                        .verilmeTarihi(gunluk.getVerilmeTarihi())
                        .gonderilmeTarihi(gunluk.getGonderilmeTarihi())
                        .build())
                .orElseGet(() -> SertifikaDogrulamaYaniti.builder()
                        .gecerli(false)
                        .sertifikaKodu(normalizeKod)
                        .build());
    }
}
