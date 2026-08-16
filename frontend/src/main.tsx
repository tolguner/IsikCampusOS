import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { SayfaYukleniyor } from './components/ortak/SayfaYukleniyor'

// Düzen dışındaki tembel sayfalar (giriş, tanıtım, doğrulama) için üst seviye
// bekleme ekranı. Düzen içindeki sayfalar UygulamaDuzeni'ndeki Suspense
// tarafından karşılanır; böylece sayfa inerken üst bar ekranda kalır.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<SayfaYukleniyor />}>
      <App />
    </Suspense>
  </StrictMode>,
)
