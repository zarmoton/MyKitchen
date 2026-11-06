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
}

export const RepasScreen: React.FC<RepasScreenProps> = ({
  userDishes,
  onValidateMeal,
  onNavigateToHistory,
  onNavigateToSuggestions,
  prefilledMeal,
}) => {
  const dayInfo = getDayInfo();

  // Mode initialized based on day of week: Mercredi, Jeudi, Vendredi -> Chabbat. Sinon Semaine.
  const [mealMode, setMealMode] = useState<MealHistoryOccasion>(dayInfo.defaultMode);

  // Semaine state
  const [semainePlat, setSemainePlat] = useState<Dish | null>(null);
  const [semaineSide, setSemaineSide] = useState<Dish | null>(null);
  const [semaineDessert, setSemaineDessert] = useState<Dish | null>(null);

  // Chabbat state: separate sets for Friday evening & Saturday lunch per card
  const [vendrediDishIds, setVendrediDishIds] = useState<Set<string>>(new Set());
  const [samediDishIds, setSamediDishIds] = useState<Set<string>>(new Set());

  // Watch for prefilledMeal from history
  useEffect(() => {
    if (!prefilledMeal) return;
    setMealMode(prefilledMeal.occasion);
    if (prefilledMeal.occasion === 'semaine') {
      setSemainePlat(prefilledMeal.mainDishes?.[0] || null);
      setSemaineSide(prefilledMeal.sides?.[0] || null);
      setSemaineDessert(prefilledMeal.desserts?.[0] || null);
    } else {
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

  // Filtered lists for Semaine
  const semaineDishes = useMemo(() => {
    return userDishes.filter(d => d.occasion === 'semaine' || d.occasion === 'tous');
  }, [userDishes]);

  const sortedSemaineMains = useMemo(() => {
    const list = semaineDishes.filter(d => d.type === 'complet' || d.type === 'principal');
    return sortByCookingDate(list);
  }, [semaineDishes]);

  const sortedSides = useMemo(() => {
    const list = userDishes.filter(d => d.type === 'accompagnement');
    return sortByCookingDate(list);
  }, [userDishes]);

  const sortedDesserts = useMemo(() => {
    const list = userDishes.filter(d => d.type === 'dessert');
    return sortByCookingDate(list);
  }, [userDishes]);

  // Filtered lists for Chabbat
  const chabbatDishes = useMemo(() => {
    return userDishes.filter(d => d.occasion.startsWith('chabbat') || d.occasion === 'tous');
  }, [userDishes]);

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
    const next = new Set(samediDishIds);
    if (next.has(dishId)) {
      next.delete(dishId);
    } else {
      next.add(dishId);
    }
    setSamediDishIds(next);
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
    if (vendrediDishIds.size === 0 && samediDishIds.size === 0) {
      Alert.alert(
        'Aucun plat sélectionné',
        'Veuillez attribuer au moins un plat pour le Vendredi soir ou le Samedi midi sur les cartes ci-dessous.'
      );
      return;
    }

    const dishesMap = new Map(userDishes.map(d => [d.id, d]));
    const vendrediDishes = Array.from(vendrediDishIds).map(id => dishesMap.get(id)!).filter(Boolean);
    const samediDishes = Array.from(samediDishIds).map(id => dishesMap.get(id)!).filter(Boolean);

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
      shabbatVendrediSoir: vendrediDishes,
      shabbatSamediMidi: samediDishes,
      mainDishes: mains,
      sides,
      desserts,
    };

    onValidateMeal(entry);
    Alert.alert(
      '🕯️ Shabbat Shalom ! Festin validé !',
      `Menu enregistré :\n• Vendredi soir : ${vendrediDishes.length} plat(s)\n• Samedi midi : ${samediDishes.length} plat(s)`,
      [
        { text: 'Consulter l’historique', onPress: onNavigateToHistory },
        { text: 'Parfait', style: 'default' },
      ]
    );

    setVendrediDishIds(new Set());
    setSamediDishIds(new Set());
  };

  // Helper component for a Chabbat card with Vendredi & Samedi toggle buttons directly on it
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
        <View style={styles.chabbatCardTop}>
          <View style={{ flex: 1 }}>
            <View style={styles.chabbatCardNameRow}>
              <Text style={styles.chabbatCardName}>{dish.name}</Text>
              <Text style={styles.cuisineIcon}>
                {dish.cuisine === 'tunisien'
                  ? '🥘'
                  : dish.cuisine === 'israelien'
                  ? '🧆'
                  : dish.cuisine === 'italien'
                  ? '🍝'
                  : dish.cuisine === 'francais'
                  ? '🥖'
                  : '🍽️'}
              </Text>
            </View>

            {dish.description ? (
              <Text style={styles.chabbatCardDesc} numberOfLines={2}>
                {dish.description}
              </Text>
            ) : null}

            {/* Date info pill */}
            <View style={styles.chabbatDateBadge}>
              <Ionicons
                name="calendar-outline"
                size={11}
                color={lastCooked.isNever ? '#059669' : colors.textSecondary}
              />
              <Text
                style={[
                  styles.chabbatDateBadgeText,
                  lastCooked.isNever && { color: '#059669', fontWeight: '700' },
                ]}
              >
                {lastCooked.text}
              </Text>
            </View>
          </View>
        </View>

        {/* The two individual toggle buttons for each dish */}
        <View style={styles.chabbatButtonsRow}>
          <TouchableOpacity
            style={[
              styles.chabbatSlotToggleBtn,
              isVendredi && styles.chabbatSlotToggleBtnVendrediActive,
            ]}
            onPress={() => toggleVendrediDish(dish.id)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isVendredi ? 'checkmark-circle' : 'ellipse-outline'}
              size={16}
              color={isVendredi ? '#FFFFFF' : colors.shabbat}
            />
            <Text
              style={[
                styles.chabbatSlotToggleBtnText,
                isVendredi && styles.chabbatSlotToggleBtnTextActive,
              ]}
            >
              🕯️ Vendredi Soir
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.chabbatSlotToggleBtn,
              isSamedi && styles.chabbatSlotToggleBtnSamediActive,
            ]}
            onPress={() => toggleSamediDish(dish.id)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isSamedi ? 'checkmark-circle' : 'ellipse-outline'}
              size={16}
              color={isSamedi ? '#FFFFFF' : '#B45309'}
            />
            <Text
              style={[
                styles.chabbatSlotToggleBtnText,
                isSamedi && styles.chabbatSlotToggleBtnTextActive,
              ]}
            >
              ☀️ Samedi Midi
            </Text>
          </TouchableOpacity>
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
            onPress={() => setMealMode('semaine')}
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
            onPress={() => setMealMode('chabbat')}
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

                <TouchableOpacity style={styles.validateMealBtn} onPress={handleValidateSemaineMeal}>
                  <Ionicons name="checkmark-done" size={20} color="#FFFFFF" />
                  <Text style={styles.validateMealBtnText}>Valider et enregistrer ce repas</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* SECTION 1: LE PLAT PRINCIPAL (TRIÉ PAR DERNIÈRE FOIS CUISINÉ) */}
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>1. Choisir le plat</Text>
                <Text style={styles.sectionSubtitle}>
                  Classés du moins récemment cuisiné (en haut) au plus récent (en bas)
                </Text>
              </View>
              <Text style={styles.sectionCounter}>{sortedSemaineMains.length} choix</Text>
            </View>

            <View style={styles.dishesGrid}>
              {sortedSemaineMains.map(dish => {
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
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                      )}
                    </View>
                    <Text style={[styles.choiceName, isSelected && styles.choiceNameSelected]} numberOfLines={2}>
                      {dish.name}
                    </Text>
                    <Text style={styles.choiceType}>
                      {dish.type === 'complet' ? 'Plat complet' : 'À accompagner'}
                    </Text>

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

            {/* SECTION 2: ACCOMPAGNEMENT */}
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
              </View>

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
                      <View>
                        <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                          {side.name}
                        </Text>
                        <Text style={[styles.chipSubDate, isSelected && { color: '#FFFFFF' }]}>
                          {lastCooked.text}
                        </Text>
                      </View>
                      {isSelected && (
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" style={{ marginLeft: 6 }} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* SECTION 3: DESSERT */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={styles.sectionTitle}>3. Un dessert ? (Optionnel)</Text>
                  <Text style={styles.sectionSubtitle}>Pour terminer sur une note sucrée</Text>
                </View>
              </View>

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
                      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                        {dessert.name}
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* ==================================================== */}
        {/* MODE CHABBAT (AVEC CHOIX VENDREDI / SAMEDI SUR CHAQUE CARTE) */}
        {/* ==================================================== */}
        {mealMode === 'chabbat' && (
          <View>
            {/* Banner explaining individual dish assignment */}
            <View style={styles.chabbatBanner}>
              <View style={{ flex: 1 }}>
                <Text style={styles.chabbatBannerTitle}>👑 Festin de Chabbat</Text>
                <Text style={styles.chabbatBannerSubtitle}>
                  Attribuez directement chaque plat au Vendredi soir, au Samedi midi, ou aux deux !
                </Text>
              </View>
            </View>

            {/* SUMMARY BAR: LIVE COUNT OF VENDREDI & SAMEDI */}
            {(vendrediDishIds.size > 0 || samediDishIds.size > 0) && (
              <View style={styles.chabbatSummaryBox}>
                <View style={styles.chabbatSummaryTop}>
                  <Text style={styles.chabbatSummaryTitle}>
                    🍽️ Menu en cours de composition :
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setVendrediDishIds(new Set());
                      setSamediDishIds(new Set());
                    }}
                  >
                    <Text style={styles.previewResetText}>Tout effacer</Text>
                  </TouchableOpacity>
                </View>

                {/* Vendredi soir row */}
                <View style={styles.summarySlotBlock}>
                  <View style={styles.summarySlotHeader}>
                    <Text style={styles.summarySlotTitle}>
                      🕯️ Vendredi Soir ({vendrediDishIds.size} plats)
                    </Text>
                  </View>
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
                      <Text style={styles.emptySlotHint}>Aucun plat assigné au vendredi soir</Text>
                    )}
                  </View>
                </View>

                {/* Samedi midi row */}
                <View style={styles.summarySlotBlock}>
                  <View style={styles.summarySlotHeader}>
                    <Text style={styles.summarySlotTitle}>
                      ☀️ Samedi Midi ({samediDishIds.size} plats)
                    </Text>
                  </View>
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
                      <Text style={styles.emptySlotHint}>Aucun plat assigné au samedi midi</Text>
                    )}
                  </View>
                </View>

                <TouchableOpacity style={styles.validateChabbatBtn} onPress={handleValidateChabbatMeal}>
                  <Ionicons name="checkmark-done-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.validateChabbatBtnText}>
                    Valider le festin de Chabbat
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* SECTION: PLATS PRINCIPAUX DE CHABBAT */}
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Plats principaux de Chabbat</Text>
                <Text style={styles.sectionSubtitle}>
                  Couscous, Pkaïla, Boulettes, Poisson... (classés du moins récent au plus récent)
                </Text>
              </View>
            </View>

            <View style={styles.chabbatCardsList}>
              {sortedChabbatMains.map(dish => renderChabbatDishItem(dish))}
            </View>

            {/* SECTION: ENTRÉES & SALADES CUITES */}
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Entrées, Salades cuites & Kémia</Text>
                <Text style={styles.sectionSubtitle}>Slata Méchouia, carottes, navets roses, matbucha...</Text>
              </View>
            </View>

            <View style={styles.chabbatCardsList}>
              {sortedChabbatEntrees.map(dish => renderChabbatDishItem(dish))}
            </View>

            {/* SECTION: ACCOMPAGNEMENTS DE CHABBAT */}
            {sortedChabbatSides.length > 0 && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Accompagnements</Text>
                </View>
                <View style={styles.chabbatCardsList}>
                  {sortedChabbatSides.map(dish => renderChabbatDishItem(dish))}
                </View>
              </View>
            )}

            {/* SECTION: DESSERTS DE CHABBAT */}
            {sortedChabbatDesserts.length > 0 && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Desserts de fête</Text>
                </View>
                <View style={styles.chabbatCardsList}>
                  {sortedChabbatDesserts.map(dish => renderChabbatDishItem(dish))}
                </View>
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
    marginBottom: 4,
  },
  summarySlotTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.text,
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
  chabbatCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
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
  chabbatDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  chabbatDateBadgeText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  chabbatButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  chabbatSlotToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardAlt,
  },
  chabbatSlotToggleBtnVendrediActive: {
    backgroundColor: colors.shabbat,
    borderColor: colors.shabbat,
  },
  chabbatSlotToggleBtnSamediActive: {
    backgroundColor: '#D97706',
    borderColor: '#D97706',
  },
  chabbatSlotToggleBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  chabbatSlotToggleBtnTextActive: {
    color: '#FFFFFF',
  },
});
