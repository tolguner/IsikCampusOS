import { CircleMarker, MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface LocationPickerProps {
  latitude: number;
  longitude: number;
  onChange: (lat: number, lng: number) => void;
}

export const LocationPicker = ({ latitude, longitude, onChange }: LocationPickerProps) => {
  const ClickHandler = () => {
    useMapEvents({
      click(event) {
        onChange(Number(event.latlng.lat.toFixed(6)), Number(event.latlng.lng.toFixed(6)));
      },
    });
    return null;
  };

  return (
    <div className="h-64 rounded-3xl overflow-hidden border border-white/10">
      <MapContainer center={[latitude, longitude]} zoom={15} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler />
        <CircleMarker center={[latitude, longitude]} radius={10} pathOptions={{ color: '#7c3aed', fillColor: '#a855f7', fillOpacity: 0.8 }} />
      </MapContainer>
    </div>
  );
};
