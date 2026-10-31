import catCipPhoto from "@/assets/images/cat-cip.jpg";
import catPasteurizationPhoto from "@/assets/images/cat-pasteurization.jpg";
import catTanksPhoto from "@/assets/images/cat-tanks.jpg";
import catVacuumPhoto from "@/assets/images/cat-vacuum.jpg";
import weldingPhoto from "@/assets/images/welding.jpg";

export type Service = {
  number: string;
  title: string;
  description: string;
  points: string[];
};

export const services: Service[] = [
  {
    number: "01",
    title: "Проектирование",
    description:
      "Анализируем технологическую задачу и предлагаем решение с расчётом производительности и компоновки.",
    points: ["Анализ задачи и консультация", "Расчёт производительности", "Компоновка участка"],
  },
  {
    number: "02",
    title: "Изготовление по техническому заданию",
    description:
      "Производим оборудование из нержавеющей стали по вашим чертежам или разрабатываем конструкцию сами.",
    points: ["Работа по ТЗ и чертежам", "Нержавеющая сталь AISI 304 / 316", "Контроль на каждом этапе"],
  },
  {
    number: "03",
    title: "Комплектация производственных линий",
    description:
      "Подбираем и поставляем всё оборудование линии — от приёмки сырья до фасовки готового продукта.",
    points: ["Подбор оборудования", "Поставка комплектующих", "Согласование сроков"],
  },
  {
    number: "04",
    title: "Монтаж и пусконаладка",
    description:
      "Доставляем, монтируем и запускаем оборудование на площадке, обучаем персонал работе с ним.",
    points: ["Доставка по Казахстану", "Монтаж и обвязка", "Обучение персонала"],
  },
  {
    number: "05",
    title: "Сервисное обслуживание",
    description:
      "Поддерживаем оборудование в работе: плановое обслуживание, ремонт, поставка запчастей и уплотнений.",
    points: ["Плановое обслуживание", "Ремонт и диагностика", "Запчасти и торцевые уплотнения"],
  },
];

/** Этапы блока «Производство по вашему ТЗ» на главной. */
export const tzSteps = [
  { number: "01", title: "Анализ задачи и консультация" },
  { number: "02", title: "Проектирование и согласование" },
  { number: "03", title: "Производство и сборка" },
  { number: "04", title: "Комплектация и испытания" },
  { number: "05", title: "Доставка, монтаж и пусконаладка" },
];

/** Полоса преимуществ под первым экраном. */
export const advantages = [
  { title: "Производство в Казахстане", description: "Собственный цех в Алматы" },
  { title: "Изготовление по ТЗ", description: "Под вашу технологию" },
  { title: "Комплектация линий", description: "От единицы до линии под ключ" },
  { title: "Сервис и поддержка", description: "Обслуживание после запуска" },
];

/** Блок «Почему Tabys Consulting». */
export const whyUs = [
  {
    title: "Собственное производство",
    description: "Полный цикл в Алматы — от раскроя до испытаний",
    image: weldingPhoto,
  },
  {
    title: "Изготовление по ТЗ",
    description: "Конструкция под ваш технологический процесс",
    image: catCipPhoto,
  },
  {
    title: "Комплексные решения",
    description: "Линии под ключ, а не разрозненное оборудование",
    image: catTanksPhoto,
  },
  {
    title: "Нержавеющая сталь",
    description: "AISI 304 и 316, пищевые допуски и сертификаты",
    image: catVacuumPhoto,
  },
  {
    title: "Сервис после запуска",
    description: "Обслуживание, запчасти, модернизация",
    image: catPasteurizationPhoto,
  },
];
