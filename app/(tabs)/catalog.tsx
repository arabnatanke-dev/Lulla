import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import { PrimaryButton } from '@/src/components/buttons';
import { Screen } from '@/src/components/screen';
import { StoryCard } from '@/src/components/story-card';
import { radii, type ThemeColors } from '@/src/constants/theme';
import { useApp } from '@/src/context/app-context';
import { categoryLabels } from '@/src/data/copy';
import { stories } from '@/src/data/stories';
import type { CategoryId } from '@/src/types';

const categories: CategoryId[] = ['all', 'bedtime', 'adventures', 'magic', 'animals', 'lessons'];

/**
 * Показывает полный каталог, строку поиска и фильтры категорий.
 * Результаты пересчитываются сразу после изменения запроса или выбранной категории.
 */
export default function CatalogScreen() {
  const { width } = useWindowDimensions();
  const { language, t, colors: palette } = useApp();
  const styles = createStyles(palette);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryId>('all');

  // Фильтруем истории по категории, названию и описанию на текущем языке.
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase(language);
    return stories.filter((story) => {
      const matchesCategory = category === 'all' || story.categories.includes(category);
      const matchesQuery =
        !normalized ||
        story.title[language].toLocaleLowerCase(language).includes(normalized) ||
        story.description[language].toLocaleLowerCase(language).includes(normalized);
      return matchesCategory && matchesQuery;
    });
  }, [category, language, query]);

  const gap = 12;
  const cardWidth = Math.min(230, (width - 36 - gap) / 2);

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>{t('catalog')}</Text>
        <Text style={styles.count}>{filtered.length}</Text>
      </View>

      <View style={styles.search}>
        <Ionicons name="search" size={20} color={palette.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('search')}
          placeholderTextColor={palette.muted}
          returnKeyType="search"
          style={styles.input}
        />
        {query ? (
          <Pressable onPress={() => setQuery('')} hitSlop={8}>
            <Ionicons name="close-circle" size={20} color={palette.muted} />
          </Pressable>
        ) : null}
      </View>

      <FlatList
        horizontal
        data={categories}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
        style={styles.filterList}
        renderItem={({ item }) => {
          const selected = item === category;
          return (
            <Pressable
              onPress={() => setCategory(item)}
              style={[styles.filter, selected && styles.selectedFilter]}>
              <Text style={[styles.filterText, selected && styles.selectedFilterText]}>
                {categoryLabels[item][language]}
              </Text>
            </Pressable>
          );
        }}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <StoryCard story={item} style={{ width: cardWidth }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="book-outline" size={48} color={palette.lavender} />
            <Text style={styles.emptyTitle}>{t('nothingFound')}</Text>
            <PrimaryButton
              label={t('resetSearch')}
              variant="secondary"
              onPress={() => {
                setQuery('');
                setCategory('all');
              }}
            />
          </View>
        }
      />
    </Screen>
  );
}

/**
 * Создаёт стили каталога для активной цветовой темы.
 */
const createStyles = (palette: ThemeColors) => StyleSheet.create({
  header: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    color: palette.text,
    fontSize: 30,
    fontWeight: '900',
  },
  count: {
    color: palette.purple,
    backgroundColor: palette.iconBubble,
    fontSize: 13,
    fontWeight: '800',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
  },
  search: {
    marginHorizontal: 18,
    height: 50,
    borderRadius: radii.md,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.line,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  input: {
    flex: 1,
    color: palette.text,
    fontSize: 16,
  },
  filterList: {
    flexGrow: 0,
    minHeight: 67,
  },
  filters: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 8,
  },
  filter: {
    paddingHorizontal: 15,
    height: 39,
    borderRadius: radii.pill,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.line,
    justifyContent: 'center',
  },
  selectedFilter: {
    backgroundColor: palette.navy,
    borderColor: palette.navy,
  },
  filterText: {
    color: palette.muted,
    fontWeight: '700',
    fontSize: 13,
  },
  selectedFilterText: {
    color: palette.white,
  },
  grid: {
    paddingHorizontal: 18,
    paddingTop: 2,
    paddingBottom: 150,
  },
  row: {
    gap: 12,
    marginBottom: 13,
  },
  empty: {
    minHeight: 360,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    gap: 18,
  },
  emptyTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
});
