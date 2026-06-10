import { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBackground } from '../components/AppBackground';
import { PrimaryButton } from '../components/PrimaryButton';
import { onboardingSlides } from '../constants/onboarding';
import { colors } from '../constants/theme';
import { storage } from '../services/storage';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const { width } = Dimensions.get('window');

export function OnboardingScreen({ navigation }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const listRef = useRef<FlatList>(null);

  const onMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(nextIndex);
  };

  const finishOnboarding = async () => {
    await storage.setString(storage.keys.onboardingSeen, 'true');
    navigation.replace('Login');
  };

  const nextSlide = async () => {
    if (currentIndex === onboardingSlides.length - 1) {
      await finishOnboarding();
      return;
    }

    listRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    setCurrentIndex((prev) => prev + 1);
  };

  return (
    <AppBackground>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerRow}>
          <Pressable onPress={finishOnboarding}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>

        <FlatList
          ref={listRef}
          data={onboardingSlides}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onMomentumScrollEnd}
          renderItem={({ item }) => (
            <View style={styles.slide}>
              <Image source={item.image} resizeMode="contain" style={styles.image} />
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle}>{item.subtitle}</Text>
            </View>
          )}
        />

        <View style={styles.bottomArea}>
          <View style={styles.dotsRow}>
            {onboardingSlides.map((slide, index) => (
              <View
                key={slide.id}
                style={[styles.dot, currentIndex === index ? styles.dotActive : styles.dotInactive]}
              />
            ))}
          </View>

          <PrimaryButton
            label={currentIndex === onboardingSlides.length - 1 ? 'Get Started' : 'Next'}
            onPress={nextSlide}
          />
        </View>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerRow: {
    alignItems: 'flex-end',
    paddingHorizontal: 22,
    paddingTop: 6,
  },
  skipText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  slide: {
    width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 26,
    gap: 14,
  },
  image: {
    width: width * 0.72,
    height: width * 0.72,
    marginBottom: 10,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 35,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    maxWidth: 310,
    lineHeight: 24,
  },
  bottomArea: {
    paddingHorizontal: 22,
    paddingBottom: 24,
    gap: 20,
  },
  dotsRow: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 8,
  },
  dot: {
    borderRadius: 999,
    height: 7,
  },
  dotActive: {
    width: 20,
    backgroundColor: colors.primary,
  },
  dotInactive: {
    width: 7,
    backgroundColor: 'rgba(148,163,184,0.5)',
  },
});
