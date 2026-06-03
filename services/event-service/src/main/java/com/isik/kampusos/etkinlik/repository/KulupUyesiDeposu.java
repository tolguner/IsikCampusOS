package com.isik.kampusos.etkinlik.repository;
 
import com.isik.kampusos.etkinlik.model.KulupUyesi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
 
import java.util.Optional;
import java.util.List;
 
@Repository
public interface KulupUyesiDeposu extends JpaRepository<KulupUyesi, String> {
    Optional<KulupUyesi> findByKulupIdAndKullaniciId(String kulupId, String kullaniciId);
    List<KulupUyesi> findByKulupId(String kulupId);
    List<KulupUyesi> findByKulupIdAndDurum(String kulupId, KulupUyesi.UyeDurumu durum);
    List<KulupUyesi> findByKulupIdAndDurumIn(String kulupId, List<KulupUyesi.UyeDurumu> durumlar);
    List<KulupUyesi> findByKulupIdAndRol(String kulupId, KulupUyesi.UyeRolu rol);
    boolean existsByKulupIdAndKullaniciId(String kulupId, String kullaniciId);
    long countByKulupId(String kulupId);
    long countByKulupIdAndDurum(String kulupId, KulupUyesi.UyeDurumu durum);
    long countByKulupIdAndDurumIn(String kulupId, List<KulupUyesi.UyeDurumu> durumlar);
}
