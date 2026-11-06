import React, { useState, useMemo } from 'react';
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
  onDeleteDish: (dishId: string) => void;
  onNavigateToSuggestions: () => void;
}

export const PlatsScreen: React.FC<PlatsScreenProps> = ({
  userDishes,
  onAddDish,
  onDeleteDish,
  onNavigateToSuggestions,
}) => {
  const [search, setSearch] = useState('');
  const [selectedOccasion, setSelectedOccasion] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCuisine, setSelectedCuisine] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Filtered dishes
  const filteredDishes = useMemo(() => {
    return userDishes.filter(dish => {
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
      }

      // Type
      if (selectedType !== 'all' && dish.type !== selectedType) {
        return false;
      }

      // Cuisine
      if (selectedCuisine !== 'all' && dish.cuisine !== selectedCuisine) {
        return false;
      }

      return true;
    });
  }, [userDishes, search, selectedOccasion, selectedType, selectedCuisine]);

  const confirmDelete = (dish: Dish) => {
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
  };

  return (
    <View style={styles.container}>
      {/* Top action row */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.screenTitle}>Mes Plats ({userDishes.length})</Text>
          <Text style={styles.screenSubtitle}>Les plats habituels de votre maison</Text>
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
          {/* Occasion / Période */}
          <TouchableOpacity
            style={[styles.filterChip, selectedOccasion === 'all' && styles.filterChipActive]}
            onPress={() => setSelectedOccasion('all')}
          >
            <Text style={[styles.filterChipText, selectedOccasion === 'all' && styles.filterChipTextActive]}>
              Tous les repas ({userDishes.length})
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
              🕯️ Chabbat
            </Text>
          </TouchableOpacity>

          <View style={styles.filterDivider} />

          {/* Nature / Type */}
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

          {/* Cuisine */}
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
              🇹🇳 Tunisien
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
              🇮🇹 Italien
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Dish List */}
      <FlatList
        data={filteredDishes}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <DishCard dish={item} onDelete={() => confirmDelete(item)} />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="restaurant-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>Aucun plat correspondant</Text>
            <Text style={styles.emptySubtitle}>
              Vous pouvez ajouter un nouveau plat avec le bouton ci-dessus ou piocher parmi nos 160+ suggestions !
            </Text>
            <TouchableOpacity style={styles.emptyActionBtn} onPress={onNavigateToSuggestions}>
              <Ionicons name="bulb-outline" size={18} color="#FFFFFF" />
              <Text style={styles.emptyActionBtnText}>Explorer les suggestions</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Modal Add */}
      <AddDishModal
        visible={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={onAddDish}
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
    fontSize: 12.5,
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
  filterChipActiveTunisien: {
    backgroundColor: colors.badgeTunisien,
    borderColor: colors.badgeTunisien,
  },
  filterChipActiveItalien: {
    backgroundColor: colors.badgeItalien,
    borderColor: colors.badgeItalien,
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
