package com.isik.kampusos.kulup.repository;
 
import com.isik.kampusos.kulup.model.KulupSaglikKaydi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
 
import java.util.Optional;
 
@Repository
public interface KulupSaglikKaydiDeposu extends JpaRepository<KulupSaglikKaydi, String> {
    Optional<KulupSaglikKaydi> findByKulupId(String kulupId);
}
