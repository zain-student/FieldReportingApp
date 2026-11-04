import React, { useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  PermissionsAndroid,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  Asset,
  ImagePickerResponse,
  launchCamera,
  launchImageLibrary,
} from 'react-native-image-picker';

import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

const MAX_PHOTOS = 5;

type PhotoAsset = Asset & {
  uri: string;
};

export default function ComposeScreen() {
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<PhotoAsset[]>([]);

  const handlePickerResponse = (response: ImagePickerResponse) => {
    if (response.didCancel) {
      return;
    }

    if (response.errorCode) {
      Alert.alert(
        'Photo selection failed',
        response.errorMessage ?? response.errorCode,
      );
      return;
    }

    const selected = (response.assets ?? []).filter(
      (asset): asset is PhotoAsset => typeof asset.uri === 'string',
    );

    const remaining = MAX_PHOTOS - photos.length;

    if (selected.length > remaining) {
      Alert.alert(
        'Photo limit reached',
        'You can attach a maximum of five photographs.',
      );
    }

    setPhotos(current => [...current, ...selected].slice(0, MAX_PHOTOS));
  };

  const selectFromGallery = async () => {
    if (photos.length >= MAX_PHOTOS) {
      Alert.alert('Limit reached', 'Maximum five photographs.');
      return;
    }

    const response = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: MAX_PHOTOS - photos.length,
      quality: 1,
      includeBase64: false,
    });

    handlePickerResponse(response);
  };

  const requestCameraPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') {
      return true;
    }

    const permission = PermissionsAndroid.PERMISSIONS.CAMERA;

    const result = await PermissionsAndroid.request(permission);

    if (result === PermissionsAndroid.RESULTS.GRANTED) {
      return true;
    }

    const openSettings = result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN;

    Alert.alert(
      'Camera permission required',
      'Allow camera access to take inspection photographs.',
      [
        { text: 'Cancel', style: 'cancel' },
        ...(openSettings
          ? [
              {
                text: 'Open Settings',
                onPress: () => {
                  void Linking.openSettings();
                },
              },
            ]
          : []),
      ],
    );

    return false;
  };

  const takePhoto = async () => {
    if (photos.length >= MAX_PHOTOS) {
      Alert.alert('Limit reached', 'Maximum five photographs.');
      return;
    }

    const granted = await requestCameraPermission();

    if (!granted) {
      return;
    }

    const response = await launchCamera({
      mediaType: 'photo',
      quality: 1,
      saveToPhotos: false,
    });

    handlePickerResponse(response);
  };

  const removePhoto = (index: number) => {
    setPhotos(current => current.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!description.trim()) {
      Alert.alert('Description required');
      return;
    }

    if (photos.length === 0) {
      Alert.alert('Please attach at least one photograph.');
      return;
    }

    Alert.alert(
      'Not connected yet',
      'The local persistence service will be connected in the next implementation milestone. Nothing has been saved or uploaded.',
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>FIELD REPORTING</Text>
          <Text style={styles.title}>New report</Text>
          <Text style={styles.subtitle}>
            Document your inspection with photographs.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Description</Text>

          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Describe what you observed..."
            placeholderTextColor={colors.muted}
            style={styles.input}
            multiline
            maxLength={300}
            textAlignVertical="top"
          />

          <Text style={styles.characterCount}>
            {description.length}/300 characters
          </Text>

          <View style={styles.divider} />

          <View style={styles.photoHeader}>
            <Text style={styles.label}>Photographs</Text>
            <Text style={styles.counter}>
              {photos.length}/{MAX_PHOTOS}
            </Text>
          </View>

          <Text style={styles.helperText}>
            Attach between 1 and 5 photographs.
          </Text>

          <View style={styles.actionRow}>
            <Pressable
              style={styles.primaryButton}
              onPress={takePhoto}
              disabled={photos.length >= MAX_PHOTOS}
            >
              <Text style={styles.primaryButtonText}>Take photo</Text>
            </Pressable>

            <Pressable
              style={styles.secondaryButton}
              onPress={selectFromGallery}
              disabled={photos.length >= MAX_PHOTOS}
            >
              <Text style={styles.secondaryButtonText}>Choose gallery</Text>
            </Pressable>
          </View>

          {photos.length > 0 ? (
            <View style={styles.photoGrid}>
              {photos.map((photo, index) => (
                <View key={`${photo.uri}-${index}`} style={styles.photoItem}>
                  <Image
                    source={{ uri: photo.uri }}
                    style={styles.photoImage}
                  />

                  <Pressable
                    style={styles.removeButton}
                    onPress={() => removePhoto(index)}
                  >
                    <Text style={styles.removeText}>×</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyPhotos}>
              <Text style={styles.emptyTitle}>No photographs added</Text>
              <Text style={styles.helperText}>
                Take a photo or choose one from your gallery.
              </Text>
            </View>
          )}
        </View>

        <Pressable style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Submit report</Text>
        </Pressable>

        <Text style={styles.footerNote}>
          Reports will be saved locally before uploading.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: 20,
    paddingBottom: 35,
  },
  header: {
    marginBottom: 22,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  title: {
    fontSize: 27,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.secondaryText,
    marginTop: 6,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  input: {
    minHeight: 115,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 13,
    marginTop: 12,
    fontSize: 15,
    color: colors.text,
    backgroundColor: '#FAFBFC',
  },
  characterCount: {
    color: colors.secondaryText,
    fontSize: 11,
    textAlign: 'right',
    marginTop: 6,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 22,
  },
  photoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  counter: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  helperText: {
    color: colors.secondaryText,
    fontSize: 12,
    marginTop: 6,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  primaryButton: {
    flex: 1,
    minHeight: 46,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  secondaryButton: {
    flex: 1,
    minHeight: 46,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#EDF3FF',
  },
  secondaryButtonText: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  emptyPhotos: {
    marginTop: 18,
    padding: 24,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  emptyTitle: {
    fontWeight: '600',
    color: colors.text,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 18,
  },
  photoItem: {
    width: '30%',
    aspectRatio: 1,
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  removeButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: {
    color: '#FFFFFF',
    fontSize: 19,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    minHeight: 53,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  footerNote: {
    textAlign: 'center',
    color: colors.secondaryText,
    fontSize: 11,
    marginTop: 12,
  },
});
