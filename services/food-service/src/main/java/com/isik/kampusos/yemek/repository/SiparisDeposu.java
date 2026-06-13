package com.isik.kampusos.yemek.repository;

import com.isik.kampusos.yemek.model.Siparis;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SiparisDeposu extends JpaRepository<Siparis, String> {

    /** Listeler son-N kayıtla sınırlanır (Pageable) — geçmiş büyüdükçe yanıt şişmesin. */
    List<Siparis> findByMusteriKullaniciIdOrderByOlusturulmaTarihiDesc(String musteriKullaniciId, Pageable sayfa);

    List<Siparis> findBySaticiIdOrderByOlusturulmaTarihiDesc(String saticiId, Pageable sayfa);

    /** Ciro raporu: teslim edilmiş siparişler (tarih aralığı teslim tarihine göre). */
    List<Siparis> findBySaticiIdAndDurumAndTeslimTarihiBetween(
            String saticiId, Siparis.SiparisDurumu durum, LocalDateTime baslangic, LocalDateTime bitis);

    /** Ciro/aktivite günlüğü: aralıktaki tüm siparişler (oluşturulma tarihine göre, en yeni önce). */
    List<Siparis> findBySaticiIdAndOlusturulmaTarihiBetweenOrderByOlusturulmaTarihiDesc(
            String saticiId, LocalDateTime baslangic, LocalDateTime bitis);

    /** Zaman aşımı görevi: eşikten eski, hâlâ onay bekleyen siparişler. */
    List<Siparis> findByDurumAndOlusturulmaTarihiBefore(Siparis.SiparisDurumu durum, LocalDateTime esik);

    /** Yoğunluk göstergesi: satıcının o anki aktif (hazırlık sürecindeki) sipariş sayısı. */
    long countBySaticiIdAndDurumIn(String saticiId, java.util.Collection<Siparis.SiparisDurumu> durumlar);
}
