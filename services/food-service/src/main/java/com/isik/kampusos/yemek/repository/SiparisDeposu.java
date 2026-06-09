package com.isik.kampusos.yemek.repository;

import com.isik.kampusos.yemek.model.Siparis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SiparisDeposu extends JpaRepository<Siparis, String> {

    List<Siparis> findByMusteriKullaniciIdOrderByOlusturulmaTarihiDesc(String musteriKullaniciId);

    List<Siparis> findBySaticiIdOrderByOlusturulmaTarihiDesc(String saticiId);

    /** Ciro raporu: teslim edilmiş siparişler (tarih aralığı teslim tarihine göre). */
    List<Siparis> findBySaticiIdAndDurumAndTeslimTarihiBetween(
            String saticiId, Siparis.SiparisDurumu durum, LocalDateTime baslangic, LocalDateTime bitis);

    /** Ciro/aktivite günlüğü: aralıktaki tüm siparişler (oluşturulma tarihine göre, en yeni önce). */
    List<Siparis> findBySaticiIdAndOlusturulmaTarihiBetweenOrderByOlusturulmaTarihiDesc(
            String saticiId, LocalDateTime baslangic, LocalDateTime bitis);
}
