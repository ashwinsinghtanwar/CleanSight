import L from 'leaflet';
import { SEV_COLOR } from './lib';

// SHAPE tells the complaint type, COLOUR tells the severity:
//   Waterlogging = water-DROP      Land garbage = rounded-SQUARE with a bin
//   Low = green · Medium = amber · High = red · no detection = slate · resolved = light grey
const drop = c => `<svg xmlns="http://www.w3.org/2000/svg" width="38" height="46" viewBox="0 0 38 46">
<path d="M19 2C19 2 4 20 4 29a15 15 0 0 0 30 0C34 20 19 2 19 2z" fill="${c}" stroke="#fff" stroke-width="3"/>
<path d="M11 30q4-4 8 0t8 0" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>
<path d="M12 36q3.5-3.5 7 0t7 0" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".8"/></svg>`;
const bin = c => `<svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" viewBox="0 0 38 38">
<rect x="2" y="2" width="34" height="34" rx="8" fill="${c}" stroke="#fff" stroke-width="3"/>
<g fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
<path d="M11 12h16M16 12V9.5h6V12M13 12l1.2 15h9.6L25 12M17 16v8M21 16v8"/></g></svg>`;
const pin = c => `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="44" viewBox="0 0 32 44">
<path d="M16 2C8 2 2 8 2 16c0 10 14 26 14 26s14-16 14-26C30 8 24 2 16 2z" fill="${c}" stroke="#fff" stroke-width="3"/><circle cx="16" cy="16" r="5.5" fill="#fff"/></svg>`;

const cache = {};
export function pinIcon(type, severity = 'None', resolved = false) {
  const key = `${type}|${severity}|${resolved}`;
  if (cache[key]) return cache[key];
  const color = resolved ? '#cbd5e1' : severity === 'pick' ? '#2563eb' : SEV_COLOR[severity] || SEV_COLOR.None;
  let ic;
  if (type === 'waterlogging')
    ic = L.divIcon({ html: drop(color), className: 'cs-marker', iconSize: [38, 46], iconAnchor: [19, 44], popupAnchor: [0, -40] });
  else if (type === 'garbage')
    ic = L.divIcon({ html: bin(color), className: 'cs-marker', iconSize: [38, 38], iconAnchor: [19, 19], popupAnchor: [0, -18] });
  else
    ic = L.divIcon({ html: pin(color), className: 'cs-marker', iconSize: [32, 44], iconAnchor: [16, 42], popupAnchor: [0, -38] });
  return (cache[key] = ic);
}
