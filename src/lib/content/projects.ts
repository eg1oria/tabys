export type Project = {
  slug: string;
  title: string;
  subtitle: string;
  location: string;
  year: string;
  scope: string[];
  image: string;
};

export const projects: Project[] = [
  {
    slug: "kompleks-pererabotki-moloka",
    title: "Комплекс оборудования для переработки молока",
    subtitle: "Алматы, Казахстан",
    location: "Алматинская область",
    year: "2024",
    scope: [
      "Приёмное отделение и охлаждение",
      "Пастеризационно-охладительная установка",
      "Резервуары хранения 5 000 л",
    ],
    image: "/images/cat-tanks.jpg",
  },
  {
    slug: "syrovarnya-pod-klyuch",
    title: "Сыроварня под ключ",
    subtitle: "Проектирование, производство, монтаж",
    location: "Шымкент",
    year: "2024",
    scope: [
      "Сыродельная ванна 1 000 л",
      "Пресс-формы и солильный бассейн",
      "Монтаж и пусконаладка",
    ],
    image: "/images/cat-cheese.jpg",
  },
  {
    slug: "liniya-pasterizacii-i-rozliva",
    title: "Линия пастеризации и розлива",
    subtitle: "Комплектация производственной линии",
    location: "Астана",
    year: "2023",
    scope: [
      "ПОУ производительностью 3 000 л/ч",
      "СИП станция мойки",
      "Обвязка и автоматика",
    ],
    image: "/images/cat-pasteurization.jpg",
  },
];
