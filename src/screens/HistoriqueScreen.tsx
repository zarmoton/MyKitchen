import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MealHistoryEntry, MealHistoryOccasion } from '../types';
import { colors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';

interface HistoriqueScreenProps {
  history: MealHistoryEntry[];
  onDeleteHistoryEntry: (id: string) => void;
  onNavigateToRepas: () => void;
}

export const HistoriqueScreen: React.FC<HistoriqueScreenProps> = ({
  history,
  onDeleteHistoryEntry,
  onNavigateToRepas,
}) => {
  const [filter, setFilter] = useState<'all' | 'semaine' | 'chabbat'>('all');

  const filteredHistory = useMemo(() => {
    if (filter === 'all') return history;
    return history.filter(item => item.occasion === filter);
  }, [history, filter]);

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
                      {isChabbat
                        ? item.shabbatSlot === 'vendredi_soir'
                          ? '🕯️ Chabbat soir'
                          : item.shabbatSlot === 'samedi_midi'
                          ? '☀️ Chabbat midi'
                          : '✨ Chabbat'
                        : '📅 Semaine'}
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
                {/* Main dishes */}
                {item.mainDishes && item.mainDishes.length > 0 && (
                  <View style={styles.dishGroup}>
                    {item.mainDishes.map((dish, idx) => (
                      <View key={idx} style={styles.dishRow}>
                        <Text style={styles.dishIcon}>
                          {dish.type === 'complet' ? '🍲' : '🥩'}
                        </Text>
                        <Text style={styles.dishName}>{dish.name}</Text>
                        <Text style={styles.dishTypeTag}>
                          {dish.type === 'complet' ? 'Plat complet' : 'Plat'}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Sides */}
                {item.sides && item.sides.length > 0 && (
                  <View style={styles.dishGroup}>
                    {item.sides.map((side, idx) => (
                      <View key={idx} style={styles.dishRow}>
                        <Text style={styles.dishIcon}>🍟</Text>
                        <Text style={styles.dishName}>{side.name}</Text>
                        <Text style={styles.dishTypeTag}>Accompagnement</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Desserts */}
                {item.desserts && item.desserts.length > 0 && (
                  <View style={styles.dishGroup}>
                    {item.desserts.map((dessert, idx) => (
                      <View key={idx} style={styles.dishRow}>
                        <Text style={styles.dishIcon}>🍰</Text>
                        <Text style={styles.dishName}>{dessert.name}</Text>
                        <Text style={styles.dishTypeTag}>Dessert</Text>
                      </View>
                    ))}
                  </View>
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
    marginBottom: 12,
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
    backgroundColor: '#FAF8FC',
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
    gap: 6,
  },
  dishGroup: {
    gap: 6,
  },
  dishRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dishIcon: {
    fontSize: 16,
  },
  dishName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  dishTypeTag: {
    fontSize: 11,
    color: colors.textSecondary,
    backgroundColor: colors.cardAlt,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
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
