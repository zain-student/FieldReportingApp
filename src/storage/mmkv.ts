import { createMMKV } from 'react-native-mmkv';

export const appStorage = createMMKV({
  id: 'field-reporting-v1',
});
// Created this instance to reuse it throughout the app.
