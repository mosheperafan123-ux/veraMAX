/**
 * Inserta leads de ejemplo para probar el dashboard sin scrapear.
 * Uso: npm run seed
 */
import { insertLead, getDb } from '../lib/db';

const ejemplos = [
  { nombre: 'Clínica Dental Sonríe', categoria: 'odontologo' as const, telefono: '3001234567', direccion: 'Av. 6 #23-10, Granada, Cali', maps_url: 'https://maps.google.com', rating: 4.8, resenas: 214 },
  { nombre: 'OdontoSalud Especialistas', categoria: 'odontologo' as const, telefono: '3017654321', direccion: 'Cra 100 #11-60, Ciudad Jardín, Cali', maps_url: 'https://maps.google.com', rating: 4.6, resenas: 132 },
  { nombre: 'Estética Bella Piel', categoria: 'estetica' as const, telefono: '3022223344', direccion: 'Cl 5 #38-25, San Fernando, Cali', maps_url: 'https://maps.google.com', rating: 4.9, resenas: 187 },
  { nombre: 'Spa Renacer Facial', categoria: 'estetica' as const, telefono: '3045556677', direccion: 'Av. Roosevelt #26-50, Cali', maps_url: 'https://maps.google.com', rating: 4.7, resenas: 98 },
  { nombre: 'Centro Odontológico Norte', categoria: 'odontologo' as const, telefono: '3038889900', direccion: 'Cl 70 #5-12, Cali', maps_url: 'https://maps.google.com', rating: 4.5, resenas: 76 },
];

let n = 0;
for (const e of ejemplos) {
  const id = insertLead(e);
  if (id) n++;
}
console.log(`✅ ${n} leads de ejemplo insertados.`);
getDb().close();
