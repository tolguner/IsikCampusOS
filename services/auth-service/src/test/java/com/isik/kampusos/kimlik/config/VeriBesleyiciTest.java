package com.isik.kampusos.kimlik.config;
 
import com.isik.kampusos.kimlik.model.Kullanici;
import com.isik.kampusos.kimlik.model.KullaniciDurumu;
import com.isik.kampusos.kimlik.repository.KullaniciDeposu;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
 
import java.util.List;
 
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
 
@ExtendWith(MockitoExtension.class)
class VeriBesleyiciTest {
 
    @Mock
    private KullaniciDeposu kullaniciDeposu;
    @Mock
    private PasswordEncoder passwordEncoder;
 
    @Test
    void seedsAtakanCetinerAsFacilityAdminForSportsFacilities() {
        when(passwordEncoder.encode(anyString())).thenAnswer(invocation -> "hashed:" + invocation.getArgument(0));
 
        new VeriBesleyici(kullaniciDeposu, passwordEncoder).run();
 
        ArgumentCaptor<Kullanici> userCaptor = ArgumentCaptor.forClass(Kullanici.class);
        verify(kullaniciDeposu, org.mockito.Mockito.atLeastOnce()).save(userCaptor.capture());
 
        List<Kullanici> savedUsers = userCaptor.getAllValues();
        Kullanici facilityAdmin = savedUsers.stream()
                .filter(user -> "atakan.cetiner@isikun.edu.tr".equals(user.getEposta()))
                .findFirst()
                .orElseThrow();
 
        assertThat(facilityAdmin.getSifre()).isEqualTo("hashed:atakan.cetiner");
        assertThat(facilityAdmin.getRoller()).isEqualTo("ROLE_FACILITY_ADMIN");
        assertThat(facilityAdmin.getAd()).isEqualTo("Atakan");
        assertThat(facilityAdmin.getSoyad()).isEqualTo("Çetiner");
        assertThat(facilityAdmin.getDurum()).isEqualTo(KullaniciDurumu.AKTIF);
        assertThat(facilityAdmin.isEpostaDogrulandi()).isTrue();
        assertThat(facilityAdmin.isSifreDegistirmeli()).isFalse();
    }
}
