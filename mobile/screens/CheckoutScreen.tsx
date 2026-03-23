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
  ShieldCheck, 
  Calendar, 
  MapPin, 
  Check,
  Lock,
  QrCode,
  Timer,
  Tag
} from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown, FadeInRight, FadeIn } from 'react-native-reanimated';

import { LuxuryColors, LuxurySpacing, LuxuryTypography, LuxuryRadius } from '@/constants/luxuryTheme';
import { PremiumPressable } from '@/components/PremiumPressable';
import GlassCard from '@/components/GlassCard';
import LuxuryModal from '@/components/LuxuryModal';
import { createBookingAPI, confirmPaymentAPI, applyVoucherAPI } from '@/services/api';

const { width } = Dimensions.get('window');

const CheckoutScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { id, carData, bookingData, totalPrice } = params;
  
  const parsedCar = carData ? JSON.parse(carData as string) : null;
  const parsedBooking = bookingData ? JSON.parse(bookingData as string) : null;
  
  const [loading, setLoading] = useState(false);
  const [paymentMethod] = useState('vietqr'); // Only VietQR supported

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
  const [modalConfig, setModalConfig] = useState<any>({ visible: false, type: 'success', title: '', message: '' });

  // Voucher state
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [appliedVoucher, setAppliedVoucher] = useState<null | { discount: number; discountAmount: number; finalPrice: number }>(null);

  // Pricing from server (set after booking created)
  const [serverPricing, setServerPricing] = useState<null | { totalDays: number; basePrice: number; serviceFee: number; tax: number; totalPrice: number }>(null);

  const displayTotal = appliedVoucher ? appliedVoucher.finalPrice : parseFloat(totalPrice as string);

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

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) return;
    setVoucherLoading(true);
    try {
      const { data } = await applyVoucherAPI(voucherCode.trim(), parseFloat(totalPrice as string));
      setAppliedVoucher(data);
    } catch (error: any) {
      setModalConfig({
        visible: true, type: 'warning', title: 'Voucher Invalid',
        message: error.response?.data?.message || 'Invalid or expired voucher code.',
        onConfirm: () => setModalConfig({ ...modalConfig, visible: false })
      });
    } finally {
      setVoucherLoading(false);
    }
  };

  const handlePay = async () => {
    if (!customerForm.name || !customerForm.email || !customerForm.phone) {
      setModalConfig({
        visible: true, type: 'warning', title: 'Missing Info',
        message: 'Please fill in all required Guest Information fields.',
        onConfirm: () => setModalConfig({ ...modalConfig, visible: false })
      });
      return;
    }
    setLoading(true);
    try {
      // Server calculates totalPrice from car pricePerDay + addOns + fees
      const finalBookingData = {
        car: id,
        pickupDate: parsedBooking.pickupDate,
        returnDate: parsedBooking.returnDate,
        pickupLocation: parsedCar?.location || 'Main Hub',
        addOns: parsedBooking.addOns || [],
        paymentMethod: paymentMethod,
        customerName: customerForm.name,
        customerEmail: customerForm.email,
        customerPhone: customerForm.phone,
        note: customerForm.note
      };

      const res = await createBookingAPI(finalBookingData);

      // Store server pricing for UI
      if (res.data.pricing) setServerPricing(res.data.pricing);

      if (paymentMethod === 'vietqr') {
        setPendingBookingId(res.data._id);
        setQrStep(true);
        setQrTimer(30);
      } else {
        setModalConfig({
          visible: true, type: 'success', title: 'Payment Secured',
          message: 'Your luxury journey has been officially reserved. Confirmation sent to your email.',
          confirmText: 'View My ITINERARY',
          onConfirm: () => { setModalConfig({ ...modalConfig, visible: false }); router.push('/(tabs)/bookings'); }
        });
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      setModalConfig({
        visible: true, type: 'error', title: 'Transaction Failed',
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
          <GlassCard style={[styles.paymentCard, { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 }]}>
            <View style={[styles.methodIcon, { backgroundColor: LuxuryColors.accent }]}>
              <QrCode size={22} color={LuxuryColors.background} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.methodLabel, { color: '#FFF', fontSize: 15 }]}>VietQR Transfer</Text>
              <Text style={{ color: LuxuryColors.textMuted, fontSize: 12, marginTop: 2 }}>Scan QR with any banking app</Text>
            </View>
            <View style={styles.radioActive}>
              <View style={styles.radioInner} />
            </View>
          </GlassCard>
        </Animated.View>

        {/* Voucher Code */}
        <Animated.View entering={FadeInDown.delay(250)} style={styles.section}>
          <Text style={styles.sectionTitle}>PROMO CODE</Text>
          <GlassCard style={{ padding: 16 }}>
            <View style={styles.row}>
              <TextInput
                placeholder="Enter voucher code"
                placeholderTextColor="rgba(255,255,255,0.2)"
                style={[styles.input, { flex: 1, marginRight: 10 }]}
                value={voucherCode}
                onChangeText={setVoucherCode}
                autoCapitalize="characters"
              />
              <PremiumPressable onPress={handleApplyVoucher} style={styles.voucherBtn} disabled={voucherLoading}>
                {voucherLoading
                  ? <ActivityIndicator size="small" color={LuxuryColors.background} />
                  : <Tag size={16} color={LuxuryColors.background} />}
              </PremiumPressable>
            </View>
            {appliedVoucher && (
              <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ color: LuxuryColors.success, ...LuxuryTypography.caption }}>✓ {appliedVoucher.discount}% OFF applied!</Text>
                <Text style={{ color: LuxuryColors.textMuted, ...LuxuryTypography.caption }}>Save {appliedVoucher.discountAmount.toLocaleString()} VNĐ</Text>
              </View>
            )}
          </GlassCard>
        </Animated.View>

        <View style={styles.securityNote}>
          <Lock size={14} color={LuxuryColors.success} />
          <Text style={styles.securityText}>AES-256 Bit Encryption Secured Transaction</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <BlurView intensity={30} tint="dark" style={styles.footer}>
        {/* Pricing breakdown */}
        <View style={styles.breakdownBox}>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Subtotal</Text>
            <Text style={styles.breakdownValue}>{Number(totalPrice).toLocaleString()} VNĐ</Text>
          </View>
          {appliedVoucher && (
            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, { color: LuxuryColors.success }]}>Voucher ({appliedVoucher.discount}%)</Text>
              <Text style={[styles.breakdownValue, { color: LuxuryColors.success }]}>-{appliedVoucher.discountAmount.toLocaleString()} VNĐ</Text>
            </View>
          )}
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Payable</Text>
          <Text style={styles.totalValue}>{Number(displayTotal).toLocaleString()} VNĐ</Text>
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
  voucherBtn: {
    width: 48, height: 48,
    borderRadius: LuxuryRadius.md,
    backgroundColor: LuxuryColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breakdownBox: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
    marginBottom: 12,
    paddingBottom: 10,
    gap: 6,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  breakdownLabel: {
    ...LuxuryTypography.caption,
    color: LuxuryColors.textMuted,
  },
  breakdownValue: {
    ...LuxuryTypography.caption,
    color: LuxuryColors.textSecondary,
  },
});

export default CheckoutScreen;
