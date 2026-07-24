import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/src/components/buttons';
import { Screen } from '@/src/components/screen';
import { StoryCard } from '@/src/components/story-card';
import { palette } from '@/src/constants/theme';
import { useApp } from '@/src/context/app-context';
import { stories } from '@/src/data/stories';

/**
 * Показывает только сказки, которые пользователь отметил сердечком.
 * Если список пуст, предлагает перейти в каталог.
 */
export default function FavoritesScreen() {
  const { favorites, t } = useApp();
  const items = stories.filter((story) => favorites.includes(story.id));

  return (
    <Screen>
      <Text style={styles.title}>{t('favorites')}</Text>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, !items.length && styles.emptyList]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <StoryCard story={item} horizontal />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.iconWrap}>
              <Ionicons name="heart-outline" size={48} color={palette.purple} />
            </View>
            <Text style={styles.emptyTitle}>{t('emptyFavorites')}</Text>
            <Text style={styles.emptyText}>{t('emptyFavoritesText')}</Text>
            <PrimaryButton
              label={t('goCatalog')}
              icon="library-outline"
              onPress={() => router.push('/catalog')}
            />
          </View>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: palette.text,
    fontSize: 30,
    fontWeight: '900',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 18,
  },
  list: {
    paddingHorizontal: 18,
    paddingBottom: 150,
  },
  emptyList: {
    flexGrow: 1,
  },
  separator: {
    height: 13,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingBottom: 80,
    gap: 13,
  },
  iconWrap: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEE8F8',
    marginBottom: 5,
  },
  emptyTitle: {
    color: palette.text,
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '900',
    textAlign: 'center',
  },
  emptyText: {
    color: palette.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 9,
  },
});
