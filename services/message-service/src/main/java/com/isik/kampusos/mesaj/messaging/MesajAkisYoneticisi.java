package com.isik.kampusos.mesaj.messaging;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Gerçek zamanlı mesaj teslimi için SSE bağlantı kayıt defteri (notification SSE deseni).
 * Yeni mesaj, konuşmanın açık bağlantıdaki katılımcılarına anında push edilir.
 */
@Component
@Slf4j
public class MesajAkisYoneticisi {

    private static final long ZAMAN_ASIMI_MS = 30L * 60L * 1000L; // 30 dk; istemci otomatik yeniden bağlanır

    private record Abone(String kullaniciId, SseEmitter emitter) {}

    private final List<Abone> aboneler = new CopyOnWriteArrayList<>();

    public SseEmitter abone(String kullaniciId) {
        SseEmitter emitter = new SseEmitter(ZAMAN_ASIMI_MS);
        Abone abone = new Abone(kullaniciId, emitter);
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

    /** Yeni mesajı, verilen alıcı kullanıcıların açık bağlantılarına iletir. */
    public void yayinla(Set<String> aliciIdler, Object yanit) {
        for (Abone abone : aboneler) {
            if (!aliciIdler.contains(abone.kullaniciId())) continue;
            try {
                abone.emitter().send(SseEmitter.event().name("mesaj").data(yanit));
            } catch (Exception e) {
                aboneler.remove(abone);
            }
        }
    }
}
