package com.isik.kampusos.mesaj.dto;

import java.util.List;

/** Mesajlaşma istek gövdeleri. */
public class KonusmaTalepleri {
    public record KonusmaAcTalebi(String modul, String baglamId, List<String> katilimcilar, String baslik) {}
    public record KapatTalebi(String modul, String baglamId) {}
    public record MesajGonderTalebi(String icerik) {}
}
