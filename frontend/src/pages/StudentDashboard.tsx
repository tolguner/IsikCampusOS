import { useAuthStore } from '../store/authStore';
import { YOLLAR } from '../utils/paths';

export const StudentDashboard = () => {
  const user = useAuthStore(state => state.user);

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-6 mt-20">
      <h1 className="text-5xl font-extrabold gradient-text">
        Kontrol Paneli
      </h1>
      <p className="text-xl text-white/40 text-center max-w-2xl leading-relaxed">
        Hoş geldin{user?.fullName ? `, ${user.fullName}` : ''}! Kampüs hayatını yönetmek için hazırsın.
        Kulüpleri keşfet, kulüp etkinliklerine katıl ve kampüs hayatını tek yerden yönet.
      </p>
      <div className="flex gap-4 mt-8">
        <button onClick={() => window.location.href = YOLLAR.kulupler} className="px-8 py-3 rounded-2xl gradient-btn shadow-lg shadow-indigo-500/20 cursor-pointer">
          Kulüpleri Keşfet
        </button>
        <button onClick={() => window.location.href = YOLLAR.tesisRezervasyon} className="px-8 py-3 rounded-2xl font-semibold text-white cursor-pointer transition-all"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
          Tesis Rezerve Et
        </button>
      </div>
    </div>
  );
};
