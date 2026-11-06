import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Dish, DishType, OccasionType, CuisineType } from '../types';
import { colors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';

interface AddDishModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (dish: Dish) => void;
  initialDish?: Dish | null;
  title?: string;
  subtitle?: string;
}

export const AddDishModal: React.FC<AddDishModalProps> = ({
  visible,
  onClose,
  onSave,
  initialDish,
  title,
  subtitle,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<DishType>('complet');
  const [occasion, setOccasion] = useState<OccasionType>('semaine');
  const [cuisine, setCuisine] = useState<CuisineType>('classique');
  const [description, setDescription] = useState('');

  // Sync state whenever initialDish changes or modal opens
  useEffect(() => {
    if (initialDish) {
      setName(initialDish.name || '');
      setType(initialDish.type || 'complet');
      setOccasion(initialDish.occasion || 'semaine');
      setCuisine(initialDish.cuisine || 'classique');
      setDescription(initialDish.description || '');
    } else {
      resetForm();
    }
  }, [initialDish, visible]);

  const resetForm = () => {
    setName('');
    setType('complet');
    setOccasion('semaine');
    setCuisine('classique');
    setDescription('');
  };

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Nom requis', 'Veuillez saisir le nom du plat.');
      return;
    }

    const dishToSave: Dish = {
      id: initialDish ? initialDish.id : `dish-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      name: trimmed,
      type,
      occasion,
      cuisine,
      description: description.trim() || undefined,
      isCustom: initialDish ? initialDish.isCustom : true,
      sourceSuggestionId: initialDish?.sourceSuggestionId,
      createdAt: initialDish?.createdAt || Date.now(),
    };

    onSave(dishToSave);
    resetForm();
    onClose();
  };

  const isEditing = !!initialDish;
  const modalTitle = title || (isEditing ? 'Modifier le plat' : 'Ajouter un plat');
  const modalSubtitle = subtitle || (isEditing ? 'Mettre à jour les informations' : 'À la carte de votre cuisine');

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>{modalTitle}</Text>
              <Text style={styles.headerSubtitle}>{modalSubtitle}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Nom du plat */}
            <Text style={styles.label}>Nom du plat *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex : Escalope panée, Hachis Parmentier, Loubia..."
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
            />

            {/* Type de plat */}
            <Text style={styles.label}>Nature du plat *</Text>
            <View style={styles.grid2}>
              <TouchableOpacity
                style={[styles.typeCard, type === 'complet' && styles.typeCardSelected]}
                onPress={() => setType('complet')}
              >
                <Text style={styles.typeIcon}>🍲</Text>
                <View style={styles.typeTextGroup}>
                  <Text style={[styles.typeTitle, type === 'complet' && styles.typeTitleSelected]}>
                    Plat complet
                  </Text>
                  <Text style={styles.typeDesc}>Tout-en-un (ex: Pâtes, Hachis)</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.typeCard, type === 'principal' && styles.typeCardSelected]}
                onPress={() => setType('principal')}
              >
                <Text style={styles.typeIcon}>🥩</Text>
                <View style={styles.typeTextGroup}>
                  <Text style={[styles.typeTitle, type === 'principal' && styles.typeTitleSelected]}>
                    À accompagner
                  </Text>
                  <Text style={styles.typeDesc}>Besoin d'un accompagnement</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.typeCard, type === 'accompagnement' && styles.typeCardSelected]}
                onPress={() => setType('accompagnement')}
              >
                <Text style={styles.typeIcon}>🍟</Text>
                <View style={styles.typeTextGroup}>
                  <Text style={[styles.typeTitle, type === 'accompagnement' && styles.typeTitleSelected]}>
                    Accompagnement
                  </Text>
                  <Text style={styles.typeDesc}>Frites, purée, salades...</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.typeCard, type === 'dessert' && styles.typeCardSelected]}
                onPress={() => setType('dessert')}
              >
                <Text style={styles.typeIcon}>🍰</Text>
                <View style={styles.typeTextGroup}>
                  <Text style={[styles.typeTitle, type === 'dessert' && styles.typeTitleSelected]}>
                    Dessert
                  </Text>
                  <Text style={styles.typeDesc}>Gâteaux, mousses, fruits...</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Occasion / Moment */}
            <Text style={styles.label}>Moment du repas *</Text>
            <View style={styles.chipsRow}>
              {[
                { key: 'semaine', label: '📅 Semaine' },
                { key: 'chabbat_vendredi', label: '🕯️ Chabbat soir' },
                { key: 'chabbat_samedi', label: '☀️ Chabbat midi' },
                { key: 'chabbat_tous', label: '🕯️☀️ Chabbat' },
                { key: 'tous', label: '🔄 Semaine & Chabbat' },
              ].map(item => (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.chip,
                    occasion === item.key && styles.chipSelected,
                  ]}
                  onPress={() => setOccasion(item.key as OccasionType)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      occasion === item.key && styles.chipTextSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Cuisine / Origine */}
            <Text style={styles.label}>Style de cuisine</Text>
            <View style={styles.chipsRow}>
              {[
                { key: 'tunisien', label: 'Tunisien' },
                { key: 'italien', label: 'Italien' },
                { key: 'israelien', label: 'Israélien' },
                { key: 'francais', label: 'Français' },
                { key: 'classique', label: 'Classique / Familial' },
              ].map(item => (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.chip,
                    cuisine === item.key && styles.chipSelected,
                  ]}
                  onPress={() => setCuisine(item.key as CuisineType)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      cuisine === item.key && styles.chipTextSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Description / Notes */}
            <Text style={styles.label}>Notes ou variante (optionnel)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Ex : Servir bien chaud avec quartier de citron..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
              value={description}
              onChangeText={setDescription}
            />

            <View style={{ height: 24 }} />
          </ScrollView>

          {/* Footer Save Button */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Ionicons name="checkmark-sharp" size={20} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>
                {isEditing ? 'Enregistrer les modifications' : 'Enregistrer le plat'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: colors.cardAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  textArea: {
    height: 72,
    textAlignVertical: 'top',
  },
  grid2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeCard: {
    width: '48%',
    backgroundColor: colors.cardAlt,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  typeCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  typeIcon: {
    fontSize: 24,
  },
  typeTextGroup: {
    flex: 1,
  },
  typeTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.text,
  },
  typeTitleSelected: {
    color: colors.primary,
  },
  typeDesc: {
    fontSize: 10.5,
    color: colors.textSecondary,
    marginTop: 2,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    rowGap: 10,
  },
  chip: {
    backgroundColor: colors.cardAlt,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    backgroundColor: colors.card,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
