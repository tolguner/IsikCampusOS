package com.isik.kampusos.etkinlik.repository;
 
import com.isik.kampusos.etkinlik.model.AkademikKadro;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
 
import java.util.List;
import java.util.Optional;
 
@Repository
public interface AkademikKadroDeposu extends JpaRepository<AkademikKadro, String> {
    Optional<AkademikKadro> findByEpostaIgnoreCase(String eposta);
    Optional<AkademikKadro> findByProfilUrl(String profilUrl);
 
    List<AkademikKadro> findByAktifTrueOrderByTamAdAsc(Pageable pageable);
 
    @Query("""
            select staff from AkademikKadro staff
            where staff.aktif = true
              and (
                lower(staff.tamAd) like lower(concat('%', :sorgu, '%'))
                or lower(coalesce(staff.akademikUnvan, '')) like lower(concat('%', :sorgu, '%'))
                or lower(coalesce(staff.eposta, '')) like lower(concat('%', :sorgu, '%'))
                or lower(coalesce(staff.bolum, '')) like lower(concat('%', :sorgu, '%'))
                or lower(coalesce(staff.fakulteVeyaBirim, '')) like lower(concat('%', :sorgu, '%'))
              )
            order by staff.tamAd asc
            """)
    List<AkademikKadro> aktifleriAra(@Param("sorgu") String sorgu, Pageable pageable);
 
    long countByAktifTrue();
 
    @Modifying
    @Query("update AkademikKadro staff set staff.aktif = false")
    void hepsiniPasifOlarakIsaretle();
}
