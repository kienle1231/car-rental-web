import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  User, 
  Settings, 
  LogOut, 
  ShieldCheck, 
  ChevronRight,
  CreditCard,
  Bell,
  HelpCircle
} from 'lucide-react-native';
import { LuxuryColors, LuxurySpacing, LuxuryTypography, LuxuryRadius } from '@/constants/luxuryTheme';
import { PremiumPressable } from '@/components/PremiumPressable';
import GlassCard from '@/components/GlassCard';
import LuxuryModal from '@/components/LuxuryModal';

const ProfileScreen = () => {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const stored = await AsyncStorage.getItem('user');
      if (stored) {
        setUser(JSON.parse(stored));
      } else {
        router.replace('/login');
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    setLogoutModalVisible(false);
    router.replace('/login');
  };

  const ProfileItem = ({ icon: Icon, label, onPress, color = LuxuryColors.textSecondary, isLast = false }: any) => (
    <PremiumPressable 
      onPress={onPress}
      style={[styles.profileItem, isLast && { borderBottomWidth: 0 }]}
    >
      <View style={styles.itemLeft}>
        <View style={[styles.iconBox, { backgroundColor: 'rgba(255,255,255,0.03)' }]}>
          <Icon size={20} color={color === LuxuryColors.textSecondary ? LuxuryColors.accent : color} />
        </View>
        <Text style={[styles.itemLabel, { color }]}>{label}</Text>
      </View>
      <ChevronRight size={18} color="rgba(255,255,255,0.2)" />
    </PremiumPressable>
  );

  if (!user) return <View style={styles.container} />;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.avatarWrapper}>
          <View style={styles.avatarGradient}>
            <Image 
              source={{ uri: `https://ui-avatars.com/api/?name=${user.name}&background=1e293b&color=D4AF37&size=200` }}
              style={styles.avatar} 
            />
          </View>
          <View style={styles.statusBadge}>
            <ShieldCheck size={12} color={LuxuryColors.background} />
          </View>
        </View>
        
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
        
        {user.role === 'admin' && (
          <GlassCard style={styles.adminBadge}>
            <ShieldCheck size={14} color={LuxuryColors.accent} />
            <Text style={styles.adminText}>ADMINISTRATOR</Text>
          </GlassCard>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ACCOUNT SETTINGS</Text>
        <GlassCard style={styles.menuCard}>
          <ProfileItem 
            icon={User} 
            label="Personal Information" 
            onPress={() => router.push('/profile/personal-info')} 
          />
          <ProfileItem 
            icon={CreditCard} 
            label="Payment Methods" 
            onPress={() => router.push('/profile/payment-methods')} 
          />
          <ProfileItem icon={Bell} label="Notifications" onPress={() => {}} />
          {user.role === 'admin' && (
            <ProfileItem 
              icon={Settings} 
              label="Admin Dashboard" 
              color={LuxuryColors.accent}
              onPress={() => router.push('/(admin)/dashboard')} 
            />
          )}
          <ProfileItem icon={Settings} label="Preferences" onPress={() => {}} isLast />
        </GlassCard>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SUPPORT</Text>
        <GlassCard style={styles.menuCard}>
          <ProfileItem icon={HelpCircle} label="Help Center" onPress={() => {}} />
          <ProfileItem icon={ShieldCheck} label="Privacy Policy" onPress={() => {}} isLast />
        </GlassCard>
      </View>

      <PremiumPressable 
        onPress={() => setLogoutModalVisible(true)}
        style={styles.logoutBtn}
      >
        <LogOut size={20} color={LuxuryColors.danger} />
        <Text style={styles.logoutText}>Sign Out from Elite</Text>
      </PremiumPressable>

      <View style={styles.footer}>
        <Text style={styles.versionText}>Elite Car Rental v1.0.4</Text>
        <Text style={styles.copyrightText}>© 2026 LUXURY HUB GLOBAL</Text>
      </View>

      <LuxuryModal
        visible={logoutModalVisible}
        type="warning"
        title="Sign Out"
        message="Are you sure you want to end your current session?"
        confirmText="Sign Out"
        cancelText="Stay Here"
        onConfirm={handleLogout}
        onCancel={() => setLogoutModalVisible(false)}
      />
      
      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LuxuryColors.background,
  },
  header: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 40,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 20,
  },
  avatarGradient: {
    padding: 3,
    borderRadius: 60,
    backgroundColor: LuxuryColors.accent,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    borderColor: LuxuryColors.background,
  },
  statusBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: LuxuryColors.accent,
    padding: 6,
    borderRadius: 15,
    borderWidth: 3,
    borderColor: LuxuryColors.background,
  },
  userName: {
    ...LuxuryTypography.titleM,
    color: '#FFF',
    marginBottom: 4,
  },
  userEmail: {
    ...LuxuryTypography.body,
    color: LuxuryColors.textMuted,
    marginBottom: 16,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    borderRadius: LuxuryRadius.full,
    borderColor: LuxuryColors.accentSoft,
  },
  adminText: {
    ...LuxuryTypography.caption,
    color: LuxuryColors.accent,
    fontWeight: '800',
    letterSpacing: 1,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    ...LuxuryTypography.caption,
    color: LuxuryColors.textMuted,
    fontWeight: '800',
    marginBottom: 12,
    marginLeft: 8,
    letterSpacing: 1.5,
  },
  menuCard: {
    padding: 4,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: {
    ...LuxuryTypography.bodySemibold,
    fontSize: 15,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginHorizontal: 20,
    borderRadius: LuxuryRadius.xl,
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.1)',
    gap: 12,
  },
  logoutText: {
    ...LuxuryTypography.bodySemibold,
    color: LuxuryColors.danger,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  versionText: {
    ...LuxuryTypography.caption,
    color: LuxuryColors.textMuted,
    marginBottom: 4,
  },
  copyrightText: {
    ...LuxuryTypography.caption,
    color: 'rgba(255,255,255,0.1)',
    fontSize: 9,
    fontWeight: '800',
  },
});

export default ProfileScreen;
