/**
 * Перенос categories из frontend/src/lib/content/categories.ts (одноразовый,
 * сгенерирован из источника, а не перепечатан).
 * Слаги и positionCount сохранены дословно: слаги уже в URL (?cat=...),
 * а витринное число позиций у 3 категорий расходится с длиной items.
 */
export type CategorySeed = {
  slug: string;
  title: string;
  short: string;
  description: string;
  /** Витринное число — переопределяет вычисляемое количество товаров. */
  positionCount: number;
  /** Фото из frontend/src/assets; нет — обложку загружают в админке. */
  image?: string;
  highlights: string[];
  /** Ключ группы фасетов -> значения. */
  facets: Record<string, string[]>;
  /** Типовые позиции: станут товарами-черновиками. */
  items: string[];
};

export const categorySeeds: CategorySeed[] = [
  {
    "slug": "emkosti-i-rezervuary",
    "title": "Ёмкости и резервуары",
    "short": "Ёмкости и резервуары",
    "description": "Производственные ёмкости, резервуары для хранения и технологических процессов",
    "positionCount": 8,
    "image": "/images/cat-tanks.jpg",
    "highlights": [
      "Ёмкости пищевые",
      "Ёмкости производственные",
      "ЦКТ",
      "Ёмкости-термосы",
      "Резервуары горизонтальные и вертикальные"
    ],
    "facets": {
      "type": [
        "tanks"
      ],
      "volume": [
        "100-1000",
        "1000-5000",
        "5000+"
      ],
      "productivity": [
        "low",
        "mid",
        "high"
      ],
      "material": [
        "aisi304",
        "aisi316"
      ],
      "application": [
        "moloko",
        "syr",
        "napitki",
        "drugoe"
      ]
    },
    "items": [
      "Ёмкости пищевые 100–10 000 л",
      "Резервуары вертикальные",
      "Резервуары горизонтальные",
      "Ёмкости-термосы",
      "Ёмкости с рубашкой и мешалкой",
      "Приёмные ванны"
    ]
  },
  {
    "slug": "pasterizacionnoe-oborudovanie",
    "title": "Пастеризационное оборудование",
    "short": "Пастеризационное оборудование",
    "description": "Установки пастеризации, охладители, комплексы под задачи производства",
    "positionCount": 6,
    "image": "/images/cat-pasteurization.jpg",
    "highlights": [],
    "facets": {
      "type": [
        "thermal"
      ],
      "volume": [
        "100-1000",
        "1000-5000"
      ],
      "productivity": [
        "mid",
        "high"
      ],
      "material": [
        "aisi304",
        "aisi316"
      ],
      "application": [
        "moloko",
        "syr",
        "napitki"
      ]
    },
    "items": [
      "Пластинчатые пастеризаторы",
      "Трубчатые пастеризаторы",
      "Ванны длительной пастеризации",
      "Секции рекуперации и охлаждения",
      "Выдерживатели"
    ]
  },
  {
    "slug": "syrovarni",
    "title": "Сыроварни",
    "short": "Сыроварни",
    "description": "Комплекты оборудования для производства сыра",
    "positionCount": 5,
    "image": "/images/cat-cheese.jpg",
    "highlights": [],
    "facets": {
      "type": [
        "processing"
      ],
      "volume": [
        "100-1000",
        "1000-5000"
      ],
      "productivity": [
        "low",
        "mid"
      ],
      "material": [
        "aisi304"
      ],
      "application": [
        "syr",
        "moloko"
      ]
    },
    "items": [
      "Сыродельные ванны",
      "Сыроизготовители с мешалкой",
      "Прессы для сыра",
      "Солильные бассейны",
      "Формы и дренажные столы"
    ]
  },
  {
    "slug": "ohladiteli-moloka",
    "title": "Охладители молока",
    "short": "Охладители молока",
    "description": "Охладители различных объёмов и конфигураций",
    "positionCount": 4,
    "image": "/images/cat-coolers.jpg",
    "highlights": [],
    "facets": {
      "type": [
        "thermal"
      ],
      "volume": [
        "100-1000",
        "1000-5000",
        "5000+"
      ],
      "productivity": [
        "mid",
        "high"
      ],
      "material": [
        "aisi304"
      ],
      "application": [
        "moloko"
      ]
    },
    "items": [
      "Охладители открытого типа",
      "Охладители закрытого типа",
      "Танки-охладители вертикальные",
      "Пластинчатые охладители"
    ]
  },
  {
    "slug": "tvorozhnye-vanny",
    "title": "Творожные ванны",
    "short": "Творожные ванны",
    "description": "Ванны для производства творога",
    "positionCount": 3,
    "image": "/images/cat-curd.jpg",
    "highlights": [],
    "facets": {
      "type": [
        "processing"
      ],
      "volume": [
        "100-1000",
        "1000-5000"
      ],
      "productivity": [
        "low",
        "mid"
      ],
      "material": [
        "aisi304"
      ],
      "application": [
        "tvorog",
        "moloko"
      ]
    },
    "items": [
      "Ванны творожные с рубашкой",
      "Пресс-тележки",
      "Ванны самопрессования"
    ]
  },
  {
    "slug": "vakuumno-vyparnye-ustanovki",
    "title": "Вакуумно-выпарные установки",
    "short": "Вакуумно-выпарные установки",
    "description": "Концентрация и выпаривание молока, соков и других продуктов",
    "positionCount": 4,
    "image": "/images/cat-vacuum.jpg",
    "highlights": [],
    "facets": {
      "type": [
        "processing"
      ],
      "volume": [
        "1000-5000",
        "5000+"
      ],
      "productivity": [
        "high"
      ],
      "material": [
        "aisi304",
        "aisi316"
      ],
      "application": [
        "moloko",
        "napitki",
        "drugoe"
      ]
    },
    "items": [
      "Одноступенчатые установки",
      "Двухступенчатые установки",
      "Вакуумные выпарные аппараты",
      "Конденсаторы и вакуумные насосы"
    ]
  },
  {
    "slug": "ckt",
    "title": "Цилиндро-конические танки (ЦКТ)",
    "short": "Цилиндро-конические танки (ЦКТ)",
    "description": "Для ферментации, хранения и технологических процессов",
    "positionCount": 4,
    "image": "/images/cat-tanks.jpg",
    "highlights": [],
    "facets": {
      "type": [
        "tanks"
      ],
      "volume": [
        "1000-5000",
        "5000+"
      ],
      "productivity": [
        "mid",
        "high"
      ],
      "material": [
        "aisi304"
      ],
      "application": [
        "napitki",
        "moloko"
      ]
    },
    "items": [
      "ЦКТ 500–5 000 л",
      "ЦКТ с рубашкой охлаждения",
      "Танки ферментации",
      "Форфасы"
    ]
  },
  {
    "slug": "pou",
    "title": "Пастеризационно-охладительные установки",
    "short": "Пастеризационно-охладительные установки (ПОУ)",
    "description": "Компактные решения для пастеризации и охлаждения",
    "positionCount": 3,
    "image": "/images/cat-pasteurization.jpg",
    "highlights": [],
    "facets": {
      "type": [
        "thermal"
      ],
      "volume": [
        "100-1000",
        "1000-5000"
      ],
      "productivity": [
        "mid"
      ],
      "material": [
        "aisi304"
      ],
      "application": [
        "moloko",
        "napitki"
      ]
    },
    "items": [
      "ПОУ 1 000 л/ч",
      "ПОУ 3 000 л/ч",
      "ПОУ 5 000 л/ч"
    ]
  },
  {
    "slug": "sip-stancii",
    "title": "СИП станции",
    "short": "СИП станции",
    "description": "Автоматические и полуавтоматические станции мойки",
    "positionCount": 4,
    "image": "/images/cat-cip.jpg",
    "highlights": [],
    "facets": {
      "type": [
        "processing"
      ],
      "volume": [
        "100-1000",
        "1000-5000"
      ],
      "productivity": [
        "mid",
        "high"
      ],
      "material": [
        "aisi304",
        "aisi316"
      ],
      "application": [
        "moloko",
        "syr",
        "napitki",
        "drugoe"
      ]
    },
    "items": [
      "СИП станции на 2 контура",
      "СИП станции на 3 контура",
      "Автоматические станции мойки",
      "Передвижные мойки"
    ]
  },
  {
    "slug": "nasosy",
    "title": "Насосы",
    "short": "Насосы",
    "description": "Насосное оборудование для пищевой промышленности",
    "positionCount": 6,
    "highlights": [],
    "facets": {
      "type": [
        "components"
      ],
      "volume": [
        "do-100",
        "100-1000"
      ],
      "productivity": [
        "low",
        "mid",
        "high"
      ],
      "material": [
        "aisi304",
        "aisi316"
      ],
      "application": [
        "moloko",
        "syr",
        "tvorog",
        "napitki",
        "drugoe"
      ]
    },
    "items": [
      "Центробежные насосы",
      "Самовсасывающие насосы",
      "Объёмные насосы",
      "Винтовые насосы",
      "Шестерённые насосы",
      "Насосные станции"
    ]
  },
  {
    "slug": "torcevye-uplotneniya",
    "title": "Торцевые уплотнения",
    "short": "Торцевые уплотнения",
    "description": "Торцевые уплотнения для насосов и промышленного оборудования",
    "positionCount": 20,
    "highlights": [],
    "facets": {
      "type": [
        "components"
      ],
      "volume": [
        "do-100"
      ],
      "productivity": [
        "low"
      ],
      "material": [
        "aisi316",
        "keramika"
      ],
      "application": [
        "moloko",
        "napitki",
        "drugoe"
      ]
    },
    "items": [
      "Уплотнения для насосов Grundfos",
      "Уплотнения одинарные",
      "Уплотнения двойные",
      "Картриджные уплотнения",
      "Комплекты ремонта"
    ]
  },
  {
    "slug": "drugie-resheniya",
    "title": "Другие решения",
    "short": "Другие решения",
    "description": "Дополнительное оборудование и комплектующие",
    "positionCount": 5,
    "highlights": [],
    "facets": {
      "type": [
        "components"
      ],
      "volume": [
        "do-100",
        "100-1000",
        "1000-5000"
      ],
      "productivity": [
        "low",
        "mid"
      ],
      "material": [
        "aisi304",
        "aisi316"
      ],
      "application": [
        "drugoe"
      ]
    },
    "items": [
      "Трубопроводная обвязка",
      "Площадки обслуживания",
      "Столы и тележки",
      "Фильтры и сепараторы",
      "Шкафы управления"
    ]
  }
];
