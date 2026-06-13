package com.isik.kampusos.profil.repository;
 
import com.isik.kampusos.profil.model.ProfilDegisiklikIstegi;
import com.isik.kampusos.profil.model.ProfilDegisiklikIstegiDurumu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
 
import java.util.List;
 
@Repository
public interface ProfilDegisiklikIstegiDeposu extends JpaRepository<ProfilDegisiklikIstegi, String> {
    List<ProfilDegisiklikIstegi> findByKullaniciIdOrderByOlusturulmaTarihiDesc(String kullaniciId);
    List<ProfilDegisiklikIstegi> findByDurumOrderByOlusturulmaTarihiDesc(ProfilDegisiklikIstegiDurumu durum);
}
