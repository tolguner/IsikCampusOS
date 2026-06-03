package com.isik.kampusos.etkinlik.repository;
 
import com.isik.kampusos.etkinlik.model.KulupDuyurusu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
 
import java.util.List;
 
@Repository
public interface KulupDuyurusuDeposu extends JpaRepository<KulupDuyurusu, String> {
    List<KulupDuyurusu> findByKulupIdOrderByOlusturulmaTarihiDesc(String kulupId);
}
