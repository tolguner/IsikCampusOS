package com.isik.kampusos.etkinlik.repository;
 
import com.isik.kampusos.etkinlik.model.KulupSaglikKaydi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
 
import java.util.Optional;
 
@Repository
public interface KulupSaglikKaydiDeposu extends JpaRepository<KulupSaglikKaydi, String> {
    Optional<KulupSaglikKaydi> findByKulupId(String kulupId);
}
