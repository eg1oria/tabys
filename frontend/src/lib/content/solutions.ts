import type { StaticImageData } from "next/image";
import solCheesePhoto from "@/assets/images/sol-cheese.jpg";
import solCurdPhoto from "@/assets/images/sol-curd.jpg";
import solDrinksPhoto from "@/assets/images/sol-drinks.jpg";
import solMilkPhoto from "@/assets/images/sol-milk.jpg";
import solOtherPhoto from "@/assets/images/sol-other.jpg";
import solYogurtPhoto from "@/assets/images/sol-yogurt.jpg";

export type Solution = {
  slug: string;
  title: string;
  description: string;
  image: StaticImageData;
};

export const solutions: Solution[] = [
  {
    slug: "molochnaya-produkciya",
    title: "Молочная продукция",
    description: "Приёмка, охлаждение, пастеризация, хранение и розлив молока",
    image: solMilkPhoto,
  },
  {
    slug: "syrnoe-proizvodstvo",
    title: "Сырное производство",
    description: "Сыроварни, прессы, солильные бассейны, камеры созревания",
    image: solCheesePhoto,
  },
  {
    slug: "smetana-i-jogurt",
    title: "Сметана и йогурт",
    description: "Сквашивание, охлаждение и фасовка кисломолочных продуктов",
    image: solYogurtPhoto,
  },
  {
    slug: "tvorog",
    title: "Творог",
    description: "Творожные ванны, прессы-тележки, охлаждение и упаковка",
    image: solCurdPhoto,
  },
  {
    slug: "napitki",
    title: "Напитки",
    description: "ЦКТ, купажные ёмкости, пастеризация и розлив напитков",
    image: solDrinksPhoto,
  },
  {
    slug: "drugie-pishchevye-produkty",
    title: "Другие пищевые продукты",
    description: "Нестандартные решения под ваш технологический процесс",
    image: solOtherPhoto,
  },
];
