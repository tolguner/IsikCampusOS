package com.isik.kampusos.bildirim.messaging;

import com.isik.kampusos.bildirim.dto.BildirimYaniti;
import com.isik.kampusos.bildirim.model.Bildirim;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Anlık (gerçek zamanlı) bildirim için SSE bağlantı kayıt defteri.
 * Bir bildirim kalıcılaştırıldığında, onu görmesi gereken açık bağlantılara anında push eder.
 * Görünürlük kuralı GET /bildirimler ile aynıdır (rol + alıcı eşleşmesi).
 */
@Component
@Slf4j
public class BildirimAkisYoneticisi {

    private static final long ZAMAN_ASIMI_MS = 30L * 60L * 1000L; // 30 dk; istemci otomatik yeniden bağlanır

    private record Abone(String kullaniciId, String roller, SseEmitter emitter) {}

    private final List<Abone> aboneler = new CopyOnWriteArrayList<>();

    public SseEmitter abone(String kullaniciId, String roller) {
        SseEmitter emitter = new SseEmitter(ZAMAN_ASIMI_MS);
        Abone abone = new Abone(kullaniciId, roller == null ? "" : roller, emitter);
        aboneler.add(abone);
        emitter.onCompletion(() -> aboneler.remove(abone));
        emitter.onTimeout(() -> { aboneler.remove(abone); emitter.complete(); });
        emitter.onError(e -> aboneler.remove(abone));
        try {
            emitter.send(SseEmitter.event().name("baglandi").data("ok"));
        } catch (Exception e) {
            aboneler.remove(abone);
        }
        return emitter;
    }

    /** Yeni bildirimi, görmesi gereken tüm açık bağlantılara anında iletir. */
    public void yayinla(Bildirim bildirim) {
        BildirimYaniti yanit = yanit(bildirim);
        for (Abone abone : aboneler) {
            if (!gorur(abone, bildirim)) {
                continue;
            }
            try {
                abone.emitter().send(SseEmitter.event().name("bildirim").data(yanit));
            } catch (Exception e) {
                aboneler.remove(abone);
            }
        }
    }

    private boolean gorur(Abone abone, Bildirim b) {
        return switch (b.getHedefKitle()) {
            case KULLANICI -> b.getAliciKullaniciId() != null && b.getAliciKullaniciId().equals(abone.kullaniciId());
            case TUM_KULLANICILAR -> true;
            case TUM_OGRENCILER -> abone.roller().contains("ROLE_STUDENT");
            case SKS_YONETICILERI -> abone.roller().contains("ROLE_SKS_ADMIN") || abone.roller().contains("ROLE_ADMIN");
            case KULUP_BASKANLARI -> false; // başkanlara KULLANICI olarak fan-out edilir
        };
    }

    private BildirimYaniti yanit(Bildirim b) {
        return BildirimYaniti.builder()
                .id(b.getId())
                .baslik(b.getBaslik())
                .mesaj(b.getMesaj())
                .baglantiUrl(b.getBaglantiUrl())
                .baglantiEtiketi(b.getBaglantiEtiketi())
                .resimUrl(b.getResimUrl())
                .tur(b.getTur().name())
                .hedefKitle(b.getHedefKitle().name())
                .ilgiliEtkinlikId(b.getIlgiliEtkinlikId())
                .olusturan(b.getOlusturan())
                .olusturanAdi(b.getOlusturanAdi())
                .okundu(false)
                .olusturulmaTarihi(b.getOlusturulmaTarihi())
                .build();
    }
}
