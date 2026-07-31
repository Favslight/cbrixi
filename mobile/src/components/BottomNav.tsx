import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { NavigationProp } from '@react-navigation/native';

import { colors } from '../constants/theme';
import type { RootStackParamList } from '../types/navigation';

type BottomNavRoute = 'Home' | 'Favorites' | 'Cart' | 'Orders' | 'Profile';

type BottomNavProps = {
  active: BottomNavRoute;
  navigation: NavigationProp<RootStackParamList>;
};

const tabs: {
  route: BottomNavRoute;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
}[] = [
  { route: 'Home', icon: 'home-outline', activeIcon: 'home-outline' },
  { route: 'Favorites', icon: 'heart-outline', activeIcon: 'heart-outline' },
  { route: 'Cart', icon: 'cart-outline', activeIcon: 'cart-outline' },
  { route: 'Orders', icon: 'receipt-outline', activeIcon: 'receipt-outline' },
  { route: 'Profile', icon: 'person-outline', activeIcon: 'person-outline' },
];

export function BottomNav({ active, navigation }: BottomNavProps) {
  return (
    <View style={styles.bottomNav}>
      {tabs.map((tab) => {
        const isActive = tab.route === active;
        return (
          <Pressable
            key={tab.route}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            onPress={() => {
              if (!isActive) navigation.navigate(tab.route);
            }}
            style={[styles.item, isActive && styles.itemActive]}
          >
            <View style={isActive ? styles.activeBubble : styles.inactiveBubble}>
              <Ionicons
                name={isActive ? tab.activeIcon : tab.icon}
                size={22}
                color={isActive ? colors.background : colors.textPrimary}
              />
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
    height: 78,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(10, 10, 10, 0.92)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOpacity: 0.34,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 16,
  },
  item: {
    width: 50,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemActive: {
    transform: [{ translateY: -24 }],
  },
  activeBubble: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  inactiveBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
