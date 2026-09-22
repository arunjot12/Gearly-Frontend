import { Zap, Car, Layers, Cpu, Package } from 'lucide-react';

export function getCategoryInfo(name = '', descri = '') {
  const text = `${name} ${descri}`.toLowerCase();
  if (/brake|pad|rotor|caliper|disc/i.test(text)) {
    return { name: 'Brakes', icon: Zap, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.14)' };
  }
  if (/engine|spark|piston|filter|oil|timing|gasket|turbo|valve/i.test(text)) {
    return { name: 'Engine & Powertrain', icon: Car, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.14)' };
  }
  if (/suspension|strut|shock|spring|arm|bushing|sway/i.test(text)) {
    return { name: 'Suspension', icon: Layers, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.14)' };
  }
  if (/electric|sensor|battery|alternator|starter|ecu|relay|wire|light/i.test(text)) {
    return { name: 'Electrical & Sensors', icon: Cpu, color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.14)' };
  }
  return { name: 'OEM Replacement', icon: Package, color: '#10b981', bg: 'rgba(16, 185, 129, 0.14)' };
}
