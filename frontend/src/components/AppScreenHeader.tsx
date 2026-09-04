import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, typography } from '../theme';

type AppScreenHeaderProps = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
};

export default function AppScreenHeader({ eyebrow, title, subtitle, onBack, right }: AppScreenHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.copy}>
        {onBack && (
          <Pressable accessibilityRole="button" accessibilityLabel="Volver" style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={16} color={colors.primary} />
            <Text style={styles.backText}>Volver</Text>
          </Pressable>
        )}
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {right && <View style={styles.right}>{right}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 },
  copy: { flex: 1, paddingRight: 12 },
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.3 },
  title: { color: colors.text, fontSize: 30, lineHeight: 35, fontWeight: '800', fontFamily: typography.display, marginTop: 4 },
  subtitle: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 6, maxWidth: 300 },
  backButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 5, marginBottom: 10 },
  backText: { color: colors.primary, fontSize: 11, fontWeight: '800' },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
