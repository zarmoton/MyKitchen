import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Dish, MealHistoryEntry, MealHistoryOccasion } from '../types';
import { getDayInfo, formatDisplayDate, formatLastCooked } from '../utils/dateUtils';
import { colors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';

interface RepasScreenProps {
  userDishes: Dish[];
  onValidateMeal: (meal: MealHistoryEntry) => void;
  onNavigateToHistory: () => void;
  onNavigateToSuggestions: () => void;
  prefilledMeal?: MealHistoryEntry | null;
  onToggleFavorite?: (dishId: string) => void;
}

export const RepasScreen: React.FC<RepasScreenProps> = ({
  userDishes,
  onValidateMeal,
  onNavigateToHistory,
  onNavigateToSuggestions,
  prefilledMeal,
  onToggleFavorite,
}) => {
  const dayInfo = getDayInfo();

  // Mode initialized based on day of week: Mercredi, Jeudi, Vendredi -> Chabbat. Sinon Semaine.
  const [mealMode, setMealMode] = useState<MealHistoryOccasion>(dayInfo.defaultMode);

  // Scope: Tout vs Que les favoris
  const [onlyFavorites, setOnlyFavorites] = useState<boolean>(false);

  // Dish type filter for page 1 ('all', 'plats', 'complet', 'principal', 'entrees', 'accompagnement', 'dessert')
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Semaine state
  const [semainePlat, setSemainePlat] = useState<Dish | null>(null);
  const [semaineSide, setSemaineSide] = useState<Dish | null>(null);
  const [semaineDessert, setSemaineDessert] = useState<Dish | null>(null);

  // Chabbat state: separate sets for Friday evening & Saturday lunch per card, plus absent state
  const [vendrediDishIds, setVendrediDishIds] = useState<Set<string>>(new Set());
  const [samediDishIds, setSamediDishIds] = useState<Set<string>>(new Set());
  const [isVendrediAbsent, setIsVendrediAbsent] = useState<boolean>(false);
  const [isSamediAbsent, setIsSamediAbsent] = useState<boolean>(false);

  // Watch for prefilledMeal from history
  useEffect(() => {
    if (!prefilledMeal) return;
    setMealMode(prefilledMeal.occasion);
    setTypeFilter('all');
    if (prefilledMeal.occasion === 'semaine') {
      setSemainePlat(prefilledMeal.mainDishes?.[0] || null);
      setSemaineSide(prefilledMeal.sides?.[0] || null);
      setSemaineDessert(prefilledMeal.desserts?.[0] || null);
    } else {
      setIsVendrediAbsent(!!prefilledMeal.vendrediAbsent);
      setIsSamediAbsent(!!prefilledMeal.samediAbsent);
      if (prefilledMeal.shabbatVendrediSoir || prefilledMeal.shabbatSamediMidi) {
        setVendrediDishIds(new Set((prefilledMeal.shabbatVendrediSoir || []).map(d => d.id)));
        setSamediDishIds(new Set((prefilledMeal.shabbatSamediMidi || []).map(d => d.id)));
      } else {
        // Fallback legacy format
        const allIds = new Set<string>();
        prefilledMeal.mainDishes?.forEach(d => allIds.add(d.id));
        prefilledMeal.sides?.forEach(d => allIds.add(d.id));
        prefilledMeal.desserts?.forEach(d => allIds.add(d.id));
        if (prefilledMeal.shabbatSlot === 'samedi_midi') {
          setSamediDishIds(allIds);
        } else {
          setVendrediDishIds(allIds);
        }
      }
    }
  }, [prefilledMeal]);

  // Sorting helper: dishes least recently cooked (or never cooked) are placed at the TOP,
  // and the most recently cooked are placed at the BOTTOM!
  const sortByCookingDate = (dishes: Dish[]): Dish[] => {
    return [...dishes].sort((a, b) => {
      if (!a.lastCookedDate && !b.lastCookedDate) return 0;
      if (!a.lastCookedDate) return -1;
      if (!b.lastCookedDate) return 1;
      return new Date(a.lastCookedDate).getTime() - new Date(b.lastCookedDate).getTime();
    });
  };

  // Scope calculations (All vs Favorites count)
  const currentAvailableDishes = useMemo(() => {
    if (mealMode === 'semaine') {
      return userDishes.filter(d => d.occasion === 'semaine' || d.occasion === 'tous');
    }
    return userDishes.filter(d => d.occasion.startsWith('chabbat') || d.occasion === 'tous');
  }, [userDishes, mealMode]);

  const currentFavsCount = useMemo(() => {
    return currentAvailableDishes.filter(d => d.isFavorite).length;
  }, [currentAvailableDishes]);

  // Filtered lists for Semaine
  const semaineDishes = useMemo(() => {
    return userDishes.filter(
      d => (d.occasion === 'semaine' || d.occasion === 'tous') && (!onlyFavorites || d.isFavorite)
    );
  }, [userDishes, onlyFavorites]);

  const sortedSemaineMains = useMemo(() => {
    const list = semaineDishes.filter(d => d.type === 'complet' || d.type === 'principal');
    return sortByCookingDate(list);
  }, [semaineDishes]);

  const sortedSemaineComplets = useMemo(() => {
    return sortedSemaineMains.filter(d => d.type === 'complet');
  }, [sortedSemaineMains]);

  const sortedSemainePrincipals = useMemo(() => {
    return sortedSemaineMains.filter(d => d.type === 'principal');
  }, [sortedSemaineMains]);

  const displayedSemaineMains = useMemo(() => {
    if (typeFilter === 'complet') return sortedSemaineComplets;
    if (typeFilter === 'principal') return sortedSemainePrincipals;
    return sortedSemaineMains;
  }, [typeFilter, sortedSemaineMains, sortedSemaineComplets, sortedSemainePrincipals]);

  const sortedSides = useMemo(() => {
    const list = userDishes.filter(
      d => d.type === 'accompagnement' && (!onlyFavorites || d.isFavorite)
    );
    return sortByCookingDate(list);
  }, [userDishes, onlyFavorites]);

  const sortedDesserts = useMemo(() => {
    const list = userDishes.filter(
      d => d.type === 'dessert' && (!onlyFavorites || d.isFavorite)
    );
    return sortByCookingDate(list);
  }, [userDishes, onlyFavorites]);

  // Filtered lists for Chabbat
  const chabbatDishes = useMemo(() => {
    return userDishes.filter(
      d => (d.occasion.startsWith('chabbat') || d.occasion === 'tous') && (!onlyFavorites || d.isFavorite)
    );
  }, [userDishes, onlyFavorites]);

  const sortedChabbatMains = useMemo(() => {
    const list = chabbatDishes.filter(d => d.type === 'complet' || d.type === 'principal');
    return sortByCookingDate(list);
  }, [chabbatDishes]);

  const sortedChabbatEntrees = useMemo(() => {
    const list = chabbatDishes.filter(
      d =>
        d.type === 'accompagnement' &&
        (d.cuisine === 'tunisien' ||
          d.cuisine === 'israelien' ||
          d.name.toLowerCase().includes('salade') ||
          d.name.toLowerCase().includes('slata') ||
          d.name.toLowerCase().includes('torchi') ||
          d.name.toLowerCase().includes('kémia') ||
          d.name.toLowerCase().includes('brik'))
    );
    return sortByCookingDate(list);
  }, [chabbatDishes]);

  const sortedChabbatSides = useMemo(() => {
    const list = chabbatDishes.filter(
      d => d.type === 'accompagnement' && !sortedChabbatEntrees.some(e => e.id === d.id)
    );
    return sortByCookingDate(list);
  }, [chabbatDishes, sortedChabbatEntrees]);

  const sortedChabbatDesserts = useMemo(() => {
    const list = chabbatDishes.filter(d => d.type === 'dessert');
    return sortByCookingDate(list);
  }, [chabbatDishes]);

  // Toggle dish in Friday night list
  const toggleVendrediDish = (dishId: string) => {
    if (isVendrediAbsent) {
      setIsVendrediAbsent(false);
    }
    const next = new Set(vendrediDishIds);
    if (next.has(dishId)) {
      next.delete(dishId);
    } else {
      next.add(dishId);
    }
    setVendrediDishIds(next);
  };

  // Toggle dish in Saturday lunch list
  const toggleSamediDish = (dishId: string) => {
    if (isSamediAbsent) {
      setIsSamediAbsent(false);
    }
    const next = new Set(samediDishIds);
    if (next.has(dishId)) {
      next.delete(dishId);
    } else {
      next.add(dishId);
    }
    setSamediDishIds(next);
  };

  // Toggle absent state for Friday
  const handleToggleVendrediAbsent = (absent: boolean) => {
    setIsVendrediAbsent(absent);
    if (absent) {
      setVendrediDishIds(new Set());
    }
  };

  // Toggle absent state for Saturday
  const handleToggleSamediAbsent = (absent: boolean) => {
    setIsSamediAbsent(absent);
    if (absent) {
      setSamediDishIds(new Set());
    }
  };

  // Roll random meal for Semaine (prioritizes least recently cooked)
  const handleRandomSemaineMeal = () => {
    if (sortedSemaineMains.length === 0) {
      Alert.alert('Aucun plat disponible', 'Ajoutez des plats de semaine pour pouvoir lancer une suggestion.');
      return;
    }

    // Pick among the top least recently cooked dishes (first half)
    const candidatesCount = Math.max(1, Math.ceil(sortedSemaineMains.length / 2));
    const randomPlat = sortedSemaineMains[Math.floor(Math.random() * candidatesCount)];
    setSemainePlat(randomPlat);

    if (randomPlat.type === 'principal' && sortedSides.length > 0) {
      const randomSide = sortedSides[Math.floor(Math.random() * Math.max(1, Math.ceil(sortedSides.length / 2)))];
      setSemaineSide(randomSide);
    } else {
      setSemaineSide(null);
    }

    if (sortedDesserts.length > 0 && Math.random() > 0.4) {
      const randomDessert = sortedDesserts[Math.floor(Math.random() * sortedDesserts.length)];
      setSemaineDessert(randomDessert);
    } else {
      setSemaineDessert(null);
    }
  };

  // Validate Semaine meal
  const handleValidateSemaineMeal = () => {
    if (!semainePlat) {
      Alert.alert('Plat requis', 'Veuillez sélectionner au moins un plat principal.');
      return;
    }

    if (semainePlat.type === 'principal' && !semaineSide) {
      Alert.alert(
        'Accompagnement conseillé',
        `"${semainePlat.name}" est un plat qui nécessite un accompagnement (ex : frites, purée, riz). Souhaitez-vous en choisir un ?`,
        [
          { text: 'Choisir maintenant', style: 'cancel' },
          {
            text: 'Valider sans accompagnement',
            style: 'default',
            onPress: () => finalizeSemaineMeal(),
          },
        ]
      );
      return;
    }

    finalizeSemaineMeal();
  };

  const finalizeSemaineMeal = () => {
    const now = new Date();
    const entry: MealHistoryEntry = {
      id: `meal-${Date.now()}`,
      date: now.toISOString(),
      displayDate: formatDisplayDate(now.toISOString()),
      occasion: 'semaine',
      mainDishes: semainePlat ? [semainePlat] : [],
      sides: semaineSide ? [semaineSide] : [],
      desserts: semaineDessert ? [semaineDessert] : [],
    };

    onValidateMeal(entry);
    Alert.alert(
      '🎉 Repas enregistré !',
      'Le repas a été validé et archivé dans l’historique. La date de dernière sélection de ce plat a été mise à jour.',
      [
        { text: 'Voir l’historique', onPress: onNavigateToHistory },
        { text: 'Super !', style: 'default' },
      ]
    );

    setSemainePlat(null);
    setSemaineSide(null);
    setSemaineDessert(null);
  };

  // Validate Chabbat meal
  const handleValidateChabbatMeal = () => {
    const isFridayValid = isVendrediAbsent || vendrediDishIds.size > 0;
    const isSaturdayValid = isSamediAbsent || samediDishIds.size > 0;

    if (!isFridayValid && !isSaturdayValid) {
      Alert.alert(
        'Repas de Chabbat incomplet',
        'Un repas de Chabbat doit contenir la partie Vendredi soir et Samedi midi.\n\nVeuillez choisir des plats ou cocher « Absent » pour chaque service.'
      );
      return;
    }

    if (!isFridayValid) {
      Alert.alert(
        'Vendredi soir incomplet',
        'Veuillez sélectionner au moins un plat pour le Vendredi soir, ou cocher « 🚗 Absent ».'
      );
      return;
    }

    if (!isSaturdayValid) {
      Alert.alert(
        'Samedi midi incomplet',
        'Veuillez sélectionner au moins un plat pour le Samedi midi, ou cocher « 🚗 Absent ».'
      );
      return;
    }

    if (isVendrediAbsent && isSamediAbsent) {
      Alert.alert(
        'Absents tout le Chabbat ?',
        'Vous avez indiqué être absent de la maison pour le Vendredi soir et le Samedi midi. Souhaitez-vous enregistrer ce Chabbat extérieur dans l’historique ?',
        [
          { text: 'Modifier', style: 'cancel' },
          { text: 'Oui, enregistrer', onPress: () => finalizeChabbatMeal([], []) },
        ]
      );
      return;
    }

    const dishesMap = new Map(userDishes.map(d => [d.id, d]));
    const vendrediDishes = isVendrediAbsent
      ? []
      : Array.from(vendrediDishIds).map(id => dishesMap.get(id)!).filter(Boolean);
    const samediDishes = isSamediAbsent
      ? []
      : Array.from(samediDishIds).map(id => dishesMap.get(id)!).filter(Boolean);

    finalizeChabbatMeal(vendrediDishes, samediDishes);
  };

  const finalizeChabbatMeal = (vendrediDishes: Dish[], samediDishes: Dish[]) => {
    const allDishes = Array.from(new Set([...vendrediDishes, ...samediDishes]));
    const mains = allDishes.filter(d => d.type === 'complet' || d.type === 'principal');
    const sides = allDishes.filter(d => d.type === 'accompagnement');
    const desserts = allDishes.filter(d => d.type === 'dessert');

    const now = new Date();
    const entry: MealHistoryEntry = {
      id: `meal-chabbat-${Date.now()}`,
      date: now.toISOString(),
      displayDate: formatDisplayDate(now.toISOString()),
      occasion: 'chabbat',
      shabbatSlot: 'les_deux',
      vendrediAbsent: isVendrediAbsent,
      samediAbsent: isSamediAbsent,
      shabbatVendrediSoir: vendrediDishes,
      shabbatSamediMidi: samediDishes,
      mainDishes: mains,
      sides,
      desserts,
    };

    onValidateMeal(entry);

    const summaryLines = [];
    if (isVendrediAbsent) {
      summaryLines.push('• Vendredi soir : 🚗 Absent de la maison');
    } else {
      summaryLines.push(`• Vendredi soir : ${vendrediDishes.length} plat(s)`);
    }

    if (isSamediAbsent) {
      summaryLines.push('• Samedi midi : 🚗 Absent de la maison');
    } else {
      summaryLines.push(`• Samedi midi : ${samediDishes.length} plat(s)`);
    }

    Alert.alert(
      '🕯️ Shabbat Shalom ! Festin validé !',
      `Menu enregistré :\n${summaryLines.join('\n')}`,
      [
        { text: 'Consulter l’historique', onPress: onNavigateToHistory },
        { text: 'Parfait', style: 'default' },
      ]
    );

    setVendrediDishIds(new Set());
    setSamediDishIds(new Set());
    setIsVendrediAbsent(false);
    setIsSamediAbsent(false);
  };

  // Helper component for a Chabbat card with Vendredi & Samedi toggle buttons directly inline with the date
  const renderChabbatDishItem = (dish: Dish) => {
    const isVendredi = vendrediDishIds.has(dish.id);
    const isSamedi = samediDishIds.has(dish.id);
    const isChosen = isVendredi || isSamedi;
    const lastCooked = formatLastCooked(dish.lastCookedDate);

    return (
      <View
        key={dish.id}
        style={[
          styles.chabbatCard,
          isChosen && styles.chabbatCardActive,
          isVendredi && !isSamedi && styles.chabbatCardFridayOnly,
          isSamedi && !isVendredi && styles.chabbatCardSaturdayOnly,
          isVendredi && isSamedi && styles.chabbatCardBoth,
        ]}
      >
        <View style={styles.chabbatCardNameRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, flexWrap: 'wrap' }}>
            <Text style={styles.chabbatCardName}>{dish.name}</Text>
            {dish.isFavorite && (
              <Ionicons name="heart" size={14} color="#EF4444" style={{ marginLeft: 4 }} />
            )}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <Text style={styles.cuisineIcon}>
                {dish.cuisine === 'tunisien'
                  ? '🥘'
                  : dish.cuisine === 'israelien'
                  ? '🧆'
                  : dish.cuisine === 'italien'
                  ? '🍝'
                  : dish.cuisine === 'francais'
                  ? '🥖'
                  : dish.cuisine === 'bbq'
                  ? '🔥'
                  : '🍽️'}
              </Text>
              {dish.kashrut && (
                <Text style={{ fontSize: 12 }}>
                  {dish.kashrut === 'bassari'
                    ? '🥩'
                    : dish.kashrut === 'halavi'
                    ? '🧀'
                    : dish.kashrut === 'poisson'
                    ? '🐟'
                    : '🌿'}
                </Text>
              )}
            </View>
            {onToggleFavorite && (
              <TouchableOpacity
                onPress={() => onToggleFavorite(dish.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name={dish.isFavorite ? 'heart' : 'heart-outline'}
                  size={19}
                  color={dish.isFavorite ? '#EF4444' : colors.textMuted}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {dish.description ? (
          <Text style={styles.chabbatCardDesc} numberOfLines={2}>
            {dish.description}
          </Text>
        ) : null}

        {/* Footer row: Date badge on the left, Friday / Saturday toggle buttons on the right */}
        <View style={styles.chabbatFooterRow}>
          <View style={[styles.chabbatDateBadge, lastCooked.isNever && styles.chabbatDateBadgeNever]}>
            <Ionicons
              name="calendar-outline"
              size={11}
              color={lastCooked.isNever ? '#059669' : colors.textSecondary}
            />
            <Text
              style={[
                styles.chabbatDateBadgeText,
                lastCooked.isNever && styles.chabbatDateBadgeTextNever,
              ]}
              numberOfLines={1}
            >
              {lastCooked.text}
            </Text>
          </View>

          <View style={styles.chabbatInlineButtons}>
            <TouchableOpacity
              style={[
                styles.chabbatInlineBtn,
                styles.chabbatInlineBtnVendredi,
                isVendredi && styles.chabbatInlineBtnVendrediActive,
              ]}
              onPress={() => toggleVendrediDish(dish.id)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isVendredi ? 'checkmark-circle' : 'add-circle-outline'}
                size={13}
                color={isVendredi ? '#FFFFFF' : colors.shabbat}
              />
              <Text
                style={[
                  styles.chabbatInlineBtnText,
                  isVendredi && styles.chabbatInlineBtnTextActive,
                ]}
              >
                🕯️ Ven. soir
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.chabbatInlineBtn,
                styles.chabbatInlineBtnSamedi,
                isSamedi && styles.chabbatInlineBtnSamediActive,
              ]}
              onPress={() => toggleSamediDish(dish.id)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isSamedi ? 'checkmark-circle' : 'add-circle-outline'}
                size={13}
                color={isSamedi ? '#FFFFFF' : '#B45309'}
              />
              <Text
                style={[
                  styles.chabbatInlineBtnText,
                  isSamedi && styles.chabbatInlineBtnTextActive,
                ]}
              >
                ☀️ Sam. midi
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Mode Switcher: Semaine vs Chabbat */}
      <View style={styles.modeSwitcherContainer}>
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              mealMode === 'semaine' && styles.segmentBtnActiveSemaine,
            ]}
            onPress={() => {
              setMealMode('semaine');
              setTypeFilter('all');
            }}
          >
            <Text style={styles.segmentIcon}>📅</Text>
            <Text
              style={[
                styles.segmentText,
                mealMode === 'semaine' && styles.segmentTextActive,
              ]}
            >
              Semaine
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentBtn,
              mealMode === 'chabbat' && styles.segmentBtnActiveShabbat,
            ]}
            onPress={() => {
              setMealMode('chabbat');
              setTypeFilter('all');
            }}
          >
            <Text style={styles.segmentIcon}>🕯️</Text>
            <Text
              style={[
                styles.segmentText,
                mealMode === 'chabbat' && styles.segmentTextActive,
              ]}
            >
              Chabbat
            </Text>
          </TouchableOpacity>
        </View>

        {/* Scope Switcher: Tout vs Que les favoris */}
        <View style={styles.scopeSwitcherContainer}>
          <TouchableOpacity
            style={[
              styles.scopeBtn,
              !onlyFavorites && (mealMode === 'semaine' ? styles.scopeBtnActiveSemaine : styles.scopeBtnActiveShabbat),
            ]}
            onPress={() => setOnlyFavorites(false)}
            activeOpacity={0.7}
          >
            <Text style={[styles.scopeBtnText, !onlyFavorites && styles.scopeBtnTextActive]}>
              🍽️ Tout ({currentAvailableDishes.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.scopeBtn,
              onlyFavorites && styles.scopeBtnActiveHeart,
            ]}
            onPress={() => setOnlyFavorites(true)}
            activeOpacity={0.7}
          >
            <Ionicons
              name="heart"
              size={13}
              color={onlyFavorites ? '#FFFFFF' : '#EF4444'}
              style={{ marginRight: 5 }}
            />
            <Text style={[styles.scopeBtnText, onlyFavorites && styles.scopeBtnTextActive]}>
              Que les favoris ({currentFavsCount})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Day hint */}
        <View style={styles.hintRow}>
          <Ionicons
            name="information-circle-outline"
            size={14}
            color={mealMode === 'chabbat' ? colors.shabbat : colors.semaine}
          />
          <Text style={[styles.hintText, { color: mealMode === 'chabbat' ? colors.shabbat : colors.semaine }]}>
            {dayInfo.isChabbatTime
              ? `Nous sommes ${dayInfo.dayName} : Mode Chabbat actif par défaut.`
              : `Nous sommes ${dayInfo.dayName} : Mode Semaine actif par défaut.`}
          </Text>
        </View>
      </View>

      {/* Type Filter Bar */}
      <View style={styles.typeFilterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.typeFilterScroll}
        >
          {mealMode === 'semaine' ? (
            <>
              <TouchableOpacity
                style={[
                  styles.typeFilterChip,
                  typeFilter === 'all' && styles.typeFilterChipActiveSemaine,
                ]}
                onPress={() => setTypeFilter('all')}
              >
                <Text
                  style={[
                    styles.typeFilterChipText,
                    typeFilter === 'all' && styles.typeFilterChipTextActive,
                  ]}
                >
                  Tous
                </Text>
                <View
                  style={[
                    styles.typeFilterChipBadge,
                    typeFilter === 'all' && styles.typeFilterChipBadgeActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.typeFilterChipBadgeText,
                      typeFilter === 'all' && styles.typeFilterChipBadgeTextActive,
                    ]}
                  >
                    {semaineDishes.length}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeFilterChip,
                  typeFilter === 'plats' && styles.typeFilterChipActiveSemaine,
                ]}
                onPress={() => setTypeFilter(typeFilter === 'plats' ? 'all' : 'plats')}
              >
                <Text
                  style={[
                    styles.typeFilterChipText,
                    typeFilter === 'plats' && styles.typeFilterChipTextActive,
                  ]}
                >
                  🍲 Plats
                </Text>
                <View
                  style={[
                    styles.typeFilterChipBadge,
                    typeFilter === 'plats' && styles.typeFilterChipBadgeActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.typeFilterChipBadgeText,
                      typeFilter === 'plats' && styles.typeFilterChipBadgeTextActive,
                    ]}
                  >
                    {sortedSemaineMains.length}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeFilterChip,
                  typeFilter === 'complet' && styles.typeFilterChipActiveSemaine,
                ]}
                onPress={() => setTypeFilter(typeFilter === 'complet' ? 'all' : 'complet')}
              >
                <Text
                  style={[
                    styles.typeFilterChipText,
                    typeFilter === 'complet' && styles.typeFilterChipTextActive,
                  ]}
                >
                  🍲 Plats complets
                </Text>
                <View
                  style={[
                    styles.typeFilterChipBadge,
                    typeFilter === 'complet' && styles.typeFilterChipBadgeActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.typeFilterChipBadgeText,
                      typeFilter === 'complet' && styles.typeFilterChipBadgeTextActive,
                    ]}
                  >
                    {sortedSemaineComplets.length}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeFilterChip,
                  typeFilter === 'principal' && styles.typeFilterChipActiveSemaine,
                ]}
                onPress={() => setTypeFilter(typeFilter === 'principal' ? 'all' : 'principal')}
              >
                <Text
                  style={[
                    styles.typeFilterChipText,
                    typeFilter === 'principal' && styles.typeFilterChipTextActive,
                  ]}
                >
                  🥩 À accompagner
                </Text>
                <View
                  style={[
                    styles.typeFilterChipBadge,
                    typeFilter === 'principal' && styles.typeFilterChipBadgeActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.typeFilterChipBadgeText,
                      typeFilter === 'principal' && styles.typeFilterChipBadgeTextActive,
                    ]}
                  >
                    {sortedSemainePrincipals.length}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeFilterChip,
                  typeFilter === 'accompagnement' && styles.typeFilterChipActiveSemaine,
                ]}
                onPress={() => setTypeFilter(typeFilter === 'accompagnement' ? 'all' : 'accompagnement')}
              >
                <Text
                  style={[
                    styles.typeFilterChipText,
                    typeFilter === 'accompagnement' && styles.typeFilterChipTextActive,
                  ]}
                >
                  🍟 Accompagnements
                </Text>
                <View
                  style={[
                    styles.typeFilterChipBadge,
                    typeFilter === 'accompagnement' && styles.typeFilterChipBadgeActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.typeFilterChipBadgeText,
                      typeFilter === 'accompagnement' && styles.typeFilterChipBadgeTextActive,
                    ]}
                  >
                    {sortedSides.length}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeFilterChip,
                  typeFilter === 'dessert' && styles.typeFilterChipActiveSemaine,
                ]}
                onPress={() => setTypeFilter(typeFilter === 'dessert' ? 'all' : 'dessert')}
              >
                <Text
                  style={[
                    styles.typeFilterChipText,
                    typeFilter === 'dessert' && styles.typeFilterChipTextActive,
                  ]}
                >
                  🍰 Desserts
                </Text>
                <View
                  style={[
                    styles.typeFilterChipBadge,
                    typeFilter === 'dessert' && styles.typeFilterChipBadgeActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.typeFilterChipBadgeText,
                      typeFilter === 'dessert' && styles.typeFilterChipBadgeTextActive,
                    ]}
                  >
                    {sortedDesserts.length}
                  </Text>
                </View>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[
                  styles.typeFilterChip,
                  typeFilter === 'all' && styles.typeFilterChipActiveShabbat,
                ]}
                onPress={() => setTypeFilter('all')}
              >
                <Text
                  style={[
                    styles.typeFilterChipText,
                    typeFilter === 'all' && styles.typeFilterChipTextActive,
                  ]}
                >
                  Tous
                </Text>
                <View
                  style={[
                    styles.typeFilterChipBadge,
                    typeFilter === 'all' && styles.typeFilterChipBadgeActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.typeFilterChipBadgeText,
                      typeFilter === 'all' && styles.typeFilterChipBadgeTextActive,
                    ]}
                  >
                    {chabbatDishes.length}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeFilterChip,
                  typeFilter === 'plats' && styles.typeFilterChipActiveShabbat,
                ]}
                onPress={() => setTypeFilter(typeFilter === 'plats' ? 'all' : 'plats')}
              >
                <Text
                  style={[
                    styles.typeFilterChipText,
                    typeFilter === 'plats' && styles.typeFilterChipTextActive,
                  ]}
                >
                  🍲 Plats
                </Text>
                <View
                  style={[
                    styles.typeFilterChipBadge,
                    typeFilter === 'plats' && styles.typeFilterChipBadgeActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.typeFilterChipBadgeText,
                      typeFilter === 'plats' && styles.typeFilterChipBadgeTextActive,
                    ]}
                  >
                    {sortedChabbatMains.length}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeFilterChip,
                  typeFilter === 'entrees' && styles.typeFilterChipActiveShabbat,
                ]}
                onPress={() => setTypeFilter(typeFilter === 'entrees' ? 'all' : 'entrees')}
              >
                <Text
                  style={[
                    styles.typeFilterChipText,
                    typeFilter === 'entrees' && styles.typeFilterChipTextActive,
                  ]}
                >
                  🥗 Entrées & Kémia
                </Text>
                <View
                  style={[
                    styles.typeFilterChipBadge,
                    typeFilter === 'entrees' && styles.typeFilterChipBadgeActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.typeFilterChipBadgeText,
                      typeFilter === 'entrees' && styles.typeFilterChipBadgeTextActive,
                    ]}
                  >
                    {sortedChabbatEntrees.length}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeFilterChip,
                  typeFilter === 'accompagnement' && styles.typeFilterChipActiveShabbat,
                ]}
                onPress={() => setTypeFilter(typeFilter === 'accompagnement' ? 'all' : 'accompagnement')}
              >
                <Text
                  style={[
                    styles.typeFilterChipText,
                    typeFilter === 'accompagnement' && styles.typeFilterChipActiveShabbat,
                  ]}
                >
                  🍟 Accompagnements
                </Text>
                <View
                  style={[
                    styles.typeFilterChipBadge,
                    typeFilter === 'accompagnement' && styles.typeFilterChipBadgeActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.typeFilterChipBadgeText,
                      typeFilter === 'accompagnement' && styles.typeFilterChipBadgeTextActive,
                    ]}
                  >
                    {sortedChabbatSides.length}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeFilterChip,
                  typeFilter === 'dessert' && styles.typeFilterChipActiveShabbat,
                ]}
                onPress={() => setTypeFilter(typeFilter === 'dessert' ? 'all' : 'dessert')}
              >
                <Text
                  style={[
                    styles.typeFilterChipText,
                    typeFilter === 'dessert' && styles.typeFilterChipTextActive,
                  ]}
                >
                  🍰 Desserts
                </Text>
                <View
                  style={[
                    styles.typeFilterChipBadge,
                    typeFilter === 'dessert' && styles.typeFilterChipBadgeActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.typeFilterChipBadgeText,
                      typeFilter === 'dessert' && styles.typeFilterChipBadgeTextActive,
                    ]}
                  >
                    {sortedChabbatDesserts.length}
                  </Text>
                </View>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </View>

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        {/* ==================================================== */}
        {/* MODE SEMAINE */}
        {/* ==================================================== */}
        {mealMode === 'semaine' && (
          <View>
            {/* Quick Roulette / Random Suggestion */}
            <View style={styles.randomBanner}>
              <View style={{ flex: 1 }}>
                <Text style={styles.randomTitle}>🎲 En panne d’inspiration ?</Text>
                <Text style={styles.randomSubtitle}>
                  Tirage au sort parmi les plats les moins récemment cuisinés
                </Text>
              </View>
              <TouchableOpacity style={styles.randomActionBtn} onPress={handleRandomSemaineMeal}>
                <Ionicons name="shuffle" size={18} color="#FFFFFF" />
                <Text style={styles.randomActionBtnText}>Proposer</Text>
              </TouchableOpacity>
            </View>

            {/* SELECTION PREVIEW BOX */}
            {(semainePlat || semaineSide || semaineDessert) && (
              <View style={styles.previewBox}>
                <View style={styles.previewHeader}>
                  <Text style={styles.previewTitle}>✨ Repas sélectionné</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setSemainePlat(null);
                      setSemaineSide(null);
                      setSemaineDessert(null);
                    }}
                  >
                    <Text style={styles.previewResetText}>Réinitialiser</Text>
                  </TouchableOpacity>
                </View>

                {/* Plat */}
                {semainePlat && (
                  <View style={styles.previewRow}>
                    <Text style={styles.previewItemIcon}>
                      {semainePlat.type === 'complet' ? '🍲' : '🥩'}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.previewItemName}>{semainePlat.name}</Text>
                      <Text style={styles.previewItemBadge}>
                        {semainePlat.type === 'complet' ? 'Plat complet' : 'Plat avec accompagnement'}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Side */}
                {semaineSide ? (
                  <View style={styles.previewRow}>
                    <Text style={styles.previewItemIcon}>🍟</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.previewItemName}>{semaineSide.name}</Text>
                      <Text style={styles.previewItemBadge}>Accompagnement</Text>
                    </View>
                    <TouchableOpacity onPress={() => setSemaineSide(null)}>
                      <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                ) : semainePlat?.type === 'principal' ? (
                  <View style={[styles.previewRow, styles.previewWarningRow]}>
                    <Ionicons name="alert-circle" size={18} color="#B45309" />
                    <Text style={styles.previewWarningText}>
                      Choisissez un accompagnement ci-dessous !
                    </Text>
                  </View>
                ) : null}

                {/* Dessert */}
                {semaineDessert && (
                  <View style={styles.previewRow}>
                    <Text style={styles.previewItemIcon}>🍰</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.previewItemName}>{semaineDessert.name}</Text>
                      <Text style={styles.previewItemBadge}>Dessert</Text>
                    </View>
                    <TouchableOpacity onPress={() => setSemaineDessert(null)}>
                      <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                )}

                {/* Kashrut conflict notice */}
                {(() => {
                  const items = [semainePlat, semaineSide, semaineDessert].filter(Boolean) as Dish[];
                  const hasBassari = items.some(d => d.kashrut === 'bassari');
                  const hasHalavi = items.some(d => d.kashrut === 'halavi');
                  if (hasBassari && hasHalavi) {
                    return (
                      <View style={[styles.previewRow, styles.previewKashrutWarningRow]}>
                        <Ionicons name="warning" size={18} color="#B91C1C" />
                        <Text style={styles.previewKashrutWarningText}>
                          ⚠️ Attention : mélange Bassari (viande) et Halavi (lait) !
                        </Text>
                      </View>
                    );
                  }
                  return null;
                })()}

                <TouchableOpacity style={styles.validateMealBtn} onPress={handleValidateSemaineMeal}>
                  <Ionicons name="checkmark-done" size={20} color="#FFFFFF" />
                  <Text style={styles.validateMealBtnText}>Valider et enregistrer ce repas</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* SECTION 1: LE PLAT PRINCIPAL (TRIÉ PAR DERNIÈRE FOIS CUISINÉ) */}
            {(typeFilter === 'all' || typeFilter === 'plats' || typeFilter === 'complet' || typeFilter === 'principal') && (
              <View>
                <View style={styles.sectionHeaderRow}>
                  <View>
                    <Text style={styles.sectionTitle}>
                      {typeFilter === 'complet'
                        ? '1. Plats complets'
                        : typeFilter === 'principal'
                        ? '1. Plats à accompagner'
                        : '1. Choisir le plat'}
                    </Text>
                    <Text style={styles.sectionSubtitle}>
                      Classés du moins récemment cuisiné (en haut) au plus récent (en bas)
                    </Text>
                  </View>
                  <Text style={styles.sectionCounter}>{displayedSemaineMains.length} choix</Text>
                </View>

                {displayedSemaineMains.length === 0 ? (
                  <View style={styles.emptyFilterState}>
                    <Text style={styles.emptyFilterText}>Aucun plat correspondant dans vos plats.</Text>
                    <TouchableOpacity style={styles.emptyFilterBtn} onPress={onNavigateToSuggestions}>
                      <Text style={styles.emptyFilterBtnText}>💡 Voir les suggestions</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.dishesGrid}>
                    {displayedSemaineMains.map(dish => {
                      const isSelected = semainePlat?.id === dish.id;
                      const lastCooked = formatLastCooked(dish.lastCookedDate);

                      return (
                        <TouchableOpacity
                          key={dish.id}
                          style={[
                            styles.choiceCard,
                            isSelected && styles.choiceCardSelected,
                          ]}
                          onPress={() => {
                            setSemainePlat(dish);
                            if (dish.type === 'complet') {
                              setSemaineSide(null);
                            }
                          }}
                        >
                          <View style={styles.choiceHeader}>
                            <Text style={styles.choiceIcon}>
                              {dish.type === 'complet' ? '🍲' : '🥩'}
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              {onToggleFavorite && (
                                <TouchableOpacity
                                  onPress={(e) => {
                                    e.stopPropagation();
                                    onToggleFavorite(dish.id);
                                  }}
                                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                >
                                  <Ionicons
                                    name={dish.isFavorite ? 'heart' : 'heart-outline'}
                                    size={18}
                                    color={dish.isFavorite ? '#EF4444' : colors.textMuted}
                                  />
                                </TouchableOpacity>
                              )}
                              {isSelected && (
                                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                              )}
                            </View>
                          </View>
                          <Text style={[styles.choiceName, isSelected && styles.choiceNameSelected]} numberOfLines={2}>
                            {dish.name}
                          </Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                            <Text style={styles.choiceType}>
                              {dish.type === 'complet' ? 'Plat complet' : 'À accompagner'}
                            </Text>
                            {dish.kashrut && (
                              <Text style={{ fontSize: 10.5, fontWeight: '700', color: colors.textSecondary }}>
                                {dish.kashrut === 'bassari'
                                  ? '🥩 Bassari'
                                  : dish.kashrut === 'halavi'
                                  ? '🧀 Halavi'
                                  : dish.kashrut === 'poisson'
                                  ? '🐟 Poisson'
                                  : '🌿 Parve'}
                              </Text>
                            )}
                          </View>

                          {/* Date badge */}
                          <View style={[styles.dateBadgePill, lastCooked.isNever && styles.dateBadgePillNever]}>
                            <Text
                              style={[
                                styles.dateBadgePillText,
                                lastCooked.isNever && styles.dateBadgePillTextNever,
                              ]}
                            >
                              {lastCooked.text}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            )}

            {/* SECTION 2: ACCOMPAGNEMENT */}
            {(typeFilter === 'all' || typeFilter === 'accompagnement') && (
              <View
                style={[
                  styles.sectionContainer,
                  semainePlat?.type === 'principal' && styles.sectionHighlighted,
                ]}
              >
                <View style={styles.sectionHeaderRow}>
                  <View>
                    <Text style={styles.sectionTitle}>
                      2. Choisir l'accompagnement {semainePlat?.type === 'principal' && '⚠️ (Requis)'}
                    </Text>
                    <Text style={styles.sectionSubtitle}>
                      {semainePlat?.type === 'principal'
                        ? 'Nécessaire pour compléter votre viande ou poisson'
                        : 'Optionnel si vous souhaitez une salade ou garniture'}
                    </Text>
                  </View>
                  <Text style={styles.sectionCounter}>{sortedSides.length} choix</Text>
                </View>

                {sortedSides.length === 0 ? (
                  <View style={styles.emptyFilterState}>
                    <Text style={styles.emptyFilterText}>Aucun accompagnement dans vos plats.</Text>
                    <TouchableOpacity style={styles.emptyFilterBtn} onPress={onNavigateToSuggestions}>
                      <Text style={styles.emptyFilterBtnText}>💡 Voir les suggestions</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.chipsWrap}>
                    {sortedSides.map(side => {
                      const isSelected = semaineSide?.id === side.id;
                      const lastCooked = formatLastCooked(side.lastCookedDate);

                      return (
                        <TouchableOpacity
                          key={side.id}
                          style={[
                            styles.chipBtn,
                            isSelected && styles.chipBtnSelected,
                          ]}
                          onPress={() => setSemaineSide(isSelected ? null : side)}
                        >
                          <Text style={styles.chipIcon}>🍟</Text>
                          <View style={{ flexShrink: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                                {side.name}
                              </Text>
                              {side.kashrut && (
                                <Text style={{ fontSize: 10, marginLeft: 3 }}>
                                  {side.kashrut === 'bassari'
                                    ? '🥩'
                                    : side.kashrut === 'halavi'
                                    ? '🧀'
                                    : side.kashrut === 'poisson'
                                    ? '🐟'
                                    : '🌿'}
                                </Text>
                              )}
                              {side.isFavorite && (
                                <Ionicons name="heart" size={12} color="#EF4444" style={{ marginLeft: 3 }} />
                              )}
                            </View>
                            <Text style={[styles.chipSubDate, isSelected && { color: '#FFFFFF' }]}>
                              {lastCooked.text}
                            </Text>
                          </View>
                          {onToggleFavorite && (
                            <TouchableOpacity
                              onPress={(e) => {
                                e.stopPropagation();
                                onToggleFavorite(side.id);
                              }}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              style={{ marginLeft: 6 }}
                            >
                              <Ionicons
                                name={side.isFavorite ? 'heart' : 'heart-outline'}
                                size={15}
                                color={side.isFavorite ? '#EF4444' : (isSelected ? 'rgba(255,255,255,0.7)' : colors.textMuted)}
                              />
                            </TouchableOpacity>
                          )}
                          {isSelected && (
                            <Ionicons name="checkmark" size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            )}

            {/* SECTION 3: DESSERT */}
            {(typeFilter === 'all' || typeFilter === 'dessert') && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeaderRow}>
                  <View>
                    <Text style={styles.sectionTitle}>3. Un dessert ? (Optionnel)</Text>
                    <Text style={styles.sectionSubtitle}>Pour terminer sur une note sucrée</Text>
                  </View>
                  <Text style={styles.sectionCounter}>{sortedDesserts.length} choix</Text>
                </View>

                {sortedDesserts.length === 0 ? (
                  <View style={styles.emptyFilterState}>
                    <Text style={styles.emptyFilterText}>Aucun dessert dans vos plats.</Text>
                    <TouchableOpacity style={styles.emptyFilterBtn} onPress={onNavigateToSuggestions}>
                      <Text style={styles.emptyFilterBtnText}>💡 Voir les suggestions</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.chipsWrap}>
                    {sortedDesserts.map(dessert => {
                      const isSelected = semaineDessert?.id === dessert.id;
                      return (
                        <TouchableOpacity
                          key={dessert.id}
                          style={[
                            styles.chipBtn,
                            isSelected && styles.chipBtnSelectedDessert,
                          ]}
                          onPress={() => setSemaineDessert(isSelected ? null : dessert)}
                        >
                          <Text style={styles.chipIcon}>🍰</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                              {dessert.name}
                            </Text>
                            {dessert.kashrut && (
                              <Text style={{ fontSize: 10, marginLeft: 3 }}>
                                {dessert.kashrut === 'bassari'
                                  ? '🥩'
                                  : dessert.kashrut === 'halavi'
                                  ? '🧀'
                                  : dessert.kashrut === 'poisson'
                                  ? '🐟'
                                  : '🌿'}
                              </Text>
                            )}
                            {dessert.isFavorite && (
                              <Ionicons name="heart" size={12} color="#EF4444" style={{ marginLeft: 3 }} />
                            )}
                          </View>
                          {onToggleFavorite && (
                            <TouchableOpacity
                              onPress={(e) => {
                                e.stopPropagation();
                                onToggleFavorite(dessert.id);
                              }}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              style={{ marginLeft: 6 }}
                            >
                              <Ionicons
                                name={dessert.isFavorite ? 'heart' : 'heart-outline'}
                                size={15}
                                color={dessert.isFavorite ? '#EF4444' : (isSelected ? 'rgba(255,255,255,0.7)' : colors.textMuted)}
                              />
                            </TouchableOpacity>
                          )}
                          {isSelected && (
                            <Ionicons name="checkmark" size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* ==================================================== */}
        {/* MODE CHABBAT (AVEC CHOIX VENDREDI / SAMEDI ET ABSENT) */}
        {/* ==================================================== */}
        {mealMode === 'chabbat' && (
          <View>
            {/* Banner explaining individual dish assignment */}
            <View style={styles.chabbatBanner}>
              <View style={{ flex: 1 }}>
                <Text style={styles.chabbatBannerTitle}>👑 Organisation du Chabbat</Text>
                <Text style={styles.chabbatBannerSubtitle}>
                  Attribuez vos plats pour le Vendredi soir et le Samedi midi, ou cochez « Absent » si vous êtes invité(s).
                </Text>
              </View>
            </View>

            {/* CHABBAT PLANNER & SUMMARY BOX */}
            <View style={styles.chabbatSummaryBox}>
              <View style={styles.chabbatSummaryTop}>
                <Text style={styles.chabbatSummaryTitle}>
                  📋 Menu du Chabbat :
                </Text>
                {(vendrediDishIds.size > 0 || samediDishIds.size > 0 || isVendrediAbsent || isSamediAbsent) && (
                  <TouchableOpacity
                    onPress={() => {
                      setVendrediDishIds(new Set());
                      setSamediDishIds(new Set());
                      setIsVendrediAbsent(false);
                      setIsSamediAbsent(false);
                    }}
                  >
                    <Text style={styles.previewResetText}>Tout effacer</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Vendredi soir row */}
              <View style={styles.summarySlotBlock}>
                <View style={styles.summarySlotHeader}>
                  <Text style={styles.summarySlotTitle}>
                    🕯️ 1er : Vendredi Soir
                  </Text>
                  <View style={styles.absentToggleRow}>
                    <TouchableOpacity
                      style={[
                        styles.absentPill,
                        !isVendrediAbsent && styles.absentPillActiveHome,
                      ]}
                      onPress={() => handleToggleVendrediAbsent(false)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.absentPillText,
                          !isVendrediAbsent && { color: '#FFFFFF', fontWeight: '800' },
                        ]}
                      >
                        🏠 Maison ({vendrediDishIds.size})
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.absentPill,
                        isVendrediAbsent && styles.absentPillActiveAbsent,
                      ]}
                      onPress={() => handleToggleVendrediAbsent(true)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.absentPillText,
                          isVendrediAbsent && { color: '#FFFFFF', fontWeight: '800' },
                        ]}
                      >
                        🚗 Absent
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {isVendrediAbsent ? (
                  <View style={styles.absentNoticeBox}>
                    <Ionicons name="car-outline" size={16} color="#6B7280" />
                    <Text style={styles.absentNoticeText}>
                      Absent de la maison (invités / repas extérieur)
                    </Text>
                  </View>
                ) : (
                  <View style={styles.chabbatSelectedPills}>
                    {userDishes
                      .filter(d => vendrediDishIds.has(d.id))
                      .map(d => (
                        <TouchableOpacity
                          key={d.id}
                          style={styles.chabbatSelectedPillFriday}
                          onPress={() => toggleVendrediDish(d.id)}
                        >
                          <Text style={styles.chabbatSelectedPillFridayText}>{d.name}</Text>
                          <Ionicons name="close-circle" size={14} color={colors.shabbat} />
                        </TouchableOpacity>
                      ))}
                    {vendrediDishIds.size === 0 && (
                      <Text style={styles.emptySlotHint}>
                        Aucun plat sélectionné — choisissez sur les cartes ci-dessous ou cochez Absent
                      </Text>
                    )}
                  </View>
                )}
              </View>

              {/* Samedi midi row */}
              <View style={[styles.summarySlotBlock, { marginTop: 12 }]}>
                <View style={styles.summarySlotHeader}>
                  <Text style={styles.summarySlotTitle}>
                    ☀️ 2ème : Samedi Midi
                  </Text>
                  <View style={styles.absentToggleRow}>
                    <TouchableOpacity
                      style={[
                        styles.absentPill,
                        !isSamediAbsent && styles.absentPillActiveSaturday,
                      ]}
                      onPress={() => handleToggleSamediAbsent(false)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.absentPillText,
                          !isSamediAbsent && { color: '#FFFFFF', fontWeight: '800' },
                        ]}
                      >
                        🏠 Maison ({samediDishIds.size})
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.absentPill,
                        isSamediAbsent && styles.absentPillActiveAbsent,
                      ]}
                      onPress={() => handleToggleSamediAbsent(true)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.absentPillText,
                          isSamediAbsent && { color: '#FFFFFF', fontWeight: '800' },
                        ]}
                      >
                        🚗 Absent
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {isSamediAbsent ? (
                  <View style={styles.absentNoticeBox}>
                    <Ionicons name="car-outline" size={16} color="#6B7280" />
                    <Text style={styles.absentNoticeText}>
                      Absent de la maison (invités / repas extérieur)
                    </Text>
                  </View>
                ) : (
                  <View style={styles.chabbatSelectedPills}>
                    {userDishes
                      .filter(d => samediDishIds.has(d.id))
                      .map(d => (
                        <TouchableOpacity
                          key={d.id}
                          style={styles.chabbatSelectedPillSaturday}
                          onPress={() => toggleSamediDish(d.id)}
                        >
                          <Text style={styles.chabbatSelectedPillSaturdayText}>{d.name}</Text>
                          <Ionicons name="close-circle" size={14} color="#B45309" />
                        </TouchableOpacity>
                      ))}
                    {samediDishIds.size === 0 && (
                      <Text style={styles.emptySlotHint}>
                        Aucun plat sélectionné — choisissez sur les cartes ci-dessous ou cochez Absent
                      </Text>
                    )}
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={styles.validateChabbatBtn}
                onPress={handleValidateChabbatMeal}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark-done-circle" size={20} color="#FFFFFF" />
                <Text style={styles.validateChabbatBtnText}>
                  Valider le festin de Chabbat
                </Text>
              </TouchableOpacity>
            </View>

            {/* SECTION: PLATS PRINCIPAUX DE CHABBAT */}
            {(typeFilter === 'all' || typeFilter === 'plats') && (
              <View>
                <View style={styles.sectionHeaderRow}>
                  <View>
                    <Text style={styles.sectionTitle}>Plats principaux de Chabbat</Text>
                    <Text style={styles.sectionSubtitle}>
                      Couscous, Pkaïla, Boulettes, Poisson... (classés du moins récent au plus récent)
                    </Text>
                  </View>
                  <Text style={styles.sectionCounter}>{sortedChabbatMains.length} choix</Text>
                </View>

                {sortedChabbatMains.length === 0 ? (
                  <View style={styles.emptyFilterState}>
                    <Text style={styles.emptyFilterText}>Aucun plat de Chabbat dans vos plats.</Text>
                    <TouchableOpacity style={styles.emptyFilterBtn} onPress={onNavigateToSuggestions}>
                      <Text style={styles.emptyFilterBtnText}>💡 Voir les suggestions</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.chabbatCardsList}>
                    {sortedChabbatMains.map(dish => renderChabbatDishItem(dish))}
                  </View>
                )}
              </View>
            )}

            {/* SECTION: ENTRÉES & SALADES CUITES */}
            {(typeFilter === 'all' || typeFilter === 'entrees') && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeaderRow}>
                  <View>
                    <Text style={styles.sectionTitle}>Entrées, Salades cuites & Kémia</Text>
                    <Text style={styles.sectionSubtitle}>Slata Méchouia, carottes, navets roses, matbucha...</Text>
                  </View>
                  <Text style={styles.sectionCounter}>{sortedChabbatEntrees.length} choix</Text>
                </View>

                {sortedChabbatEntrees.length === 0 ? (
                  <View style={styles.emptyFilterState}>
                    <Text style={styles.emptyFilterText}>Aucune entrée ou salade cuite dans vos plats.</Text>
                    <TouchableOpacity style={styles.emptyFilterBtn} onPress={onNavigateToSuggestions}>
                      <Text style={styles.emptyFilterBtnText}>💡 Voir les suggestions</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.chabbatCardsList}>
                    {sortedChabbatEntrees.map(dish => renderChabbatDishItem(dish))}
                  </View>
                )}
              </View>
            )}

            {/* SECTION: ACCOMPAGNEMENTS DE CHABBAT */}
            {(typeFilter === 'all' || typeFilter === 'accompagnement') && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeaderRow}>
                  <View>
                    <Text style={styles.sectionTitle}>Accompagnements</Text>
                    <Text style={styles.sectionSubtitle}>Garnitures et féculents</Text>
                  </View>
                  <Text style={styles.sectionCounter}>{sortedChabbatSides.length} choix</Text>
                </View>

                {sortedChabbatSides.length === 0 ? (
                  <View style={styles.emptyFilterState}>
                    <Text style={styles.emptyFilterText}>Aucun accompagnement spécifique pour Chabbat.</Text>
                    <TouchableOpacity style={styles.emptyFilterBtn} onPress={onNavigateToSuggestions}>
                      <Text style={styles.emptyFilterBtnText}>💡 Voir les suggestions</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.chabbatCardsList}>
                    {sortedChabbatSides.map(dish => renderChabbatDishItem(dish))}
                  </View>
                )}
              </View>
            )}

            {/* SECTION: DESSERTS DE CHABBAT */}
            {(typeFilter === 'all' || typeFilter === 'dessert') && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeaderRow}>
                  <View>
                    <Text style={styles.sectionTitle}>Desserts de fête</Text>
                    <Text style={styles.sectionSubtitle}>Pour terminer en beauté</Text>
                  </View>
                  <Text style={styles.sectionCounter}>{sortedChabbatDesserts.length} choix</Text>
                </View>

                {sortedChabbatDesserts.length === 0 ? (
                  <View style={styles.emptyFilterState}>
                    <Text style={styles.emptyFilterText}>Aucun dessert spécifique pour Chabbat.</Text>
                    <TouchableOpacity style={styles.emptyFilterBtn} onPress={onNavigateToSuggestions}>
                      <Text style={styles.emptyFilterBtnText}>💡 Voir les suggestions</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.chabbatCardsList}>
                    {sortedChabbatDesserts.map(dish => renderChabbatDishItem(dish))}
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modeSwitcherContainer: {
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: colors.cardAlt,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  segmentBtnActiveSemaine: {
    backgroundColor: colors.semaine,
    shadowColor: colors.semaine,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentBtnActiveShabbat: {
    backgroundColor: colors.shabbat,
    shadowColor: colors.shabbat,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentIcon: {
    fontSize: 16,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  scopeSwitcherContainer: {
    flexDirection: 'row',
    backgroundColor: colors.cardAlt,
    borderRadius: 12,
    padding: 3,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scopeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 9,
  },
  scopeBtnActiveSemaine: {
    backgroundColor: colors.semaine,
  },
  scopeBtnActiveShabbat: {
    backgroundColor: colors.shabbat,
  },
  scopeBtnActiveHeart: {
    backgroundColor: '#EF4444',
  },
  scopeBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  scopeBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  hintText: {
    fontSize: 12,
    fontWeight: '600',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  randomBanner: {
    backgroundColor: '#FFF4E5',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  randomTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#E65100',
  },
  randomSubtitle: {
    fontSize: 12,
    color: '#B78103',
    marginTop: 2,
  },
  randomActionBtn: {
    backgroundColor: colors.semaine,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    marginLeft: 10,
  },
  randomActionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  previewBox: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  previewResetText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.danger,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.cardAlt,
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
  previewWarningRow: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  previewWarningText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#B45309',
  },
  previewKashrutWarningRow: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  previewKashrutWarningText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#B91C1C',
    flex: 1,
  },
  previewItemIcon: {
    fontSize: 20,
  },
  previewItemName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.text,
  },
  previewItemBadge: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  validateMealBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  validateMealBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 10,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sectionCounter: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  sectionContainer: {
    marginTop: 16,
  },
  sectionHighlighted: {
    backgroundColor: '#FEF9C3',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FACC15',
  },
  dishesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  choiceCard: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  choiceCardSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.primaryLight,
  },
  choiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  choiceIcon: {
    fontSize: 22,
  },
  choiceName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  choiceNameSelected: {
    color: colors.primary,
  },
  choiceType: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  dateBadgePill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  dateBadgePillNever: {
    backgroundColor: '#ECFDF5',
  },
  dateBadgePillText: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  dateBadgePillTextNever: {
    color: '#059669',
    fontWeight: '700',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  chipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipBtnSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipBtnSelectedDessert: {
    backgroundColor: '#BE185D',
    borderColor: '#BE185D',
  },
  chipIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  chipSubDate: {
    fontSize: 9.5,
    color: colors.textSecondary,
    marginTop: 1,
  },
  // Chabbat Specific Styles
  chabbatBanner: {
    backgroundColor: colors.shabbatLight,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#D8CEE8',
  },
  chabbatBannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.shabbatDark,
  },
  chabbatBannerSubtitle: {
    fontSize: 12,
    color: '#5C4A8A',
    marginTop: 2,
  },
  chabbatSummaryBox: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: colors.shabbat,
    shadowColor: colors.shabbat,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chabbatSummaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  chabbatSummaryTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.shabbatDark,
  },
  summarySlotBlock: {
    marginBottom: 10,
  },
  summarySlotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  summarySlotTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.text,
  },
  absentToggleRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  absentPill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: colors.cardAlt,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  absentPillActiveHome: {
    backgroundColor: colors.shabbat,
    borderColor: colors.shabbat,
  },
  absentPillActiveSaturday: {
    backgroundColor: '#D97706',
    borderColor: '#D97706',
  },
  absentPillActiveAbsent: {
    backgroundColor: '#6B7280',
    borderColor: '#6B7280',
  },
  absentPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  absentNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  absentNoticeText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  chabbatSelectedPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chabbatSelectedPillFriday: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.shabbatLight,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
  },
  chabbatSelectedPillFridayText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.shabbatDark,
  },
  chabbatSelectedPillSaturday: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
  },
  chabbatSelectedPillSaturdayText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#92400E',
  },
  emptySlotHint: {
    fontSize: 11.5,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  validateChabbatBtn: {
    backgroundColor: colors.shabbat,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 12,
    gap: 8,
    marginTop: 6,
  },
  validateChabbatBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
  },
  chabbatCardsList: {
    gap: 10,
    marginBottom: 14,
  },
  chabbatCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  chabbatCardActive: {
    borderWidth: 1.5,
  },
  chabbatCardFridayOnly: {
    borderColor: colors.shabbat,
    backgroundColor: '#FAF8FC',
  },
  chabbatCardSaturdayOnly: {
    borderColor: '#D97706',
    backgroundColor: '#FFFDF7',
  },
  chabbatCardBoth: {
    borderColor: colors.primary,
    backgroundColor: '#FDFCF7',
  },
  // Type Filter Bar styles
  typeFilterContainer: {
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingVertical: 8,
  },
  typeFilterScroll: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  typeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: colors.cardAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeFilterChipActiveSemaine: {
    backgroundColor: colors.semaine,
    borderColor: colors.semaine,
  },
  typeFilterChipActiveShabbat: {
    backgroundColor: colors.shabbat,
    borderColor: colors.shabbat,
  },
  typeFilterChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  typeFilterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  typeFilterChipBadge: {
    marginLeft: 6,
    backgroundColor: 'rgba(0,0,0,0.06)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  typeFilterChipBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  typeFilterChipBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  typeFilterChipBadgeTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  emptyFilterState: {
    backgroundColor: colors.cardAlt,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginVertical: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  emptyFilterText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyFilterBtn: {
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyFilterBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  chabbatCardTop: {
    marginBottom: 6,
  },
  chabbatCardNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chabbatCardName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  cuisineIcon: {
    fontSize: 16,
    marginLeft: 6,
  },
  chabbatCardDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: 4,
  },
  chabbatFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 6,
    gap: 8,
  },
  chabbatDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 8,
    flexShrink: 1,
  },
  chabbatDateBadgeNever: {
    backgroundColor: '#ECFDF5',
  },
  chabbatDateBadgeText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  chabbatDateBadgeTextNever: {
    color: '#059669',
    fontWeight: '700',
  },
  chabbatInlineButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  chabbatInlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardAlt,
  },
  chabbatInlineBtnVendredi: {
    borderColor: '#E9D5FF',
  },
  chabbatInlineBtnVendrediActive: {
    backgroundColor: colors.shabbat,
    borderColor: colors.shabbat,
  },
  chabbatInlineBtnSamedi: {
    borderColor: '#FDE68A',
  },
  chabbatInlineBtnSamediActive: {
    backgroundColor: '#D97706',
    borderColor: '#D97706',
  },
  chabbatInlineBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  chabbatInlineBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
