import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Dish, MealHistoryEntry, MealHistoryOccasion, ShabbatSubOccasion } from '../types';
import { getDayInfo, formatDisplayDate } from '../utils/dateUtils';
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
  const [randomModeActive, setRandomModeActive] = useState<boolean>(false);

  // Chabbat state
  const [shabbatSlot, setShabbatSlot] = useState<ShabbatSubOccasion>('vendredi_soir');
  const [selectedChabbatDishIds, setSelectedChabbatDishIds] = useState<Set<string>>(new Set());

  // Watch for prefilledMeal from history
  useEffect(() => {
    if (!prefilledMeal) return;
    setMealMode(prefilledMeal.occasion);
    if (prefilledMeal.occasion === 'semaine') {
      setSemainePlat(prefilledMeal.mainDishes?.[0] || null);
      setSemaineSide(prefilledMeal.sides?.[0] || null);
      setSemaineDessert(prefilledMeal.desserts?.[0] || null);
    } else {
      if (prefilledMeal.shabbatSlot) {
        setShabbatSlot(prefilledMeal.shabbatSlot);
      }
      const allIds = new Set<string>();
      prefilledMeal.mainDishes?.forEach(d => allIds.add(d.id));
      prefilledMeal.sides?.forEach(d => allIds.add(d.id));
      prefilledMeal.desserts?.forEach(d => allIds.add(d.id));
      setSelectedChabbatDishIds(allIds);
    }
  }, [prefilledMeal]);

  // Filtered lists for Semaine
  const semaineDishes = useMemo(() => {
    return userDishes.filter(d => d.occasion === 'semaine' || d.occasion === 'tous');
  }, [userDishes]);

  const semaineMainsAndComplets = useMemo(() => {
    return semaineDishes.filter(d => d.type === 'complet' || d.type === 'principal');
  }, [semaineDishes]);

  const allSides = useMemo(() => {
    return userDishes.filter(d => d.type === 'accompagnement');
  }, [userDishes]);

  const allDesserts = useMemo(() => {
    return userDishes.filter(d => d.type === 'dessert');
  }, [userDishes]);

  // Filtered lists for Chabbat
  const chabbatDishes = useMemo(() => {
    return userDishes.filter(d => d.occasion.startsWith('chabbat') || d.occasion === 'tous');
  }, [userDishes]);

  const chabbatEntrees = useMemo(() => {
    return chabbatDishes.filter(d => d.type === 'accompagnement' && (d.cuisine === 'tunisien' || d.name.toLowerCase().includes('salade') || d.name.toLowerCase().includes('slata') || d.name.toLowerCase().includes('torchi') || d.name.toLowerCase().includes('kémia') || d.name.toLowerCase().includes('brik')));
  }, [chabbatDishes]);

  const chabbatMains = useMemo(() => {
    return chabbatDishes.filter(d => d.type === 'complet' || d.type === 'principal');
  }, [chabbatDishes]);

  const chabbatSides = useMemo(() => {
    return chabbatDishes.filter(d => d.type === 'accompagnement' && !chabbatEntrees.some(e => e.id === d.id));
  }, [chabbatDishes, chabbatEntrees]);

  const chabbatDesserts = useMemo(() => {
    return chabbatDishes.filter(d => d.type === 'dessert');
  }, [chabbatDishes]);

  // Roll random meal for Semaine
  const handleRandomSemaineMeal = () => {
    if (semaineMainsAndComplets.length === 0) {
      Alert.alert('Aucun plat disponible', 'Ajoutez des plats de semaine pour pouvoir lancer une suggestion.');
      return;
    }

    const randomPlat = semaineMainsAndComplets[Math.floor(Math.random() * semaineMainsAndComplets.length)];
    setSemainePlat(randomPlat);

    if (randomPlat.type === 'principal' && allSides.length > 0) {
      const randomSide = allSides[Math.floor(Math.random() * allSides.length)];
      setSemaineSide(randomSide);
    } else {
      setSemaineSide(null);
    }

    if (allDesserts.length > 0 && Math.random() > 0.4) {
      const randomDessert = allDesserts[Math.floor(Math.random() * allDesserts.length)];
      setSemaineDessert(randomDessert);
    } else {
      setSemaineDessert(null);
    }

    setRandomModeActive(true);
  };

  // Roll random menu for Chabbat
  const handleRandomChabbatMenu = () => {
    const selected = new Set<string>();

    // 1-2 Entrées / Kémia
    if (chabbatEntrees.length > 0) {
      const e = chabbatEntrees[Math.floor(Math.random() * chabbatEntrees.length)];
      selected.add(e.id);
    }

    // 1-2 Plats
    if (chabbatMains.length > 0) {
      const m1 = chabbatMains[Math.floor(Math.random() * chabbatMains.length)];
      selected.add(m1.id);
      // Optional 2nd dish (e.g., boulettes or poisson)
      const others = chabbatMains.filter(m => m.id !== m1.id);
      if (others.length > 0 && Math.random() > 0.3) {
        selected.add(others[Math.floor(Math.random() * others.length)].id);
      }
    }

    // Accompagnement
    if (chabbatSides.length > 0 && Math.random() > 0.3) {
      selected.add(chabbatSides[Math.floor(Math.random() * chabbatSides.length)].id);
    }

    // Dessert
    if (chabbatDesserts.length > 0) {
      selected.add(chabbatDesserts[Math.floor(Math.random() * chabbatDesserts.length)].id);
    }

    setSelectedChabbatDishIds(selected);
  };

  // Toggle dish in Chabbat multi-select
  const toggleChabbatDish = (dishId: string) => {
    const next = new Set(selectedChabbatDishIds);
    if (next.has(dishId)) {
      next.delete(dishId);
    } else {
      next.add(dishId);
    }
    setSelectedChabbatDishIds(next);
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
      'Le repas a été validé et ajouté à votre historique.',
      [
        { text: 'Voir l’historique', onPress: onNavigateToHistory },
        { text: 'Super !', style: 'default' },
      ]
    );

    // Reset selection
    setSemainePlat(null);
    setSemaineSide(null);
    setSemaineDessert(null);
    setRandomModeActive(false);
  };

  // Validate Chabbat meal
  const handleValidateChabbatMeal = () => {
    if (selectedChabbatDishIds.size === 0) {
      Alert.alert('Sélection vide', 'Veuillez cocher au moins un plat pour votre repas de Chabbat.');
      return;
    }

    const selectedDishes = userDishes.filter(d => selectedChabbatDishIds.has(d.id));
    const mains = selectedDishes.filter(d => d.type === 'complet' || d.type === 'principal');
    const sides = selectedDishes.filter(d => d.type === 'accompagnement');
    const desserts = selectedDishes.filter(d => d.type === 'dessert');

    const now = new Date();
    const entry: MealHistoryEntry = {
      id: `meal-chabbat-${Date.now()}`,
      date: now.toISOString(),
      displayDate: formatDisplayDate(now.toISOString()),
      occasion: 'chabbat',
      shabbatSlot,
      mainDishes: mains,
      sides,
      desserts,
    };

    onValidateMeal(entry);
    Alert.alert(
      '🕯️ Shabbat Shalom ! Festin validé !',
      `Menu enregistré pour ${shabbatSlot === 'vendredi_soir' ? 'Vendredi soir' : shabbatSlot === 'samedi_midi' ? 'Samedi midi' : 'le Chabbat complet'} avec ${selectedDishes.length} mets.`,
      [
        { text: 'Consulter l’historique', onPress: onNavigateToHistory },
        { text: 'Parfait', style: 'default' },
      ]
    );

    setSelectedChabbatDishIds(new Set());
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
              ? `Nous sommes ${dayInfo.dayName} : Mode Chabbat sélectionné par défaut.`
              : `Nous sommes ${dayInfo.dayName} : Mode Semaine sélectionné par défaut.`}
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
                  Tirage au sort d’un bon plat de semaine parmi vos favoris
                </Text>
              </View>
              <TouchableOpacity style={styles.randomActionBtn} onPress={handleRandomSemaineMeal}>
                <Ionicons name="shuffle" size={18} color="#FFFFFF" />
                <Text style={styles.randomActionBtnText}>Proposer</Text>
              </TouchableOpacity>
            </View>

            {/* SELECTION CARD PREVIEW IF SOMETHING IS CHOSEN */}
            {(semainePlat || semaineSide || semaineDessert) && (
              <View style={styles.previewBox}>
                <View style={styles.previewHeader}>
                  <Text style={styles.previewTitle}>✨ Repas en cours de composition</Text>
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

            {/* SECTION 1: LE PLAT PRINCIPAL */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>1. Choisir le plat</Text>
              <Text style={styles.sectionCounter}>{semaineMainsAndComplets.length} choix</Text>
            </View>

            <View style={styles.dishesGrid}>
              {semaineMainsAndComplets.map(dish => {
                const isSelected = semainePlat?.id === dish.id;
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
                    <Text style={[styles.choiceName, isSelected && styles.choiceNameSelected]}>
                      {dish.name}
                    </Text>
                    <Text style={styles.choiceType}>
                      {dish.type === 'complet' ? 'Plat complet' : 'À accompagner'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* SECTION 2: ACCOMPAGNEMENT (ACTIVÉ NOTAMMENT SI PLAT À ACCOMPAGNER) */}
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
                      ? 'Nécessaire pour compléter votre plat de viande/poisson'
                      : 'Optionnel si vous souhaitez une salade ou garniture'}
                  </Text>
                </View>
              </View>

              <View style={styles.chipsWrap}>
                {allSides.map(side => {
                  const isSelected = semaineSide?.id === side.id;
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
                      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                        {side.name}
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* SECTION 3: DESSERT (OPTIONNEL) */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={styles.sectionTitle}>3. Un dessert ? (Optionnel)</Text>
                  <Text style={styles.sectionSubtitle}>Pour terminer en douceur</Text>
                </View>
              </View>

              <View style={styles.chipsWrap}>
                {allDesserts.map(dessert => {
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
        {/* MODE CHABBAT */}
        {/* ==================================================== */}
        {mealMode === 'chabbat' && (
          <View>
            {/* Chabbat Slot Selector: Vendredi soir vs Samedi midi */}
            <View style={styles.shabbatSlotRow}>
              <TouchableOpacity
                style={[
                  styles.shabbatSlotBtn,
                  shabbatSlot === 'vendredi_soir' && styles.shabbatSlotBtnActive,
                ]}
                onPress={() => setShabbatSlot('vendredi_soir')}
              >
                <Text style={styles.shabbatSlotIcon}>🕯️</Text>
                <Text
                  style={[
                    styles.shabbatSlotText,
                    shabbatSlot === 'vendredi_soir' && styles.shabbatSlotTextActive,
                  ]}
                >
                  Vendredi Soir
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.shabbatSlotBtn,
                  shabbatSlot === 'samedi_midi' && styles.shabbatSlotBtnActive,
                ]}
                onPress={() => setShabbatSlot('samedi_midi')}
              >
                <Text style={styles.shabbatSlotIcon}>☀️</Text>
                <Text
                  style={[
                    styles.shabbatSlotText,
                    shabbatSlot === 'samedi_midi' && styles.shabbatSlotTextActive,
                  ]}
                >
                  Samedi Midi
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.shabbatSlotBtn,
                  shabbatSlot === 'les_deux' && styles.shabbatSlotBtnActive,
                ]}
                onPress={() => setShabbatSlot('les_deux')}
              >
                <Text style={styles.shabbatSlotIcon}>✨</Text>
                <Text
                  style={[
                    styles.shabbatSlotText,
                    shabbatSlot === 'les_deux' && styles.shabbatSlotTextActive,
                  ]}
                >
                  Tout le Chabbat
                </Text>
              </TouchableOpacity>
            </View>

            {/* Random Menu Generator Button */}
            <View style={styles.chabbatBanner}>
              <View style={{ flex: 1 }}>
                <Text style={styles.chabbatBannerTitle}>👑 Festin de Chabbat</Text>
                <Text style={styles.chabbatBannerSubtitle}>
                  Composez une table généreuse avec plusieurs plats (Couscous + Boulettes + Slata...)
                </Text>
              </View>
              <TouchableOpacity style={styles.chabbatMagicBtn} onPress={handleRandomChabbatMenu}>
                <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                <Text style={styles.chabbatMagicBtnText}>Idée menu</Text>
              </TouchableOpacity>
            </View>

            {/* Selected Summary Pill */}
            {selectedChabbatDishIds.size > 0 && (
              <View style={styles.chabbatSummaryBox}>
                <View style={styles.chabbatSummaryTop}>
                  <Text style={styles.chabbatSummaryTitle}>
                    🍽️ {selectedChabbatDishIds.size} plat(s) sélectionné(s) pour la table :
                  </Text>
                  <TouchableOpacity onPress={() => setSelectedChabbatDishIds(new Set())}>
                    <Text style={styles.previewResetText}>Effacer tout</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.chabbatSelectedPills}>
                  {userDishes
                    .filter(d => selectedChabbatDishIds.has(d.id))
                    .map(d => (
                      <TouchableOpacity
                        key={d.id}
                        style={styles.chabbatSelectedPill}
                        onPress={() => toggleChabbatDish(d.id)}
                      >
                        <Text style={styles.chabbatSelectedPillText}>{d.name}</Text>
                        <Ionicons name="close-circle" size={14} color={colors.shabbat} />
                      </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity style={styles.validateChabbatBtn} onPress={handleValidateChabbatMeal}>
                  <Ionicons name="checkmark-done-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.validateChabbatBtnText}>
                    Valider le repas ({shabbatSlot === 'vendredi_soir' ? 'Vendredi soir' : shabbatSlot === 'samedi_midi' ? 'Samedi midi' : 'Chabbat complet'})
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* SECTION: PLATS PRINCIPAUX & SPÉCIALITÉS CHABBAT (MULTI-SELECTION) */}
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Plats principaux de Chabbat</Text>
                <Text style={styles.sectionSubtitle}>
                  Sélectionnez un ou plusieurs plats (ex: Couscous + Boulettes au cumin + Poisson)
                </Text>
              </View>
            </View>

            <View style={styles.chabbatGrid}>
              {chabbatMains.map(dish => {
                const isSelected = selectedChabbatDishIds.has(dish.id);
                return (
                  <TouchableOpacity
                    key={dish.id}
                    style={[
                      styles.chabbatDishCard,
                      isSelected && styles.chabbatDishCardSelected,
                    ]}
                    onPress={() => toggleChabbatDish(dish.id)}
                  >
                    <View style={styles.chabbatCardHeader}>
                      <Ionicons
                        name={isSelected ? 'checkbox' : 'square-outline'}
                        size={22}
                        color={isSelected ? colors.shabbat : colors.textMuted}
                      />
                      <Text style={styles.chabbatCardCuisine}>
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
                    <Text
                      style={[
                        styles.chabbatCardName,
                        isSelected && styles.chabbatCardNameSelected,
                      ]}
                    >
                      {dish.name}
                    </Text>
                    {dish.description ? (
                      <Text style={styles.chabbatCardDesc} numberOfLines={2}>
                        {dish.description}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* SECTION: ENTRÉES, SALADES & KÉMIA */}
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Entrées, Salades cuites & Kémia</Text>
                <Text style={styles.sectionSubtitle}>Slata Méchouia, carottes, navets roses, brik...</Text>
              </View>
            </View>

            <View style={styles.chipsWrap}>
              {chabbatEntrees.map(dish => {
                const isSelected = selectedChabbatDishIds.has(dish.id);
                return (
                  <TouchableOpacity
                    key={dish.id}
                    style={[
                      styles.chipBtn,
                      isSelected && styles.chipBtnSelectedShabbat,
                    ]}
                    onPress={() => toggleChabbatDish(dish.id)}
                  >
                    <Text style={styles.chipIcon}>🥗</Text>
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                      {dish.name}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* SECTION: ACCOMPAGNEMENTS DE CHABBAT */}
            {chabbatSides.length > 0 && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Accompagnements</Text>
                </View>
                <View style={styles.chipsWrap}>
                  {chabbatSides.map(dish => {
                    const isSelected = selectedChabbatDishIds.has(dish.id);
                    return (
                      <TouchableOpacity
                        key={dish.id}
                        style={[
                          styles.chipBtn,
                          isSelected && styles.chipBtnSelectedShabbat,
                        ]}
                        onPress={() => toggleChabbatDish(dish.id)}
                      >
                        <Text style={styles.chipIcon}>🍟</Text>
                        <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                          {dish.name}
                        </Text>
                        {isSelected && (
                          <Ionicons name="checkmark" size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* SECTION: DESSERTS DE CHABBAT */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={styles.sectionTitle}>Desserts de Chabbat</Text>
                  <Text style={styles.sectionSubtitle}>Salade d'oranges, Makrouds, douceurs...</Text>
                </View>
              </View>
              <View style={styles.chipsWrap}>
                {chabbatDesserts.map(dish => {
                  const isSelected = selectedChabbatDishIds.has(dish.id);
                  return (
                    <TouchableOpacity
                      key={dish.id}
                      style={[
                        styles.chipBtn,
                        isSelected && styles.chipBtnSelectedShabbat,
                      ]}
                      onPress={() => toggleChabbatDish(dish.id)}
                    >
                      <Text style={styles.chipIcon}>🍊</Text>
                      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                        {dish.name}
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
  chipBtnSelectedShabbat: {
    backgroundColor: colors.shabbat,
    borderColor: colors.shabbat,
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
  // Chabbat Specific Styles
  shabbatSlotRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  shabbatSlotBtn: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  shabbatSlotBtnActive: {
    backgroundColor: colors.shabbatLight,
    borderColor: colors.shabbat,
    borderWidth: 2,
  },
  shabbatSlotIcon: {
    fontSize: 18,
  },
  shabbatSlotText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  shabbatSlotTextActive: {
    color: colors.shabbat,
  },
  chabbatBanner: {
    backgroundColor: colors.shabbatLight,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
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
  chabbatMagicBtn: {
    backgroundColor: colors.shabbat,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    marginLeft: 10,
  },
  chabbatMagicBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12.5,
  },
  chabbatSummaryBox: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: colors.shabbat,
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
  chabbatSelectedPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  chabbatSelectedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.shabbatLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 6,
  },
  chabbatSelectedPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.shabbatDark,
  },
  validateChabbatBtn: {
    backgroundColor: colors.shabbat,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 12,
    gap: 8,
  },
  validateChabbatBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
  },
  chabbatGrid: {
    gap: 8,
    marginBottom: 14,
  },
  chabbatDishCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  chabbatDishCardSelected: {
    backgroundColor: colors.shabbatLight,
    borderColor: colors.shabbat,
    borderWidth: 1.5,
  },
  chabbatCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  chabbatCardCuisine: {
    fontSize: 16,
  },
  chabbatCardName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  chabbatCardNameSelected: {
    color: colors.shabbatDark,
  },
  chabbatCardDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
});

