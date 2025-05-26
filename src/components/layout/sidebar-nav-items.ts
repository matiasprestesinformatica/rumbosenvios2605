
import type { NavItem } from '@/types';
import { LayoutDashboard, Users2, Building, Truck, Package, ListChecks, Map, Settings } from 'lucide-react';

export const NAV_ITEMS: NavItem[] = [
  {
    href: '/',
    label: 'Panel de Control',
    icon: LayoutDashboard,
    keywords: 'dashboard inicio metricas',
  },
  {
    href: '/clientes',
    label: 'Clientes',
    icon: Users2,
    keywords: 'clientes usuarios personas',
  },
  {
    href: '/empresas',
    label: 'Empresas',
    icon: Building,
    keywords: 'empresas negocios compañias',
  },
  {
    href: '/repartidores',
    label: 'Repartidores',
    icon: Truck, // Using Truck for drivers as per previous context. Moped or Bike could be alternatives.
    keywords: 'repartidores conductores personal entrega',
  },
  {
    href: '/envios',
    label: 'Envíos', // Could also be Pedidos (Orders)
    icon: Package,
    keywords: 'envios pedidos paquetes gestion',
  },
  {
    href: '/repartos',
    label: 'Repartos', // Specific deliveries or delivery runs
    icon: ListChecks,
    keywords: 'repartos entregas logistica',
  },
  {
    href: '/mapa-envios',
    label: 'Mapa de Envíos',
    icon: Map,
    keywords: 'mapa seguimiento tiempo real localizacion',
  },
  // Settings is often in a footer or user menu, but can be here too.
  // {
  //   href: '/configuracion',
  //   label: 'Configuración',
  //   icon: Settings,
  //   keywords: 'configuracion ajustes cuenta',
  // },
];
