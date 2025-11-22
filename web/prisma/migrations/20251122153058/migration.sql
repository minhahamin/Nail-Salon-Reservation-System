-- CreateTable
CREATE TABLE "Designer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "specialties" TEXT NOT NULL,
    "workHours" TEXT NOT NULL,
    "holidays" TEXT,
    "breaks" TEXT,
    "recurringBreaks" TEXT,
    "defaultBlocks" TEXT,
    "specialHours" TEXT,
    "dailyMaxAppointments" INTEGER,
    "dailyMaxMinutes" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
