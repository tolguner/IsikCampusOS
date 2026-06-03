package com.isik.kampusos.kimlik.repository;
 
import com.isik.kampusos.kimlik.model.DogrulamaKodu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
 
import java.util.Optional;
 
@Repository
public interface DogrulamaKoduDeposu extends JpaRepository<DogrulamaKodu, String> {
    Optional<DogrulamaKodu> findByEpostaAndKodAndKodTuruAndKullanildiFalse(
            String eposta, String kod, String kodTuru);

    Optional<DogrulamaKodu> findFirstByKullaniciIdAndKodTuruAndKullanildiFalseOrderByOlusturulmaTarihiDesc(
            String kullaniciId, String kodTuru);
 
    void deleteByKullaniciIdAndKodTuru(String kullaniciId, String kodTuru);
}
