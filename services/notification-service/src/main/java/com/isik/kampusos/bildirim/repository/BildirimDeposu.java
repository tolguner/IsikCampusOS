package com.isik.kampusos.bildirim.repository;

import com.isik.kampusos.bildirim.model.Bildirim;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface BildirimDeposu extends JpaRepository<Bildirim, String> {
    List<Bildirim> findByAliciKullaniciIdOrHedefKitleInOrderByOlusturulmaTarihiDesc(
            String aliciKullaniciId,
            Collection<Bildirim.HedefKitle> hedefKitleler
    );
}
