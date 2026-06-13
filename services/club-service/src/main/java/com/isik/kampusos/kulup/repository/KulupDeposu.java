package com.isik.kampusos.kulup.repository;
 
import com.isik.kampusos.kulup.model.Kulup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
 
import java.util.List;
import java.util.Optional;
 
@Repository
public interface KulupDeposu extends JpaRepository<Kulup, String> {
    List<Kulup> findByYoneticiKullaniciIdAndSilindiFalse(String yoneticiKullaniciId);
    List<Kulup> findAllBySilindiFalseOrderByAdAsc();
    List<Kulup> findByAktifTrueAndSilindiFalseOrderByAdAsc();
    boolean existsByAdIgnoreCaseAndSilindiFalse(String ad);
    boolean existsByAdIgnoreCaseAndSilindiFalseAndIdNot(String ad, String id);
    boolean existsByYoneticiKullaniciIdAndSilindiFalse(String yoneticiKullaniciId);
    boolean existsByYoneticiKullaniciIdAndSilindiFalseAndIdNot(String yoneticiKullaniciId, String id);
    boolean existsByDanismanAkademikPersonelIdAndSilindiFalse(String danismanAkademikPersonelId);
    boolean existsByDanismanAkademikPersonelIdAndSilindiFalseAndIdNot(String danismanAkademikPersonelId, String id);
    Optional<Kulup> findByAdIgnoreCaseAndSilindiFalse(String ad);
    Optional<Kulup> findByIdAndSilindiFalse(String id);
}
