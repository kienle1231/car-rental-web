import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Calendar, MapPin, CreditCard, ChevronRight, Clock, AlertTriangle, Zap, XCircle, RotateCcw } from 'lucide-react-native';

import {
  LuxuryColors,
  LuxurySpacing,
  LuxuryTypography,
  LuxuryRadius,
} from '@/constants/luxuryTheme';
import { getMyBookingsAPI, extendBookingAPI, cancelBookingAPI } from '@/services/api';
import GlassCard from '@/components/GlassCard';
import { PremiumPressable } from '@/components/PremiumPressable';
import LuxuryModal from '@/components/LuxuryModal';
import { BookingCardSkeleton } from '@/components/Skeleton';

const statusConfigs: Record<string, { bg: string; text: string; border: string; label: string }> = {
  Pending: { 
    bg: 'rgba(245, 158, 11, 0.12)', 
    text: '#F59E0B', 
    border: 'rgba(245, 158, 11, 0.3)',
    label: 'Awaiting Approval'
  },
  Approved: { 
    bg: 'rgba(16, 185, 129, 0.12)', 
    text: '#10B981', 
    border: 'rgba(16, 185, 129, 0.3)',
    label: 'Confirmed'
  },
  Cancelled: { 
    bg: 'rgba(239, 68, 68, 0.12)', 
    text: '#EF4444', 
    border: 'rgba(239, 68, 68, 0.3)',
    label: 'Cancelled'
  },
  Overdue: {
    bg: 'rgba(239, 68, 68, 0.2)',
    text: '#FF0000',
    border: 'rgba(239, 68, 68, 0.5)',
    label: 'OVERDUE'
  },
  Completed: {
    bg: 'rgba(255, 255, 255, 0.05)',
    text: 'rgba(255, 255, 255, 0.4)',
    border: 'rgba(255, 255, 255, 0.1)',
    label: 'Completed'
  }
};

const BookingScreen = () => {
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelModalId, setCancelModalId] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  const loadBookings = async (withRefresh = false) => {
    if (withRefresh) setRefreshing(true);
    else setLoading(true);
    
    try {
      const { data } = await getMyBookingsAPI();
      setBookings(data);
    } catch (error) {
      console.error('Bookings load error:', error);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleExtend = async (id: string, currentEnd: string) => {
    const nextDay = new Date(currentEnd);
    nextDay.setDate(nextDay.getDate() + 1);
    const newDate = nextDay.toISOString().split('T')[0];

    try {
      await extendBookingAPI(id, newDate);
      loadBookings(true);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to extend trip');
    }
  };

  const handleCancel = async () => {
    if (!cancelModalId) return;
    setCancelLoading(true);
    try {
      await cancelBookingAPI(cancelModalId);
      setCancelModalId(null);
      loadBookings(true);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setCancelLoading(false);
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingWrapper}>
        <StatusBar barStyle="light-content" />
        <View style={styles.header}>
          <Text style={styles.title}>Reservations</Text>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.list}>
            {[1, 2, 3].map(i => <BookingCardSkeleton key={i} />)}
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadBookings(true)}
            tintColor={LuxuryColors.accent}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>My Reservations</Text>
          <Text style={styles.subtitle}>Active and past luxury bookings</Text>
        </View>

        {bookings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Calendar size={60} color={LuxuryColors.textMuted} strokeWidth={1} />
            <Text style={styles.emptyTitle}>No Journeys Yet</Text>
            <Text style={styles.emptySubtitle}>Your premium fleet bookings will appear here.</Text>
            <PremiumPressable style={styles.browseBtn}>
              <Text style={styles.browseBtnText}>Explore Fleet</Text>
            </PremiumPressable>
          </View>
        ) : (
          <View style={styles.list}>
            {bookings.map((booking, index) => {
              const isOverdue = new Date(booking.returnDate) < new Date() && booking.status === 'Approved';
              const effectiveStatus = isOverdue ? 'Overdue' : booking.status;
              const status = statusConfigs[effectiveStatus] || statusConfigs.Pending;
              return (
                <Animated.View 
                  key={booking._id} 
                  entering={FadeInDown.delay(index * 100).duration(600).springify()}
                >
                  <PremiumPressable 
                    scaleTo={0.98} 
                    style={styles.cardWrapper}
                    onPress={() => router.push({
                      pathname: '/booking-detail' as any,
                      params: { booking: JSON.stringify(booking) }
                    })}
                  >
                    <GlassCard style={styles.bookingCard}>
                      <View style={styles.cardHeader}>
                        <View style={styles.carInfo}>
                          <Text style={styles.carBrand}>{booking.car?.brand || 'Premium'}</Text>
                          <Text style={styles.carModel}>{booking.car?.model || 'Executive'}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: status.bg, borderColor: status.border }]}>
                          <Text style={[styles.statusText, { color: status.text }]}>{status.label}</Text>
                        </View>
                      </View>

                      <View style={styles.imageRow}>
                        <Image source={{ uri: booking.car?.imageUrl }} style={styles.carImage} />
                        <View style={styles.detailsColumn}>
                          <View style={styles.detailItem}>
                            <Clock size={14} color={LuxuryColors.textMuted} />
                            <Text style={styles.detailText}>
                              {new Date(booking.pickupDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - {new Date(booking.returnDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </Text>
                          </View>
                          <View style={styles.detailItem}>
                            <MapPin size={14} color={LuxuryColors.textMuted} />
                            <Text style={styles.detailText} numberOfLines={1}>{booking.pickupLocation}</Text>
                          </View>
                          <View style={styles.detailItem}>
                            <CreditCard size={14} color={LuxuryColors.textMuted} />
                            <Text style={styles.totalPrice}>${booking.totalPrice?.toFixed(2)}</Text>
                          </View>
                        </View>
                      </View>
                      
                      <View style={styles.cardFooter}>
                        <View style={styles.addonInfo}>
                           {booking.addOns?.length > 0 && (
                             <Text style={styles.addonText}>{booking.addOns.length} Exclusive Add-ons</Text>
                           )}
                           {booking.lateFee > 0 && (
                             <Text style={styles.lateFeeText}>Late Fee: +${booking.lateFee}</Text>
                           )}
                        </View>
                        
                        {booking.status === 'Approved' && (
                          <PremiumPressable 
                            onPress={() => handleExtend(booking._id, booking.returnDate)}
                            style={styles.extendBtn}
                          >
                            <Zap size={14} color={LuxuryColors.background} />
                            <Text style={styles.extendBtnText}>EXTEND</Text>
                          </PremiumPressable>
                        )}

                        {(booking.status === 'Pending' || booking.status === 'Approved') && (
                          <PremiumPressable 
                            onPress={() => setCancelModalId(booking._id)}
                            style={styles.cancelBtn}
                          >
                            <XCircle size={14} color={LuxuryColors.danger} />
                            <Text style={styles.cancelBtnText}>CANCEL</Text>
                          </PremiumPressable>
                        )}
                        
                        {(booking.status === 'Overdue' || (booking.status === 'Approved' && isOverdue)) && (
                          <View style={styles.overdueWarn}>
                            <AlertTriangle size={14} color={LuxuryColors.danger} />
                            <Text style={styles.overdueWarnText}>RETURN NOW</Text>
                          </View>
                        )}

                        {booking.status === 'Completed' && (
                          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                            {booking.lateFee > 0 && (
                              <View style={styles.lateFeeUserInfo}>
                                <Text style={styles.lateFeeUserLabel}>LATE FEE APPLIED</Text>
                                <Text style={styles.lateFeeUserValue}>+${booking.lateFee}</Text>
                              </View>
                            )}
                            <PremiumPressable 
                              style={styles.bookAgainBtn}
                              onPress={() => router.push(`/car/${booking.car?._id}`)}
                            >
                              <RotateCcw size={14} color={LuxuryColors.accent} />
                              <Text style={styles.bookAgainText}>BOOK AGAIN</Text>
                            </PremiumPressable>
                          </View>
                        )}
                      </View>
                    </GlassCard>
                  </PremiumPressable>
                </Animated.View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <LuxuryModal
        visible={!!cancelModalId}
        type="warning"
        title="Cancel Reservation"
        message="Are you sure you want to cancel this booking? This action cannot be undone."
        confirmText={cancelLoading ? 'Cancelling...' : 'Yes, Cancel'}
        cancelText="Keep Booking"
        onConfirm={handleCancel}
        onCancel={() => setCancelModalId(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LuxuryColors.background,
  },
  content: {
    padding: LuxurySpacing.screenPadding,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    ...LuxuryTypography.titleL,
    color: '#FFF',
  },
  subtitle: {
    ...LuxuryTypography.caption,
    color: LuxuryColors.textMuted,
    marginTop: 4,
  },
  loadingWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: LuxuryColors.background,
  },
  loadingText: {
    ...LuxuryTypography.caption,
    color: LuxuryColors.textSecondary,
    marginTop: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    gap: 16,
  },
  emptyTitle: {
    ...LuxuryTypography.titleM,
    color: LuxuryColors.textPrimary,
  },
  emptySubtitle: {
    ...LuxuryTypography.body,
    color: LuxuryColors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  browseBtn: {
    backgroundColor: LuxuryColors.accent,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: LuxuryRadius.full,
    marginTop: 12,
  },
  browseBtnText: {
    ...LuxuryTypography.bodySemibold,
    color: LuxuryColors.background,
  },
  list: {
    gap: 20,
  },
  cardWrapper: {
    borderRadius: LuxuryRadius.xl,
    overflow: 'hidden',
  },
  bookingCard: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  carInfo: {
    gap: 2,
  },
  carBrand: {
    ...LuxuryTypography.tiny,
    color: LuxuryColors.accent,
  },
  carModel: {
    ...LuxuryTypography.titleM,
    fontSize: 20,
    color: '#FFF',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: LuxuryRadius.sm,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  imageRow: {
    flexDirection: 'row',
    gap: 20,
  },
  carImage: {
    width: 130,
    height: 90,
    borderRadius: LuxuryRadius.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  detailsColumn: {
    flex: 1,
    justifyContent: 'space-between',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    ...LuxuryTypography.caption,
    color: LuxuryColors.textSecondary,
    fontSize: 13,
  },
  totalPrice: {
    ...LuxuryTypography.bodySemibold,
    color: LuxuryColors.accentStrong,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: LuxuryColors.border,
  },
  addonInfo: {
    flex: 1,
  },
  addonText: {
    ...LuxuryTypography.tiny,
    color: LuxuryColors.textMuted,
    textTransform: 'none',
    letterSpacing: 0,
  },
  lateFeeText: {
    ...LuxuryTypography.caption,
    color: LuxuryColors.danger,
    fontWeight: '800',
    marginTop: 4,
  },
  extendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LuxuryColors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  extendBtnText: {
    ...LuxuryTypography.tiny,
    color: LuxuryColors.background,
    fontWeight: '900',
  },
  overdueWarn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  overdueWarnText: {
    fontSize: 10,
    fontWeight: '900',
    color: LuxuryColors.danger,
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  cancelBtnText: {
    ...LuxuryTypography.tiny,
    color: LuxuryColors.danger,
    fontWeight: '900',
  },
  lateFeeUserInfo: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    alignItems: 'flex-end',
  },
  lateFeeUserLabel: {
    ...LuxuryTypography.tiny,
    color: LuxuryColors.danger,
    fontSize: 8,
    fontWeight: '800',
  },
  lateFeeUserValue: {
    ...LuxuryTypography.bodySemibold,
    color: LuxuryColors.danger,
    fontSize: 14,
  },
  bookAgainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  bookAgainText: {
    ...LuxuryTypography.tiny,
    color: LuxuryColors.accent,
    fontWeight: '900',
    letterSpacing: 1,
  },
});

export default BookingScreen;
