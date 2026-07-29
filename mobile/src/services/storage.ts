import AsyncStorage from '@react-native-async-storage/async-storage';

const keys = {
  onboardingSeen: 'cbrixi.onboardingSeen',
  userToken: 'cbrixi.userToken',
  adminToken: 'cbrixi.adminToken',
  userData: 'cbrixi.userData',
  adminName: 'cbrixi.adminName',
  favoriteProducts: 'cbrixi.favoriteProducts',
};

const memoryCache = new Map<string, string | null>();

export const storage = {
  keys,
  getString: async (key: string) => {
    if (memoryCache.has(key)) {
      return memoryCache.get(key) ?? null;
    }
    const value = await AsyncStorage.getItem(key);
    memoryCache.set(key, value);
    return value;
  },
  setString: async (key: string, value: string) => {
    memoryCache.set(key, value);
    await AsyncStorage.setItem(key, value);
  },
  multiSet: async (entries: Array<[string, string]>) => {
    entries.forEach(([key, value]) => memoryCache.set(key, value));
    await AsyncStorage.multiSet(entries);
  },
  remove: async (key: string) => {
    memoryCache.set(key, null);
    await AsyncStorage.removeItem(key);
  },
  multiRemove: async (entries: string[]) => {
    entries.forEach((key) => memoryCache.set(key, null));
    await AsyncStorage.multiRemove(entries);
  },
};
