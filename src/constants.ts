import { Hotel, Utensils, Coffee, ShoppingBag, Scissors, Stethoscope, Ticket, Car, Store } from 'lucide-react';

export interface PlaceTypeInfo {
  id: string;
  label: string;
  icon: any;
  color: string;
}

export const PLACE_TYPES: PlaceTypeInfo[] = [
  { id: 'Hotel', label: 'Hotel / Resort', icon: Hotel, color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
  { id: 'Restaurant', label: 'Restaurant & Dining', icon: Utensils, color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  { id: 'Cafe', label: 'Cafe & Bakery', icon: Coffee, color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  { id: 'Retail', label: 'Retail & Shopping', icon: ShoppingBag, color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
  { id: 'Salon & Spa', label: 'Salon, Spa & Beauty', icon: Scissors, color: 'bg-pink-500/20 text-pink-300 border-pink-500/30' },
  { id: 'Healthcare', label: 'Clinic & Healthcare', icon: Stethoscope, color: 'bg-teal-500/20 text-teal-300 border-teal-500/30' },
  { id: 'Entertainment', label: 'Entertainment & Leisure', icon: Ticket, color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  { id: 'Automotive', label: 'Automotive & Services', icon: Car, color: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
  { id: 'Other', label: 'Other Business', icon: Store, color: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
];
