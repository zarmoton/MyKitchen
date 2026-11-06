export type DishType = 'complet' | 'principal' | 'accompagnement' | 'dessert';

export type OccasionType = 
  | 'semaine' 
  | 'chabbat_vendredi' 
  | 'chabbat_samedi' 
  | 'chabbat_tous' 
  | 'tous';

export type CuisineType = 'tunisien' | 'italien' | 'israelien' | 'francais' | 'classique';

export interface Dish {
  id: string;
  name: string;
  type: DishType;
  occasion: OccasionType;
  cuisine: CuisineType;
  description?: string;
  isCustom?: boolean;
  createdAt?: number;
  sourceSuggestionId?: string;
  lastCookedDate?: string; // ISO date string of when this dish was last prepared/selected
}

export type MealHistoryOccasion = 'semaine' | 'chabbat';
export type ShabbatSubOccasion = 'vendredi_soir' | 'samedi_midi' | 'les_deux';

export interface MealHistoryEntry {
  id: string;
  date: string; // ISO string
  displayDate: string; // French formatted date
  occasion: MealHistoryOccasion;
  shabbatSlot?: ShabbatSubOccasion;
  mainDishes: Dish[];
  sides: Dish[];
  desserts: Dish[];
  // Specific Chabbat breakdown
  shabbatVendrediSoir?: Dish[];
  shabbatSamediMidi?: Dish[];
  vendrediAbsent?: boolean; // Absent / Invité vendredi soir
  samediAbsent?: boolean;   // Absent / Invité samedi midi
  notes?: string;
}

export type TabType = 'repas' | 'plats' | 'suggestions' | 'historique';
