import React, { useEffect, useState, useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Dimensions,
  StatusBar,
  TextInput,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  interpolate,
  Extrapolate,
  FadeInDown,
  FadeInRight,
} from 'react-native-reanimated';
import {
  Search,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  Zap,
  Globe,
  Trophy,
  Flame,
  Star as StarIcon,
  Sparkles,
} from 'lucide-react-native';

import {
  LuxuryColors,
  LuxurySpacing,
  LuxuryTypography,
  LuxuryRadius,
} from '@/constants/luxuryTheme';
import { getCarsAPI } from '@/services/api';
import CarCard from '@/components/CarCard';
import GlassCard from '@/components/GlassCard';
import { PremiumPressable } from '@/components/PremiumPressable';
import { CarCardSkeleton } from '@/components/Skeleton';

const { width, height } = Dimensions.get('window');
const HERO_HEIGHT = height * 0.45;

const categories = [
  { id: 'all', label: 'All Fleet', icon: <Globe size={18} /> },
  { id: 'electric', label: 'Electric', icon: <Zap size={18} /> },
  { id: 'luxury', label: 'Luxury', icon: <Trophy size={18} /> },
  { id: 'sport', label: 'Sport', icon: <Flame size={18} /> },
];

const HomeScreen = () => {
  const router = useRouter();
  const [recommended, setRecommended] = useState<any[]>([]);
  const [featured, setFeatured] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [carsRes] = await Promise.all([getCarsAPI()]);
        const cars = Array.isArray(carsRes.data) ? carsRes.data : (carsRes.data?.data || []);
        setRecommended(cars.slice(2, 6));
        setFeatured(cars.slice(0, 3));
      } catch (error) {
        console.error('Home data load error:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const heroAnimatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(scrollY.value, [-HERO_HEIGHT, 0, HERO_HEIGHT], [-HERO_HEIGHT / 2, 0, HERO_HEIGHT * 0.75], Extrapolate.CLAMP);
    const scale = interpolate(scrollY.value, [-HERO_HEIGHT, 0, HERO_HEIGHT], [1.2, 1, 1], Extrapolate.CLAMP);
    return { transform: [{ translateY }, { scale }] };
  });

  const headerAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [0, HERO_HEIGHT * 0.1], [1, 0], Extrapolate.CLAMP);
    return { opacity };
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* CINEMATIC HERO */}
        <View style={styles.heroContainer}>
          <Animated.View style={[styles.heroBackground, heroAnimatedStyle]}>
            <Video
              source={{ uri: 'https://assets.mixkit.co/videos/52427/52427-720.mp4' }}
              style={StyleSheet.absoluteFill}
              shouldPlay
              isLooping
              isMuted
              resizeMode={ResizeMode.COVER}
            />
            <LinearGradient
              colors={['transparent', 'rgba(2, 6, 23, 0.4)', 'rgba(2, 6, 23, 1)']}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>

          <Animated.View style={[styles.heroContent, headerAnimatedStyle]}>
            <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.badge}>
              <StarIcon size={12} color={LuxuryColors.accent} fill={LuxuryColors.accent} />
              <Text style={styles.badgeText}>ELITE SELECTION</Text>
            </Animated.View>
            <Animated.Text entering={FadeInDown.delay(400).springify()} style={styles.heroTitle}>
              Beyond{"\n"}Standard.
            </Animated.Text>
            <Animated.Text entering={FadeInDown.delay(500).springify()} style={styles.heroSubtitle}>
              Access the world's most prestigious fleet with concierge delivery.
            </Animated.Text>
          </Animated.View>
        </View>

        {/* SEARCH & DISCOVERY */}
        <Animated.View entering={FadeInDown.delay(600).springify()} style={styles.searchOverlay}>
          <GlassCard style={styles.searchCard}>
            <View style={styles.searchRow}>
              <Search size={22} color={LuxuryColors.accent} />
              <View style={styles.divider} />
              <View style={{ flex: 1 }}>
                <Text style={styles.searchLabel}>DISCOVER</Text>
                <TextInput 
                  placeholder="Find your next icon..." 
                  placeholderTextColor={LuxuryColors.textMuted}
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={(text) => setSearchQuery(text)}
                  onSubmitEditing={() => router.push({ pathname: '/cars' as any, params: { search: searchQuery } })}
                />
              </View>
              <PremiumPressable withHaptics style={styles.filterBtn}>
                <SlidersHorizontal size={18} color={LuxuryColors.background} />
              </PremiumPressable>
            </View>
          </GlassCard>
        </Animated.View>

        {/* CATEGORY SELECTOR */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {categories.map((cat, i) => (
            <Animated.View key={cat.id} entering={FadeInRight.delay(700 + i * 100).springify()}>
              <PremiumPressable 
                onPress={() => {
                  setActiveCategory(cat.id);
                  router.push({ pathname: '/cars' as any, params: { type: cat.id === 'all' ? 'All' : cat.label } });
                }}
                style={[
                  styles.categoryBtn, 
                  activeCategory === cat.id && styles.categoryBtnActive
                ]}
              >
                {React.cloneElement(cat.icon as any, { 
                  color: activeCategory === cat.id ? LuxuryColors.background : LuxuryColors.textSecondary 
                })}
                <Text style={[
                  styles.categoryText, 
                  activeCategory === cat.id && styles.categoryTextActive
                ]}>{cat.label}</Text>
              </PremiumPressable>
            </Animated.View>
          ))}
        </ScrollView>

        <View style={styles.mainContent}>
          {/* FEATURED SNAP CAROUSEL */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Fleet</Text>
            <ChevronRight size={20} color={LuxuryColors.accent} />
          </View>
          
          <ScrollView 
            horizontal 
            pagingEnabled 
            snapToInterval={width * 0.85 + 20}
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredScroll}
          >
            {loading ? [1].map((_, i) => <View key={i} style={styles.featuredLoader} />) : 
              featured.map((car, i) => (
                <PremiumPressable 
                  key={car._id}
                  onPress={() => router.push(`/car/${car._id}`)}
                  style={styles.featuredCard}
                >
                  <Image source={{ uri: car.imageUrl }} style={styles.featuredImg} />
                  <LinearGradient 
                    colors={['transparent', 'rgba(0,0,0,0.8)']} 
                    style={StyleSheet.absoluteFill} 
                  />
                  <View style={styles.featuredInfo}>
                    <Text style={styles.featuredBrand}>{car.brand}</Text>
                    <Text style={styles.featuredName}>{car.model}</Text>
                    <View style={styles.featuredMeta}>
                      <Text style={styles.featuredPrice}>${car.pricePerDay}/day</Text>
                      <View style={styles.featuredRating}>
                        <StarIcon size={12} color={LuxuryColors.accent} fill={LuxuryColors.accent} />
                        <Text style={styles.ratingValue}>{car.rating}</Text>
                      </View>
                    </View>
                  </View>
                </PremiumPressable>
              ))
            }
          </ScrollView>

          {/* CURATED LIST */}
          <View style={[styles.sectionHeader, { marginTop: 32 }]}>
            <View>
              <Text style={styles.sectionTitle}>Curated For You</Text>
              <Text style={styles.sectionSubtitle}>Top picks based on elite performance</Text>
            </View>
            <PremiumPressable onPress={() => router.push('/cars')}>
              <Text style={styles.viewAllBtn}>View all</Text>
            </PremiumPressable>
          </View>

          {loading ? (
            <View style={{ marginTop: 10 }}>
              <CarCardSkeleton />
              <CarCardSkeleton />
            </View>
          ) : (
            recommended.map((car, index) => (
              <Animated.View 
                key={car._id} 
                entering={FadeInDown.delay(index * 100).duration(600).springify()}
              >
                <CarCard 
                  car={car} 
                  onPress={() => router.push(`/car/${car._id}`)} 
                />
              </Animated.View>
            ))
          )}

          {/* ELITE CLUB CARD */}
          <PremiumPressable onPress={() => router.push('/ai-chat')}>
            <LinearGradient
              colors={[LuxuryColors.accentSoft, 'rgba(2,6,23,0.5)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.eliteCard}
            >
              <View style={styles.eliteIconBg}>
                <Sparkles size={28} color={LuxuryColors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.eliteTitle}>Elite AI Concierge</Text>
                <Text style={styles.eliteBody}>Ask anything about our fleet or your upcoming journey.</Text>
              </View>
              <View style={styles.eliteArrow}>
                <ChevronRight size={20} color={LuxuryColors.background} />
              </View>
            </LinearGradient>
          </PremiumPressable>
        </View>
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LuxuryColors.background,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  heroContainer: {
    height: HERO_HEIGHT,
    overflow: 'hidden',
  },
  heroBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  heroContent: {
    position: 'absolute',
    bottom: 60,
    left: 24,
    right: 24,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: LuxuryRadius.full,
    alignSelf: 'flex-start',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  badgeText: {
    ...LuxuryTypography.tiny,
    color: '#FFF',
    fontSize: 10,
  },
  heroTitle: {
    ...LuxuryTypography.titleXL,
    color: '#FFFFFF',
    marginBottom: 16,
    lineHeight: 48,
  },
  heroSubtitle: {
    ...LuxuryTypography.body,
    color: 'rgba(248, 250, 252, 0.65)',
    maxWidth: '85%',
  },
  searchOverlay: {
    marginTop: -45,
    paddingHorizontal: 24,
  },
  searchCard: {
    padding: 10,
    paddingLeft: 22,
    borderRadius: LuxuryRadius.xl,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  searchLabel: {
    ...LuxuryTypography.tiny,
    color: LuxuryColors.accent,
    fontSize: 8,
    marginBottom: 0,
  },
  searchInput: {
    ...LuxuryTypography.bodySemibold,
    color: '#FFF',
    height: 38,
    padding: 0,
  },
  filterBtn: {
    backgroundColor: LuxuryColors.accent,
    padding: 12,
    borderRadius: LuxuryRadius.md,
  },
  categoryScroll: {
    paddingHorizontal: 24,
    gap: 12,
    marginTop: 24,
    paddingBottom: 4,
  },
  categoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: LuxuryColors.card,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: LuxuryRadius.full,
    borderWidth: 1,
    borderColor: LuxuryColors.border,
  },
  categoryBtnActive: {
    backgroundColor: LuxuryColors.accent,
    borderColor: LuxuryColors.accent,
  },
  categoryText: {
    ...LuxuryTypography.bodySemibold,
    color: LuxuryColors.textSecondary,
    fontSize: 14,
  },
  categoryTextActive: {
    color: LuxuryColors.background,
  },
  mainContent: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    ...LuxuryTypography.titleM,
    color: '#FFF',
    letterSpacing: -0.5,
  },
  sectionSubtitle: {
    ...LuxuryTypography.caption,
    color: LuxuryColors.textMuted,
    marginTop: 4,
  },
  viewAllBtn: {
    ...LuxuryTypography.caption,
    color: LuxuryColors.accent,
    fontWeight: '700',
  },
  featuredScroll: {
    gap: 20,
    paddingRight: 24,
  },
  featuredCard: {
    width: width * 0.85,
    height: 220,
    borderRadius: LuxuryRadius.xl,
    overflow: 'hidden',
    backgroundColor: LuxuryColors.card,
  },
  featuredImg: {
    ...StyleSheet.absoluteFillObject,
  },
  featuredInfo: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  featuredBrand: {
    ...LuxuryTypography.tiny,
    color: LuxuryColors.accent,
    fontSize: 10,
    marginBottom: 4,
  },
  featuredName: {
    ...LuxuryTypography.titleM,
    color: '#FFF',
    marginBottom: 8,
  },
  featuredMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featuredPrice: {
    ...LuxuryTypography.bodySemibold,
    color: 'rgba(255,255,255,0.9)',
    fontSize: 15,
  },
  featuredRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: LuxuryRadius.full,
  },
  ratingValue: {
    ...LuxuryTypography.tiny,
    color: '#FFF',
    fontSize: 10,
  },
  featuredLoader: {
    width: width * 0.85,
    height: 220,
    borderRadius: LuxuryRadius.xl,
    backgroundColor: LuxuryColors.cardStrong,
  },
  eliteCard: {
    marginTop: 40,
    padding: 24,
    borderRadius: LuxuryRadius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.2)',
  },
  eliteIconBg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eliteTitle: {
    ...LuxuryTypography.titleM,
    color: '#FFF',
    fontSize: 18,
    marginBottom: 4,
  },
  eliteBody: {
    ...LuxuryTypography.caption,
    color: LuxuryColors.textSecondary,
    fontSize: 12,
  },
  eliteArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: LuxuryColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default HomeScreen;
