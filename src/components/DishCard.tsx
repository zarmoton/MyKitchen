import React, { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Dish } from '../types';
import { colors } from '../theme/colors';
import { formatLastCooked } from '../utils/dateUtils';
import { Ionicons } from '@expo/vector-icons';

export interface DishCardProps {
  dish: Dish;
  onPress?: ((dish: Dish) => void) | (() => void);
  onEdit?: ((dish: Dish) => void) | (() => void);
  onDelete?: ((dish: Dish) => void) | (() => void);
  isSelected?: boolean;
  isSuggestionView?: boolean;
  isImportedInUserDishes?: boolean;
  onToggleImport?: ((dish: Dish) => void) | (() => void);
  selectable?: boolean;
  showLastCooked?: boolean;
  compact?: boolean;
}

const DishCardComponent: React.FC<DishCardProps> = ({
  dish,
  onPress,
  onEdit,
  onDelete,
  isSelected = false,
  isSuggestionView = false,
  isImportedInUserDishes = false,
  onToggleImport,
  selectable = false,
  showLastCooked = false,
  compact = isSuggestionView,
}) => {
  const typeBadge = useMemo(() => {
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
  }, [dish.type]);

  const cuisineBadge = useMemo(() => {
    switch (dish.cuisine) {
      case 'tunisien':
        return { label: 'Tunisien', bg: colors.badgeTunisienBg, color: colors.badgeTunisien };
      case 'italien':
        return { label: 'Italien', bg: colors.badgeItalienBg, color: colors.badgeItalien };
      case 'israelien':
        return { label: 'Israélien', bg: colors.badgeIsraelienBg, color: colors.badgeIsraelien };
      case 'francais':
        return { label: 'Français', bg: colors.badgeFrancaisBg, color: colors.badgeFrancais };
      case 'classique':
        return { label: 'Classique', bg: colors.badgeClassiqueBg, color: colors.badgeClassique };
    }
  }, [dish.cuisine]);

  const occasionBadge = useMemo(() => {
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
  }, [dish.occasion]);

  const lastCookedInfo = useMemo(() => {
    return formatLastCooked(dish.lastCookedDate);
  }, [dish.lastCookedDate]);

  const handlePress = useCallback(() => {
    if (onPress) (onPress as any)(dish);
    else if (onToggleImport) (onToggleImport as any)(dish);
  }, [onPress, onToggleImport, dish]);

  const handleEdit = useCallback(() => {
    if (onEdit) (onEdit as any)(dish);
  }, [onEdit, dish]);

  const handleDelete = useCallback(() => {
    if (onDelete) (onDelete as any)(dish);
  }, [onDelete, dish]);

  const handleToggleImport = useCallback(() => {
    if (onToggleImport) (onToggleImport as any)(dish);
  }, [onToggleImport, dish]);

  // In suggestion view: If already imported to "Mes Plats", the line turns green!
  const isGreenHighlight = isSuggestionView && isImportedInUserDishes;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      style={[
        styles.card,
        compact && styles.compactCard,
        isGreenHighlight && styles.greenCard,
        isSelected && styles.selectedCard,
      ]}
    >
      <View style={styles.contentRow}>
        {selectable && (
          <View style={styles.checkboxContainer}>
            <Ionicons
              name={isSelected ? 'checkbox' : 'square-outline'}
              size={compact ? 18 : 22}
              color={isSelected ? colors.primary : colors.textMuted}
            />
          </View>
        )}

        <View style={styles.mainInfo}>
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.name,
                compact && styles.compactName,
                isGreenHighlight && styles.greenName,
              ]}
              numberOfLines={1}
            >
              {dish.name}
            </Text>
            {isGreenHighlight && (
              <View style={[styles.greenCheckBadge, compact && styles.compactGreenCheckBadge]}>
                <Ionicons name="checkmark-circle" size={compact ? 13 : 15} color={colors.addedGreenText} />
                <Text style={[styles.greenCheckText, compact && styles.compactGreenCheckText]}>
                  Dans mes plats
                </Text>
              </View>
            )}
          </View>

          {dish.description ? (
            <Text
              style={[styles.description, compact && styles.compactDescription]}
              numberOfLines={1}
            >
              {dish.description}
            </Text>
          ) : null}

          {/* Badges Row */}
          <View style={[styles.badgesRow, compact && styles.compactBadgesRow]}>
            <View style={[styles.badge, compact && styles.compactBadge, { backgroundColor: typeBadge.bg }]}>
              <Ionicons
                name={typeBadge.icon as any}
                size={compact ? 10 : 12}
                color={typeBadge.color}
                style={{ marginRight: 3 }}
              />
              <Text style={[styles.badgeText, compact && styles.compactBadgeText, { color: typeBadge.color }]}>
                {typeBadge.label}
              </Text>
            </View>

            <View style={[styles.badge, compact && styles.compactBadge, { backgroundColor: cuisineBadge.bg }]}>
              <Text style={[styles.badgeText, compact && styles.compactBadgeText, { color: cuisineBadge.color }]}>
                {cuisineBadge.label}
              </Text>
            </View>

            <View style={[styles.badge, compact && styles.compactBadge, { backgroundColor: occasionBadge.bg }]}>
              <Text style={[styles.badgeText, compact && styles.compactBadgeText, { color: occasionBadge.color }]}>
                {occasionBadge.label}
              </Text>
            </View>

            {/* Date de dernière sélection */}
            {showLastCooked && (
              <View
                style={[
                  styles.badge,
                  compact && styles.compactBadge,
                  styles.lastCookedBadge,
                  lastCookedInfo.isNever && styles.lastCookedBadgeNever,
                ]}
              >
                <Ionicons
                  name="calendar-outline"
                  size={compact ? 9 : 11}
                  color={lastCookedInfo.isNever ? '#059669' : colors.textSecondary}
                  style={{ marginRight: 3 }}
                />
                <Text
                  style={[
                    styles.badgeText,
                    compact && styles.compactBadgeText,
                    { color: lastCookedInfo.isNever ? '#059669' : colors.textSecondary },
                  ]}
                >
                  {lastCookedInfo.text}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Actions Row */}
        <View style={styles.actionsRow}>
          {onEdit && (
            <TouchableOpacity
              style={[styles.actionIconBtn, compact && styles.compactActionIconBtn]}
              onPress={handleEdit}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="pencil-outline" size={compact ? 14 : 17} color={colors.textSecondary} />
            </TouchableOpacity>
          )}

          {onDelete && (
            <TouchableOpacity
              style={[styles.actionIconBtn, compact && styles.compactActionIconBtn]}
              onPress={handleDelete}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="trash-outline" size={compact ? 14 : 17} color={colors.danger} />
            </TouchableOpacity>
          )}

          {isSuggestionView && onToggleImport && (
            <TouchableOpacity
              style={[
                styles.actionBtn,
                compact && styles.compactActionBtn,
                isGreenHighlight ? styles.actionBtnRemove : styles.actionBtnAdd,
              ]}
              onPress={handleToggleImport}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={isGreenHighlight ? 'checkmark' : 'add'}
                size={compact ? 15 : 18}
                color={isGreenHighlight ? '#FFFFFF' : colors.primary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const DishCard = React.memo(DishCardComponent);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  compactCard: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    marginBottom: 6,
    borderRadius: 11,
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
    gap: 8,
  },
  checkboxContainer: {
    marginRight: 2,
  },
  mainInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  compactName: {
    fontSize: 13.5,
    fontWeight: '700',
    lineHeight: 17,
  },
  greenName: {
    color: colors.addedGreenText,
  },
  greenCheckBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C8E6C9',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 10,
    gap: 3,
  },
  compactGreenCheckBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  greenCheckText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.addedGreenText,
  },
  compactGreenCheckText: {
    fontSize: 9.5,
  },
  description: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
    lineHeight: 16,
  },
  compactDescription: {
    fontSize: 11,
    lineHeight: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 2,
  },
  compactBadgesRow: {
    gap: 4,
    marginTop: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  compactBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  compactBadgeText: {
    fontSize: 9.5,
  },
  lastCookedBadge: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  lastCookedBadgeNever: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginLeft: 4,
  },
  actionIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.cardAlt,
  },
  compactActionIconBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 2,
  },
  compactActionBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  actionBtnAdd: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  actionBtnRemove: {
    backgroundColor: colors.addedGreenText,
  },
});
