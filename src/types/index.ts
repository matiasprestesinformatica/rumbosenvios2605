import type { LucideIcon } from 'lucide-react';

export type Driver = {
  id: string;
  name: string;
  status: 'Available' | 'On Delivery' | 'Offline';
  vehicle: string;
  contact: string;
  currentLocation?: string; 
  availabilityStart?: string; 
  availabilityEnd?: string; 
};

export type Order = {
  id: string;
  customerName: string;
  deliveryAddress: string;
  status: 'Pending' | 'In-Transit' | 'Delivered' | 'Failed' | 'Cancelled';
  assignedDriverId?: string;
  deadline: string; 
  packageType?: string;
  timeWindowStart?: string;
  timeWindowEnd?: string;
  urgency?: 'high' | 'medium' | 'low';
};

export type DeliveryMetric = {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number; 
  trendDirection?: 'up' | 'down';
  previousValue?: string | number;
};

export type PricedItem = {
  packageType: 'document' | 'small-parcel' | 'medium-parcel' | 'large-parcel';
  distance: number; // in km
  deliverySpeed: 'standard' | 'express' | 'overnight';
};

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  keywords?: string; // For potential future search functionality
  children?: NavItem[];
};
