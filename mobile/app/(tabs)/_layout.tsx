import { Tabs } from 'expo-router';
import React from 'react';
import { BlurView } from 'expo-blur';
import { StyleSheet, Platform } from 'react-native';
import { Home, Car, CalendarRange, User } from 'lucide-react-native';

import { LuxuryColors, LuxuryRadius } from '@/constants/luxuryTheme';
import FloatingAIButton from '@/components/FloatingAIButton';

export default function TabLayout() {
  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: LuxuryColors.accent,
          tabBarInactiveTintColor: 'rgba(255,255,255,0.4)',
          headerShown: false,
          tabBarStyle: {
            position: 'absolute',
            bottom: 24,
            left: 20,
            right: 20,
            height: 64,
            backgroundColor: Platform.OS === 'ios' ? 'transparent' : 'rgba(15, 23, 42, 0.95)',
            borderRadius: 32,
            borderTopWidth: 0,
            paddingBottom: 0,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.1)',
            boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.3)',
            elevation: 10,
          },
          tabBarBackground: () => (
            Platform.OS === 'ios' ? (
              <BlurView 
                tint="dark" 
                intensity={80} 
                style={{ ...StyleSheet.absoluteFillObject, borderRadius: 32, overflow: 'hidden' }} 
              />
            ) : null
          ),
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '700',
            marginBottom: 4,
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'ELITE',
            tabBarIcon: ({ color, size }) => <Home size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="cars"
          options={{
            title: 'FLEET',
            tabBarIcon: ({ color, size }) => <Car size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="bookings"
          options={{
            title: 'JOURNEYS',
            tabBarIcon: ({ color, size }) => <CalendarRange size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'PROFILE',
            tabBarIcon: ({ color, size }) => <User size={22} color={color} />,
          }}
        />
      </Tabs>
      <FloatingAIButton />
    </>
  );
}
