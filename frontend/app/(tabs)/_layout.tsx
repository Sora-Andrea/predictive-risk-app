import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  const colorScheme = useColorScheme();
 const isMobile = Platform.OS === 'android' || Platform.OS === 'ios';
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => <Ionicons size={28} name={ focused ? 'home' : 'home-outline'} color={color} />,
        }}
      />
      
      <Tabs.Screen
        name="camera"
        options={{
          href: isMobile ? '/camera' : null,
          title: "Camera Scan", 
          tabBarIcon: ({ color,focused }) => <Ionicons size={28} name={focused ? 'camera' : 'camera-outline'} color={color} />,
        }}
      />

      
      <Tabs.Screen 
        name="risk" 
        options={{
          title: "Risk", 
          tabBarIcon: ({ color,focused }) => <Ionicons size={28} name={focused ? 'heart' : 'heart-outline'} color={color} />,
        }} 
      />
    </Tabs>
  );
}
