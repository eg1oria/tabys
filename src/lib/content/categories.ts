export type Category = {
  slug: string;
  title: string;
  /** Короткое имя для боковой панели каталога. */
  short: string;
  /** Число позиций в категории — как в макете. */
  count: number;
  description: string;
  image: string;
  /** Значения для фильтров каталога. */
  type: string;
  volume: string[];
  productivity: string[];
  material: string[];
  application: string[];
  /** Типовые позиции категории — показываем в карточке категории. */
  items: string[];
  /** Крупная карточка в блоке «Наше оборудование» на главной. */
  highlights?: string[];
};

export const categories: Category[] = [
  {
    slug: "emkosti-i-rezervuary",
    title: "Ёмкости и резервуары",
    short: "Ёмкости и резервуары",
    count: 8,
    description:
      "Производственные ёмкости, резервуары для хранения и технологических процессов",
    image: "/images/cat-tanks.jpg",
    type: "tanks",
    volume: ["100-1000", "1000-5000", "5000+"],
    productivity: ["low", "mid", "high"],
    material: ["aisi304", "aisi316"],
    application: ["moloko", "syr", "napitki", "drugoe"],
    highlights: [
      "Ёмкости пищевые",
      "Ёмкости производственные",
      "ЦКТ",
      "Ёмкости-термосы",
      "Резервуары горизонтальные и вертикальные",
    ],
    items: ["Ёмкости пищевые 100–10 000 л", "Резервуары вертикальные", "Резервуары горизонтальные", "Ёмкости-термосы", "Ёмкости с рубашкой и мешалкой", "Приёмные ванны"]
  },
  {
    slug: "pasterizacionnoe-oborudovanie",
    title: "Пастеризационное оборудование",
    short: "Пастеризационное оборудование",
    count: 6,
    description:
      "Установки пастеризации, охладители, комплексы под задачи производства",
    image: "/images/cat-pasteurization.jpg",
    type: "thermal",
    volume: ["100-1000", "1000-5000"],
    productivity: ["mid", "high"],
    material: ["aisi304", "aisi316"],
    application: ["moloko", "syr", "napitki"],
    items: ["Пластинчатые пастеризаторы", "Трубчатые пастеризаторы", "Ванны длительной пастеризации", "Секции рекуперации и охлаждения", "Выдерживатели"]
  },
  {
    slug: "syrovarni",
    title: "Сыроварни",
    short: "Сыроварни",
    count: 5,
    description: "Комплекты оборудования для производства сыра",
    image: "/images/cat-cheese.jpg",
    type: "processing",
    volume: ["100-1000", "1000-5000"],
    productivity: ["low", "mid"],
    material: ["aisi304"],
    application: ["syr", "moloko"],
    items: ["Сыродельные ванны", "Сыроизготовители с мешалкой", "Прессы для сыра", "Солильные бассейны", "Формы и дренажные столы"]
  },
  {
    slug: "ohladiteli-moloka",
    title: "Охладители молока",
    short: "Охладители молока",
    count: 4,
    description: "Охладители различных объёмов и конфигураций",
    image: "/images/cat-coolers.jpg",
    type: "thermal",
    volume: ["100-1000", "1000-5000", "5000+"],
    productivity: ["mid", "high"],
    material: ["aisi304"],
    application: ["moloko"],
    items: ["Охладители открытого типа", "Охладители закрытого типа", "Танки-охладители вертикальные", "Пластинчатые охладители"]
  },
  {
    slug: "tvorozhnye-vanny",
    title: "Творожные ванны",
    short: "Творожные ванны",
    count: 3,
    description: "Ванны для производства творога",
    image: "/images/cat-curd.jpg",
    type: "processing",
    volume: ["100-1000", "1000-5000"],
    productivity: ["low", "mid"],
    material: ["aisi304"],
    application: ["tvorog", "moloko"],
    items: ["Ванны творожные с рубашкой", "Пресс-тележки", "Ванны самопрессования"]
  },
  {
    slug: "vakuumno-vyparnye-ustanovki",
    title: "Вакуумно-выпарные установки",
    short: "Вакуумно-выпарные установки",
    count: 4,
    description: "Концентрация и выпаривание молока, соков и других продуктов",
    image: "/images/cat-vacuum.jpg",
    type: "processing",
    volume: ["1000-5000", "5000+"],
    productivity: ["high"],
    material: ["aisi304", "aisi316"],
    application: ["moloko", "napitki", "drugoe"],
    items: ["Одноступенчатые установки", "Двухступенчатые установки", "Вакуумные выпарные аппараты", "Конденсаторы и вакуумные насосы"]
  },
  {
    slug: "ckt",
    title: "Цилиндро-конические танки (ЦКТ)",
    short: "Цилиндро-конические танки (ЦКТ)",
    count: 4,
    description: "Для ферментации, хранения и технологических процессов",
    image: "/images/cat-tanks.jpg",
    type: "tanks",
    volume: ["1000-5000", "5000+"],
    productivity: ["mid", "high"],
    material: ["aisi304"],
    application: ["napitki", "moloko"],
    items: ["ЦКТ 500–5 000 л", "ЦКТ с рубашкой охлаждения", "Танки ферментации", "Форфасы"]
  },
  {
    slug: "pou",
    title: "Пастеризационно-охладительные установки",
    short: "Пастеризационно-охладительные установки (ПОУ)",
    count: 3,
    description: "Компактные решения для пастеризации и охлаждения",
    image: "/images/cat-pasteurization.jpg",
    type: "thermal",
    volume: ["100-1000", "1000-5000"],
    productivity: ["mid"],
    material: ["aisi304"],
    application: ["moloko", "napitki"],
    items: ["ПОУ 1 000 л/ч", "ПОУ 3 000 л/ч", "ПОУ 5 000 л/ч"]
  },
  {
    slug: "sip-stancii",
    title: "СИП станции",
    short: "СИП станции",
    count: 4,
    description: "Автоматические и полуавтоматические станции мойки",
    image: "/images/cat-cip.jpg",
    type: "processing",
    volume: ["100-1000", "1000-5000"],
    productivity: ["mid", "high"],
    material: ["aisi304", "aisi316"],
    application: ["moloko", "syr", "napitki", "drugoe"],
    items: ["СИП станции на 2 контура", "СИП станции на 3 контура", "Автоматические станции мойки", "Передвижные мойки"]
  },
  {
    slug: "nasosy",
    title: "Насосы",
    short: "Насосы",
    count: 6,
    description: "Насосное оборудование для пищевой промышленности",
    image: "/images/cat-pumps.jpg",
    type: "components",
    volume: ["do-100", "100-1000"],
    productivity: ["low", "mid", "high"],
    material: ["aisi304", "aisi316"],
    application: ["moloko", "syr", "tvorog", "napitki", "drugoe"],
    items: ["Центробежные насосы", "Самовсасывающие насосы", "Объёмные насосы", "Винтовые насосы", "Шестерённые насосы", "Насосные станции"]
  },
  {
    slug: "torcevye-uplotneniya",
    title: "Торцевые уплотнения",
    short: "Торцевые уплотнения",
    count: 20,
    description: "Торцевые уплотнения для насосов и промышленного оборудования",
    image: "/images/seals.jpg",
    type: "components",
    volume: ["do-100"],
    productivity: ["low"],
    material: ["aisi316", "keramika"],
    application: ["moloko", "napitki", "drugoe"],
    items: ["Уплотнения для насосов Grundfos", "Уплотнения одинарные", "Уплотнения двойные", "Картриджные уплотнения", "Комплекты ремонта"]
  },
  {
    slug: "drugie-resheniya",
    title: "Другие решения",
    short: "Другие решения",
    count: 5,
    description: "Дополнительное оборудование и комплектующие",
    image: "/images/cat-other.jpg",
    type: "components",
    volume: ["do-100", "100-1000", "1000-5000"],
    productivity: ["low", "mid"],
    material: ["aisi304", "aisi316"],
    application: ["drugoe"],
    items: ["Трубопроводная обвязка", "Площадки обслуживания", "Столы и тележки", "Фильтры и сепараторы", "Шкафы управления"]
  },
];

export const totalPositions = categories.reduce((sum, c) => sum + c.count, 0);

export type FilterGroup = {
  key: "type" | "volume" | "productivity" | "material" | "application";
  title: string;
  options: { value: string; label: string }[];
};

export const filterGroups: FilterGroup[] = [
  {
    key: "type",
    title: "Тип оборудования",
    options: [
      { value: "tanks", label: "Ёмкости и резервуары" },
      { value: "thermal", label: "Тепловое оборудование" },
      { value: "processing", label: "Технологические установки" },
      { value: "components", label: "Комплектующие" },
    ],
  },
  {
    key: "volume",
    title: "Объём, л",
    options: [
      { value: "do-100", label: "до 100" },
      { value: "100-1000", label: "100 – 1 000" },
      { value: "1000-5000", label: "1 000 – 5 000" },
      { value: "5000+", label: "более 5 000" },
    ],
  },
  {
    key: "productivity",
    title: "Производительность",
    options: [
      { value: "low", label: "до 1 000 л/ч" },
      { value: "mid", label: "1 000 – 5 000 л/ч" },
      { value: "high", label: "более 5 000 л/ч" },
    ],
  },
  {
    key: "material",
    title: "Материал",
    options: [
      { value: "aisi304", label: "Нержавеющая сталь AISI 304" },
      { value: "aisi316", label: "Нержавеющая сталь AISI 316" },
      { value: "keramika", label: "Керамика / карбид кремния" },
    ],
  },
  {
    key: "application",
    title: "Сфера применения",
    options: [
      { value: "moloko", label: "Молочная продукция" },
      { value: "syr", label: "Сыроделие" },
      { value: "tvorog", label: "Творог" },
      { value: "napitki", label: "Напитки" },
      { value: "drugoe", label: "Другие пищевые продукты" },
    ],
  },
];
