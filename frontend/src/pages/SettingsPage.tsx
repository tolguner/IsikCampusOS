import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Shield, Monitor, Moon, Sun, MonitorSmartphone, Globe, Palette } from 'lucide-react';

export const SettingsPage = () => {
  const [theme, setTheme] = useState('system');
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    marketing: false,
    events: true
  });

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="w-full h-full animate-fade-in flex flex-col space-y-8 pb-10">
      
      <div className="mb-2">
        <h1 className="text-3xl font-extrabold text-white">Ayarlar</h1>
        <p className="text-white/40 mt-1">Uygulama tercihlerinizi ve bildirim ayarlarınızı yapılandırın.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Settings Sidebar */}
        <div className="md:col-span-1 space-y-2">
          <div className="p-4 rounded-2xl border border-white/5 bg-white/[0.02]">
            <nav className="flex flex-col gap-1">
              <button className="flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-500/10 text-indigo-400 font-medium text-sm text-left transition-colors">
                <Palette className="w-4 h-4" /> Görünüm & Tema
              </button>
              <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:bg-white/5 hover:text-white font-medium text-sm text-left transition-colors cursor-pointer">
                <Bell className="w-4 h-4" /> Bildirimler
              </button>
              <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:bg-white/5 hover:text-white font-medium text-sm text-left transition-colors cursor-pointer">
                <Globe className="w-4 h-4" /> Dil ve Bölge
              </button>
              <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:bg-white/5 hover:text-white font-medium text-sm text-left transition-colors cursor-pointer">
                <Shield className="w-4 h-4" /> Gizlilik
              </button>
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Theme Section */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-3xl border border-white/5 bg-white/[0.02]"
          >
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Monitor className="w-5 h-5 text-indigo-400" /> Tema Tercihi
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <button 
                onClick={() => setTheme('light')}
                className={`p-4 rounded-2xl border flex flex-col items-center gap-3 transition-all cursor-pointer ${theme === 'light' ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
              >
                <Sun className={`w-6 h-6 ${theme === 'light' ? 'text-indigo-400' : 'text-white/60'}`} />
                <span className={`text-sm font-medium ${theme === 'light' ? 'text-indigo-400' : 'text-white/60'}`}>Açık</span>
              </button>
              <button 
                onClick={() => setTheme('dark')}
                className={`p-4 rounded-2xl border flex flex-col items-center gap-3 transition-all cursor-pointer ${theme === 'dark' ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
              >
                <Moon className={`w-6 h-6 ${theme === 'dark' ? 'text-indigo-400' : 'text-white/60'}`} />
                <span className={`text-sm font-medium ${theme === 'dark' ? 'text-indigo-400' : 'text-white/60'}`}>Koyu</span>
              </button>
              <button 
                onClick={() => setTheme('system')}
                className={`p-4 rounded-2xl border flex flex-col items-center gap-3 transition-all cursor-pointer ${theme === 'system' ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
              >
                <MonitorSmartphone className={`w-6 h-6 ${theme === 'system' ? 'text-indigo-400' : 'text-white/60'}`} />
                <span className={`text-sm font-medium ${theme === 'system' ? 'text-indigo-400' : 'text-white/60'}`}>Sistem</span>
              </button>
            </div>
            <p className="text-xs text-white/40 mt-4 italic">* Not: Sistem şu anda ağırlıklı olarak Koyu mod için optimize edilmiştir.</p>
          </motion.div>

          {/* Notifications Section */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="p-6 rounded-3xl border border-white/5 bg-white/[0.02]"
          >
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-purple-400" /> Bildirim Tercihleri
            </h2>
            <div className="space-y-4">
              
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                <div>
                  <h4 className="text-sm font-medium text-white">E-posta Bildirimleri</h4>
                  <p className="text-xs text-white/40 mt-0.5">Önemli hesap güncellemelerini e-posta ile al.</p>
                </div>
                <button 
                  onClick={() => toggleNotification('email')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${notifications.email ? 'bg-indigo-500' : 'bg-white/20'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifications.email ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                <div>
                  <h4 className="text-sm font-medium text-white">Push (Tarayıcı) Bildirimleri</h4>
                  <p className="text-xs text-white/40 mt-0.5">Anlık mesajlar ve uyarılar için anında bildirim al.</p>
                </div>
                <button 
                  onClick={() => toggleNotification('push')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${notifications.push ? 'bg-indigo-500' : 'bg-white/20'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifications.push ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                <div>
                  <h4 className="text-sm font-medium text-white">Kampüs Etkinlikleri</h4>
                  <p className="text-xs text-white/40 mt-0.5">Yeni kulüp etkinlikleri ve duyurularından haberdar ol.</p>
                </div>
                <button 
                  onClick={() => toggleNotification('events')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${notifications.events ? 'bg-indigo-500' : 'bg-white/20'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifications.events ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
};
