package com.isik.kampusos.profil.repository;
 
import com.isik.kampusos.profil.model.Profil;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
 
import java.util.Optional;
 
@Repository
public interface ProfilDeposu extends JpaRepository<Profil, String> {
    Optional<Profil> findByKullaniciId(String kullaniciId);
 
    @org.springframework.transaction.annotation.Transactional
    void deleteByKullaniciId(String kullaniciId);
}
