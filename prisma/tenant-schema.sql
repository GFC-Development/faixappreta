-- Tenant database schema (equivalent to prisma/schema.prisma)

CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STUDENT',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "studentType" TEXT NOT NULL DEFAULT 'ESSENCIAL',
    "belt" TEXT NOT NULL DEFAULT 'BRANCA',
    "degrees" INTEGER NOT NULL DEFAULT 0,
    "initialCheckins" INTEGER NOT NULL DEFAULT 0,
    "monthlyCredits" INTEGER NOT NULL DEFAULT 0,
    "modalities" TEXT NOT NULL DEFAULT 'GRAPPLING',
    "isKids" INTEGER NOT NULL DEFAULT 0,
    "photoUrl" TEXT,
    "monthlyDueDay" INTEGER,
    "lastPaymentDate" DATETIME,
    "lastGraduationDate" DATETIME,
    "lastBeltChangeDate" DATETIME,
    "isOwner" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

CREATE TABLE IF NOT EXISTS "PrivateSlot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isAvailable" INTEGER NOT NULL DEFAULT 1,
    "userId" TEXT,
    "instructorId" TEXT,
    CONSTRAINT "PrivateSlot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PrivateSlot_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "GroupClass" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "isKids" INTEGER NOT NULL DEFAULT 0,
    "classType" TEXT NOT NULL DEFAULT 'GROUP',
    "instructorId" TEXT,
    CONSTRAINT "GroupClass_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "privateSlotId" TEXT,
    "groupClassId" TEXT,
    "date" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "checkedIn" INTEGER NOT NULL DEFAULT 0,
    "checkinStatus" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Booking_privateSlotId_fkey" FOREIGN KEY ("privateSlotId") REFERENCES "PrivateSlot" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Booking_groupClassId_fkey" FOREIGN KEY ("groupClassId") REFERENCES "GroupClass" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "date" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Event_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "BeltRequirement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "belt" TEXT NOT NULL,
    "requiredClasses" INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "BeltRequirement_belt_key" ON "BeltRequirement"("belt");

CREATE TABLE IF NOT EXISTS "DegreeRequirement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "belt" TEXT NOT NULL,
    "degree" INTEGER NOT NULL,
    "requiredClasses" INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "DegreeRequirement_belt_degree_key" ON "DegreeRequirement"("belt", "degree");

CREATE TABLE IF NOT EXISTS "NotificationRead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "notificationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NotificationRead_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "NotificationRead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "NotificationRead_notificationId_userId_key" ON "NotificationRead"("notificationId", "userId");

CREATE TABLE IF NOT EXISTS "PlanUpgradeRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "details" TEXT,
    "price" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "readByAdmin" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlanUpgradeRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "GraduationLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "belt" TEXT NOT NULL,
    "degrees" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GraduationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "RescheduleLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL DEFAULT 'RESCHEDULE',
    "userId" TEXT NOT NULL,
    "privateSlotId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "newPrivateSlotId" TEXT,
    "newDate" TEXT,
    "readByAdmin" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RescheduleLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RescheduleLog_privateSlotId_fkey" FOREIGN KEY ("privateSlotId") REFERENCES "PrivateSlot" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RescheduleLog_newPrivateSlotId_fkey" FOREIGN KEY ("newPrivateSlotId") REFERENCES "PrivateSlot" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "RescheduleLog_privateSlotId_date_type_key" ON "RescheduleLog"("privateSlotId", "date", "type");
