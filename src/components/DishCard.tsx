import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Dish } from '../types';
import { colors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';

interface DishCardProps {
  dish: Dish;
  onPress?: () => void;
  onDelete?: () => void;
  isSelected?: boolean;
  isSuggestionView?: boolean;
  isImportedInUserDishes?: boolean;
  onToggleImport?: () => void;
  selectable?: boolean;
}

export const DishCard: React.FC<DishCardProps> = ({
  dish,
  onPress,
  onDelete,
  isSelected = false,
  isSuggestionView = false,
  isImportedInUserDishes = false,
  onToggleImport,
  selectable = false,
}) => {
  const getTypeBadge = () => {
    switch (dish.type) {
      case 'complet':
        return { label: 'Plat complet', icon: 'restaurant-outline', bg: '#E0F2FE', color: '#0369A1' };
      case 'principal':
        return { label: 'À accompagner', icon: 'fast-food-outline', bg: '#FEF3C7', color: '#B45309' };
      case 'accompagnement':
        return { label: 'Accompagnement', icon: 'nutrition-outline', bg: '#ECFDF5', color: '#047857' };
      case 'dessert':
        return { label: 'Dessert', icon: 'ice-cream-outline', bg: '#FDF2F8', color: '#BE185D' };
    }
  };

  const getCuisineBadge = () => {
    switch (dish.cuisine) {
      case 'tunisien':
        return { label: '🇹🇳 Tunisien', bg: colors.badgeTunisienBg, color: colors.badgeTunisien };
      case 'italien':
        return { label: '🇮🇹 Italien', bg: colors.badgeItalienBg, color: colors.badgeItalien };
      case 'classique':
        return { label: '🍽️ Classique', bg: colors.badgeClassiqueBg, color: colors.badgeClassique };
    }
  };

  const getOccasionBadge = () => {
    switch (dish.occasion) {
      case 'semaine':
        return { label: 'Semaine', bg: colors.semaineLight, color: colors.semaine };
      case 'chabbat_vendredi':
        return { label: 'Chabbat (Vendredi)', bg: colors.shabbatLight, color: colors.shabbat };
      case 'chabbat_samedi':
        return { label: 'Chabbat (Samedi)', bg: colors.shabbatLight, color: colors.shabbat };
      case 'chabbat_tous':
        return { label: 'Chabbat', bg: colors.shabbatLight, color: colors.shabbat };
      case 'tous':
        return { label: 'Semaine & Chabbat', bg: '#F3F4F6', color: '#4B5563' };
    }
  };

  const typeBadge = getTypeBadge();
  const cuisineBadge = getCuisineBadge();
  const occasionBadge = getOccasionBadge();

  // In suggestion view: If already imported to "Mes Plats", the line turns green!
  // (As specifically requested: "une fois integrés à notre liste la ligne deviendra verte")
  const isGreenHighlight = isSuggestionView && isImportedInUserDishes;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress || onToggleImport}
      style={[
        styles.card,
        isGreenHighlight && styles.greenCard,
        isSelected && styles.selectedCard,
      ]}
    >
      <View style={styles.contentRow}>
        {selectable && (
          <View style={styles.checkboxContainer}>
            <Ionicons
              name={isSelected ? 'checkbox' : 'square-outline'}
              size={22}
              color={isSelected ? colors.primary : colors.textMuted}
            />
          </View>
        )}

        <View style={styles.mainInfo}>
          <View style={styles.titleRow}>
            <Text style={[styles.name, isGreenHighlight && styles.greenName]} numberOfLines={2}>
              {dish.name}
            </Text>
            {isGreenHighlight && (
              <View style={styles.greenCheckBadge}>
                <Ionicons name="checkmark-circle" size={16} color={colors.addedGreenText} />
                <Text style={styles.greenCheckText}>Dans mes plats</Text>
              </View>
            )}
          </View>

          {dish.description ? (
            <Text style={styles.description} numberOfLines={2}>
              {dish.description}
            </Text>
          ) : null}

          {/* Badges Row */}
          <View style={styles.badgesRow}>
            <View style={[styles.badge, { backgroundColor: typeBadge.bg }]}>
              <Ionicons name={typeBadge.icon as any} size={12} color={typeBadge.color} style={{ marginRight: 4 }} />
              <Text style={[styles.badgeText, { color: typeBadge.color }]}>{typeBadge.label}</Text>
            </View>

            <View style={[styles.badge, { backgroundColor: cuisineBadge.bg }]}>
              <Text style={[styles.badgeText, { color: cuisineBadge.color }]}>{cuisineBadge.label}</Text>
            </View>

            <View style={[styles.badge, { backgroundColor: occasionBadge.bg }]}>
              <Text style={[styles.badgeText, { color: occasionBadge.color }]}>{occasionBadge.label}</Text>
            </View>
          </View>
        </View>

        {/* Action Button */}
        {isSuggestionView && onToggleImport ? (
          <TouchableOpacity
            style={[
              styles.actionBtn,
              isGreenHighlight ? styles.actionBtnRemove : styles.actionBtnAdd,
            ]}
            onPress={onToggleImport}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={isGreenHighlight ? 'checkmark' : 'add'}
              size={18}
              color={isGreenHighlight ? '#FFFFFF' : colors.primary}
            />
          </TouchableOpacity>
        ) : onDelete ? (
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={onDelete}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  greenCard: {
    backgroundColor: colors.addedGreenBg,
    borderColor: colors.addedGreenBorder,
    borderWidth: 1.5,
  },
  selectedCard: {
    borderColor: colors.primary,
    borderWidth: 1.5,
    backgroundColor: colors.primaryLight,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkboxContainer: {
    marginRight: 4,
  },
  mainInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  greenName: {
    color: colors.addedGreenText,
  },
  greenCheckBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C8E6C9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  greenCheckText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.addedGreenText,
  },
  description: {
    fontSize: 12.5,
    color: colors.textSecondary,
    marginBottom: 8,
    lineHeight: 17,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  actionBtnAdd: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  actionBtnRemove: {
    backgroundColor: colors.addedGreenText,
  },
  deleteBtn: {
    padding: 6,
    marginLeft: 4,
  },
});

