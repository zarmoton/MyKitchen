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
import { Dish, CuisineType, OccasionType, DishType } from '../types';
import { DishCard } from '../components/DishCard';
import { AddDishModal } from '../components/AddDishModal';
import { colors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';

interface SuggestionsScreenProps {
  suggestions: Dish[];
  userDishes: Dish[];
  onToggleSuggestion: (suggestion: Dish) => void;
  onAddSuggestion: (suggestion: Dish) => void;
  onUpdateSuggestion: (suggestion: Dish) => void;
  onDeleteSuggestion: (suggestionId: string) => void;
}

export const SuggestionsScreen: React.FC<SuggestionsScreenProps> = ({
  suggestions,
  userDishes,
  onToggleSuggestion,
  onAddSuggestion,
  onUpdateSuggestion,
  onDeleteSuggestion,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState<string>('all');
  const [selectedOccasion, setSelectedOccasion] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'imported' | 'not_imported'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSuggestion, setEditingSuggestion] = useState<Dish | null>(null);

  // Build a lookup set of imported suggestion IDs and dish names
  const importedSet = useMemo(() => {
    const set = new Set<string>();
    userDishes.forEach(d => {
      if (d.sourceSuggestionId) {
        set.add(d.sourceSuggestionId);
      }
      set.add(d.name.toLowerCase().trim());
    });
    return set;
  }, [userDishes]);

  const isDishImported = (sug: Dish): boolean => {
    return importedSet.has(sug.id) || importedSet.has(sug.name.toLowerCase().trim());
  };

  // Filtered list
  const filteredSuggestions = useMemo(() => {
    return suggestions.filter(item => {
      // Search
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesDesc = item.description?.toLowerCase().includes(query);
        if (!matchesName && !matchesDesc) return false;
      }

      // Cuisine
      if (selectedCuisine !== 'all' && item.cuisine !== selectedCuisine) {
        return false;
      }

      // Occasion
      if (selectedOccasion !== 'all') {
        if (selectedOccasion === 'semaine' && item.occasion !== 'semaine' && item.occasion !== 'tous') {
          return false;
        }
        if (selectedOccasion === 'chabbat' && !item.occasion.startsWith('chabbat') && item.occasion !== 'tous') {
          return false;
        }
      }

      // Type
      if (selectedType !== 'all' && item.type !== selectedType) {
        return false;
      }

      // Status (Imported vs not imported)
      const imported = isDishImported(item);
      if (statusFilter === 'imported' && !imported) return false;
      if (statusFilter === 'not_imported' && imported) return false;

      return true;
    });
  }, [suggestions, search, selectedCuisine, selectedOccasion, selectedType, statusFilter, importedSet]);

  // Statistics
  const importedCount = useMemo(() => {
    return suggestions.filter(d => isDishImported(d)).length;
  }, [suggestions, importedSet]);

  const confirmDeleteSuggestion = (sug: Dish) => {
    Alert.alert(
      'Supprimer la suggestion',
      `Voulez-vous retirer définitivement "${sug.name}" de la liste des suggestions ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => onDeleteSuggestion(sug.id),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Banner info */}
      <View style={styles.banner}>
        <View style={styles.bannerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>💡 {suggestions.length} Idées de Plats</Text>
            <Text style={styles.bannerSubtitle}>
              Spécialités tunisiennes, classiques italiens & cuisine quotidienne
            </Text>
          </View>

          <TouchableOpacity
            style={styles.newIdeaBtn}
            onPress={() => setIsAddModalOpen(true)}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.newIdeaBtnText}>Ajouter</Text>
          </TouchableOpacity>

          <View style={styles.countBadge}>
            <Text style={styles.countNumber}>{importedCount}</Text>
            <Text style={styles.countLabel}>dans mes plats</Text>
          </View>
        </View>

        <Text style={styles.bannerNote}>
          👉 Appuyez sur une idée pour l’ajouter à vos plats. La ligne deviendra{' '}
          <Text style={{ color: colors.addedGreenText, fontWeight: '700' }}>verte</Text> !
        </Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher couscous, spaghetti, poisson, brick..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
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
          {/* Cuisine Filters - SANS DRAPEAU */}
          <TouchableOpacity
            style={[styles.filterChip, selectedCuisine === 'all' && styles.filterChipActive]}
            onPress={() => setSelectedCuisine('all')}
          >
            <Text style={[styles.filterChipText, selectedCuisine === 'all' && styles.filterChipTextActive]}>
              Toutes cuisines ({suggestions.length})
            </Text>
          </TouchableOpacity>

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
            style={[styles.filterChip, selectedCuisine === 'classique' && styles.filterChipActive]}
            onPress={() => setSelectedCuisine(selectedCuisine === 'classique' ? 'all' : 'classique')}
          >
            <Text style={[styles.filterChipText, selectedCuisine === 'classique' && styles.filterChipTextActive]}>
              Classique
            </Text>
          </TouchableOpacity>

          <View style={styles.filterDivider} />

          {/* Occasion Filters */}
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

          {/* Status Filter */}
          <TouchableOpacity
            style={[styles.filterChip, statusFilter === 'imported' && styles.filterChipActiveGreen]}
            onPress={() => setStatusFilter(statusFilter === 'imported' ? 'all' : 'imported')}
          >
            <Text
              style={[
                styles.filterChipText,
                statusFilter === 'imported' && styles.filterChipTextActiveGreen,
              ]}
            >
              ✓ Déjà pris ({importedCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, statusFilter === 'not_imported' && styles.filterChipActive]}
            onPress={() => setStatusFilter(statusFilter === 'not_imported' ? 'all' : 'not_imported')}
          >
            <Text style={[styles.filterChipText, statusFilter === 'not_imported' && styles.filterChipTextActive]}>
              + Nouvelles idées ({suggestions.length - importedCount})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* List */}
      <FlatList
        data={filteredSuggestions}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        initialNumToRender={15}
        maxToRenderPerBatch={20}
        windowSize={10}
        renderItem={({ item }) => {
          const imported = isDishImported(item);
          return (
            <DishCard
              dish={item}
              isSuggestionView={true}
              isImportedInUserDishes={imported}
              onToggleImport={() => onToggleSuggestion(item)}
              onEdit={() => setEditingSuggestion(item)}
              onDelete={() => confirmDeleteSuggestion(item)}
            />
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search" size={42} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>Aucune suggestion trouvée</Text>
            <Text style={styles.emptySubtitle}>Essayez de modifier votre recherche ou vos filtres.</Text>
          </View>
        }
      />

      {/* Add / Edit Modal for Suggestions */}
      <AddDishModal
        visible={isAddModalOpen || !!editingSuggestion}
        initialDish={editingSuggestion}
        title={editingSuggestion ? 'Modifier l’idée de suggestion' : 'Ajouter une idée à la base'}
        subtitle="Cette suggestion apparaîtra dans le catalogue d’idées"
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingSuggestion(null);
        }}
        onSave={(dish) => {
          if (editingSuggestion) {
            onUpdateSuggestion(dish);
          } else {
            onAddSuggestion(dish);
          }
          setIsAddModalOpen(false);
          setEditingSuggestion(null);
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
  banner: {
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E6C8',
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#7A5200',
  },
  bannerSubtitle: {
    fontSize: 11.5,
    color: '#8A6D3B',
    marginTop: 2,
  },
  bannerNote: {
    fontSize: 12,
    color: '#6B5420',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F5E6BF',
  },
  newIdeaBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  newIdeaBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  countBadge: {
    backgroundColor: colors.addedGreenBg,
    borderWidth: 1.5,
    borderColor: colors.addedGreenBorder,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
  },
  countNumber: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.addedGreenText,
  },
  countLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.addedGreenText,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginTop: 12,
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
  filterChipActiveTunisien: {
    backgroundColor: colors.badgeTunisien,
    borderColor: colors.badgeTunisien,
  },
  filterChipActiveItalien: {
    backgroundColor: colors.badgeItalien,
    borderColor: colors.badgeItalien,
  },
  filterChipActiveSemaine: {
    backgroundColor: colors.semaine,
    borderColor: colors.semaine,
  },
  filterChipActiveShabbat: {
    backgroundColor: colors.shabbat,
    borderColor: colors.shabbat,
  },
  filterChipActiveGreen: {
    backgroundColor: colors.addedGreenText,
    borderColor: colors.addedGreenText,
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
  filterChipTextActiveTunisien: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  filterChipTextActiveItalien: {
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
  filterChipTextActiveGreen: {
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
    paddingVertical: 50,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 30,
  },
});
