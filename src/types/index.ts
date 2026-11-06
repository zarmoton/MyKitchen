export type DishType = 'complet' | 'principal' | 'accompagnement' | 'dessert';

export type OccasionType = 
  | 'semaine' 
  | 'chabbat_vendredi' 
  | 'chabbat_samedi' 
  | 'chabbat_tous' 
  | 'tous';

export type CuisineType = 'tunisien' | 'italien' | 'classique';

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
  notes?: string;
}

export type TabType = 'repas' | 'plats' | 'suggestions' | 'historique';

