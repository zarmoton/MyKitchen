import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';
import { getDayInfo } from '../utils/dateUtils';
import { Ionicons } from '@expo/vector-icons';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onOpenSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title = "Qu'est-ce qu'on mange ?",
  subtitle,
  onOpenSettings,
}) => {
  const dayInfo = getDayInfo();

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.brandRow}>
          <Text style={styles.logoIcon}>🥘</Text>
          <View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.dateText}>
              {dayInfo.dateFormatted}
              {dayInfo.isChabbatTime ? (
                <Text style={styles.chabbatIndicator}> • Préparation Chabbat 🕯️</Text>
              ) : (
                <Text style={styles.semaineIndicator}> • En semaine 📅</Text>
              )}
            </Text>
          </View>
        </View>

        {onOpenSettings && (
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={onOpenSettings}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="settings-outline" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoIcon: {
    fontSize: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  dateText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  chabbatIndicator: {
    color: colors.shabbat,
    fontWeight: '700',
  },
  semaineIndicator: {
    color: colors.semaine,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 6,
  },
  settingsBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: colors.cardAlt,
  },
});

