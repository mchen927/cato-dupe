import { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  ScrollView,
  Pressable,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontSize, fontFamily, spacing, borderRadius } from '../../src/theme';
import { useSettings } from '../../src/settings';

function SettingRow({
  label,
  value,
  placeholder,
  onChangeText,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (text: string) => void;
}) {
  return (
    <View style={styles.settingRow}>
      <Text style={styles.settingLabel}>{label}</Text>
      <TextInput
        style={styles.settingInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        autoCorrect={false}
      />
    </View>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const settings = useSettings();
  const [userName, setUserName] = useState(settings.userName);
  const [catName, setCatName] = useState(settings.catName);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setUserName(settings.userName);
    setCatName(settings.catName);
  }, [settings.userName, settings.catName]);

  const hasChanges = userName !== settings.userName || catName !== settings.catName;

  const handleSave = () => {
    settings.update({ userName, catName });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top + spacing.sm }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.screenTitle}>Settings</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personalization</Text>
        <View style={styles.card}>
          <SettingRow
            label="Your name"
            value={userName}
            placeholder="What should the cat call you?"
            onChangeText={setUserName}
          />
          <View style={styles.divider} />
          <SettingRow
            label="Cat's name"
            value={catName}
            placeholder="Cato"
            onChangeText={setCatName}
          />
        </View>

        <Pressable
          style={[
            styles.saveBtn,
            hasChanges ? styles.saveBtnActive : styles.saveBtnDisabled,
            saved && styles.saveBtnSaved,
          ]}
          onPress={handleSave}
          disabled={!hasChanges}
        >
          <Text style={[
            styles.saveBtnText,
            hasChanges && styles.saveBtnTextActive,
            saved && styles.saveBtnTextSaved,
          ]}>
            {saved ? 'Saved ✓' : 'Save'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.card}>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Version</Text>
            <Text style={styles.aboutValue}>1.0.0</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Made with</Text>
            <Text style={styles.aboutValue}>love 🐱</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  screenTitle: {
    fontSize: fontSize.xxl,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.md,
    letterSpacing: -0.3,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md - 2,
    minHeight: 48,
  },
  settingLabel: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.regular,
    color: colors.textPrimary,
    flexShrink: 0,
  },
  settingInput: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
    textAlign: 'right',
    flex: 1,
    marginLeft: spacing.md,
    paddingVertical: 0,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.separator,
    marginLeft: spacing.md,
  },
  saveBtn: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm + 4,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  saveBtnActive: {
    backgroundColor: colors.accent,
  },
  saveBtnDisabled: {
    backgroundColor: colors.backgroundSecondary,
  },
  saveBtnSaved: {
    backgroundColor: colors.success,
  },
  saveBtnText: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.semibold,
    color: colors.textMuted,
  },
  saveBtnTextActive: {
    color: colors.textOnAccent,
  },
  saveBtnTextSaved: {
    color: colors.textOnAccent,
  },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md - 2,
    minHeight: 48,
  },
  aboutLabel: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.regular,
    color: colors.textPrimary,
  },
  aboutValue: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
  },
});
