// OSRM "encoded polyline" (precision 5) çözücü → [enlem, boylam] noktaları.
// Backend RotaIstemcisi.polylineCoz ile aynı algoritma; haritada gerçek yol rotasını çizmek için.
export function polylineCoz(encoded?: string | null): [number, number][] {
  const noktalar: [number, number][] = [];
  if (!encoded) return noktalar;
  let index = 0;
  let lat = 0;
  let lng = 0;
  const len = encoded.length;
  while (index < len) {
    let sonuc = 1;
    let shift = 0;
    let b: number;
    do {
      b = encoded.charCodeAt(index++) - 63 - 1;
      sonuc += b << shift;
      shift += 5;
    } while (b >= 0x1f && index < len);
    lat += (sonuc & 1) !== 0 ? ~(sonuc >> 1) : sonuc >> 1;

    sonuc = 1;
    shift = 0;
    do {
      b = encoded.charCodeAt(index++) - 63 - 1;
      sonuc += b << shift;
      shift += 5;
    } while (b >= 0x1f && index < len);
    lng += (sonuc & 1) !== 0 ? ~(sonuc >> 1) : sonuc >> 1;

    noktalar.push([lat * 1e-5, lng * 1e-5]);
  }
  return noktalar;
}
