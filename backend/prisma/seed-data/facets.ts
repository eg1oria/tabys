/** Перенос filterGroups из frontend/src/lib/content/categories.ts. */
export type FacetGroupSeed = {
  key: string;
  title: string;
  singleSelect: boolean;
  values: { value: string; label: string }[];
};

export const facetGroups: FacetGroupSeed[] = [
  {
    key: 'type',
    title: 'Тип оборудования',
    // У категории ровно одно значение типа — остальные группы множественные.
    singleSelect: true,
    values: [
      { value: 'tanks', label: 'Ёмкости и резервуары' },
      { value: 'thermal', label: 'Тепловое оборудование' },
      { value: 'processing', label: 'Технологические установки' },
      { value: 'components', label: 'Комплектующие' },
    ],
  },
  {
    key: 'volume',
    title: 'Объём, л',
    singleSelect: false,
    values: [
      { value: 'do-100', label: 'до 100' },
      { value: '100-1000', label: '100 – 1 000' },
      { value: '1000-5000', label: '1 000 – 5 000' },
      { value: '5000+', label: 'более 5 000' },
    ],
  },
  {
    key: 'productivity',
    title: 'Производительность',
    singleSelect: false,
    values: [
      { value: 'low', label: 'до 1 000 л/ч' },
      { value: 'mid', label: '1 000 – 5 000 л/ч' },
      { value: 'high', label: 'более 5 000 л/ч' },
    ],
  },
  {
    key: 'material',
    title: 'Материал',
    singleSelect: false,
    values: [
      { value: 'aisi304', label: 'Нержавеющая сталь AISI 304' },
      { value: 'aisi316', label: 'Нержавеющая сталь AISI 316' },
      { value: 'keramika', label: 'Керамика / карбид кремния' },
    ],
  },
  {
    key: 'application',
    title: 'Сфера применения',
    singleSelect: false,
    values: [
      { value: 'moloko', label: 'Молочная продукция' },
      { value: 'syr', label: 'Сыроделие' },
      { value: 'tvorog', label: 'Творог' },
      { value: 'napitki', label: 'Напитки' },
      { value: 'drugoe', label: 'Другие пищевые продукты' },
    ],
  },
];
