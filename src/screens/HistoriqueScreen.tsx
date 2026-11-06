import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import { MealHistoryEntry, Dish } from '../types';
import { colors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';

interface HistoriqueScreenProps {
  history: MealHistoryEntry[];
  onDeleteHistoryEntry: (id: string) => void;
  onNavigateToRepas: () => void;
  onRepeatMeal?: (meal: MealHistoryEntry) => void;
}

export const HistoriqueScreen: React.FC<HistoriqueScreenProps> = ({
  history,
  onDeleteHistoryEntry,
  onNavigateToRepas,
  onRepeatMeal,
}) => {
  const [filter, setFilter] = useState<'all' | 'semaine' | 'chabbat'>('all');

  const filteredHistory = useMemo(() => {
    if (filter === 'all') return history;
    return history.filter(item => item.occasion === filter);
  }, [history, filter]);

  const shareMeal = (item: MealHistoryEntry) => {
    const isChabbat = item.occasion === 'chabbat';
    if (isChabbat) {
      const lines = [`🕯️ Menu de Chabbat (${item.displayDate}) :`];

      const vendrediDishes = item.shabbatVendrediSoir || [];
      const samediDishes = item.shabbatSamediMidi || [];

      if (vendrediDishes.length > 0 || samediDishes.length > 0) {
        if (vendrediDishes.length > 0) {
          lines.push('\n🕯️ VENDREDI SOIR :');
          vendrediDishes.forEach(d => {
            lines.push(`• ${d.name} (${getCuisineLabel(d.cuisine)})`);
          });
        }

        if (samediDishes.length > 0) {
          lines.push('\n☀️ SAMEDI MIDI :');
          samediDishes.forEach(d => {
            lines.push(`• ${d.name} (${getCuisineLabel(d.cuisine)})`);
          });
        }
      } else {
        // Fallback for older entries
        if (item.mainDishes?.length) {
          lines.push('\nPlats :');
          item.mainDishes.forEach(d => lines.push(`• ${d.name}`));
        }
        if (item.sides?.length) {
          lines.push('\nAccompagnements :');
          item.sides.forEach(s => lines.push(`• ${s.name}`));
        }
        if (item.desserts?.length) {
          lines.push('\nDesserts :');
          item.desserts.forEach(des => lines.push(`• ${des.name}`));
        }
      }

      lines.push('\n✨ Shabbat Shalom !');

      Share.share({
        message: lines.join('\n'),
      });
      return;
    }

    // Semaine
    const lines = [`🍽️ Repas du ${item.displayDate} :`];
    if (item.mainDishes?.length) {
      lines.push('\nPlats :');
      item.mainDishes.forEach(d => lines.push(`• ${d.name}`));
    }
    if (item.sides?.length) {
      lines.push('\nAccompagnements :');
      item.sides.forEach(s => lines.push(`• ${s.name}`));
    }
    if (item.desserts?.length) {
      lines.push('\nDesserts :');
      item.desserts.forEach(des => lines.push(`• ${des.name}`));
    }

    Share.share({
      message: lines.join('\n'),
    });
  };

  const getCuisineLabel = (cuisine: string) => {
    switch (cuisine) {
      case 'tunisien':
        return 'Tunisien';
      case 'italien':
        return 'Italien';
      case 'israelien':
        return 'Israélien';
      case 'francais':
        return 'Français';
      default:
        return 'Classique';
    }
  };

  const getDishIcon = (dish: Dish) => {
    if (dish.type === 'dessert') return '🍰';
    if (dish.type === 'accompagnement') return '🍟';
    if (dish.type === 'complet') return '🍲';
    return '🥩';
  };

  const confirmDelete = (item: MealHistoryEntry) => {
    Alert.alert(
      'Supprimer du journal',
      'Voulez-vous retirer ce repas de votre historique ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => onDeleteHistoryEntry(item.id),
        },
      ]
    );
  };

  const renderDishRow = (dish: Dish, idx: number) => (
    <View key={dish.id || idx} style={styles.dishRow}>
      <Text style={styles.dishIcon}>{getDishIcon(dish)}</Text>
      <Text style={styles.dishName}>{dish.name}</Text>
      <View style={styles.dishTagsRow}>
        <Text style={styles.cuisineTag}>{getCuisineLabel(dish.cuisine)}</Text>
        <Text style={styles.dishTypeTag}>
          {dish.type === 'complet'
            ? 'Plat complet'
            : dish.type === 'principal'
            ? 'À accompagner'
            : dish.type === 'accompagnement'
            ? 'Accompagnement'
            : 'Dessert'}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Top Header & Filter */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.title}>Historique des repas</Text>
          <Text style={styles.subtitle}>Ce qui a été cuisiné à la maison</Text>
        </View>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterBtn, filter === 'all' && styles.filterBtnActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
              Tous ({history.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterBtn, filter === 'semaine' && styles.filterBtnActiveSemaine]}
            onPress={() => setFilter('semaine')}
          >
            <Text style={[styles.filterText, filter === 'semaine' && styles.filterTextActive]}>
              📅 Semaine
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterBtn, filter === 'chabbat' && styles.filterBtnActiveShabbat]}
            onPress={() => setFilter('chabbat')}
          >
            <Text style={[styles.filterText, filter === 'chabbat' && styles.filterTextActive]}>
              🕯️ Chabbat
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* History List */}
      <FlatList
        data={filteredHistory}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const isChabbat = item.occasion === 'chabbat';
          const hasVendredi = item.shabbatVendrediSoir && item.shabbatVendrediSoir.length > 0;
          const hasSamedi = item.shabbatSamediMidi && item.shabbatSamediMidi.length > 0;
          const isDetailedChabbat = isChabbat && (hasVendredi || hasSamedi);

          return (
            <View style={[styles.historyCard, isChabbat && styles.historyCardChabbat]}>
              {/* Header */}
              <View style={styles.cardHeader}>
                <View style={styles.dateGroup}>
                  <Text style={styles.dateText}>{item.displayDate}</Text>
                  <View
                    style={[
                      styles.occasionBadge,
                      isChabbat ? styles.occasionBadgeChabbat : styles.occasionBadgeSemaine,
                    ]}
                  >
                    <Text
                      style={[
                        styles.occasionBadgeText,
                        isChabbat ? styles.occasionBadgeTextChabbat : styles.occasionBadgeTextSemaine,
                      ]}
                    >
                      {isChabbat ? '🕯️ Chabbat' : '📅 Semaine'}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => confirmDelete(item)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Items List */}
              <View style={styles.itemsContainer}>
                {isDetailedChabbat ? (
                  <>
                    {/* 1st: Vendredi Soir Section */}
                    {hasVendredi && (
                      <View style={styles.chabbatSection}>
                        <View style={styles.vendrediSectionHeader}>
                          <Ionicons name="flame" size={15} color="#D97706" />
                          <Text style={styles.vendrediSectionTitle}>1er : Vendredi Soir</Text>
                          <View style={styles.sectionBadge}>
                            <Text style={styles.sectionBadgeText}>
                              {item.shabbatVendrediSoir!.length} plat(s)
                            </Text>
                          </View>
                        </View>
                        <View style={styles.dishGroup}>
                          {item.shabbatVendrediSoir!.map((dish, idx) => renderDishRow(dish, idx))}
                        </View>
                      </View>
                    )}

                    {/* 2nd: Samedi Midi Section */}
                    {hasSamedi && (
                      <View style={[styles.chabbatSection, styles.samediSectionMargin]}>
                        <View style={styles.samediSectionHeader}>
                          <Ionicons name="sunny" size={15} color="#B45309" />
                          <Text style={styles.samediSectionTitle}>2ème : Samedi Midi</Text>
                          <View style={styles.sectionBadge}>
                            <Text style={styles.sectionBadgeText}>
                              {item.shabbatSamediMidi!.length} plat(s)
                            </Text>
                          </View>
                        </View>
                        <View style={styles.dishGroup}>
                          {item.shabbatSamediMidi!.map((dish, idx) => renderDishRow(dish, idx))}
                        </View>
                      </View>
                    )}
                  </>
                ) : (
                  <>
                    {/* Main dishes */}
                    {item.mainDishes && item.mainDishes.length > 0 && (
                      <View style={styles.dishGroup}>
                        {item.mainDishes.map((dish, idx) => renderDishRow(dish, idx))}
                      </View>
                    )}

                    {/* Sides */}
                    {item.sides && item.sides.length > 0 && (
                      <View style={styles.dishGroup}>
                        {item.sides.map((side, idx) => renderDishRow(side, idx))}
                      </View>
                    )}

                    {/* Desserts */}
                    {item.desserts && item.desserts.length > 0 && (
                      <View style={styles.dishGroup}>
                        {item.desserts.map((dessert, idx) => renderDishRow(dessert, idx))}
                      </View>
                    )}
                  </>
                )}
              </View>

              {/* Card Footer Actions */}
              <View style={styles.cardActionsRow}>
                <TouchableOpacity
                  style={styles.cardActionBtn}
                  onPress={() => shareMeal(item)}
                >
                  <Ionicons name="share-social-outline" size={15} color={colors.textSecondary} />
                  <Text style={styles.cardActionBtnText}>Partager le menu</Text>
                </TouchableOpacity>

                {onRepeatMeal && (
                  <TouchableOpacity
                    style={[styles.cardActionBtn, styles.cardActionBtnPrimary]}
                    onPress={() => onRepeatMeal(item)}
                  >
                    <Ionicons name="refresh" size={15} color={colors.primary} />
                    <Text style={[styles.cardActionBtnText, { color: colors.primary, fontWeight: '700' }]}>
                      Reprendre ce menu
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>Aucun repas enregistré</Text>
            <Text style={styles.emptySubtitle}>
              Validez vos repas depuis l’onglet "Repas" pour garder trace de vos menus de la semaine ou de Chabbat !
            </Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={onNavigateToRepas}>
              <Ionicons name="restaurant" size={16} color="#FFFFFF" />
              <Text style={styles.emptyBtnText}>Composer un repas</Text>
            </TouchableOpacity>
          </View>
        }
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 12.5,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterBtn: {
    backgroundColor: colors.cardAlt,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
  },
  filterBtnActive: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  filterBtnActiveSemaine: {
    backgroundColor: colors.semaine,
    borderColor: colors.semaine,
  },
  filterBtnActiveShabbat: {
    backgroundColor: colors.shabbat,
    borderColor: colors.shabbat,
  },
  filterText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
  },
  historyCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  historyCardChabbat: {
    borderColor: '#D8CEE8',
    backgroundColor: '#FCFBFE',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    marginBottom: 10,
  },
  dateGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  dateText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.text,
  },
  occasionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  occasionBadgeSemaine: {
    backgroundColor: colors.semaineLight,
  },
  occasionBadgeChabbat: {
    backgroundColor: colors.shabbatLight,
  },
  occasionBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  occasionBadgeTextSemaine: {
    color: colors.semaine,
  },
  occasionBadgeTextChabbat: {
    color: colors.shabbat,
  },
  itemsContainer: {
    gap: 10,
  },
  chabbatSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  samediSectionMargin: {
    marginTop: 4,
  },
  vendrediSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  vendrediSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E',
    flex: 1,
  },
  samediSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomColor: '#F3F4F6',
    borderBottomWidth: 1,
  },
  samediSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#78350F',
    flex: 1,
  },
  sectionBadge: {
    backgroundColor: colors.cardAlt,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  sectionBadgeText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  cardActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.cardAlt,
  },
  cardActionBtnPrimary: {
    backgroundColor: colors.primaryLight,
  },
  cardActionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  dishGroup: {
    gap: 6,
  },
  dishRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  dishIcon: {
    fontSize: 15,
  },
  dishName: {
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  dishTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cuisineTag: {
    fontSize: 10.5,
    color: colors.textSecondary,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
    fontWeight: '500',
  },
  dishTypeTag: {
    fontSize: 10.5,
    color: colors.textSecondary,
    backgroundColor: colors.cardAlt,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
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
  emptyBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 14,
    marginTop: 18,
  },
  emptyBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13.5,
  },
});
