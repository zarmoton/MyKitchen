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

  const confirmDeleteSuggestion = useCallback(
    (sug: Dish) => {
      Alert.alert(
        'Supprimer la suggestion',
        `Voulez-vous retirer définitivement "${sug.name}" de la base d’idées ?`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: () => onDeleteSuggestion(sug.id),
          },
        ]
      );
    },
    [onDeleteSuggestion]
  );

  const renderSuggestionItem = useCallback(
    ({ item }: { item: Dish }) => {
      const imported = importedSet.has(item.id) || importedSet.has(item.name.toLowerCase().trim());
      return (
        <DishCard
          dish={item}
          compact={true}
          isSuggestionView={true}
          isImportedInUserDishes={imported}
          onToggleImport={onToggleSuggestion}
          onEdit={setEditingSuggestion}
          onDelete={confirmDeleteSuggestion}
        />
      );
    },
    [importedSet, onToggleSuggestion, confirmDeleteSuggestion]
  );

  return (
    <View style={styles.container}>
      {/* ULTRA-COMPACT TOP CONTROLS (takes minimal vertical height) */}
      <View style={styles.topControlPanel}>
        {/* Row 1: Title, Count Pill & Compact Add Button */}
        <View style={styles.headerRow}>
          <View style={styles.titleGroup}>
            <Text style={styles.headerTitle}>💡 Suggestions</Text>
            <View style={styles.statsPill}>
              <Text style={styles.statsText}>
                {suggestions.length} idées • <Text style={styles.statsGreen}>{importedCount} pris</Text>
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.compactAddBtn}
            onPress={() => setIsAddModalOpen(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={15} color="#FFFFFF" />
            <Text style={styles.compactAddBtnText}>Ajouter</Text>
          </TouchableOpacity>
        </View>

        {/* Row 2: Sleek compact Search Bar */}
        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={15} color={colors.textSecondary} style={{ marginRight: 6 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher couscous, pâtes, poisson, bœuf..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            clearButtonMode="while-editing"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={15} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Row 3: Horizontal Mini Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {/* All */}
          <TouchableOpacity
            style={[
              styles.miniChip,
              selectedCuisine === 'all' && selectedOccasion === 'all' && statusFilter === 'all' && styles.miniChipActive,
            ]}
            onPress={() => {
              setSelectedCuisine('all');
              setSelectedOccasion('all');
              setStatusFilter('all');
            }}
          >
            <Text
              style={[
                styles.miniChipText,
                selectedCuisine === 'all' && selectedOccasion === 'all' && statusFilter === 'all' && styles.miniChipTextActive,
              ]}
            >
              Toutes ({suggestions.length})
            </Text>
          </TouchableOpacity>

          {/* New / Not yet imported */}
          <TouchableOpacity
            style={[styles.miniChip, statusFilter === 'not_imported' && styles.miniChipActive]}
            onPress={() => setStatusFilter(statusFilter === 'not_imported' ? 'all' : 'not_imported')}
          >
            <Text style={[styles.miniChipText, statusFilter === 'not_imported' && styles.miniChipTextActive]}>
              ✨ À découvrir ({suggestions.length - importedCount})
            </Text>
          </TouchableOpacity>

          {/* Already taken */}
          <TouchableOpacity
            style={[styles.miniChip, statusFilter === 'imported' && styles.miniChipActiveGreen]}
            onPress={() => setStatusFilter(statusFilter === 'imported' ? 'all' : 'imported')}
          >
            <Text style={[styles.miniChipText, statusFilter === 'imported' && styles.miniChipTextActiveGreen]}>
              ✓ Déjà pris ({importedCount})
            </Text>
          </TouchableOpacity>

          <View style={styles.miniDivider} />

          {/* Cuisines */}
          <TouchableOpacity
            style={[styles.miniChip, selectedCuisine === 'tunisien' && styles.miniChipActiveTunisien]}
            onPress={() => setSelectedCuisine(selectedCuisine === 'tunisien' ? 'all' : 'tunisien')}
          >
            <Text style={[styles.miniChipText, selectedCuisine === 'tunisien' && styles.miniChipTextActiveTunisien]}>
              Tunisien
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.miniChip, selectedCuisine === 'italien' && styles.miniChipActiveItalien]}
            onPress={() => setSelectedCuisine(selectedCuisine === 'italien' ? 'all' : 'italien')}
          >
            <Text style={[styles.miniChipText, selectedCuisine === 'italien' && styles.miniChipTextActiveItalien]}>
              Italien
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.miniChip, selectedCuisine === 'israelien' && styles.miniChipActiveIsraelien]}
            onPress={() => setSelectedCuisine(selectedCuisine === 'israelien' ? 'all' : 'israelien')}
          >
            <Text style={[styles.miniChipText, selectedCuisine === 'israelien' && styles.miniChipTextActive]}>
              Israélien
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.miniChip, selectedCuisine === 'francais' && styles.miniChipActiveFrancais]}
            onPress={() => setSelectedCuisine(selectedCuisine === 'francais' ? 'all' : 'francais')}
          >
            <Text style={[styles.miniChipText, selectedCuisine === 'francais' && styles.miniChipTextActive]}>
              Français
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.miniChip, selectedCuisine === 'bbq' && styles.miniChipActiveBbq]}
            onPress={() => setSelectedCuisine(selectedCuisine === 'bbq' ? 'all' : 'bbq')}
          >
            <Text style={[styles.miniChipText, selectedCuisine === 'bbq' && styles.miniChipTextActive]}>
              🔥 BBQ
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.miniChip, selectedCuisine === 'classique' && styles.miniChipActive]}
            onPress={() => setSelectedCuisine(selectedCuisine === 'classique' ? 'all' : 'classique')}
          >
            <Text style={[styles.miniChipText, selectedCuisine === 'classique' && styles.miniChipTextActive]}>
              Classique
            </Text>
          </TouchableOpacity>

          <View style={styles.miniDivider} />

          {/* Occasions */}
          <TouchableOpacity
            style={[styles.miniChip, selectedOccasion === 'semaine' && styles.miniChipActiveSemaine]}
            onPress={() => setSelectedOccasion(selectedOccasion === 'semaine' ? 'all' : 'semaine')}
          >
            <Text style={[styles.miniChipText, selectedOccasion === 'semaine' && styles.miniChipTextActive]}>
              📅 Semaine
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.miniChip, selectedOccasion === 'chabbat' && styles.miniChipActiveShabbat]}
            onPress={() => setSelectedOccasion(selectedOccasion === 'chabbat' ? 'all' : 'chabbat')}
          >
            <Text style={[styles.miniChipText, selectedOccasion === 'chabbat' && styles.miniChipTextActive]}>
              🕯️ Chabbat
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* List with compact DishCards */}
      <FlatList
        data={filteredSuggestions}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        initialNumToRender={12}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        windowSize={5}
        removeClippedSubviews={true}
        renderItem={renderSuggestionItem}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search" size={36} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>Aucune idée trouvée</Text>
            <Text style={styles.emptySubtitle}>
              Modifiez votre recherche ou réinitialisez les filtres.
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => {
                setSearch('');
                setSelectedCuisine('all');
                setSelectedOccasion('all');
                setSelectedType('all');
                setStatusFilter('all');
              }}
            >
              <Text style={styles.emptyBtnText}>Réinitialiser les filtres</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Add / Edit Suggestion Modal */}
      <AddDishModal
        visible={isAddModalOpen || editingSuggestion !== null}
        initialDish={editingSuggestion || undefined}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingSuggestion(null);
        }}
        onSave={dish => {
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
  topControlPanel: {
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: 7,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  statsPill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 10,
  },
  statsText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  statsGreen: {
    color: colors.addedGreenText,
    fontWeight: '700',
  },
  compactAddBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 12,
  },
  compactAddBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 11.5,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardAlt,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    padding: 0,
  },
  filterScroll: {
    gap: 6,
    paddingVertical: 1,
  },
  miniChip: {
    backgroundColor: colors.cardAlt,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 14,
  },
  miniChipActive: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  miniChipActiveGreen: {
    backgroundColor: colors.addedGreenBorder,
    borderColor: colors.addedGreenBorder,
  },
  miniChipActiveTunisien: {
    backgroundColor: colors.badgeTunisien,
    borderColor: colors.badgeTunisien,
  },
  miniChipActiveItalien: {
    backgroundColor: colors.badgeItalien,
    borderColor: colors.badgeItalien,
  },
  miniChipActiveIsraelien: {
    backgroundColor: colors.badgeIsraelien,
    borderColor: colors.badgeIsraelien,
  },
  miniChipActiveFrancais: {
    backgroundColor: colors.badgeFrancais,
    borderColor: colors.badgeFrancais,
  },
  miniChipActiveBbq: {
    backgroundColor: colors.badgeBbq,
    borderColor: colors.badgeBbq,
  },
  miniChipActiveSemaine: {
    backgroundColor: colors.semaine,
    borderColor: colors.semaine,
  },
  miniChipActiveShabbat: {
    backgroundColor: colors.shabbat,
    borderColor: colors.shabbat,
  },
  miniChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  miniChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  miniChipTextActiveGreen: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  miniChipTextActiveTunisien: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  miniChipTextActiveItalien: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  miniDivider: {
    width: 1,
    height: 18,
    backgroundColor: colors.borderLight,
    marginHorizontal: 2,
    alignSelf: 'center',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 24,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptyBtn: {
    backgroundColor: colors.cardAlt,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    marginTop: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
});
