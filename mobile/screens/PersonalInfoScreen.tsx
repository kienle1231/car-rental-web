import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, User, Mail, Shield, Zap, Award } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { LuxuryColors, LuxurySpacing, LuxuryTypography, LuxuryRadius } from '@/constants/luxuryTheme';
import { PremiumPressable } from '@/components/PremiumPressable';
import LuxuryInput from '@/components/LuxuryInput';
import LuxuryButton from '@/components/LuxuryButton';
import GlassCard from '@/components/GlassCard';

const PersonalInfoScreen = () => {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const stored = await AsyncStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        setUser(u);
        setName(u.name);
      }
    };
    fetchUser();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    // Simulation: in a real app we'd call an API here
    setTimeout(async () => {
      if (user) {
        const updatedUser = { ...user, name };
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        setLoading(false);
        router.back();
      }
    }, 1000);
  };

  if (!user) return null;

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <PremiumPressable onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#FFF" />
        </PremiumPressable>
        <Text style={styles.headerTitle}>Personal Profile</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.statusSection}>
          <GlassCard style={styles.membershipCard}>
            <View style={styles.membershipInfo}>
              <Award size={24} color={LuxuryColors.accent} />
              <View>
                <Text style={styles.membershipLabel}>MEMBERSHIP STATUS</Text>
                <Text style={styles.membershipType}>ELITE PLATINUM</Text>
              </View>
            </View>
            <View style={styles.pointsBadge}>
              <Zap size={12} color={LuxuryColors.background} />
              <Text style={styles.pointsText}>2,450 PTS</Text>
            </View>
          </GlassCard>
        </View>

        <Text style={styles.sectionTitle}>IDENTIFICATION</Text>
        <GlassCard style={styles.inputCard}>
          <LuxuryInput
            label="FULL NAME"
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
          />
          <View style={styles.readOnlyGroup}>
            <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
            <View style={styles.readOnlyInput}>
              <Mail size={18} color={LuxuryColors.textMuted} />
              <Text style={styles.readOnlyText}>{user.email}</Text>
            </View>
            <Text style={styles.helperText}>Email cannot be changed for security reasons.</Text>
          </View>
        </GlassCard>

        <Text style={styles.sectionTitle}>SECURITY</Text>
        <GlassCard style={styles.securityCard}>
          <View style={styles.securityItem}>
            <View style={styles.securityLeft}>
              <Shield size={20} color={LuxuryColors.success} />
              <Text style={styles.securityLabel}>Two-Factor Authentication</Text>
            </View>
            <Text style={styles.securityStatus}>ENABLED</Text>
          </View>
        </GlassCard>

        <View style={{ height: 40 }} />
        
        <LuxuryButton 
          title={loading ? 'SAVING CHANGES...' : 'UPDATE PROFILE'} 
          onPress={handleSave}
          disabled={loading}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LuxuryColors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  headerTitle: {
    ...LuxuryTypography.titleM,
    fontSize: 18,
    color: '#FFF',
  },
  scrollContent: {
    padding: 20,
  },
  statusSection: {
    marginBottom: 30,
  },
  membershipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  membershipInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  membershipLabel: {
    ...LuxuryTypography.caption,
    color: LuxuryColors.textMuted,
    fontSize: 10,
    fontWeight: '800',
  },
  membershipType: {
    ...LuxuryTypography.bodySemibold,
    color: LuxuryColors.accent,
    letterSpacing: 1,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LuxuryColors.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  pointsText: {
    ...LuxuryTypography.tiny,
    color: LuxuryColors.background,
    fontWeight: '900',
  },
  sectionTitle: {
    ...LuxuryTypography.caption,
    color: LuxuryColors.textMuted,
    fontWeight: '800',
    marginBottom: 12,
    marginLeft: 4,
    letterSpacing: 1.5,
  },
  inputCard: {
    padding: 20,
    gap: 20,
    marginBottom: 30,
  },
  readOnlyGroup: {
    gap: 8,
  },
  inputLabel: {
    ...LuxuryTypography.tiny,
    color: '#94A3B8',
    marginLeft: 4,
  },
  readOnlyInput: {
    height: 56,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: LuxuryRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  readOnlyText: {
    ...LuxuryTypography.body,
    color: LuxuryColors.textSecondary,
  },
  helperText: {
    ...LuxuryTypography.tiny,
    color: LuxuryColors.textMuted,
    fontSize: 10,
    fontStyle: 'italic',
    marginLeft: 4,
  },
  securityCard: {
    padding: 20,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  securityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  securityLabel: {
    ...LuxuryTypography.body,
    color: '#FFF',
    fontSize: 14,
  },
  securityStatus: {
    ...LuxuryTypography.caption,
    color: LuxuryColors.success,
    fontWeight: '800',
    fontSize: 11,
  },
});

export default PersonalInfoScreen;
