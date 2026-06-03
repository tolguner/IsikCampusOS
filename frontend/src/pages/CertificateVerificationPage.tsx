import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, BadgeCheck, CheckCircle2, Loader2, Search } from 'lucide-react';
import { authApi } from '../lib/api';
import { YOLLAR } from '../utils/paths';

type CertificateVerificationResponse = {
  valid: boolean;
  certificateCode: string;
  recipientName?: string;
  eventTitle?: string;
  clubName?: string;
  certificateTitle?: string;
  issuedAt?: string;
  sentAt?: string;
};

type CertificateVerificationApiResponse = {
  gecerli: boolean;
  sertifikaKodu: string;
  aliciAdi?: string;
  etkinlikBasligi?: string;
  kulupAdi?: string;
  sertifikaBasligi?: string;
  verilmeTarihi?: string;
  gonderilmeTarihi?: string;
};

const mapCertificateVerification = (data: CertificateVerificationApiResponse): CertificateVerificationResponse => ({
  valid: data.gecerli,
  certificateCode: data.sertifikaKodu,
  recipientName: data.aliciAdi,
  eventTitle: data.etkinlikBasligi,
  clubName: data.kulupAdi,
  certificateTitle: data.sertifikaBasligi,
  issuedAt: data.verilmeTarihi,
  sentAt: data.gonderilmeTarihi,
});

export const CertificateVerificationPage = () => {
  const [searchParams] = useSearchParams();
  const [certificateCode, setCertificateCode] = useState('');
  const [result, setResult] = useState<CertificateVerificationResponse | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const verifyCode = async (rawCode: string) => {
    const code = rawCode.trim();
    if (!code) return;

    setIsLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await authApi.get<CertificateVerificationApiResponse>(`/sertifikalar/dogrula/${encodeURIComponent(code)}`);
      setResult(mapCertificateVerification(res.data));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Sertifika kodu kontrol edilemedi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) return;
    setCertificateCode(code);
    verifyCode(code);
  }, [searchParams]);

  const verifyCertificate = async (event: FormEvent) => {
    event.preventDefault();
    verifyCode(certificateCode);
  };

  return (
    <div className="min-h-screen bg-[#050510] text-white relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#060818] via-[#0A0C27] to-[#070716]" />
        <div className="absolute -top-40 right-[-120px] w-[520px] h-[520px] rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute -bottom-48 left-[-120px] w-[560px] h-[560px] rounded-full bg-cyan-500/15 blur-3xl" />
      </div>

      <nav className="relative z-10 mx-5 mt-5 px-6 py-3.5 rounded-3xl flex justify-between items-center border border-white/10 bg-white/[0.035] backdrop-blur-xl">
        <Link to={YOLLAR.giris} className="flex items-center gap-3">
          <img src="/isik-ikon.png" alt="Işık Üniversitesi İkon" className="w-7 h-7 object-contain" />
          <div>
            <span className="font-bold text-lg text-white">Işık<span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">CampusOS</span></span>
            <p className="text-[11px] text-white/40 -mt-0.5">Sertifika Kontrolü</p>
          </div>
        </Link>
        <Link to={YOLLAR.giris} className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold text-white/70 bg-white/[0.06] hover:bg-white/[0.1] border border-white/10">
          <ArrowLeft className="w-4 h-4" />
          Giriş
        </Link>
      </nav>

      <main className="relative z-10 min-h-[calc(100vh-88px)] flex items-center justify-center px-6 py-10">
        <section className="w-full max-w-2xl rounded-3xl border border-white/10 bg-white/[0.045] p-6 sm:p-8 backdrop-blur-2xl shadow-2xl shadow-black/30">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-2xl bg-purple-500/15 border border-purple-300/20 flex items-center justify-center">
              <BadgeCheck className="w-5 h-5 text-purple-200" />
            </div>
            <div>
              <h1 className="text-2xl font-black">Sertifika Kodu Kontrolü</h1>
              <p className="text-sm text-white/40 mt-1">Katılım sertifikasının geçerliliğini doğrula.</p>
            </div>
          </div>

          <form onSubmit={verifyCertificate} className="flex flex-col sm:flex-row gap-3">
            <input
              value={certificateCode}
              onChange={event => setCertificateCode(event.target.value)}
              placeholder="CERT-XXXXXXXX-XXXXXXXX"
              className="flex-1 rounded-2xl bg-[#111123] border border-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-purple-400/60"
            />
            <button disabled={isLoading || !certificateCode.trim()} type="submit" className="inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black text-white bg-purple-500/80 hover:bg-purple-500 disabled:opacity-45">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Kontrol Et
            </button>
          </form>

          {error && (
            <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 flex items-center gap-3 text-sm font-semibold text-red-100">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          {result && (
            <div className={`mt-5 rounded-2xl border px-4 py-4 ${result.valid ? 'border-emerald-400/20 bg-emerald-500/10' : 'border-red-400/20 bg-red-500/10'}`}>
              <div className="flex items-center gap-3">
                {result.valid ? <CheckCircle2 className="w-5 h-5 text-emerald-200" /> : <AlertCircle className="w-5 h-5 text-red-200" />}
                <div>
                  <div className="font-black">{result.valid ? 'Geçerli sertifika' : 'Sertifika bulunamadı'}</div>
                  <div className="text-xs text-white/45 mt-0.5">{result.certificateCode}</div>
                </div>
              </div>

              {result.valid && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <Info label="Ad Soyad" value={result.recipientName} />
                  <Info label="Etkinlik" value={result.eventTitle} />
                  <Info label="Kulüp" value={result.clubName} />
                  <Info label="Sertifika" value={result.certificateTitle} />
                  <Info label="Düzenlenme" value={formatDate(result.issuedAt)} />
                  <Info label="Gönderim" value={formatDate(result.sentAt)} />
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

const Info = ({ label, value }: { label: string; value?: string }) => (
  <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-2">
    <div className="text-[11px] font-bold uppercase text-white/35">{label}</div>
    <div className="mt-1 font-bold text-white/85">{value || '-'}</div>
  </div>
);

const formatDate = (value?: string) => {
  if (!value) return '-';
  return new Date(value).toLocaleString('tr-TR');
};
