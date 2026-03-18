import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { 
  ChevronLeft, 
  Calendar, 
  MapPin, 
  CreditCard, 
  Clock, 
  Car as CarIcon,
  ShieldCheck,
  AlertCircle
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import {
  LuxuryColors,
  LuxurySpacing,
  LuxuryTypography,
  LuxuryRadius,
} from '@/constants/luxuryTheme';
import { PremiumPressable } from '@/components/PremiumPressable';
import GlassCard from '@/components/GlassCard';
import LuxuryButton from '@/components/LuxuryButton';
import LuxuryModal from '@/components/LuxuryModal';
import { cancelBookingAPI } from '@/services/api';
// Assuming we might have a getBookingByIdAPI or similar, otherwise we'll pass data via params or use existing bookings list.
// For now, let's assume we fetch or pass data.

const BookingDetailScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  // Simplified for demo: assuming data passed via params or locally managed
  const booking = JSON.parse(params.booking as string || '{}');
  
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const handleCancel = async () => {
    setCancelLoading(true);
    try {
      await cancelBookingAPI(booking._id);
      setShowCancelModal(false);
      router.back();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setCancelLoading(false);
    }
  };

  const statusColors: any = {
    Pending: LuxuryColors.accent,
    Approved: LuxuryColors.success,
    Completed: '#94A3B8',
    Cancelled: LuxuryColors.danger,
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <PremiumPressable onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#FFF" />
        </PremiumPressable>
        <Text style={styles.headerTitle}>Reservation Details</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.delay(100)}>
          <GlassCard style={styles.mainCard}>
            <Image source={{ uri: booking.car?.imageUrl }} style={styles.carImage} />
            <View style={styles.statusBadge}>
              <View style={[styles.statusDot, { backgroundColor: statusColors[booking.status] }]} />
              <Text style={[styles.statusText, { color: statusColors[booking.status] }]}>
                {booking.status?.toUpperCase()}
              </Text>
            </View>
            
            <View style={styles.contentPadding}>
              <Text style={styles.brand}>{booking.car?.brand}</Text>
              <Text style={styles.model}>{booking.car?.name}</Text>
              
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Calendar size={18} color={LuxuryColors.accent} />
                  <View>
                    <Text style={styles.infoLabel}>PICKUP</Text>
                    <Text style={styles.infoValue}>{new Date(booking.pickupDate).toLocaleDateString()}</Text>
                  </View>
                </View>
                <View style={styles.infoItem}>
                  <Clock size={18} color={LuxuryColors.accent} />
                  <View>
                    <Text style={styles.infoLabel}>RETURN</Text>
                    <Text style={styles.infoValue}>{new Date(booking.returnDate).toLocaleDateString()}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.locationContainer}>
                <MapPin size={18} color={LuxuryColors.textMuted} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>HUB LOCATION</Text>
                  <Text style={styles.infoValue}>{booking.pickupLocation}</Text>
                </View>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200)}>
          <Text style={styles.sectionTitle}>PRICE BREAKDOWN</Text>
          <GlassCard style={styles.priceCard}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Daily Rate</Text>
              <Text style={styles.priceValue}>${booking.car?.pricePerDay} x Total Days</Text>
            </View>
            {booking.lateFee > 0 && (
              <View style={styles.priceRow}>
                <Text style={[styles.priceLabel, { color: LuxuryColors.danger }]}>Late Return Fee</Text>
                <Text style={[styles.priceValue, { color: LuxuryColors.danger }]}>+${booking.lateFee}</Text>
              </View>
            )}
            <View style={styles.divider} />
            <View style={styles.priceRow}>
              <Text style={styles.totalLabel}>Total Paid</Text>
              <Text style={styles.totalValue}>${booking.totalPrice}</Text>
            </View>
            <View style={styles.paymentMethod}>
              <CreditCard size={14} color={LuxuryColors.textMuted} />
              <Text style={styles.paymentText}>Mastercard ending in 8842</Text>
            </View>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300)}>
          <View style={styles.protectionCard}>
            <ShieldCheck size={24} color={LuxuryColors.success} />
            <View style={{ flex: 1 }}>
              <Text style={styles.protectionTitle}>Elite Insurance Active</Text>
              <Text style={styles.protectionBody}>Fully covered against theft and damage with $0 deductible.</Text>
            </View>
          </View>
        </Animated.View>

        <View style={styles.actions}>
          <LuxuryButton 
            title="VIEW VEHICLE" 
            onPress={() => router.push(`/car/${booking.car?._id}`)}
            style={styles.viewBtn}
          />
          
          {(booking.status === 'Pending' || booking.status === 'Approved') && (
            <PremiumPressable 
              onPress={() => setShowCancelModal(true)}
              style={styles.cancelBtn}
            >
              <Text style={styles.cancelText}>CANCEL RESERVATION</Text>
            </PremiumPressable>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <LuxuryModal
        visible={showCancelModal}
        type="warning"
        title="Cancel Reservation"
        message="Are you sure you want to cancel? This action might incur a small administrative fee depending on timing."
        confirmText={cancelLoading ? "Processing..." : "Yes, Cancel"}
        cancelText="No, Keep It"
        onConfirm={handleCancel}
        onCancel={() => setShowCancelModal(false)}
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
    color: '#FFF',
    fontSize: 18,
  },
  scrollContent: {
    padding: 20,
  },
  mainCard: {
    borderRadius: LuxuryRadius.xl,
    overflow: 'hidden',
    marginBottom: 24,
  },
  carImage: {
    width: '100%',
    height: 200,
  },
  statusBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: LuxuryRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    ...LuxuryTypography.tiny,
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 1,
  },
  contentPadding: {
    padding: 24,
  },
  brand: {
    ...LuxuryTypography.tiny,
    color: LuxuryColors.accent,
    fontSize: 12,
    marginBottom: 4,
  },
  model: {
    ...LuxuryTypography.titleL,
    color: '#FFF',
    fontSize: 24,
    marginBottom: 24,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 32,
    marginBottom: 24,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoLabel: {
    ...LuxuryTypography.tiny,
    color: LuxuryColors.textMuted,
    fontSize: 9,
    marginBottom: 2,
  },
  infoValue: {
    ...LuxuryTypography.bodySemibold,
    color: '#FFF',
    fontSize: 13,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginVertical: 20,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: {
    ...LuxuryTypography.tiny,
    color: LuxuryColors.textMuted,
    marginLeft: 4,
    marginBottom: 12,
    letterSpacing: 1.5,
  },
  priceCard: {
    padding: 24,
    gap: 16,
    marginBottom: 24,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    ...LuxuryTypography.body,
    color: LuxuryColors.textSecondary,
    fontSize: 14,
  },
  priceValue: {
    ...LuxuryTypography.bodySemibold,
    color: '#FFF',
    fontSize: 14,
  },
  totalLabel: {
    ...LuxuryTypography.bodySemibold,
    color: '#FFF',
    fontSize: 16,
  },
  totalValue: {
    ...LuxuryTypography.titleL,
    color: LuxuryColors.accent,
    fontSize: 24,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  paymentText: {
    ...LuxuryTypography.tiny,
    color: LuxuryColors.textMuted,
    fontSize: 11,
  },
  protectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    padding: 20,
    borderRadius: LuxuryRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.1)',
    marginBottom: 32,
  },
  protectionTitle: {
    ...LuxuryTypography.bodySemibold,
    color: LuxuryColors.success,
    fontSize: 14,
  },
  protectionBody: {
    ...LuxuryTypography.tiny,
    color: 'rgba(16, 185, 129, 0.7)',
    fontSize: 11,
    marginTop: 2,
  },
  actions: {
    gap: 16,
  },
  viewBtn: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cancelBtn: {
    alignItems: 'center',
    padding: 16,
  },
  cancelText: {
    ...LuxuryTypography.tiny,
    color: LuxuryColors.danger,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
});

export default BookingDetailScreen;
