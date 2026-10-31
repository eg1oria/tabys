-- Telegram подключается из админки, а не через TELEGRAM_* в окружении:
-- заказчик сам заводит бота и подключает чаты менеджеров. Плюс поля для
-- повторной отправки уведомлений о заявках — раньше неудачная отправка
-- терялась навсегда.

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "notifyAttemptAt" TIMESTAMP(3),
ADD COLUMN     "notifyAttempts" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "TelegramBot" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "token" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "updatesOffset" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TelegramBot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelegramChat" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "lastError" TEXT,
    "lastErrorAt" TIMESTAMP(3),
    "addedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelegramChat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelegramLinkCode" (
    "code" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelegramLinkCode_pkey" PRIMARY KEY ("code")
);

-- CreateIndex
CREATE UNIQUE INDEX "TelegramChat_chatId_key" ON "TelegramChat"("chatId");

-- AddForeignKey
ALTER TABLE "TelegramChat" ADD CONSTRAINT "TelegramChat_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelegramLinkCode" ADD CONSTRAINT "TelegramLinkCode_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Бот один на сайт: вторую строку база не примет.
ALTER TABLE "TelegramBot" ADD CONSTRAINT "TelegramBot_single_row" CHECK ("id" = 1);
