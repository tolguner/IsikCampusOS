package com.isik.kampusos.yemek.repository;

import com.isik.kampusos.yemek.model.MenuOgesi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MenuOgesiDeposu extends JpaRepository<MenuOgesi, String> {
    List<MenuOgesi> findBySaticiIdAndDurumOrderByKategoriAscAdAsc(String saticiId, MenuOgesi.MenuDurumu durum);
    List<MenuOgesi> findBySaticiId(String saticiId);
}
