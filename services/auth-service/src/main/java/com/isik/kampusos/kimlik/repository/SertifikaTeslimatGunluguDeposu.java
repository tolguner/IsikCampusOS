package com.isik.kampusos.kimlik.repository;
 
import com.isik.kampusos.kimlik.model.SertifikaTeslimatGunlugu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
 
import java.util.Optional;
 
@Repository
public interface SertifikaTeslimatGunluguDeposu extends JpaRepository<SertifikaTeslimatGunlugu, String> {
    Optional<SertifikaTeslimatGunlugu> findBySertifikaKodu(String sertifikaKodu);
}
