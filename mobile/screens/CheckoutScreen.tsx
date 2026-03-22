import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  Dimensions,
  Platform,
  ActivityIndicator,
  Image,
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
  Apple,
  QrCode,
  Timer
} from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown, FadeInRight, FadeIn } from 'react-native-reanimated';

import { LuxuryColors, LuxurySpacing, LuxuryTypography, LuxuryRadius } from '@/constants/luxuryTheme';
import { PremiumPressable } from '@/components/PremiumPressable';
import GlassCard from '@/components/GlassCard';
import LuxuryModal from '@/components/LuxuryModal';
import BiometricModal from '@/components/BiometricModal';
import { createBookingAPI, confirmPaymentAPI } from '@/services/api';

const { width } = Dimensions.get('window');

const CheckoutScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { id, carData, bookingData, totalPrice } = params;
  
  const parsedCar = carData ? JSON.parse(carData as string) : null;
  const parsedBooking = bookingData ? JSON.parse(bookingData as string) : null;
  
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('vietqr');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  // Guest Information State
  const [customerForm, setCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
    note: ''
  });
  
  // QR Payment Flow State
  const [qrStep, setQrStep] = useState(false);
  const [pendingBookingId, setPendingBookingId] = useState('');
  const [qrTimer, setQrTimer] = useState(30);
  const [biometricVisible, setBiometricVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState<any>({ visible: false, type: 'success', title: '', message: '' });

  // Handle auto payment confirmation timer
  useEffect(() => {
    let interval: any;
    if (qrStep && qrTimer > 0) {
      interval = setInterval(() => {
        setQrTimer((prev) => prev - 1);
      }, 1000);
    } else if (qrStep && qrTimer === 0) {
      handleConfirmPayment();
    }
    return () => clearInterval(interval);
  }, [qrStep, qrTimer]);

  const handlePay = async () => {
    if (!customerForm.name || !customerForm.email || !customerForm.phone) {
      setModalConfig({
        visible: true,
        type: 'warning',
        title: 'Missing Info',
        message: 'Please fill in all required Guest Information fields.',
        onConfirm: () => setModalConfig({ ...modalConfig, visible: false })
      });
      return;
    }

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
        paymentStatus: paymentMethod === 'vietqr' ? 'pending' : 'paid',
        paymentMethod: paymentMethod,
        customerName: customerForm.name,
        customerEmail: customerForm.email,
        customerPhone: customerForm.phone,
        note: customerForm.note
      };

      const res = await createBookingAPI(finalBookingData);

      if (paymentMethod === 'vietqr') {
        setPendingBookingId(res.data._id);
        setQrStep(true);
        setQrTimer(30);
      } else {
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
      }
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

  const handleConfirmPayment = async () => {
    try {
      setLoading(true);
      await confirmPaymentAPI({ bookingId: pendingBookingId });
      setModalConfig({
        visible: true,
        type: 'success',
        title: 'Payment Confirmed',
        message: 'Your transfer was successful. Your luxury journey is officially reserved.',
        confirmText: 'View My ITINERARY',
        onConfirm: () => {
          setModalConfig({ ...modalConfig, visible: false });
          router.replace('/(tabs)/bookings');
        }
      });
    } catch (error: any) {
      setModalConfig({
        visible: true,
        type: 'error',
        title: 'Confirmation Failed',
        message: error.response?.data?.error || 'Could not verify payment yet.',
        onConfirm: () => setModalConfig({ ...modalConfig, visible: false })
      });
    } finally {
      setLoading(false);
    }
  };

  const PaymentOption = ({ _id, icon: Icon, label }: any) => (
    <PremiumPressable
      onPress={() => setPaymentMethod(_id)}
      style={[
        styles.methodCard,
        paymentMethod === _id && styles.methodCardActive
      ]}
    >
      <View style={styles.methodHeader}>
        <View style={[styles.methodIcon, paymentMethod === _id && { backgroundColor: LuxuryColors.accent }]}>
          <Icon size={20} color={paymentMethod === _id ? LuxuryColors.background : LuxuryColors.accent} />
        </View>
        <Text style={[styles.methodLabel, paymentMethod === _id && { color: '#FFF' }]}>{label}</Text>
      </View>
      <View style={[styles.radio, paymentMethod === _id && styles.radioActive]}>
        {paymentMethod === _id && <View style={styles.radioInner} />}
      </View>
    </PremiumPressable>
  );

  if (qrStep) {
    // Generate VietQR formatting
    // Let's pass the raw totalPrice or formatted
    const qrUrl = `https://img.vietqr.io/image/MB-0981313248-compact.png?amount=${totalPrice}&addInfo=BOOKING_${pendingBookingId}&accountName=LE%20TRUNG%20KIEN`;

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { marginLeft: 20 }]}>Complete Transfer</Text>
        </View>

        <ScrollView contentContainerStyle={[styles.scrollContent, { alignItems: 'center' }]}>
          <Animated.View entering={FadeInDown} style={{ width: '100%' }}>
            <GlassCard style={styles.qrCard}>
              <Text style={styles.qrAmount}>{Number(totalPrice).toLocaleString()} VNĐ</Text>
              <Text style={styles.qrDesc}>Scan with your banking app</Text>

              <View style={styles.qrBox}>
                <Image source={{ uri: qrUrl }} style={styles.qrImage} resizeMode="contain" />
              </View>

              <View style={styles.qrDetails}>
                <View style={styles.qrDetailRow}>
                  <Text style={styles.qrLabel}>Bank:</Text>
                  <Text style={styles.qrValue}>MB Bank</Text>
                </View>
                <View style={styles.qrDetailRow}>
                  <Text style={styles.qrLabel}>Account No:</Text>
                  <Text style={styles.qrValue}>0981313248</Text>
                </View>
                <View style={styles.qrDetailRow}>
                  <Text style={styles.qrLabel}>Account Name:</Text>
                  <Text style={styles.qrValueHighlight}>LE TRUNG KIEN</Text>
                </View>
                <View style={styles.qrDetailRow}>
                  <Text style={styles.qrLabel}>Content:</Text>
                  <Text style={styles.qrValueHighlight}>BOOKING_{pendingBookingId}</Text>
                </View>
              </View>
            </GlassCard>

            <View style={styles.timerContainer}>
              <ActivityIndicator color={LuxuryColors.accent} size="small" />
              <Text style={styles.waitingText}>Waiting for payment confirmation...</Text>
            </View>
            
            <View style={styles.timerRow}>
              <Timer size={16} color={LuxuryColors.textMuted} />
              <Text style={styles.timerText}>Auto confirm in {qrTimer}s</Text>
            </View>

            <PremiumPressable onPress={handleConfirmPayment} style={styles.transferDoneBtn} disabled={loading}>
              {loading ? <ActivityIndicator color={LuxuryColors.background} /> : <Check size={20} color={LuxuryColors.background} />}
              <Text style={styles.payBtnText}>I HAVE TRANSFERRED</Text>
            </PremiumPressable>

          </Animated.View>
        </ScrollView>
        <LuxuryModal
          visible={modalConfig.visible}
          type={modalConfig.type}
          title={modalConfig.title}
          message={modalConfig.message}
          confirmText={modalConfig.confirmText}
          onConfirm={modalConfig.onConfirm}
        />
      </View>
    );
  }

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
              <Text style={styles.priceTag}>{Number(totalPrice).toLocaleString()} VNĐ</Text>
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

        <Animated.View entering={FadeInDown.delay(150)} style={styles.section}>
          <Text style={styles.sectionTitle}>GUEST INFORMATION</Text>
          <GlassCard style={styles.paymentCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>FULL NAME *</Text>
              <TextInput
                placeholder="Le Trung Kien"
                placeholderTextColor="rgba(255,255,255,0.2)"
                style={styles.input}
                value={customerForm.name}
                onChangeText={(t) => setCustomerForm({...customerForm, name: t})}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>EMAIL ADDRESS (FOR E-TICKET) *</Text>
              <TextInput
                placeholder="de180359letrungkien@gmail.com"
                placeholderTextColor="rgba(255,255,255,0.2)"
                style={styles.input}
                value={customerForm.email}
                onChangeText={(t) => setCustomerForm({...customerForm, email: t})}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PHONE NUMBER *</Text>
              <TextInput
                placeholder="0981313248"
                placeholderTextColor="rgba(255,255,255,0.2)"
                style={styles.input}
                value={customerForm.phone}
                onChangeText={(t) => setCustomerForm({...customerForm, phone: t})}
                keyboardType="phone-pad"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>SPECIAL REQUESTS / NOTES</Text>
              <TextInput
                placeholder="Need 2 baby car seats..."
                placeholderTextColor="rgba(255,255,255,0.2)"
                style={[styles.input, { height: 80, textAlignVertical: 'top', paddingTop: 12 }]}
                value={customerForm.note}
                onChangeText={(t) => setCustomerForm({...customerForm, note: t})}
                multiline
              />
            </View>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
          <Text style={styles.sectionTitle}>PAYMENT METHOD</Text>
          <View style={styles.methodsGrid}>
            <PaymentOption _id="vietqr" icon={QrCode} label="VietQR" />
            <PaymentOption _id="card" icon={CreditCard} label="Credit Card" />
            <PaymentOption _id="apple" icon={Apple} label="Apple Pay" />
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
          <Text style={styles.totalValue}>{Number(totalPrice).toLocaleString()} VNĐ</Text>
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
  qrCard: {
    padding: 25,
    alignItems: 'center',
    marginBottom: 20,
  },
  qrAmount: {
    ...LuxuryTypography.titleL,
    fontSize: 32,
    color: LuxuryColors.accent,
    marginBottom: 5,
  },
  qrDesc: {
    ...LuxuryTypography.body,
    color: LuxuryColors.textSecondary,
    marginBottom: 20,
  },
  qrBox: {
    width: 240,
    height: 240,
    backgroundColor: '#FFF',
    borderRadius: LuxuryRadius.lg,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
  },
  qrImage: {
    width: 220,
    height: 220,
  },
  qrDetails: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: LuxuryRadius.md,
    padding: 15,
    gap: 12,
  },
  qrDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qrLabel: {
    ...LuxuryTypography.body,
    color: LuxuryColors.textMuted,
    fontSize: 13,
  },
  qrValue: {
    ...LuxuryTypography.bodySemibold,
    color: '#FFF',
    fontSize: 14,
  },
  qrValueHighlight: {
    ...LuxuryTypography.bodySemibold,
    color: LuxuryColors.accent,
    fontSize: 14,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 10,
    marginBottom: 10,
  },
  waitingText: {
    ...LuxuryTypography.bodySemibold,
    color: LuxuryColors.accent,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 30,
  },
  timerText: {
    ...LuxuryTypography.caption,
    color: LuxuryColors.textMuted,
  },
  transferDoneBtn: {
    height: 56,
    backgroundColor: LuxuryColors.accent,
    borderRadius: LuxuryRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
  },
});

export default CheckoutScreen;
