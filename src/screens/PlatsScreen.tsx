import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Dish, OccasionType, DishType, CuisineType } from '../types';
import { DishCard } from '../components/DishCard';
import { AddDishModal } from '../components/AddDishModal';
import { colors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';

interface PlatsScreenProps {
  userDishes: Dish[];
  onAddDish: (dish: Dish) => void;
  onUpdateDish?: (dish: Dish) => void;
  onDeleteDish: (dishId: string) => void;
  onNavigateToSuggestions: () => void;
  onToggleFavorite?: (dishId: string) => void;
}

export const PlatsScreen: React.FC<PlatsScreenProps> = ({
  userDishes,
  onAddDish,
  onUpdateDish,
  onDeleteDish,
  onNavigateToSuggestions,
  onToggleFavorite,
}) => {
  const [search, setSearch] = useState('');
  const [selectedOccasion, setSelectedOccasion] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCuisine, setSelectedCuisine] = useState<string>('all');
  const [selectedKashrut, setSelectedKashrut] = useState<string>('all');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);

  const favoritesCount = useMemo(() => {
    return userDishes.filter(d => d.isFavorite).length;
  }, [userDishes]);

  // Filtered & sorted dishes
  const filteredDishes = useMemo(() => {
    const list = userDishes.filter(dish => {
      // Favorites filter
      if (onlyFavorites && !dish.isFavorite) {
        return false;
      }

      // Search
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesName = dish.name.toLowerCase().includes(query);
        const matchesDesc = dish.description?.toLowerCase().includes(query);
        if (!matchesName && !matchesDesc) return false;
      }

      // Occasion
      if (selectedOccasion !== 'all') {
        if (selectedOccasion === 'semaine' && dish.occasion !== 'semaine' && dish.occasion !== 'tous') {
          return false;
        }
        if (selectedOccasion === 'chabbat' && !dish.occasion.startsWith('chabbat') && dish.occasion !== 'tous') {
          return false;
        }
        if (
          selectedOccasion === 'chabbat_vendredi' &&
          dish.occasion !== 'chabbat_vendredi' &&
          dish.occasion !== 'chabbat_tous' &&
          dish.occasion !== 'tous'
        ) {
          return false;
        }
        if (
          selectedOccasion === 'chabbat_samedi' &&
          dish.occasion !== 'chabbat_samedi' &&
          dish.occasion !== 'chabbat_tous' &&
          dish.occasion !== 'tous'
        ) {
          return false;
        }
      }

      // Type
      if (selectedType !== 'all' && dish.type !== selectedType) {
        return false;
      }

      // Cuisine
      if (selectedCuisine !== 'all' && dish.cuisine !== selectedCuisine) {
        return false;
      }

      // Kashrut (Halavi / Bassari / Poisson / Parve)
      if (selectedKashrut !== 'all' && dish.kashrut !== selectedKashrut) {
        return false;
      }

      return true;
    });

    // Tri : du moins récemment cuisiné (en haut) au plus récent (en bas)
    return list.sort((a, b) => {
      if (!a.lastCookedDate && !b.lastCookedDate) return 0;
      if (!a.lastCookedDate) return -1;
      if (!b.lastCookedDate) return 1;
      return new Date(a.lastCookedDate).getTime() - new Date(b.lastCookedDate).getTime();
    });
  }, [userDishes, search, selectedOccasion, selectedType, selectedCuisine, selectedKashrut, onlyFavorites]);

  const confirmDelete = useCallback(
    (dish: Dish) => {
      Alert.alert(
        'Supprimer ce plat',
        `Voulez-vous retirer "${dish.name}" de votre liste de plats ?`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: () => onDeleteDish(dish.id),
          },
        ]
      );
    },
    [onDeleteDish]
  );

  const renderDishItem = useCallback(
    ({ item }: { item: Dish }) => (
      <DishCard
        dish={item}
        showLastCooked={true}
        onEdit={setEditingDish}
        onDelete={confirmDelete}
        onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(item.id) : undefined}
      />
    ),
    [confirmDelete, onToggleFavorite]
  );

  return (
    <View style={styles.container}>
      {/* Top action row */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.screenTitle}>Mes Plats ({userDishes.length})</Text>
          <Text style={styles.screenSubtitle}>Triés par date de dernier passage en cuisine</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setIsAddModalOpen(true)}>
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Nouveau plat</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher dans mes plats..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Horizontal Scroll */}
      <View style={styles.filtersWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {/* Tous */}
          <TouchableOpacity
            style={[
              styles.filterChip,
              !onlyFavorites &&
                selectedOccasion === 'all' &&
                selectedType === 'all' &&
                selectedCuisine === 'all' &&
                selectedKashrut === 'all' &&
                styles.filterChipActive,
            ]}
            onPress={() => {
              setOnlyFavorites(false);
              setSelectedOccasion('all');
              setSelectedType('all');
              setSelectedCuisine('all');
              setSelectedKashrut('all');
            }}
          >
            <Text
              style={[
                styles.filterChipText,
                !onlyFavorites &&
                  selectedOccasion === 'all' &&
                  selectedType === 'all' &&
                  selectedCuisine === 'all' &&
                  selectedKashrut === 'all' &&
                  styles.filterChipTextActive,
              ]}
            >
              Tous ({userDishes.length})
            </Text>
          </TouchableOpacity>

          {/* Favoris */}
          <TouchableOpacity
            style={[styles.filterChip, onlyFavorites && styles.filterChipActiveHeart]}
            onPress={() => setOnlyFavorites(!onlyFavorites)}
          >
            <Ionicons
              name={onlyFavorites ? 'heart' : 'heart-outline'}
              size={13}
              color={onlyFavorites ? '#FFFFFF' : '#EF4444'}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.filterChipText, onlyFavorites && styles.filterChipTextActive]}>
              Favoris ({favoritesCount})
            </Text>
          </TouchableOpacity>

          <View style={styles.filterDivider} />

          {/* Catégories Casher (Halavi / Bassari / Poisson / Parve) */}
          <TouchableOpacity
            style={[styles.filterChip, selectedKashrut === 'bassari' && styles.filterChipActiveBassari]}
            onPress={() => setSelectedKashrut(selectedKashrut === 'bassari' ? 'all' : 'bassari')}
          >
            <Text style={[styles.filterChipText, selectedKashrut === 'bassari' && styles.filterChipTextActive]}>
              🥩 Bassari
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, selectedKashrut === 'halavi' && styles.filterChipActiveHalavi]}
            onPress={() => setSelectedKashrut(selectedKashrut === 'halavi' ? 'all' : 'halavi')}
          >
            <Text style={[styles.filterChipText, selectedKashrut === 'halavi' && styles.filterChipTextActive]}>
              🧀 Halavi
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, selectedKashrut === 'poisson' && styles.filterChipActivePoisson]}
            onPress={() => setSelectedKashrut(selectedKashrut === 'poisson' ? 'all' : 'poisson')}
          >
            <Text style={[styles.filterChipText, selectedKashrut === 'poisson' && styles.filterChipTextActive]}>
              🐟 Poisson
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, selectedKashrut === 'parve' && styles.filterChipActiveParve]}
            onPress={() => setSelectedKashrut(selectedKashrut === 'parve' ? 'all' : 'parve')}
          >
            <Text style={[styles.filterChipText, selectedKashrut === 'parve' && styles.filterChipTextActive]}>
              🌿 Parve
            </Text>
          </TouchableOpacity>

          {/* Nature / Type - Demandé expressément */}
          <TouchableOpacity
            style={[styles.filterChip, selectedType === 'complet' && styles.filterChipActive]}
            onPress={() => setSelectedType(selectedType === 'complet' ? 'all' : 'complet')}
          >
            <Text style={[styles.filterChipText, selectedType === 'complet' && styles.filterChipTextActive]}>
              🍲 Plats complets
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, selectedType === 'principal' && styles.filterChipActive]}
            onPress={() => setSelectedType(selectedType === 'principal' ? 'all' : 'principal')}
          >
            <Text style={[styles.filterChipText, selectedType === 'principal' && styles.filterChipTextActive]}>
              🥩 À accompagner
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, selectedType === 'accompagnement' && styles.filterChipActive]}
            onPress={() => setSelectedType(selectedType === 'accompagnement' ? 'all' : 'accompagnement')}
          >
            <Text style={[styles.filterChipText, selectedType === 'accompagnement' && styles.filterChipTextActive]}>
              🍟 Accompagnements
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, selectedType === 'dessert' && styles.filterChipActive]}
            onPress={() => setSelectedType(selectedType === 'dessert' ? 'all' : 'dessert')}
          >
            <Text style={[styles.filterChipText, selectedType === 'dessert' && styles.filterChipTextActive]}>
              🍰 Desserts
            </Text>
          </TouchableOpacity>

          <View style={styles.filterDivider} />

          {/* Chabbat Vendredi soir & Samedi midi - Demandé expressément */}
          <TouchableOpacity
            style={[styles.filterChip, selectedOccasion === 'chabbat_vendredi' && styles.filterChipActiveShabbat]}
            onPress={() => setSelectedOccasion(selectedOccasion === 'chabbat_vendredi' ? 'all' : 'chabbat_vendredi')}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedOccasion === 'chabbat_vendredi' && styles.filterChipTextActiveShabbat,
              ]}
            >
              🕯️ Chabbat vendredi soir
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, selectedOccasion === 'chabbat_samedi' && styles.filterChipActiveShabbat]}
            onPress={() => setSelectedOccasion(selectedOccasion === 'chabbat_samedi' ? 'all' : 'chabbat_samedi')}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedOccasion === 'chabbat_samedi' && styles.filterChipTextActiveShabbat,
              ]}
            >
              ☀️ Chabbat midi
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, selectedOccasion === 'chabbat' && styles.filterChipActiveShabbat]}
            onPress={() => setSelectedOccasion(selectedOccasion === 'chabbat' ? 'all' : 'chabbat')}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedOccasion === 'chabbat' && styles.filterChipTextActiveShabbat,
              ]}
            >
              🕯️☀️ Tout Chabbat
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, selectedOccasion === 'semaine' && styles.filterChipActiveSemaine]}
            onPress={() => setSelectedOccasion(selectedOccasion === 'semaine' ? 'all' : 'semaine')}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedOccasion === 'semaine' && styles.filterChipTextActiveSemaine,
              ]}
            >
              📅 Semaine
            </Text>
          </TouchableOpacity>

          <View style={styles.filterDivider} />

          {/* Cuisines */}
          <TouchableOpacity
            style={[styles.filterChip, selectedCuisine === 'tunisien' && styles.filterChipActiveTunisien]}
            onPress={() => setSelectedCuisine(selectedCuisine === 'tunisien' ? 'all' : 'tunisien')}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedCuisine === 'tunisien' && styles.filterChipTextActiveTunisien,
              ]}
            >
              Tunisien
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, selectedCuisine === 'italien' && styles.filterChipActiveItalien]}
            onPress={() => setSelectedCuisine(selectedCuisine === 'italien' ? 'all' : 'italien')}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedCuisine === 'italien' && styles.filterChipTextActiveItalien,
              ]}
            >
              Italien
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, selectedCuisine === 'israelien' && styles.filterChipActiveIsraelien]}
            onPress={() => setSelectedCuisine(selectedCuisine === 'israelien' ? 'all' : 'israelien')}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedCuisine === 'israelien' && styles.filterChipTextActive,
              ]}
            >
              Israélien
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, selectedCuisine === 'francais' && styles.filterChipActiveFrancais]}
            onPress={() => setSelectedCuisine(selectedCuisine === 'francais' ? 'all' : 'francais')}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedCuisine === 'francais' && styles.filterChipTextActive,
              ]}
            >
              Français
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, selectedCuisine === 'bbq' && styles.filterChipActiveBbq]}
            onPress={() => setSelectedCuisine(selectedCuisine === 'bbq' ? 'all' : 'bbq')}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedCuisine === 'bbq' && styles.filterChipTextActive,
              ]}
            >
              🔥 BBQ
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Dish List */}
      <FlatList
        data={filteredDishes}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        initialNumToRender={12}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        windowSize={5}
        removeClippedSubviews={true}
        renderItem={renderDishItem}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="restaurant-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>Aucun plat correspondant</Text>
            <Text style={styles.emptySubtitle}>
              Vous pouvez ajouter un nouveau plat avec le bouton ci-dessus ou piocher parmi nos suggestions !
            </Text>
            <TouchableOpacity style={styles.emptyActionBtn} onPress={onNavigateToSuggestions}>
              <Ionicons name="bulb-outline" size={18} color="#FFFFFF" />
              <Text style={styles.emptyActionBtnText}>Explorer les suggestions</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Modal Add / Edit */}
      <AddDishModal
        visible={isAddModalOpen || !!editingDish}
        initialDish={editingDish}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingDish(null);
        }}
        onSave={(dish) => {
          if (editingDish && onUpdateDish) {
            onUpdateDish(dish);
          } else {
            onAddDish(dish);
          }
          setIsAddModalOpen(false);
          setEditingDish(null);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  screenSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  addBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    gap: 6,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    padding: 0,
  },
  filtersWrapper: {
    marginBottom: 6,
  },
  filterScroll: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 8,
  },
  filterChip: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
  },
  filterChipActive: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  filterChipActiveSemaine: {
    backgroundColor: colors.semaine,
    borderColor: colors.semaine,
  },
  filterChipActiveShabbat: {
    backgroundColor: colors.shabbat,
    borderColor: colors.shabbat,
  },
  filterChipActiveHeart: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  filterChipActiveBassari: {
    backgroundColor: '#B91C1C',
    borderColor: '#B91C1C',
  },
  filterChipActiveHalavi: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  filterChipActivePoisson: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
  },
  filterChipActiveParve: {
    backgroundColor: '#15803D',
    borderColor: '#15803D',
  },
  filterChipActiveTunisien: {
    backgroundColor: colors.badgeTunisien,
    borderColor: colors.badgeTunisien,
  },
  filterChipActiveItalien: {
    backgroundColor: colors.badgeItalien,
    borderColor: colors.badgeItalien,
  },
  filterChipActiveIsraelien: {
    backgroundColor: colors.badgeIsraelien,
    borderColor: colors.badgeIsraelien,
  },
  filterChipActiveFrancais: {
    backgroundColor: colors.badgeFrancais,
    borderColor: colors.badgeFrancais,
  },
  filterChipActiveBbq: {
    backgroundColor: colors.badgeBbq,
    borderColor: colors.badgeBbq,
  },
  filterChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  filterChipTextActiveSemaine: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  filterChipTextActiveShabbat: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  filterChipTextActiveTunisien: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  filterChipTextActiveItalien: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  filterDivider: {
    width: 1,
    height: 20,
    backgroundColor: colors.border,
    marginHorizontal: 4,
    alignSelf: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13.5,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
  },
  emptyActionBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 20,
  },
  emptyActionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
