import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import {
  Alert,
  Dimensions,
  TextInput,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  StatusBar,
  ActivityIndicator,
  FlatList,
  TextInput as RNTextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Calendar as RNCalendar } from 'react-native-calendars';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  interpolate,
  Extrapolate,
  FadeIn,
  FadeInRight,
  FadeInDown,
} from 'react-native-reanimated';
import { 
  ChevronLeft, 
  Star, 
  MapPin, 
  Users, 
  Gauge, 
  Fuel, 
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronRight,
  Maximize2
} from 'lucide-react-native';

import GlassCard from '@/components/GlassCard';
import { PremiumPressable } from '@/components/PremiumPressable';
import LuxuryModal from '@/components/LuxuryModal';
import { 
  LuxuryColors, 
  LuxurySpacing, 
  LuxuryTypography, 
  LuxuryRadius 
} from '@/constants/luxuryTheme';
import { 
  createBookingAPI, 
  getAvailabilityByCarAPI, 
  getCarByIdAPI, 
  getCarPricingAPI,
  getReviewsByCarAPI,
  createReviewAPI 
} from '@/services/api';
import { CarDetailSkeleton } from '@/components/Skeleton';

const { width, height } = Dimensions.get('window');
const IMAGE_HEIGHT = height * 0.35;

const addOnOptions = [
  { id: 'basic_insurance', label: 'Basic Insurance', price: 12 },
  { id: 'premium_insurance', label: 'Premium Insurance', price: 28 },
  { id: 'gps', label: 'GPS Navigation', price: 8 },
  { id: 'child_seat', label: 'Child Seat', price: 6 },
];

const CarDetailScreen = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [car, setCar] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Specs');
  const [pricing, setPricing] = useState<any>(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [booking, setBooking] = useState({
    pickupDate: '',
    returnDate: '',
    addOns: [] as string[],
  });
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [markedDates, setMarkedDates] = useState<any>({});
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [bookingError, setBookingError] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewStats, setReviewStats] = useState({ count: 0, avgRating: 0 });
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    visible: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
  }>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  const scrollY = useSharedValue(0);
  const imageX = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const imageScrollHandler = useAnimatedScrollHandler((event) => {
    imageX.value = event.contentOffset.x;
  });

  const [occupiedDates, setOccupiedDates] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [{ data: carData }, { data: availabilityData }] = await Promise.all([
          getCarByIdAPI(String(id)),
          getAvailabilityByCarAPI(String(id)),
        ]);
        setCar(carData);
        
        // Process occupied dates
        const occupied: string[] = [];
        availabilityData.forEach((book: any) => {
          let curr = new Date(book.pickupDate);
          const end = new Date(book.returnDate);
          while (curr <= end) {
            occupied.push(curr.toISOString().split('T')[0]);
            curr.setDate(curr.getDate() + 1);
          }
        });
        setOccupiedDates(occupied);
        
        // Initial marked dates with occupied ones
        const initialMarked: any = {};
        occupied.forEach(date => {
          initialMarked[date] = { 
            disabled: true, 
            disableTouchEvent: true, 
            textColor: 'rgba(255,255,255,0.1)' 
          };
        });
        setMarkedDates(initialMarked);

      } catch (error) {
        console.error('Car detail fetch error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Fetch reviews
  const loadReviews = useCallback(async () => {
    setReviewLoading(true);
    try {
      const { data } = await getReviewsByCarAPI(String(id));
      setReviews(data.reviews || []);
      setReviewStats(data.stats || { count: 0, avgRating: 0 });
    } catch (error) {
      console.error('Reviews fetch error:', error);
    } finally {
      setReviewLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleSubmitReview = async () => {
    if (!reviewText.trim()) {
      setModalConfig({
        visible: true, type: 'warning', title: 'Review Required',
        message: 'Please write a comment for your review.',
        confirmText: 'OK',
        onConfirm: () => setModalConfig(prev => ({ ...prev, visible: false }))
      });
      return;
    }
    setReviewSubmitting(true);
    try {
      await createReviewAPI({ car: String(id), rating: reviewRating, comment: reviewText.trim() });
      setReviewText('');
      setReviewRating(5);
      loadReviews();
      setModalConfig({
        visible: true, type: 'success', title: 'Review Submitted',
        message: 'Thank you for your feedback!',
        confirmText: 'Great',
        onConfirm: () => setModalConfig(prev => ({ ...prev, visible: false }))
      });
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to submit review.';
      setModalConfig({
        visible: true, type: 'error', title: 'Cannot Submit',
        message: msg,
        confirmText: 'OK',
        onConfirm: () => setModalConfig(prev => ({ ...prev, visible: false }))
      });
    } finally {
      setReviewSubmitting(false);
    }
  };

  const StarRatingInput = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {[1, 2, 3, 4, 5].map(s => (
        <PremiumPressable key={s} onPress={() => onChange(s)}>
          <Star size={28} color={LuxuryColors.accent} fill={s <= value ? LuxuryColors.accent : 'transparent'} />
        </PremiumPressable>
      ))}
    </View>
  );

  useEffect(() => {
    if (!booking.pickupDate || !booking.returnDate) return;
    const loadPricing = async () => {
      setPricingLoading(true);
      try {
        const { data } = await getCarPricingAPI(String(id), {
          startDate: booking.pickupDate,
          endDate: booking.returnDate,
        });
        setPricing(data);
      } catch (error) {
        console.error('Pricing error:', error);
      } finally {
        setPricingLoading(false);
      }
    };
    loadPricing();
  }, [booking.pickupDate, booking.returnDate, id]);

  const images = useMemo(() => {
    if (!car) return [];
    const gallery = Array.isArray(car.galleryImages) && car.galleryImages.length > 0 
      ? car.galleryImages 
      : [
          car.imageUrl,
          'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?q=80&w=2070&auto=format&fit=crop', // Interior
          'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=2070&auto=format&fit=crop'  // Detail
        ];
    return gallery;
  }, [car]);

  const days = useMemo(() => {
    if (!booking.pickupDate || !booking.returnDate) return 0;
    const start = new Date(booking.pickupDate);
    const end = new Date(booking.returnDate);
    return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));
  }, [booking.pickupDate, booking.returnDate]);

  const addOnsTotal = useMemo(() => {
    return addOnOptions
      .filter((option) => booking.addOns.includes(option.id))
      .reduce((sum, option) => sum + option.price * (days || 1), 0);
  }, [booking.addOns, days]);

  const dynamicPerDay = pricing?.dynamicPricePerDay || (car ? car.pricePerDay : 0);
  const totalPrice = car ? days * dynamicPerDay + addOnsTotal : 0;

  const handleBooking = async () => {
    console.log('Booking attempt:', booking);
    if (!booking.pickupDate || !booking.returnDate) {
      setBookingError(true);
      setModalConfig({
        visible: true,
        type: 'warning',
        title: 'Dates Required',
        message: 'To experience this masterpiece, please define your journey timeline first.',
        confirmText: 'Choose Dates',
        onConfirm: () => {
          setModalConfig(prev => ({ ...prev, visible: false }));
          setShowCalendarModal(true);
          setBookingError(false);
        }
      });
      return;
    }

    try {
      const stored = await AsyncStorage.getItem('user');
      console.log('Auth check:', stored ? 'Logged in' : 'Guest');
      if (!stored) {
        setModalConfig({
          visible: true,
          type: 'info',
          title: 'Login Required',
          message: 'Please sign in to book your exclusive journey.',
          confirmText: 'Login Now',
          cancelText: 'Maybe Later',
          onConfirm: () => {
            setModalConfig(prev => ({ ...prev, visible: false }));
            router.push('/login');
          }
        });
        return;
      }

      // Navigate to Checkout instead of calling API directly
      router.push({
        pathname: '/checkout',
        params: {
          id: id as string,
          carData: JSON.stringify({
            brand: car.brand,
            model: car.model,
            location: car.location,
          }),
          bookingData: JSON.stringify({
            pickupDate: booking.pickupDate,
            returnDate: booking.returnDate,
            addOns: booking.addOns,
          }),
          totalPrice: totalPrice.toString()
        }
      });
    } catch (error: any) {
      console.error('Booking navigation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddOnToggle = (addonId: string) => {
    setBooking((prev) => {
      const exists = prev.addOns.includes(addonId);
      return { 
        ...prev, 
        addOns: exists ? prev.addOns.filter(id => id !== addonId) : [...prev.addOns, addonId] 
      };
    });
  };

  const handleDateSelect = (day: any) => {
    const selectedDate = day.dateString;
    
    // Check if selected day itself is occupied
    if (occupiedDates.includes(selectedDate)) return;

    if (!booking.pickupDate || (booking.pickupDate && booking.returnDate)) {
      // Start new selection
      setBooking(prev => ({ ...prev, pickupDate: selectedDate, returnDate: '' }));
      
      const newMarked: any = {};
      // Re-add occupied dates
      occupiedDates.forEach(date => {
        newMarked[date] = { disabled: true, disableTouchEvent: true, textColor: 'rgba(255,255,255,0.1)' };
      });

      newMarked[selectedDate] = { 
        startingDay: true, 
        color: LuxuryColors.accent, 
        textColor: LuxuryColors.background 
      };
      setMarkedDates(newMarked);
    } else {
      // Selection end date
      const start = new Date(booking.pickupDate);
      const end = new Date(selectedDate);
      
      if (end < start) {
        setBooking(prev => ({ ...prev, pickupDate: selectedDate, returnDate: '' }));
        const newMarked: any = {};
        occupiedDates.forEach(date => {
          newMarked[date] = { disabled: true, disableTouchEvent: true, textColor: 'rgba(255,255,255,0.1)' };
        });
        newMarked[selectedDate] = { 
          startingDay: true, 
          color: LuxuryColors.accent, 
          textColor: LuxuryColors.background 
        };
        setMarkedDates(newMarked);
        return;
      }

      // Check for overlap with occupied dates in the range
      let hasConflict = false;
      let checkCurr = new Date(start);
      while (checkCurr <= end) {
        if (occupiedDates.includes(checkCurr.toISOString().split('T')[0])) {
          hasConflict = true;
          break;
        }
        checkCurr.setDate(checkCurr.getDate() + 1);
      }

      if (hasConflict) {
        setModalConfig({
          visible: true,
          type: 'error',
          title: 'Car Unavailable',
          message: 'The selected range includes dates when the car is already reserved.',
          confirmText: 'Adjust Dates',
          onConfirm: () => setModalConfig(prev => ({ ...prev, visible: false }))
        });
        return;
      }
      
      setBooking(prev => ({ ...prev, returnDate: selectedDate }));
      
      const rangeMarked: any = {};
      // Re-add occupied dates
      occupiedDates.forEach(date => {
        rangeMarked[date] = { disabled: true, disableTouchEvent: true, textColor: 'rgba(255,255,255,0.1)' };
      });

      let curr = new Date(start);
      while (curr <= end) {
        const dateStr = curr.toISOString().split('T')[0];
        if (dateStr === booking.pickupDate) {
          rangeMarked[dateStr] = { 
            startingDay: true, 
            color: LuxuryColors.accent, 
            textColor: LuxuryColors.background 
          };
        } else if (dateStr === selectedDate) {
          rangeMarked[dateStr] = { 
            endingDay: true, 
            color: LuxuryColors.accent, 
            textColor: LuxuryColors.background 
          };
        } else {
          rangeMarked[dateStr] = { 
            color: 'rgba(212, 175, 55, 0.2)', 
            textColor: '#FFF' 
          };
        }
        curr.setDate(curr.getDate() + 1);
      }
      setMarkedDates(rangeMarked);
    }
  };

  const formatDateLabel = (dateStr: string) => {
    if (!dateStr) return 'Select Date';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
  };

  const imageAnimatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(scrollY.value, [-IMAGE_HEIGHT, 0], [1.5, 1], Extrapolate.CLAMP);
    const translateY = interpolate(scrollY.value, [0, IMAGE_HEIGHT], [0, IMAGE_HEIGHT * 0.4], Extrapolate.CLAMP);
    return { transform: [{ scale }, { translateY }] };
  });

  const headerAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [IMAGE_HEIGHT * 0.7, IMAGE_HEIGHT], [0, 1], Extrapolate.CLAMP);
    return { opacity };
  });

  if (loading || !car) {
    return <CarDetailSkeleton />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <Animated.View style={[styles.floatingHeader, headerAnimatedStyle]}>
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
        <Text style={styles.headerTitle}>{car.brand} {car.model}</Text>
      </Animated.View>

      <PremiumPressable 
        onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} 
        style={styles.backBtn}
        scaleTo={0.9}
      >
        <ChevronLeft size={24} color="#FFF" />
      </PremiumPressable>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View style={[styles.imageWrapper, imageAnimatedStyle]}>
          <Animated.ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={imageScrollHandler}
            scrollEventThrottle={16}
            onMomentumScrollEnd={(e) => {
              setActiveImageIndex(Math.round(e.nativeEvent.contentOffset.x / width));
            }}
          >
            {images.map((img: string, index: number) => (
              <Image key={index} source={{ uri: img }} style={styles.mainImage} resizeMode="cover" />
            ))}
          </Animated.ScrollView>
          <LinearGradient
            colors={['transparent', 'rgba(2, 6, 23, 0.2)', LuxuryColors.background]}
            style={[StyleSheet.absoluteFill, Platform.OS === 'web' && { pointerEvents: 'none' } as any]}
            pointerEvents={Platform.OS === 'web' ? undefined : 'none'}
          />
          
          <View style={styles.pagination}>
            {images.map((_: any, i: number) => (
              <View key={i} style={[styles.dot, activeImageIndex === i && styles.activeDot]} />
            ))}
          </View>

          <PremiumPressable style={styles.expandBtn}>
            <Maximize2 size={18} color="#FFF" />
          </PremiumPressable>
        </Animated.View>

        <View style={styles.content}>
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <View style={styles.titleRow}>
              <View>
                <Text style={styles.brandSubtitle}>{car.brand}</Text>
                <Text style={styles.modelTitle}>{car.model}</Text>
              </View>
              <View style={styles.ratingBadge}>
                <Star size={14} color={LuxuryColors.accent} fill={LuxuryColors.accent} />
                <Text style={styles.ratingText}>{car.rating}</Text>
              </View>
            </View>

            <View style={styles.locationRow}>
              <MapPin size={14} color={LuxuryColors.textMuted} />
              <Text style={styles.locationText}>{car.location || 'Premium Fleet Hub'}</Text>
            </View>

            <View style={styles.specsContainer}>
              {[
                { icon: <Users size={18} />, label: car.seats, sub: 'Seats' },
                { icon: <Gauge size={18} />, label: car.transmission === 'Automatic' ? 'Auto' : 'Manual', sub: 'Trans' },
                { icon: <Fuel size={18} />, label: car.fuelType, sub: 'Fuel' },
                { icon: <Star size={18} />, label: 'Top', sub: 'Rating' },
              ].map((item, idx) => (
                <GlassCard key={idx} style={styles.specBox}>
                  {React.cloneElement(item.icon as any, { color: LuxuryColors.accent })}
                  <Text style={styles.specLabel}>{item.label}</Text>
                  <Text style={styles.specSub}>{item.sub}</Text>
                </GlassCard>
              ))}
            </View>

            <View style={styles.tabsRow}>
              {['Specs', 'Details', 'Reviews'].map((tab) => (
                <PremiumPressable 
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  style={[styles.tabItem, activeTab === tab && styles.tabActive]}
                >
                  <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
                </PremiumPressable>
              ))}
            </View>

            {activeTab === 'Specs' && (
              <Animated.View entering={FadeInRight} style={styles.detailsList}>
                <Text style={styles.description}>{car.description}</Text>
              </Animated.View>
            )}

            {activeTab === 'Details' && (
              <Animated.View entering={FadeInRight} style={styles.specsGrid}>
                <View style={styles.specRow}>
                  <View style={styles.specItem}>
                    <Users size={18} color={LuxuryColors.accent} />
                    <View>
                      <Text style={styles.specItemLabel}>SEATING</Text>
                      <Text style={styles.specItemValue}>{car.seats || 5} Universe</Text>
                    </View>
                  </View>
                  <View style={styles.specItem}>
                    <Gauge size={18} color={LuxuryColors.accent} />
                    <View>
                      <Text style={styles.specItemLabel}>ENGINE</Text>
                      <Text style={styles.specItemValue}>{car.transmission || 'Automatic'}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.specRow}>
                  <View style={styles.specItem}>
                    <Fuel size={18} color={LuxuryColors.accent} />
                    <View>
                      <Text style={styles.specItemLabel}>ENERGY</Text>
                      <Text style={styles.specItemValue}>{car.fuelType || 'Electric'}</Text>
                    </View>
                  </View>
                  <View style={styles.specItem}>
                    <Maximize2 size={18} color={LuxuryColors.accent} />
                    <View>
                      <Text style={styles.specItemLabel}>RELEASE</Text>
                      <Text style={styles.specItemValue}>{car.year || 2024} Elite</Text>
                    </View>
                  </View>
                </View>
              </Animated.View>
            )}

            {activeTab === 'Reviews' && (
              <Animated.View entering={FadeInRight} style={styles.detailsList}>
                {/* Review Stats */}
                <GlassCard style={styles.reviewStatsCard}>
                  <View style={styles.reviewStatsLeft}>
                    <Text style={styles.reviewAvgNumber}>{reviewStats.avgRating || car.rating}</Text>
                    <View style={styles.reviewStarsRow}>
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} size={14} color={LuxuryColors.accent} fill={s <= Math.round(reviewStats.avgRating || car.rating) ? LuxuryColors.accent : 'transparent'} />
                      ))}
                    </View>
                    <Text style={styles.reviewCountText}>{reviewStats.count} reviews</Text>
                  </View>
                </GlassCard>

                {/* Write Review Form */}
                <GlassCard style={styles.writeReviewCard}>
                  <Text style={styles.writeReviewTitle}>Share Your Experience</Text>
                  <StarRatingInput value={reviewRating} onChange={setReviewRating} />
                  <TextInput
                    style={styles.reviewInput}
                    placeholder="Write your review..."
                    placeholderTextColor={LuxuryColors.textMuted}
                    multiline
                    numberOfLines={3}
                    value={reviewText}
                    onChangeText={setReviewText}
                  />
                  <PremiumPressable
                    onPress={handleSubmitReview}
                    style={styles.submitReviewBtn}
                    disabled={reviewSubmitting}
                  >
                    <Text style={styles.submitReviewText}>{reviewSubmitting ? 'SUBMITTING...' : 'SUBMIT REVIEW'}</Text>
                  </PremiumPressable>
                </GlassCard>

                {/* Reviews List */}
                {reviewLoading ? (
                  <ActivityIndicator color={LuxuryColors.accent} style={{ marginTop: 20 }} />
                ) : reviews.length === 0 ? (
                  <View style={styles.noReviewsBox}>
                    <Star size={40} color={LuxuryColors.textMuted} strokeWidth={1} />
                    <Text style={styles.noReviewsText}>No reviews yet. Be the first!</Text>
                  </View>
                ) : (
                  reviews.map((review: any) => (
                    <GlassCard key={review._id} style={styles.reviewCard}>
                      <View style={styles.reviewHeader}>
                        <View style={styles.reviewUser}>
                          <View style={styles.reviewAvatar}>
                            <Users size={16} color={LuxuryColors.accent} />
                          </View>
                          <View>
                            <Text style={styles.reviewUserName}>{review.user?.name || 'Elite Member'}</Text>
                            <Text style={styles.reviewDate}>{new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                          </View>
                        </View>
                        <View style={styles.reviewStarsRow}>
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} size={12} color={LuxuryColors.accent} fill={s <= review.rating ? LuxuryColors.accent : 'transparent'} />
                          ))}
                        </View>
                      </View>
                      <Text style={styles.reviewComment}>{review.comment}</Text>
                    </GlassCard>
                  ))
                )}
              </Animated.View>
            )}

            <GlassCard style={styles.bookingCard}>
              <View style={styles.pricingHeader}>
                <View>
                  <Text style={styles.perDayLabel}>DRIVE EXCLUSIVE</Text>
                  <Text style={styles.mainPrice}>${car.pricePerDay}<Text style={{ fontSize: 16, color: LuxuryColors.textMuted }}>/day</Text></Text>
                </View>
                {pricingLoading ? <ActivityIndicator color={LuxuryColors.accent} /> : (
                  <View style={styles.insuranceBadge}>
                    <CheckCircle2 size={12} color={LuxuryColors.success} />
                    <Text style={styles.insuranceText}>Fully Insured</Text>
                  </View>
                )}
              </View>

              <PremiumPressable 
                onPress={() => {
                  setBookingError(false);
                  setShowCalendarModal(true);
                }}
                style={[
                  styles.dateSelector,
                  bookingError && { borderColor: LuxuryColors.danger, borderWidth: 2 }
                ]}
              >
                <View style={styles.dateField}>
                  <CalendarIcon size={18} color={LuxuryColors.accent} />
                  <View>
                    <Text style={styles.dateLabel}>PICKUP</Text>
                    <Text style={styles.dateValue}>{formatDateLabel(booking.pickupDate)}</Text>
                  </View>
                </View>
                <View style={styles.verticalDivider} />
                <View style={styles.dateField}>
                  <CalendarIcon size={18} color={LuxuryColors.accent} />
                  <View>
                    <Text style={styles.dateLabel}>RETURN</Text>
                    <Text style={styles.dateValue}>{formatDateLabel(booking.returnDate)}</Text>
                  </View>
                </View>
              </PremiumPressable>

              {days > 0 && (
                <Animated.View entering={FadeIn} style={styles.totalCalc}>
                  <View style={styles.calcRow}>
                    <Text style={styles.calcLabel}>Rental ({days} days)</Text>
                    <Text style={styles.calcValue}>${days * dynamicPerDay}</Text>
                  </View>
                  {addOnsTotal > 0 && (
                    <View style={styles.calcRow}>
                      <Text style={styles.calcLabel}>Premium Add-ons</Text>
                      <Text style={styles.calcValue}>+${addOnsTotal}</Text>
                    </View>
                  )}
                  <View style={styles.finalDivider} />
                  <View style={styles.calcRow}>
                    <Text style={styles.totalLabel}>Total Price</Text>
                    <Text style={styles.totalValue}>${totalPrice}</Text>
                  </View>
                </Animated.View>
              )}

              <PremiumPressable 
                onPress={handleBooking}
                style={[
                  styles.reserveBtn,
                  (!booking.pickupDate || !booking.returnDate) && { opacity: 0.8, backgroundColor: 'rgba(234, 179, 8, 0.4)' }
                ]}
              >
                <Text style={styles.reserveBtnText}>RESERVE NOW</Text>
                <ChevronRight size={20} color={(!booking.pickupDate || !booking.returnDate) ? LuxuryColors.accent : LuxuryColors.background} />
              </PremiumPressable>
            </GlassCard>

            <Text style={styles.sectionTitle}>Enhance Your Journey</Text>
            <View style={styles.addonsGrid}>
              {addOnOptions.map((addon) => {
                const selected = booking.addOns.includes(addon.id);
                return (
                  <PremiumPressable 
                    key={addon.id}
                    onPress={() => handleAddOnToggle(addon.id)}
                    style={[styles.addonPill, selected && styles.addonPillActive]}
                  >
                    <CheckCircle2 size={16} color={selected ? LuxuryColors.background : LuxuryColors.accent} />
                    <Text style={[styles.addonName, selected && styles.addonNameActive]}>{addon.label}</Text>
                    <Text style={styles.addonPrice}>+${addon.price}</Text>
                  </PremiumPressable>
                );
              })}
            </View>
          </Animated.View>
        </View>
      </Animated.ScrollView>

      {/* LUXURY CALENDAR MODAL */}
      {showCalendarModal && (
        <View style={styles.modalOverlay}>
          <GlassCard style={styles.calendarCard}>
            <View style={styles.calendarHeader}>
              <Text style={styles.modalTitle}>Select Trip Dates</Text>
              <PremiumPressable onPress={() => setShowCalendarModal(false)}>
                <CheckCircle2 size={24} color={LuxuryColors.accent} />
              </PremiumPressable>
            </View>
            
            <RNCalendar
              markingType={'period'}
              markedDates={markedDates}
              onDayPress={handleDateSelect}
              minDate={new Date().toISOString().split('T')[0]}
              theme={{
                backgroundColor: 'transparent',
                calendarBackground: 'transparent',
                textSectionTitleColor: LuxuryColors.textMuted,
                selectedDayBackgroundColor: LuxuryColors.accent,
                selectedDayTextColor: LuxuryColors.background,
                todayTextColor: LuxuryColors.accent,
                dayTextColor: '#FFF',
                textDisabledColor: 'rgba(255,255,255,0.1)',
                dotColor: LuxuryColors.accent,
                monthTextColor: '#FFF',
                indicatorColor: LuxuryColors.accent,
                textDayFontFamily: 'System',
                textMonthFontFamily: 'System',
                textDayHeaderFontFamily: 'System',
                textDayFontWeight: '400',
                textMonthFontWeight: 'bold',
                textDayHeaderFontWeight: '600',
                textDayFontSize: 14,
                textMonthFontSize: 16,
                textDayHeaderFontSize: 12,
              }}
              style={styles.calendarStyles}
            />

            <View style={styles.calendarFooter}>
              <View>
                <Text style={styles.footerLabel}>Duration</Text>
                <Text style={styles.footerValue}>{days || 0} Days</Text>
              </View>
              <PremiumPressable 
                onPress={() => setShowCalendarModal(false)}
                style={styles.confirmBtn}
              >
                <Text style={styles.confirmBtnText}>Confirm</Text>
              </PremiumPressable>
            </View>
          </GlassCard>
        </View>
      )}
      {/* CUSTOM LUXURY MODAL */}
      <LuxuryModal
        visible={modalConfig.visible}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        cancelText={modalConfig.cancelText}
        onConfirm={modalConfig.onConfirm || (() => setModalConfig(prev => ({ ...prev, visible: false })))}
        onCancel={() => setModalConfig(prev => ({ ...prev, visible: false }))}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LuxuryColors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: LuxuryColors.background,
  },
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    paddingTop: 50,
    alignItems: 'center',
    zIndex: 100,
  },
  headerTitle: {
    ...LuxuryTypography.bodySemibold,
    color: '#FFF',
  },
  backBtn: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 110,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(2, 6, 23, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 60,
  },
  imageWrapper: {
    height: IMAGE_HEIGHT,
    width: width,
  },
  mainImage: {
    width: width,
    height: IMAGE_HEIGHT,
  },
  pagination: {
    position: 'absolute',
    bottom: 60,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  activeDot: {
    width: 20,
    backgroundColor: LuxuryColors.accent,
  },
  expandBtn: {
    position: 'absolute',
    bottom: 60,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(2, 6, 23, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20,
    marginTop: -25,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  brandSubtitle: {
    ...LuxuryTypography.tiny,
    color: LuxuryColors.accent,
    marginBottom: 4,
  },
  modelTitle: {
    ...LuxuryTypography.titleL,
    color: '#FFF',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: LuxuryRadius.full,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  ratingText: {
    ...LuxuryTypography.bodySemibold,
    color: LuxuryColors.accent,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 24,
  },
  locationText: {
    ...LuxuryTypography.caption,
    color: LuxuryColors.textMuted,
  },
  specsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  specBox: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 6,
  },
  specLabel: {
    ...LuxuryTypography.bodySemibold,
    fontSize: 14,
    color: '#FFF',
    marginTop: 4,
  },
  specSub: {
    fontSize: 10,
    color: LuxuryColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: LuxuryColors.border,
  },
  tabItem: {
    paddingVertical: 12,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: LuxuryColors.accent,
  },
  tabText: {
    ...LuxuryTypography.bodySemibold,
    color: LuxuryColors.textMuted,
  },
  tabTextActive: {
    color: '#FFF',
  },
  detailsList: {
    paddingVertical: 10,
  },
  description: {
    ...LuxuryTypography.body,
    color: LuxuryColors.textSecondary,
    lineHeight: 24,
    marginBottom: 32,
  },
  bookingCard: {
    padding: 24,
    marginBottom: 32,
  },
  pricingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  perDayLabel: {
    ...LuxuryTypography.caption,
    color: LuxuryColors.textMuted,
  },
  mainPrice: {
    ...LuxuryTypography.titleL,
    color: LuxuryColors.accentStrong,
  },
  dateSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: LuxuryRadius.md,
    borderWidth: 1,
    borderColor: LuxuryColors.border,
    marginBottom: 20,
  },
  dateField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  dateLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: LuxuryColors.textMuted,
    letterSpacing: 1,
  },
  dateValue: {
    ...LuxuryTypography.bodySemibold,
    fontSize: 14,
    color: '#FFF',
  },
  verticalDivider: {
    width: 1,
    backgroundColor: LuxuryColors.border,
  },
  totalCalc: {
    paddingTop: 16,
    gap: 12,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calcLabel: {
    ...LuxuryTypography.body,
    color: LuxuryColors.textSecondary,
  },
  calcValue: {
    ...LuxuryTypography.bodySemibold,
    color: '#FFF',
  },
  finalDivider: {
    height: 1,
    backgroundColor: LuxuryColors.border,
    marginVertical: 4,
  },
  totalLabel: {
    ...LuxuryTypography.titleM,
    color: '#FFF',
  },
  totalValue: {
    ...LuxuryTypography.titleM,
    color: LuxuryColors.accentStrong,
  },
  reserveBtn: {
    marginTop: 24,
    backgroundColor: LuxuryColors.accent,
    height: 60,
    borderRadius: LuxuryRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  reserveBtnText: {
    ...LuxuryTypography.bodySemibold,
    fontWeight: '800',
    color: LuxuryColors.background,
    letterSpacing: 1,
  },
  sectionTitle: {
    ...LuxuryTypography.titleM,
    color: '#FFF',
    marginBottom: 16,
  },
  addonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  addonPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LuxuryColors.card,
    borderWidth: 1,
    borderColor: LuxuryColors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: LuxuryRadius.full,
    gap: 8,
  },
  addonPillActive: {
    backgroundColor: LuxuryColors.accent,
    borderColor: LuxuryColors.accent,
  },
  addonName: {
    ...LuxuryTypography.caption,
    fontWeight: '600',
    color: LuxuryColors.textPrimary,
  },
  addonNameActive: {
    color: LuxuryColors.background,
  },
  addonPrice: {
    fontSize: 10,
    color: LuxuryColors.textMuted,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  calendarCard: {
    width: width * 0.9,
    padding: 20,
    borderRadius: LuxuryRadius.xl,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    ...LuxuryTypography.titleM,
    color: '#FFF',
  },
  calendarStyles: {
    borderRadius: LuxuryRadius.md,
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: 10,
  },
  calendarFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: LuxuryColors.border,
  },
  footerLabel: {
    ...LuxuryTypography.tiny,
    color: LuxuryColors.textMuted,
  },
  footerValue: {
    ...LuxuryTypography.bodySemibold,
    color: LuxuryColors.accent,
  },
  confirmBtn: {
    backgroundColor: LuxuryColors.accent,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: LuxuryRadius.full,
  },
  confirmBtnText: {
    ...LuxuryTypography.bodySemibold,
    color: LuxuryColors.background,
  },
  insuranceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: LuxuryRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  insuranceText: {
    ...LuxuryTypography.tiny,
    color: LuxuryColors.success,
    fontSize: 9,
    textTransform: 'none',
  },
  // Review Styles
  reviewStatsCard: {
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  reviewStatsLeft: {
    alignItems: 'center',
    gap: 8,
  },
  reviewAvgNumber: {
    ...LuxuryTypography.titleXL,
    color: LuxuryColors.accent,
    fontSize: 48,
  },
  reviewStarsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  reviewCountText: {
    ...LuxuryTypography.caption,
    color: LuxuryColors.textMuted,
    marginTop: 4,
  },
  writeReviewCard: {
    padding: 20,
    gap: 16,
    marginBottom: 20,
  },
  writeReviewTitle: {
    ...LuxuryTypography.bodySemibold,
    color: '#FFF',
  },
  reviewInput: {
    ...LuxuryTypography.body,
    color: '#FFF',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: LuxuryRadius.md,
    borderWidth: 1,
    borderColor: LuxuryColors.border,
    padding: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitReviewBtn: {
    backgroundColor: LuxuryColors.accent,
    height: 48,
    borderRadius: LuxuryRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitReviewText: {
    ...LuxuryTypography.bodySemibold,
    color: LuxuryColors.background,
    letterSpacing: 1,
  },
  noReviewsBox: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  noReviewsText: {
    ...LuxuryTypography.body,
    color: LuxuryColors.textMuted,
  },
  reviewCard: {
    padding: 20,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewUserName: {
    ...LuxuryTypography.bodySemibold,
    color: '#FFF',
    fontSize: 14,
  },
  reviewDate: {
    ...LuxuryTypography.tiny,
    color: LuxuryColors.textMuted,
    fontSize: 10,
    textTransform: 'none',
    letterSpacing: 0,
  },
  reviewComment: {
    ...LuxuryTypography.body,
    color: LuxuryColors.textSecondary,
    lineHeight: 22,
  },
  // Specs Tab Styles
  specsGrid: {
    paddingVertical: 10,
    gap: 16,
  },
  specRow: {
    flexDirection: 'row',
    gap: 16,
  },
  specItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 16,
    borderRadius: LuxuryRadius.md,
    borderWidth: 1,
    borderColor: LuxuryColors.border,
  },
  specItemLabel: {
    ...LuxuryTypography.tiny,
    color: LuxuryColors.textMuted,
    fontSize: 8,
  },
  specItemValue: {
    ...LuxuryTypography.bodySemibold,
    color: '#FFF',
    fontSize: 13,
  },
});

export default CarDetailScreen;
