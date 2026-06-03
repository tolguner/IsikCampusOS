package com.isik.kampusos.kimlik.repository;
 
import com.isik.kampusos.kimlik.model.Kullanici;
import com.isik.kampusos.kimlik.model.KullaniciDurumu;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
 
import java.util.Optional;
 
@Repository
public interface KullaniciDeposu extends JpaRepository<Kullanici, String>, JpaSpecificationExecutor<Kullanici> {
    Optional<Kullanici> findByEposta(String eposta);
    boolean existsByEposta(String eposta);
    boolean existsByOgrenciNumarasi(String ogrenciNumarasi);
    Optional<Kullanici> findByOgrenciNumarasi(String ogrenciNumarasi);
 
    @Query("SELECT k FROM Kullanici k WHERE k.roller LIKE '%ROLE_STUDENT%' " +
           "AND (:search IS NULL OR LOWER(k.ad) LIKE LOWER(CONCAT('%',:search,'%')) " +
           "OR LOWER(k.soyad) LIKE LOWER(CONCAT('%',:search,'%')) " +
           "OR LOWER(k.ogrenciNumarasi) LIKE LOWER(CONCAT('%',:search,'%')) " +
           "OR LOWER(k.eposta) LIKE LOWER(CONCAT('%',:search,'%'))) " +
           "AND (:durum IS NULL OR k.durum = :durum) " +
           "AND (:fakulte IS NULL OR k.fakulte = :fakulte) " +
           "ORDER BY k.olusturulmaTarihi DESC")
    Page<Kullanici> ogrencileriBul(
            @Param("search") String search,
            @Param("durum") KullaniciDurumu durum,
            @Param("fakulte") String fakulte,
            Pageable pageable
    );
}
