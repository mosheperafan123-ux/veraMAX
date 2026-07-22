// Genera dos demos de ejemplo (dental + estética) para previsualizar el template.
import { generateDemo } from '../lib/demo-generator.ts';

const dental = {
  id: 990001,
  nombre: 'Odontología del Norte',
  categoria: 'odontologo',
  telefono: '3001234567',
  direccion: 'Cra 66 #13-45, San Fernando, Cali, Valle del Cauca',
  maps_url: 'https://maps.google.com/?q=Odontologia+del+Norte',
  rating: 4.8,
  resenas: 327,
  instagram: 'odontologiadelnorte',
  facebook: 'odontologiadelnorte',
  sitio_web: null,
  estado: 'nuevo', temperatura: 'frio', demo_url: null, confirmo_web: 0,
  seguimientos: 0, notas: null, contactado_en: null, ultimo_contacto: null,
  creado_en: '2026-01-01 00:00:00',
};

const estetica = {
  ...dental,
  id: 990002,
  nombre: 'Centro de Estética Bella Vida',
  categoria: 'estetica',
  telefono: '3109876543',
  direccion: 'Av 6N #28-10, Granada, Cali, Valle del Cauca',
  rating: 4.9,
  resenas: 215,
  instagram: 'bellavidaspa',
  facebook: null,
};

for (const lead of [dental, estetica]) {
  const res = generateDemo(lead);
  console.log(`✓ ${lead.categoria.padEnd(11)} → ${res.filePath}`);
}
