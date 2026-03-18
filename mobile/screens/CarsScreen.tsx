import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
  StatusBar,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, {
  FadeInDown,
  Layout,
} from 'react-native-reanimated';
import { Search, SlidersHorizontal, X } from 'lucide-react-native';

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

const brands = ['Tesla', 'BMW', 'Mercedes', 'Audi', 'Lamborghini', 'Porsche', 'Toyota', 'Land Rover'];
const types = ['Sedan', 'SUV', 'Coupe', 'Electric', 'Supercar'];

const CarsScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [cars, setCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState((params.search as string) || '');
  const [selectedBrand, setSelectedBrand] = useState((params.brand as string) || 'All');
  const [selectedType, setSelectedType] = useState((params.type as string) || 'All');

  const loadCars = async (withRefresh = false) => {
    if (withRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const params: Record<string, string> = {};
      if (selectedBrand !== 'All') params.brand = selectedBrand;
      if (selectedType !== 'All') params.type = selectedType;
      if (search) params.search = search;
      
      const { data } = await getCarsAPI(params);
      setCars(Array.isArray(data) ? data : data?.data || []);
    } catch (error) {
      console.error('Cars fetch error:', error);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCars();
  }, [selectedBrand, selectedType, search]);

  const FilterPill = ({ label, selected, onPress }: any) => (
    <PremiumPressable 
      withHaptics 
      onPress={onPress}
      style={[styles.pill, selected && styles.pillActive]}
    >
      <Text style={[styles.pillText, selected && styles.pillTextActive]}>{label}</Text>
    </PremiumPressable>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Elite Fleet</Text>
        <Text style={styles.subtitle}>Handpicked collection of world-class vehicles</Text>
      </View>

      <View style={styles.searchContainer}>
        <GlassCard style={styles.searchBox}>
          <Search size={20} color={LuxuryColors.textMuted} />
          <TextInput
            placeholder="Search by brand, model..."
            placeholderTextColor={LuxuryColors.textMuted}
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => loadCars()}
          />
          {search.length > 0 && (
            <PremiumPressable onPress={() => { setSearch(''); loadCars(); }}>
              <X size={18} color={LuxuryColors.textMuted} />
            </PremiumPressable>
          )}
          <View style={styles.divider} />
          <PremiumPressable style={styles.filterBtn}>
            <SlidersHorizontal size={18} color={LuxuryColors.accent} />
          </PremiumPressable>
        </GlassCard>
      </View>

      <View style={styles.filtersWrapper}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={['All', ...brands]}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <FilterPill 
              label={item} 
              selected={selectedBrand === item} 
              onPress={() => setSelectedBrand(item)} 
            />
          )}
        />
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={['All', ...types]}
          keyExtractor={(item) => item}
          contentContainerStyle={[styles.filterList, { paddingTop: 0 }]}
          renderItem={({ item }) => (
            <FilterPill 
              label={item} 
              selected={selectedType === item} 
              onPress={() => setSelectedType(item)} 
            />
          )}
        />
      </View>

      <FlatList
        data={cars}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={5}
        windowSize={5}
        removeClippedSubviews={true}
        onRefresh={() => loadCars(true)}
        refreshing={refreshing}
        renderItem={({ item, index }) => (
          <Animated.View 
            layout={Layout.springify()}
            entering={FadeInDown.delay(index * 50).duration(500)}
          >
            <CarCard 
              car={item} 
              onPress={() => router.push(`/car/${item._id}`)} 
            />
          </Animated.View>
        )}
        ListEmptyComponent={
          loading ? (
            <View style={{ gap: 16 }}>
              <CarCardSkeleton />
              <CarCardSkeleton />
              <CarCardSkeleton />
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No premium vehicles match your criteria.</Text>
              <PremiumPressable 
                onPress={() => { setSelectedBrand('All'); setSelectedType('All'); setSearch(''); }}
                style={styles.resetBtn}
              >
                <Text style={styles.resetText}>Reset Filters</Text>
              </PremiumPressable>
            </View>
          )
        }
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
    paddingTop: 60,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    ...LuxuryTypography.titleL,
    color: '#FFF',
  },
  subtitle: {
    ...LuxuryTypography.caption,
    color: LuxuryColors.textMuted,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingLeft: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    ...LuxuryTypography.bodySemibold,
    color: '#FFF',
    fontSize: 15,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: LuxuryColors.border,
  },
  filterBtn: {
    padding: 4,
  },
  filtersWrapper: {
    marginBottom: 8,
  },
  filterList: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 10,
  },
  pill: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: LuxuryColors.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: LuxuryRadius.full,
  },
  pillActive: {
    backgroundColor: LuxuryColors.accentSoft,
    borderColor: LuxuryColors.accent,
  },
  pillText: {
    ...LuxuryTypography.caption,
    color: LuxuryColors.textSecondary,
    fontWeight: '600',
  },
  pillTextActive: {
    color: LuxuryColors.accent,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  emptyState: {
    paddingVertical: 100,
    alignItems: 'center',
  },
  emptyText: {
    ...LuxuryTypography.body,
    color: LuxuryColors.textMuted,
    textAlign: 'center',
  },
  resetBtn: {
    marginTop: 20,
  },
  resetText: {
    ...LuxuryTypography.bodySemibold,
    color: LuxuryColors.accent,
  },
});

export default CarsScreen;
