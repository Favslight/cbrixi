import AsyncStorage from '@react-native-async-storage/async-storage';

const keys = {
  onboardingSeen: 'cbrixi.onboardingSeen',
  userToken: 'cbrixi.userToken',
  adminToken: 'cbrixi.adminToken',
  userData: 'cbrixi.userData',
  adminName: 'cbrixi.adminName',
  favoriteProducts: 'cbrixi.favoriteProducts',
};

export const storage = {
  keys,
  getString: (key: string) => AsyncStorage.getItem(key),
  setString: (key: string, value: string) => AsyncStorage.setItem(key, value),
  remove: (key: string) => AsyncStorage.removeItem(key),
  multiRemove: (entries: string[]) => AsyncStorage.multiRemove(entries),
};
