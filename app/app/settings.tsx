import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme as getSystemColorScheme,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore, type ThemeMode, useEffectiveColorScheme } from '../store/themeStore';

export default function SettingsScreen() {
  const router = useRouter();
  const systemColorScheme = getSystemColorScheme();
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);
  const initTheme = useThemeStore((state) => state.initTheme);
  const effectiveColorScheme = useEffectiveColorScheme(systemColorScheme);
  const isDark = effectiveColorScheme === 'dark';

  useEffect(() => {
    initTheme();
  }, []);

  const handleThemeChange = async (newTheme: ThemeMode) => {
    await setTheme(newTheme);
  };

  const themeOptions: { label: string; value: ThemeMode }[] = [
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' },
    { label: 'System', value: 'system' },
  ];

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
        <View style={[styles.header, { borderBottomColor: isDark ? '#333' : '#e0e0e0' }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons
              name="chevron-back"
              size={28}
              color={isDark ? '#fff' : '#333'}
            />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#333' }]}>
            Settings
          </Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Theme Section */}
          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                { color: isDark ? '#e0e0e0' : '#333' },
              ]}
            >
              Appearance
            </Text>

            <View
              style={[
                styles.settingCard,
                { backgroundColor: isDark ? '#2a2a2a' : '#fff' },
              ]}
            >
              <Text style={[styles.settingLabel, { color: isDark ? '#fff' : '#333' }]}>
                Theme
              </Text>
              <Text
                style={[
                  styles.settingValue,
                  { color: isDark ? '#aaa' : '#666' },
                ]}
              >
                {theme === 'system'
                  ? `System (${effectiveColorScheme === 'dark' ? 'Dark' : 'Light'})`
                  : theme.charAt(0).toUpperCase() + theme.slice(1)}
              </Text>
            </View>

            {/* Theme Options */}
            <View style={styles.themeOptionsContainer}>
              {themeOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.themeOption,
                    {
                      backgroundColor: isDark ? '#2a2a2a' : '#fff',
                      borderColor:
                        theme === option.value ? '#007AFF' : isDark ? '#444' : '#ddd',
                      borderWidth: theme === option.value ? 2 : 1,
                    },
                  ]}
                  onPress={() => handleThemeChange(option.value)}
                >
                  <View
                    style={[
                      styles.themePreview,
                      {
                        backgroundColor:
                          option.value === 'light'
                            ? '#fff'
                            : option.value === 'dark'
                            ? '#2a2a2a'
                            : systemColorScheme === 'dark'
                            ? '#2a2a2a'
                            : '#fff',
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.themeOptionText,
                      {
                        color:
                          theme === option.value
                            ? '#007AFF'
                            : isDark
                            ? '#aaa'
                            : '#666',
                        fontWeight:
                          theme === option.value ? '700' : '500',
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                  {theme === option.value && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color="#007AFF"
                      style={{ marginLeft: 'auto' }}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* About Section */}
          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                { color: isDark ? '#e0e0e0' : '#333' },
              ]}
            >
              About
            </Text>

            <View
              style={[
                styles.settingCard,
                { backgroundColor: isDark ? '#2a2a2a' : '#fff' },
              ]}
            >
              <Text style={[styles.settingLabel, { color: isDark ? '#fff' : '#333' }]}>
                App Version
              </Text>
              <Text
                style={[
                  styles.settingValue,
                  { color: isDark ? '#aaa' : '#666' },
                ]}
              >
                1.0.0
              </Text>
            </View>

            <View
              style={[
                styles.settingCard,
                { backgroundColor: isDark ? '#2a2a2a' : '#fff' },
              ]}
            >
              <Text style={[styles.settingLabel, { color: isDark ? '#fff' : '#333' }]}>
                App Name
              </Text>
              <Text
                style={[
                  styles.settingValue,
                  { color: isDark ? '#aaa' : '#666' },
                ]}
              >
                HealEasy
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  settingCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingValue: {
    fontSize: 14,
  },
  themeOptionsContainer: {
    gap: 12,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  themePreview: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  themeOptionText: {
    fontSize: 14,
    flex: 1,
  },
});
