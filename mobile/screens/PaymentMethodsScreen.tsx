import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  ChevronLeft, 
  CreditCard, 
  Plus, 
  Trash2, 
  CheckCircle2,
  Lock
} from 'lucide-react-native';

import { LuxuryColors, LuxuryTypography, LuxuryRadius } from '@/constants/luxuryTheme';
import { PremiumPressable } from '@/components/PremiumPressable';
import GlassCard from '@/components/GlassCard';
import LuxuryButton from '@/components/LuxuryButton';

const PaymentMethodsScreen = () => {
  const router = useRouter();

  const CardItem = ({ brand, last4, expiry, isDefault }: any) => (
    <GlassCard style={[styles.cardContainer, isDefault && styles.defaultCard]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardInfo}>
          <View style={styles.chip} />
          <Text style={styles.cardNumber}>•••• •••• •••• {last4}</Text>
        </View>
        <CreditCard size={24} color={isDefault ? LuxuryColors.accent : LuxuryColors.textSecondary} />
      </View>
      
      <View style={styles.cardFooter}>
        <View>
          <Text style={styles.footerLabel}>CARD HOLDER</Text>
          <Text style={styles.footerValue}>{brand.toUpperCase()}</Text>
        </View>
        <View>
          <Text style={styles.footerLabel}>EXPIRY</Text>
          <Text style={styles.footerValue}>{expiry}</Text>
        </View>
        {isDefault && (
          <View style={styles.defaultBadge}>
            <CheckCircle2 size={12} color={LuxuryColors.background} />
            <Text style={styles.defaultText}>DEFAULT</Text>
          </View>
        )}
      </View>
      
      <View style={styles.cardActions}>
        <PremiumPressable style={styles.actionBtn}>
          <Trash2 size={18} color={LuxuryColors.danger} />
        </PremiumPressable>
      </View>
    </GlassCard>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <PremiumPressable onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#FFF" />
        </PremiumPressable>
        <Text style={styles.headerTitle}>Payment Vault</Text>
        <PremiumPressable style={styles.addBtn}>
          <Plus size={20} color={LuxuryColors.accent} />
        </PremiumPressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.securityBanner}>
          <Lock size={14} color={LuxuryColors.success} />
          <Text style={styles.securityText}>PCI-DSS Level 1 Compliant Security</Text>
        </View>

        <Text style={styles.sectionTitle}>SAVED INSTRUMENTS</Text>
        
        <CardItem 
          brand="Visa Infinite" 
          last4="8842" 
          expiry="08/29" 
          isDefault 
        />
        
        <CardItem 
          brand="Mastercard World" 
          last4="2109" 
          expiry="12/27" 
        />

        <PremiumPressable style={styles.addNewCard}>
          <View style={styles.addIconCircle}>
            <Plus size={24} color="#FFF" />
          </View>
          <Text style={styles.addNewText}>Add Secure Payment Method</Text>
        </PremiumPressable>

        <View style={{ height: 40 }} />
      </ScrollView>

      <View style={styles.footer}>
        <LuxuryButton 
          title="SET PRIMARY METHOD" 
          onPress={() => {}} 
          variant="outline"
        />
      </View>
    </View>
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
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  headerTitle: {
    ...LuxuryTypography.titleM,
    fontSize: 18,
    color: '#FFF',
  },
  scrollContent: {
    padding: 20,
  },
  securityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 25,
    padding: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderRadius: LuxuryRadius.sm,
  },
  securityText: {
    ...LuxuryTypography.tiny,
    color: LuxuryColors.success,
    fontSize: 10,
  },
  sectionTitle: {
    ...LuxuryTypography.caption,
    color: LuxuryColors.textMuted,
    fontWeight: '800',
    marginBottom: 20,
    marginLeft: 4,
    letterSpacing: 1.5,
  },
  cardContainer: {
    padding: 24,
    marginBottom: 20,
    height: 180,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  defaultCard: {
    borderColor: 'rgba(212, 175, 55, 0.3)',
    backgroundColor: 'rgba(212, 175, 55, 0.03)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardInfo: {
    gap: 12,
  },
  chip: {
    width: 40,
    height: 30,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  cardNumber: {
    ...LuxuryTypography.titleM,
    color: '#FFF',
    fontSize: 20,
    letterSpacing: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 30,
  },
  footerLabel: {
    ...LuxuryTypography.tiny,
    color: LuxuryColors.textMuted,
    fontSize: 8,
    marginBottom: 2,
  },
  footerValue: {
    ...LuxuryTypography.caption,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '700',
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LuxuryColors.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
    marginLeft: 'auto',
  },
  defaultText: {
    ...LuxuryTypography.tiny,
    color: LuxuryColors.background,
    fontSize: 8,
    fontWeight: '900',
  },
  cardActions: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  actionBtn: {
    padding: 8,
  },
  addNewCard: {
    height: 100,
    borderRadius: LuxuryRadius.xl,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 10,
  },
  addIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addNewText: {
    ...LuxuryTypography.bodySemibold,
    color: LuxuryColors.textSecondary,
    fontSize: 14,
  },
  footer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  }
});

export default PaymentMethodsScreen;
