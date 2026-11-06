import AsyncStorage from '@react-native-async-storage/async-storage';
import { Dish, MealHistoryEntry } from '../types';
import { INITIAL_USER_DISHES } from '../data/defaultDishes';
import { SUGGESTIONS_DATABASE } from '../data/suggestionsDatabase';

const STORAGE_KEYS = {
  DISHES: '@mykitchen_user_dishes_v2',
  MEAL_HISTORY: '@mykitchen_meal_history_v1',
  SUGGESTIONS: '@mykitchen_suggestions_v1',
};

// ==========================================
// USER DISHES
// ==========================================
export const getDishes = async (): Promise<Dish[]> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.DISHES);
    if (!raw) {
      await AsyncStorage.setItem(STORAGE_KEYS.DISHES, JSON.stringify(INITIAL_USER_DISHES));
      return INITIAL_USER_DISHES;
    }
    return JSON.parse(raw);
  } catch (error) {
    console.error('Error loading dishes:', error);
    return INITIAL_USER_DISHES;
  }
};

export const saveDishes = async (dishes: Dish[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.DISHES, JSON.stringify(dishes));
  } catch (error) {
    console.error('Error saving dishes:', error);
  }
};

export const addDish = async (newDish: Dish): Promise<Dish[]> => {
  try {
    const current = await getDishes();
    const updated = [newDish, ...current];
    await saveDishes(updated);
    return updated;
  } catch (error) {
    console.error('Error adding dish:', error);
    return [];
  }
};

export const updateDish = async (updatedDish: Dish): Promise<Dish[]> => {
  try {
    const current = await getDishes();
    const updated = current.map(d => (d.id === updatedDish.id ? updatedDish : d));
    await saveDishes(updated);
    return updated;
  } catch (error) {
    console.error('Error updating dish:', error);
    return [];
  }
};

export const removeDish = async (dishId: string): Promise<Dish[]> => {
  try {
    const current = await getDishes();
    const updated = current.filter(d => d.id !== dishId && d.sourceSuggestionId !== dishId);
    await saveDishes(updated);
    return updated;
  } catch (error) {
    console.error('Error removing dish:', error);
    return [];
  }
};

export const toggleImportSuggestion = async (suggestion: Dish): Promise<{ dishes: Dish[]; isImported: boolean }> => {
  try {
    const current = await getDishes();
    const existingIndex = current.findIndex(
      d => d.sourceSuggestionId === suggestion.id || d.name.toLowerCase() === suggestion.name.toLowerCase()
    );

    let updated: Dish[];
    let isImported = false;

    if (existingIndex >= 0) {
      // Remove
      updated = current.filter((_, idx) => idx !== existingIndex);
      isImported = false;
    } else {
      // Add
      const dishToAdd: Dish = {
        ...suggestion,
        id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        sourceSuggestionId: suggestion.id,
        isCustom: false,
        createdAt: Date.now(),
      };
      updated = [dishToAdd, ...current];
      isImported = true;
    }

    await saveDishes(updated);
    return { dishes: updated, isImported };
  } catch (error) {
    console.error('Error toggling suggestion:', error);
    return { dishes: [], isImported: false };
  }
};

// ==========================================
// SUGGESTIONS (MUTABLE: ADD, EDIT, DELETE)
// ==========================================
export const getSuggestions = async (): Promise<Dish[]> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.SUGGESTIONS);
    if (!raw) {
      await AsyncStorage.setItem(STORAGE_KEYS.SUGGESTIONS, JSON.stringify(SUGGESTIONS_DATABASE));
      return SUGGESTIONS_DATABASE;
    }
    return JSON.parse(raw);
  } catch (error) {
    console.error('Error loading suggestions:', error);
    return SUGGESTIONS_DATABASE;
  }
};

export const saveSuggestions = async (suggestions: Dish[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SUGGESTIONS, JSON.stringify(suggestions));
  } catch (error) {
    console.error('Error saving suggestions:', error);
  }
};

export const addSuggestion = async (newSug: Dish): Promise<Dish[]> => {
  try {
    const current = await getSuggestions();
    const updated = [newSug, ...current];
    await saveSuggestions(updated);
    return updated;
  } catch (error) {
    console.error('Error adding suggestion:', error);
    return [];
  }
};

export const updateSuggestion = async (updatedSug: Dish): Promise<Dish[]> => {
  try {
    const current = await getSuggestions();
    const updated = current.map(s => (s.id === updatedSug.id ? updatedSug : s));
    await saveSuggestions(updated);
    return updated;
  } catch (error) {
    console.error('Error updating suggestion:', error);
    return [];
  }
};

export const deleteSuggestion = async (sugId: string): Promise<Dish[]> => {
  try {
    const current = await getSuggestions();
    const updated = current.filter(s => s.id !== sugId);
    await saveSuggestions(updated);
    return updated;
  } catch (error) {
    console.error('Error deleting suggestion:', error);
    return [];
  }
};

// ==========================================
// MEAL HISTORY
// ==========================================
export const getMealHistory = async (): Promise<MealHistoryEntry[]> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.MEAL_HISTORY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (error) {
    console.error('Error loading history:', error);
    return [];
  }
};

export const saveMealHistory = async (history: MealHistoryEntry[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.MEAL_HISTORY, JSON.stringify(history));
  } catch (error) {
    console.error('Error saving meal history:', error);
  }
};

export const addMealToHistory = async (entry: MealHistoryEntry): Promise<MealHistoryEntry[]> => {
  try {
    const current = await getMealHistory();
    const updated = [entry, ...current];
    await saveMealHistory(updated);
    return updated;
  } catch (error) {
    console.error('Error adding meal to history:', error);
    return [];
  }
};

export const deleteMealFromHistory = async (entryId: string): Promise<MealHistoryEntry[]> => {
  try {
    const current = await getMealHistory();
    const updated = current.filter(item => item.id !== entryId);
    await saveMealHistory(updated);
    return updated;
  } catch (error) {
    console.error('Error deleting meal from history:', error);
    return [];
  }
};
