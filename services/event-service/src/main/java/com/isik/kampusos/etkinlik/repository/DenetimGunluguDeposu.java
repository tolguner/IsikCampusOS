package com.isik.kampusos.etkinlik.repository;
 
import com.isik.kampusos.etkinlik.model.DenetimGunlugu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
 
import java.util.List;
 
@Repository
public interface DenetimGunluguDeposu extends JpaRepository<DenetimGunlugu, String> {
    List<DenetimGunlugu> findByVarlikTuruAndVarlikIdOrderByOlusturulmaTarihiDesc(DenetimGunlugu.VarlikTuru varlikTuru, String varlikId);
}
