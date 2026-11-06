import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  StatusBar as RNStatusBar,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from './src/components/Header';
import { RepasScreen } from './src/screens/RepasScreen';
import { PlatsScreen } from './src/screens/PlatsScreen';
import { SuggestionsScreen } from './src/screens/SuggestionsScreen';
import { HistoriqueScreen } from './src/screens/HistoriqueScreen';
import { SettingsModal } from './src/components/SettingsModal';
import {
  getDishes,
  addDish,
  updateDish,
  removeDish,
  saveDishes,
  getSuggestions,
  addSuggestion,
  updateSuggestion,
  deleteSuggestion,
  saveSuggestions,
  toggleImportSuggestion,
  getMealHistory,
  addMealToHistory,
  deleteMealFromHistory,
  saveMealHistory,
} from './src/storage/storage';
import { Dish, MealHistoryEntry, TabType } from './src/types';
import { colors } from './src/theme/colors';
import { Ionicons } from '@expo/vector-icons';

function MainApp() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>('repas');
  const [userDishes, setUserDishes] = useState<Dish[]>([]);
  const [suggestions, setSuggestions] = useState<Dish[]>([]);
  const [mealHistory, setMealHistory] = useState<MealHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [prefilledMeal, setPrefilledMeal] = useState<MealHistoryEntry | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Load data on app launch
  useEffect(() => {
    const loadAppData = async () => {
      try {
        const [dishes, sugs, history] = await Promise.all([
          getDishes(),
          getSuggestions(),
          getMealHistory(),
        ]);
        setUserDishes(dishes);
        setSuggestions(sugs);
        setMealHistory(history);
      } catch (err) {
        console.error('Error loading initial data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadAppData();
  }, []);

  // Dish handlers
  const handleAddDish = useCallback(async (dish: Dish) => {
    const updated = await addDish(dish);
    setUserDishes(updated);
  }, []);

  const handleUpdateDish = useCallback(async (dish: Dish) => {
    const updated = await updateDish(dish);
    setUserDishes(updated);
  }, []);

  const handleDeleteDish = useCallback(async (dishId: string) => {
    const updated = await removeDish(dishId);
    setUserDishes(updated);
  }, []);

  // Suggestions handlers (Add, Update, Delete, Toggle Import)
  const handleAddSuggestion = useCallback(async (sug: Dish) => {
    const updated = await addSuggestion(sug);
    setSuggestions(updated);
  }, []);

  const handleUpdateSuggestion = useCallback(async (sug: Dish) => {
    const updated = await updateSuggestion(sug);
    setSuggestions(updated);
  }, []);

  const handleDeleteSuggestion = useCallback(async (sugId: string) => {
    const updated = await deleteSuggestion(sugId);
    setSuggestions(updated);
  }, []);

  const handleToggleSuggestion = useCallback(async (suggestion: Dish) => {
    const { dishes } = await toggleImportSuggestion(suggestion);
    setUserDishes(dishes);
  }, []);

  // History handlers & updating lastCookedDate on cooked dishes
  const handleValidateMeal = useCallback(
    async (entry: MealHistoryEntry) => {
      // 1. Add meal to history
      const updatedHistory = await addMealToHistory(entry);
      setMealHistory(updatedHistory);

      // 2. Identify all dishes used in this meal
      const cookedDishIds = new Set<string>();
      entry.mainDishes?.forEach(d => cookedDishIds.add(d.id));
      entry.sides?.forEach(d => cookedDishIds.add(d.id));
      entry.desserts?.forEach(d => cookedDishIds.add(d.id));
      if (!entry.vendrediAbsent) {
        entry.shabbatVendrediSoir?.forEach(d => cookedDishIds.add(d.id));
      }
      if (!entry.samediAbsent) {
        entry.shabbatSamediMidi?.forEach(d => cookedDishIds.add(d.id));
      }

      // 3. Update lastCookedDate timestamp on user dishes
      const updatedDishes = userDishes.map(dish => {
        if (cookedDishIds.has(dish.id)) {
          return {
            ...dish,
            lastCookedDate: entry.date,
          };
        }
        return dish;
      });

      setUserDishes(updatedDishes);
      await saveDishes(updatedDishes);
    },
    [userDishes]
  );

  const handleDeleteHistoryEntry = useCallback(async (id: string) => {
    const updated = await deleteMealFromHistory(id);
    setMealHistory(updated);
  }, []);

  const handleRepeatMeal = useCallback((meal: MealHistoryEntry) => {
    setPrefilledMeal(meal);
    setActiveTab('repas');
  }, []);

  // Settings handlers
  const handleResetDishes = useCallback(async (dishes: Dish[]) => {
    setUserDishes(dishes);
    await saveDishes(dishes);
  }, []);

  const handleResetSuggestions = useCallback(async (sugs: Dish[]) => {
    setSuggestions(sugs);
    await saveSuggestions(sugs);
  }, []);

  const handleClearHistory = useCallback(async () => {
    setMealHistory([]);
    await saveMealHistory([]);
  }, []);

  const handleImportData = useCallback(
    async (data: { dishes?: Dish[]; suggestions?: Dish[]; history?: MealHistoryEntry[] }) => {
      if (data.dishes) {
        setUserDishes(data.dishes);
        await saveDishes(data.dishes);
      }
      if (data.suggestions) {
        setSuggestions(data.suggestions);
        await saveSuggestions(data.suggestions);
      }
      if (data.history) {
        setMealHistory(data.history);
        await saveMealHistory(data.history);
      }
    },
    []
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Préparation de votre cuisine...</Text>
      </View>
    );
  }

  // Calculate safe bottom padding specifically accounting for Android navigation buttons
  const dynamicBottomPadding = Math.max(insets.bottom, 12) + (Platform.OS === 'android' ? 18 : 6);
  const dynamicTopPadding = Math.max(insets.top, Platform.OS === 'android' ? (RNStatusBar.currentHeight || 0) : 0);

  return (
    <View style={[styles.safeArea, { paddingTop: dynamicTopPadding }]}>
      <StatusBar style="dark" />

      {/* Main Header with Settings button */}
      <Header onOpenSettings={() => setIsSettingsOpen(true)} />

      {/* Active Screen View */}
      <View style={styles.contentContainer}>
        {activeTab === 'repas' && (
          <RepasScreen
            userDishes={userDishes}
            onValidateMeal={handleValidateMeal}
            onNavigateToHistory={() => setActiveTab('historique')}
            onNavigateToSuggestions={() => setActiveTab('suggestions')}
            prefilledMeal={prefilledMeal}
          />
        )}

        {activeTab === 'plats' && (
          <PlatsScreen
            userDishes={userDishes}
            onAddDish={handleAddDish}
            onUpdateDish={handleUpdateDish}
            onDeleteDish={handleDeleteDish}
            onNavigateToSuggestions={() => setActiveTab('suggestions')}
          />
        )}

        {activeTab === 'suggestions' && (
          <SuggestionsScreen
            suggestions={suggestions}
            userDishes={userDishes}
            onToggleSuggestion={handleToggleSuggestion}
            onAddSuggestion={handleAddSuggestion}
            onUpdateSuggestion={handleUpdateSuggestion}
            onDeleteSuggestion={handleDeleteSuggestion}
          />
        )}

        {activeTab === 'historique' && (
          <HistoriqueScreen
            history={mealHistory}
            onDeleteHistoryEntry={handleDeleteHistoryEntry}
            onNavigateToRepas={() => setActiveTab('repas')}
            onRepeatMeal={handleRepeatMeal}
          />
        )}
      </View>

      {/* Modern Bottom Navigation Bar with Android navigation bar clearance */}
      <View style={[styles.tabBar, { paddingBottom: dynamicBottomPadding }]}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('repas')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'repas' ? 'restaurant' : 'restaurant-outline'}
            size={22}
            color={activeTab === 'repas' ? colors.primary : colors.textMuted}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'repas' && styles.tabLabelActive,
            ]}
          >
            Repas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('plats')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'plats' ? 'book' : 'book-outline'}
            size={22}
            color={activeTab === 'plats' ? colors.primary : colors.textMuted}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'plats' && styles.tabLabelActive,
            ]}
          >
            Mes Plats
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('suggestions')}
          activeOpacity={0.7}
        >
          <View>
            <Ionicons
              name={activeTab === 'suggestions' ? 'bulb' : 'bulb-outline'}
              size={22}
              color={activeTab === 'suggestions' ? colors.primary : colors.textMuted}
            />
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{suggestions.length}</Text>
            </View>
          </View>
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'suggestions' && styles.tabLabelActive,
            ]}
          >
            Suggestions
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('historique')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'historique' ? 'time' : 'time-outline'}
            size={22}
            color={activeTab === 'historique' ? colors.primary : colors.textMuted}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'historique' && styles.tabLabelActive,
            ]}
          >
            Historique
          </Text>
        </TouchableOpacity>
      </View>

      {/* Settings & Backup Modal */}
      <SettingsModal
        visible={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        userDishes={userDishes}
        suggestions={suggestions}
        mealHistory={mealHistory}
        onResetDishes={handleResetDishes}
        onResetSuggestions={handleResetSuggestions}
        onClearHistory={handleClearHistory}
        onImportData={handleImportData}
      />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <MainApp />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.card,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 10,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  tabBadge: {
    position: 'absolute',
    top: -4,
    right: -12,
    backgroundColor: colors.addedGreenText,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 8,
  },
  tabBadgeText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
