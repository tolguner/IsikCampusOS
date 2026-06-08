package com.isik.kampusos.yemek.repository;

import com.isik.kampusos.yemek.model.CalismaSaati;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CalismaSaatiDeposu extends JpaRepository<CalismaSaati, String> {
    List<CalismaSaati> findBySaticiIdOrderByGunAsc(String saticiId);
    Optional<CalismaSaati> findBySaticiIdAndGun(String saticiId, short gun);

    /**
     * Bulk delete (hemen çalışır) — türetilmiş load-then-delete'in flush sırasında
     * INSERT'lerden sonra çalışıp benzersizlik kısıtını ihlal etmesini önler.
     */
    @Modifying
    @Query("delete from CalismaSaati c where c.saticiId = :saticiId")
    void deleteBySaticiId(@Param("saticiId") String saticiId);
}
