import AsyncStorage from '@react-native-async-storage/async-storage';

export const storeUser = async (user: any) => {
  await AsyncStorage.setItem('user', JSON.stringify(user));
};

export const getStoredUser = async () => {
  const stored = await AsyncStorage.getItem('user');
  return stored ? JSON.parse(stored) : null;
};

export const clearUser = async () => {
  await AsyncStorage.removeItem('user');
};
