package com.isik.kampusos.tesis.repository;

import com.isik.kampusos.tesis.model.TesisKullanilabilirlikKurali;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface TesisKullanilabilirlikKuraliDeposu extends JpaRepository<TesisKullanilabilirlikKurali, String> {
    List<TesisKullanilabilirlikKurali> findByKaynakIdOrderByHaftaninGunuAscBaslangicSaatiAsc(String kaynakId);

    @Transactional
    void deleteByKaynakId(String kaynakId);
}
