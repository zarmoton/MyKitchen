import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  ActivityIndicator,
  StatusBar as RNStatusBar,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Header } from './src/components/Header';
import { RepasScreen } from './src/screens/RepasScreen';
import { PlatsScreen } from './src/screens/PlatsScreen';
import { SuggestionsScreen } from './src/screens/SuggestionsScreen';
import { HistoriqueScreen } from './src/screens/HistoriqueScreen';
import {
  getDishes,
  addDish,
  removeDish,
  toggleImportSuggestion,
  getMealHistory,
  addMealToHistory,
  deleteMealFromHistory,
} from './src/storage/storage';
import { Dish, MealHistoryEntry, TabType } from './src/types';
import { colors } from './src/theme/colors';
import { Ionicons } from '@expo/vector-icons';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('repas');
  const [userDishes, setUserDishes] = useState<Dish[]>([]);
  const [mealHistory, setMealHistory] = useState<MealHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [prefilledMeal, setPrefilledMeal] = useState<MealHistoryEntry | null>(null);

  // Load data on app launch
  useEffect(() => {
    const loadAppData = async () => {
      try {
        const [dishes, history] = await Promise.all([
          getDishes(),
          getMealHistory(),
        ]);
        setUserDishes(dishes);
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

  const handleDeleteDish = useCallback(async (dishId: string) => {
    const updated = await removeDish(dishId);
    setUserDishes(updated);
  }, []);

  const handleToggleSuggestion = useCallback(async (suggestion: Dish) => {
    const { dishes } = await toggleImportSuggestion(suggestion);
    setUserDishes(dishes);
  }, []);

  // History handlers
  const handleValidateMeal = useCallback(async (entry: MealHistoryEntry) => {
    const updated = await addMealToHistory(entry);
    setMealHistory(updated);
  }, []);

  const handleDeleteHistoryEntry = useCallback(async (id: string) => {
    const updated = await deleteMealFromHistory(id);
    setMealHistory(updated);
  }, []);

  const handleRepeatMeal = useCallback((meal: MealHistoryEntry) => {
    setPrefilledMeal(meal);
    setActiveTab('repas');
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Préparation de votre cuisine...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Main Header */}
      <Header />

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
            onDeleteDish={handleDeleteDish}
            onNavigateToSuggestions={() => setActiveTab('suggestions')}
          />
        )}

        {activeTab === 'suggestions' && (
          <SuggestionsScreen
            userDishes={userDishes}
            onToggleSuggestion={handleToggleSuggestion}
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

      {/* Modern Bottom Navigation Bar */}
      <View style={styles.tabBar}>
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
              <Text style={styles.tabBadgeText}>163</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.card,
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
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
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
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
