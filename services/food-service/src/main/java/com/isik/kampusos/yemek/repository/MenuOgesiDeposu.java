package com.isik.kampusos.yemek.repository;

import com.isik.kampusos.yemek.model.MenuOgesi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface MenuOgesiDeposu extends JpaRepository<MenuOgesi, String> {
    List<MenuOgesi> findBySaticiIdAndDurumOrderByKategoriAscAdAsc(String saticiId, MenuOgesi.MenuDurumu durum);
    List<MenuOgesi> findBySaticiId(String saticiId);
    boolean existsBySaticiIdAndKategoriAndDurum(String saticiId, String kategori, MenuOgesi.MenuDurumu durum);

    /** Kategori adı değişince ilgili işletmenin tüm ürünlerindeki kategori adını günceller. */
    @Modifying
    @Transactional
    @Query("update MenuOgesi m set m.kategori = :yeni where m.saticiId = :saticiId and m.kategori = :eski")
    int kategoriYenidenAdlandir(@Param("saticiId") String saticiId,
                                @Param("eski") String eski, @Param("yeni") String yeni);
}
