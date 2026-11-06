import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  Share,
  TextInput,
} from 'react-native';
import { colors } from '../theme/colors';
import { Dish, MealHistoryEntry } from '../types';
import { INITIAL_USER_DISHES } from '../data/defaultDishes';
import { SUGGESTIONS_DATABASE } from '../data/suggestionsDatabase';
import { Ionicons } from '@expo/vector-icons';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  userDishes: Dish[];
  suggestions: Dish[];
  mealHistory: MealHistoryEntry[];
  onResetDishes: (dishes: Dish[]) => void;
  onResetSuggestions: (sug: Dish[]) => void;
  onClearHistory: () => void;
  onImportData: (data: { dishes?: Dish[]; suggestions?: Dish[]; history?: MealHistoryEntry[] }) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  onClose,
  userDishes,
  suggestions,
  mealHistory,
  onResetDishes,
  onResetSuggestions,
  onClearHistory,
  onImportData,
}) => {
  const [importText, setImportText] = useState('');
  const [showImportBox, setShowImportBox] = useState(false);

  // Export JSON via Share
  const handleExportData = () => {
    try {
      const payload = {
        app: 'MyKitchen',
        exportDate: new Date().toISOString(),
        userDishes,
        suggestions,
        mealHistory,
      };
      const json = JSON.stringify(payload, null, 2);
      Share.share({
        title: 'Sauvegarde MyKitchen',
        message: json,
      });
    } catch (e) {
      Alert.alert('Erreur', 'Impossible d’exporter les données.');
    }
  };

  // Import JSON
  const handleApplyImport = () => {
    try {
      if (!importText.trim()) return;
      const parsed = JSON.parse(importText);
      if (parsed.userDishes || parsed.suggestions || parsed.mealHistory) {
        onImportData({
          dishes: parsed.userDishes,
          suggestions: parsed.suggestions,
          history: parsed.mealHistory,
        });
        Alert.alert('Succès', 'Les données ont été restaurées avec succès !');
        setImportText('');
        setShowImportBox(false);
      } else {
        Alert.alert('Format invalide', 'Le format des données n’est pas reconnu.');
      }
    } catch (e) {
      Alert.alert('Erreur de lecture', 'Veuillez vérifier que le texte collé est un JSON valide.');
    }
  };

  // Reset dishes confirmation
  const confirmResetDishes = () => {
    Alert.alert(
      'Restaurer la liste de départ',
      'Voulez-vous réinitialiser votre liste "Mes Plats" avec les 25 plats favoris configurés au départ (Couscous, Camounilla, Schnitzel, Pkaïla, etc.) ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Restaurer',
          style: 'destructive',
          onPress: () => {
            onResetDishes(INITIAL_USER_DISHES);
            Alert.alert('Restauration effectuée', 'Vos 25 plats de départ sont rétablis.');
          },
        },
      ]
    );
  };

  // Reset suggestions confirmation
  const confirmResetSuggestions = () => {
    Alert.alert(
      'Restaurer les suggestions',
      'Voulez-vous réinitialiser le catalogue des suggestions avec la base complète d’origine (160+ idées) ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Restaurer',
          style: 'destructive',
          onPress: () => {
            onResetSuggestions(SUGGESTIONS_DATABASE);
            Alert.alert('Suggestions rétablies', 'Le catalogue initial a été restauré.');
          },
        },
      ]
    );
  };

  // Clear history confirmation
  const confirmClearHistory = () => {
    Alert.alert(
      'Effacer l’historique',
      'Voulez-vous supprimer tout le journal des repas enregistrés ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Effacer tout',
          style: 'destructive',
          onPress: () => {
            onClearHistory();
            Alert.alert('Historique vidé', 'Tous les repas enregistrés ont été effacés.');
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>⚙️ Paramètres & Sauvegarde</Text>
              <Text style={styles.subtitle}>Gérez les données de votre cuisine</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Stats section */}
            <View style={styles.statsCard}>
              <View style={styles.statItem}>
                <Text style={styles.statNum}>{userDishes.length}</Text>
                <Text style={styles.statLabel}>Mes Plats</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNum}>{suggestions.length}</Text>
                <Text style={styles.statLabel}>Suggestions</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNum}>{mealHistory.length}</Text>
                <Text style={styles.statLabel}>Repas cuisinés</Text>
              </View>
            </View>

            {/* Actions group: Sauvegarde */}
            <Text style={styles.sectionLabel}>Sauvegarde & Synchronisation</Text>

            <TouchableOpacity style={styles.optionRow} onPress={handleExportData}>
              <View style={[styles.iconBox, { backgroundColor: '#E0F2FE' }]}>
                <Ionicons name="share-outline" size={20} color="#0284C7" />
              </View>
              <View style={styles.optionTextGroup}>
                <Text style={styles.optionTitle}>Exporter / Partager mes données</Text>
                <Text style={styles.optionDesc}>Envoyez vos plats et suggestions par WhatsApp ou message</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => setShowImportBox(!showImportBox)}
            >
              <View style={[styles.iconBox, { backgroundColor: '#F3E8FF' }]}>
                <Ionicons name="download-outline" size={20} color="#9333EA" />
              </View>
              <View style={styles.optionTextGroup}>
                <Text style={styles.optionTitle}>Importer une sauvegarde</Text>
                <Text style={styles.optionDesc}>Restaurer des données à partir d'un texte JSON</Text>
              </View>
            </TouchableOpacity>

            {showImportBox && (
              <View style={styles.importBox}>
                <Text style={styles.importLabel}>Collez le code JSON de sauvegarde ci-dessous :</Text>
                <TextInput
                  style={styles.importInput}
                  multiline
                  placeholder="Collez ici..."
                  placeholderTextColor={colors.textMuted}
                  value={importText}
                  onChangeText={setImportText}
                />
                <TouchableOpacity style={styles.applyImportBtn} onPress={handleApplyImport}>
                  <Text style={styles.applyImportBtnText}>Appliquer l'importation</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Actions group: Restauration */}
            <Text style={styles.sectionLabel}>Réinitialisation</Text>

            <TouchableOpacity style={styles.optionRow} onPress={confirmResetDishes}>
              <View style={[styles.iconBox, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="refresh" size={20} color="#D97706" />
              </View>
              <View style={styles.optionTextGroup}>
                <Text style={styles.optionTitle}>Restaurer les 25 plats de départ</Text>
                <Text style={styles.optionDesc}>Rétablit votre liste avec les plats configurés au début</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionRow} onPress={confirmResetSuggestions}>
              <View style={[styles.iconBox, { backgroundColor: '#DCFCE7' }]}>
                <Ionicons name="bulb-outline" size={20} color="#16A34A" />
              </View>
              <View style={styles.optionTextGroup}>
                <Text style={styles.optionTitle}>Restaurer les suggestions d'origine</Text>
                <Text style={styles.optionDesc}>Remet les 160+ idées d'origine si vous en avez supprimé</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionRow} onPress={confirmClearHistory}>
              <View style={[styles.iconBox, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="trash-outline" size={20} color="#DC2626" />
              </View>
              <View style={styles.optionTextGroup}>
                <Text style={[styles.optionTitle, { color: colors.danger }]}>Vider l'historique des repas</Text>
                <Text style={styles.optionDesc}>Supprime les repas passés sans toucher à vos plats</Text>
              </View>
            </TouchableOpacity>

            <View style={{ height: 30 }} />
          </ScrollView>
        </View>
      </View>
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
    maxHeight: '85%',
    paddingTop: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 12.5,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: colors.cardAlt,
    borderRadius: 14,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: '70%',
    backgroundColor: colors.border,
    alignSelf: 'center',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 12,
    marginBottom: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 12,
    borderRadius: 14,
    marginBottom: 8,
    gap: 12,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTextGroup: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  optionDesc: {
    fontSize: 11.5,
    color: colors.textSecondary,
    marginTop: 2,
  },
  importBox: {
    backgroundColor: colors.cardAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  importLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  importInput: {
    backgroundColor: colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    height: 70,
    padding: 8,
    fontSize: 12,
    textAlignVertical: 'top',
    color: colors.text,
  },
  applyImportBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  applyImportBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});

