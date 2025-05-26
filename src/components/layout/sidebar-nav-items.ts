import type { NavItem } from '@/types';
import { LayoutDashboard, Users, Package, Route, MapPin, DollarSign } from 'lucide-react';

export const NAV_ITEMS: NavItem[] = [
  {
    href: '/',
    label: 'Panel de Control',
    icon: LayoutDashboard,
    keywords: 'dashboard analytics metrics',
  },
  {
    href: '/orders',
    label: 'Gestión de Pedidos',
    icon: Package,
    keywords: 'orders packages delivery management',
  },
  {
    href: '/drivers',
    label: 'Gestión de Repartidores',
    icon: Users,
    keywords: 'drivers personnel staff management',
  },
  {
    href: '/delivery-suggestions',
    label: 'Sugerencia de Rutas',
    icon: Route,
    keywords: 'ai suggestions routes optimization',
  },
  {
    href: '/tracking',
    label: 'Seguimiento en Vivo',
    icon: MapPin,
    keywords: 'tracking map real-time location',
  },
  {
    href: '/pricing',
    label: 'Estimación de Precios',
    icon: DollarSign,
    keywords: 'pricing calculator estimation',
  },
];
