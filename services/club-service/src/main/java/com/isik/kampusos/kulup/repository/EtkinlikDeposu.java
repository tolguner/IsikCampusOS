package com.isik.kampusos.kulup.repository;
 
import com.isik.kampusos.kulup.model.Etkinlik;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
 
import java.util.List;
import java.util.Collection;
 
@Repository
public interface EtkinlikDeposu extends JpaRepository<Etkinlik, String> {
    List<Etkinlik> findByDurum(Etkinlik.EtkinlikDurumu durum);
    List<Etkinlik> findByDurumAndHatirlaticiEtkinTrue(Etkinlik.EtkinlikDurumu durum);
    List<Etkinlik> findByDurumInOrderByGuncellenmeTarihiDesc(Collection<Etkinlik.EtkinlikDurumu> durumlar);
    List<Etkinlik> findByKulup_Id(String kulupId);
    List<Etkinlik> findByKulup_IdAndDurumIn(String kulupId, Collection<Etkinlik.EtkinlikDurumu> durumlar);
    List<Etkinlik> findByKulup_YoneticiKullaniciId(String yoneticiKullaniciId);
    long countByKulup_Id(String kulupId);
}
