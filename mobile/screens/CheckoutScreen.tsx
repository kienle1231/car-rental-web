import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { 
  ChevronLeft, 
  CreditCard, 
  ShieldCheck, 
  Calendar, 
  MapPin, 
  Check,
  Lock,
  Apple
} from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';

import { LuxuryColors, LuxurySpacing, LuxuryTypography, LuxuryRadius } from '@/constants/luxuryTheme';
import { PremiumPressable } from '@/components/PremiumPressable';
import GlassCard from '@/components/GlassCard';
import LuxuryModal from '@/components/LuxuryModal';
import BiometricModal from '@/components/BiometricModal';
import { createBookingAPI } from '@/services/api';

const { width } = Dimensions.get('window');

const CheckoutScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { id, carData, bookingData, totalPrice } = params;
  
  const parsedCar = carData ? JSON.parse(carData as string) : null;
  const parsedBooking = bookingData ? JSON.parse(bookingData as string) : null;
  
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [biometricVisible, setBiometricVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState<any>({ visible: false, type: 'success', title: '', message: '' });

  const handlePay = async () => {
    if (paymentMethod === 'card' && (!cardNumber || !expiry || !cvv)) {
      setModalConfig({
        visible: true,
        type: 'warning',
        title: 'Missing Info',
        message: 'Please complete your payment card details.',
        onConfirm: () => setModalConfig({ ...modalConfig, visible: false })
      });
      return;
    }

    setBiometricVisible(true);
  };

  const processPayment = async () => {
    setBiometricVisible(false);
    setLoading(true);
    try {
      const finalBookingData = {
        car: id,
        pickupDate: parsedBooking.pickupDate,
        returnDate: parsedBooking.returnDate,
        pickupLocation: parsedCar?.location || 'Main Hub',
        addOns: parsedBooking.addOns || [],
        totalPrice: parseFloat(totalPrice as string),
        paymentStatus: 'paid', // Mark as paid for demo
        paymentMethod: paymentMethod,
      };

      await createBookingAPI(finalBookingData);

      setModalConfig({
        visible: true,
        type: 'success',
        title: 'Payment Secured',
        message: 'Your luxury journey has been officially reserved. Confirmation sent to your email.',
        confirmText: 'View My ITINERARY',
        onConfirm: () => {
          setModalConfig({ ...modalConfig, visible: false });
          router.push('/(tabs)/bookings');
        }
      });
    } catch (error: any) {
      console.error('Payment error:', error);
      setModalConfig({
        visible: true,
        type: 'error',
        title: 'Transaction Failed',
        message: error.response?.data?.error || 'Unable to process payment.',
        onConfirm: () => setModalConfig({ ...modalConfig, visible: false })
      });
    } finally {
      setLoading(false);
    }
  };

  const PaymentOption = ({ id, icon: Icon, label }: any) => (
    <PremiumPressable
      onPress={() => setPaymentMethod(id)}
      style={[
        styles.methodCard,
        paymentMethod === id && styles.methodCardActive
      ]}
    >
      <View style={styles.methodHeader}>
        <View style={[styles.methodIcon, paymentMethod === id && { backgroundColor: LuxuryColors.accent }]}>
          <Icon size={20} color={paymentMethod === id ? LuxuryColors.background : LuxuryColors.accent} />
        </View>
        <Text style={[styles.methodLabel, paymentMethod === id && { color: '#FFF' }]}>{label}</Text>
      </View>
      <View style={[styles.radio, paymentMethod === id && styles.radioActive]}>
        {paymentMethod === id && <View style={styles.radioInner} />}
      </View>
    </PremiumPressable>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <PremiumPressable onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#FFF" />
        </PremiumPressable>
        <Text style={styles.headerTitle}>Secure Checkout</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.delay(100)}>
          <Text style={styles.sectionTitle}>JOURNEY SUMMARY</Text>
          <GlassCard style={styles.summaryCard}>
            <View style={styles.carRow}>
              <Text style={styles.carName}>{parsedCar?.brand} {parsedCar?.model}</Text>
              <Text style={styles.priceTag}>${totalPrice}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.detailRow}>
              <Calendar size={16} color={LuxuryColors.textMuted} />
              <Text style={styles.detailText}>{parsedBooking?.pickupDate} → {parsedBooking?.returnDate}</Text>
            </View>
            <View style={styles.detailRow}>
              <MapPin size={16} color={LuxuryColors.textMuted} />
              <Text style={styles.detailText}>{parsedCar?.location || 'Premium Hub'}</Text>
            </View>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
          <Text style={styles.sectionTitle}>PAYMENT METHOD</Text>
          <View style={styles.methodsGrid}>
            <PaymentOption id="card" icon={CreditCard} label="Credit Card" />
            <PaymentOption id="apple" icon={Apple} label="Apple Pay" />
          </View>
        </Animated.View>

        {paymentMethod === 'card' && (
          <Animated.View entering={FadeInRight} style={styles.cardInputSection}>
            <GlassCard style={styles.paymentCard}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>CARD NUMBER</Text>
                <TextInput
                  placeholder="0000 0000 0000 0000"
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  style={styles.input}
                  value={cardNumber}
                  onChangeText={setCardNumber}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 2 }]}>
                  <Text style={styles.inputLabel}>EXPIRY DATE</Text>
                  <TextInput
                    placeholder="MM/YY"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    style={styles.input}
                    value={expiry}
                    onChangeText={setExpiry}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>CVV</Text>
                  <TextInput
                    placeholder="***"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    style={styles.input}
                    value={cvv}
                    onChangeText={setCvv}
                    keyboardType="numeric"
                    secureTextEntry
                  />
                </View>
              </View>
            </GlassCard>
          </Animated.View>
        )}

        <View style={styles.securityNote}>
          <Lock size={14} color={LuxuryColors.success} />
          <Text style={styles.securityText}>AES-256 Bit Encryption Secured Transaction</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <BlurView intensity={30} tint="dark" style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Payable</Text>
          <Text style={styles.totalValue}>${totalPrice}</Text>
        </View>
        <PremiumPressable 
          onPress={handlePay} 
          style={styles.payBtn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={LuxuryColors.background} />
          ) : (
            <>
              <ShieldCheck size={20} color={LuxuryColors.background} />
              <Text style={styles.payBtnText}>AUTHORIZE PAYMENT</Text>
            </>
          )}
        </PremiumPressable>
      </BlurView>

      <LuxuryModal
        visible={modalConfig.visible}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        onConfirm={modalConfig.onConfirm}
      />

      <BiometricModal 
        visible={biometricVisible}
        type={paymentMethod === 'apple' ? 'face' : 'fingerprint'}
        onSuccess={processPayment}
        onCancel={() => setBiometricVisible(false)}
      />
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
  headerTitle: {
    ...LuxuryTypography.titleM,
    fontSize: 18,
    color: '#FFF',
    letterSpacing: 1,
  },
  scrollContent: {
    padding: 20,
  },
  sectionTitle: {
    ...LuxuryTypography.caption,
    color: LuxuryColors.textMuted,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 15,
    marginLeft: 5,
  },
  summaryCard: {
    padding: 20,
    marginBottom: 30,
  },
  carRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  carName: {
    ...LuxuryTypography.titleM,
    fontSize: 20,
    color: '#FFF',
  },
  priceTag: {
    ...LuxuryTypography.titleM,
    fontSize: 20,
    color: LuxuryColors.accent,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  detailText: {
    ...LuxuryTypography.body,
    color: LuxuryColors.textSecondary,
    fontSize: 14,
  },
  section: {
    marginBottom: 30,
  },
  methodsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  methodCard: {
    flex: 1,
    height: 100,
    borderRadius: LuxuryRadius.xl,
    padding: 15,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'space-between',
  },
  methodCardActive: {
    borderColor: LuxuryColors.accent,
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
  },
  methodHeader: {
    gap: 10,
  },
  methodIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodLabel: {
    ...LuxuryTypography.bodySemibold,
    color: LuxuryColors.textMuted,
    fontSize: 13,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 15,
    right: 15,
  },
  radioActive: {
    borderColor: LuxuryColors.accent,
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: LuxuryColors.accent,
  },
  cardInputSection: {
    marginBottom: 20,
  },
  paymentCard: {
    padding: 20,
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    ...LuxuryTypography.caption,
    color: LuxuryColors.textMuted,
    fontSize: 10,
    fontWeight: '800',
  },
  input: {
    ...LuxuryTypography.bodySemibold,
    color: '#FFF',
    height: 50,
    borderRadius: LuxuryRadius.md,
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  row: {
    flexDirection: 'row',
    gap: 15,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  securityText: {
    ...LuxuryTypography.caption,
    color: LuxuryColors.success,
    fontSize: 11,
  },
  footer: {
    padding: 25,
    paddingBottom: Platform.OS === 'ios' ? 45 : 25,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  totalLabel: {
    ...LuxuryTypography.body,
    color: LuxuryColors.textSecondary,
  },
  totalValue: {
    ...LuxuryTypography.titleM,
    color: '#FFF',
  },
  payBtn: {
    height: 60,
    backgroundColor: LuxuryColors.accent,
    borderRadius: LuxuryRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  payBtnText: {
    ...LuxuryTypography.bodySemibold,
    color: LuxuryColors.background,
    fontSize: 16,
    letterSpacing: 1.5,
  },
});

export default CheckoutScreen;
