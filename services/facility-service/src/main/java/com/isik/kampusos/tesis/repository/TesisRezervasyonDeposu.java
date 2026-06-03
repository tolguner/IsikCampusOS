package com.isik.kampusos.tesis.repository;

import com.isik.kampusos.tesis.model.TesisRezervasyon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;

@Repository
public interface TesisRezervasyonDeposu extends JpaRepository<TesisRezervasyon, String> {
    List<TesisRezervasyon> findByRezervasyonYapanKullaniciIdOrderByBaslangicTarihiDesc(String rezervasyonYapanKullaniciId);
    
    List<TesisRezervasyon> findByKaynakIdAndDurumIn(String kaynakId, List<TesisRezervasyon.RezervasyonDurumu> durumlar);
    
    List<TesisRezervasyon> findAllByOrderByBaslangicTarihiDesc();

    @Query("select b from TesisRezervasyon b where b.kaynak.id = :resourceId and b.bitisTarihi > :start and b.baslangicTarihi < :end and b.durum in :statuses")
    List<TesisRezervasyon> findCalendarBookings(
            @Param("resourceId") String resourceId,
            @Param("start") OffsetDateTime start,
            @Param("end") OffsetDateTime end,
            @Param("statuses") List<TesisRezervasyon.RezervasyonDurumu> statuses
    );
}
