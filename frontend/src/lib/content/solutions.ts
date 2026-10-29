export type Solution = {
  slug: string;
  title: string;
  description: string;
  image: string;
};

export const solutions: Solution[] = [
  {
    slug: "molochnaya-produkciya",
    title: "Молочная продукция",
    description: "Приёмка, охлаждение, пастеризация, хранение и розлив молока",
    image: "/images/sol-milk.jpg",
  },
  {
    slug: "syrnoe-proizvodstvo",
    title: "Сырное производство",
    description: "Сыроварни, прессы, солильные бассейны, камеры созревания",
    image: "/images/sol-cheese.jpg",
  },
  {
    slug: "smetana-i-jogurt",
    title: "Сметана и йогурт",
    description: "Сквашивание, охлаждение и фасовка кисломолочных продуктов",
    image: "/images/sol-yogurt.jpg",
  },
  {
    slug: "tvorog",
    title: "Творог",
    description: "Творожные ванны, прессы-тележки, охлаждение и упаковка",
    image: "/images/sol-curd.jpg",
  },
  {
    slug: "napitki",
    title: "Напитки",
    description: "ЦКТ, купажные ёмкости, пастеризация и розлив напитков",
    image: "/images/sol-drinks.jpg",
  },
  {
    slug: "drugie-pishchevye-produkty",
    title: "Другие пищевые продукты",
    description: "Нестандартные решения под ваш технологический процесс",
    image: "/images/sol-other.jpg",
  },
];
