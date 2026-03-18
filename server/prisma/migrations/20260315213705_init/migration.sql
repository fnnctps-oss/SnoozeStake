-- CreateEnum
CREATE TYPE "WakeUpTaskType" AS ENUM ('NONE', 'MATH', 'QR_SCAN', 'PHOTO_SUNLIGHT', 'WALK_STEPS', 'SHAKE_PHONE', 'BARCODE_SCAN', 'TYPING_TEST');

-- CreateEnum
CREATE TYPE "TaskDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "PenaltyDestination" AS ENUM ('SAVINGS', 'CHARITY', 'FRIEND');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "BattleStatus" AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "GroupRole" AS ENUM ('ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('WALLET_TOPUP', 'SNOOZE_PENALTY', 'SAVINGS_WITHDRAWAL', 'FRIEND_TRANSFER', 'CHARITY_DONATION', 'BATTLE_BET', 'BATTLE_WIN', 'REFUND');

-- CreateEnum
CREATE TYPE "FriendshipStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "firebaseUid" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "stripeCustomerId" TEXT,
    "walletBalance" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "totalSnoozed" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "totalSaved" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "streakStartDate" TIMESTAMP(3),
    "referralCode" TEXT NOT NULL,
    "referredBy" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'America/Chicago',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alarm" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "daysOfWeek" INTEGER[],
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "snoozeBasePenalty" DECIMAL(10,2) NOT NULL DEFAULT 1.00,
    "useEscalatingPenalty" BOOLEAN NOT NULL DEFAULT false,
    "maxSnoozes" INTEGER NOT NULL DEFAULT 5,
    "snoozeDurationMinutes" INTEGER NOT NULL DEFAULT 5,
    "wakeUpTaskType" "WakeUpTaskType" NOT NULL DEFAULT 'NONE',
    "wakeUpTaskDifficulty" "TaskDifficulty" NOT NULL DEFAULT 'EASY',
    "penaltyDestination" "PenaltyDestination" NOT NULL DEFAULT 'SAVINGS',
    "charityId" TEXT,
    "friendRecipientId" TEXT,
    "noEscapeMode" BOOLEAN NOT NULL DEFAULT false,
    "soundUrl" TEXT,
    "vibrationPattern" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Alarm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SnoozeEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "alarmId" TEXT NOT NULL,
    "snoozedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "penaltyAmount" DECIMAL(10,2) NOT NULL,
    "snoozeNumber" INTEGER NOT NULL,
    "platformFee" DECIMAL(10,2) NOT NULL,
    "recipientAmount" DECIMAL(10,2) NOT NULL,
    "destination" "PenaltyDestination" NOT NULL,
    "charityId" TEXT,
    "friendRecipientId" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "SnoozeEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WakeUpEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "alarmId" TEXT NOT NULL,
    "wokeUpAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "snoozeCount" INTEGER NOT NULL DEFAULT 0,
    "totalPenalty" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "moneySaved" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "taskCompleted" "WakeUpTaskType",

    CONSTRAINT "WakeUpEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Charity" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "logoUrl" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Charity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SnoozeBattle" (
    "id" TEXT NOT NULL,
    "challengerId" TEXT NOT NULL,
    "opponentId" TEXT NOT NULL,
    "weekStartDate" DATE NOT NULL,
    "weekEndDate" DATE NOT NULL,
    "betAmount" DECIMAL(10,2) NOT NULL,
    "challengerSnoozeCount" INTEGER NOT NULL DEFAULT 0,
    "opponentSnoozeCount" INTEGER NOT NULL DEFAULT 0,
    "status" "BattleStatus" NOT NULL DEFAULT 'PENDING',
    "winnerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SnoozeBattle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountabilityGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "inviteCode" TEXT NOT NULL,
    "maxMembers" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountabilityGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupMember" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role" "GroupRole" NOT NULL DEFAULT 'MEMBER',

    CONSTRAINT "GroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "platformFee" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "stripePaymentIntentId" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Friendship" (
    "id" TEXT NOT NULL,
    "initiatorId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "status" "FriendshipStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Friendship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Waitlist" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "referralCode" TEXT NOT NULL,
    "referredBy" TEXT,
    "position" INTEGER NOT NULL,
    "referralCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Waitlist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_firebaseUid_key" ON "User"("firebaseUid");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

-- CreateIndex
CREATE INDEX "Alarm_userId_idx" ON "Alarm"("userId");

-- CreateIndex
CREATE INDEX "SnoozeEvent_userId_idx" ON "SnoozeEvent"("userId");

-- CreateIndex
CREATE INDEX "SnoozeEvent_alarmId_idx" ON "SnoozeEvent"("alarmId");

-- CreateIndex
CREATE INDEX "WakeUpEvent_userId_idx" ON "WakeUpEvent"("userId");

-- CreateIndex
CREATE INDEX "SnoozeBattle_challengerId_idx" ON "SnoozeBattle"("challengerId");

-- CreateIndex
CREATE INDEX "SnoozeBattle_opponentId_idx" ON "SnoozeBattle"("opponentId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountabilityGroup_inviteCode_key" ON "AccountabilityGroup"("inviteCode");

-- CreateIndex
CREATE UNIQUE INDEX "GroupMember_groupId_userId_key" ON "GroupMember"("groupId", "userId");

-- CreateIndex
CREATE INDEX "Transaction_userId_idx" ON "Transaction"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Friendship_initiatorId_receiverId_key" ON "Friendship"("initiatorId", "receiverId");

-- CreateIndex
CREATE UNIQUE INDEX "Waitlist_email_key" ON "Waitlist"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Waitlist_referralCode_key" ON "Waitlist"("referralCode");

-- AddForeignKey
ALTER TABLE "Alarm" ADD CONSTRAINT "Alarm_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alarm" ADD CONSTRAINT "Alarm_charityId_fkey" FOREIGN KEY ("charityId") REFERENCES "Charity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SnoozeEvent" ADD CONSTRAINT "SnoozeEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SnoozeEvent" ADD CONSTRAINT "SnoozeEvent_alarmId_fkey" FOREIGN KEY ("alarmId") REFERENCES "Alarm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SnoozeEvent" ADD CONSTRAINT "SnoozeEvent_charityId_fkey" FOREIGN KEY ("charityId") REFERENCES "Charity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WakeUpEvent" ADD CONSTRAINT "WakeUpEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WakeUpEvent" ADD CONSTRAINT "WakeUpEvent_alarmId_fkey" FOREIGN KEY ("alarmId") REFERENCES "Alarm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SnoozeBattle" ADD CONSTRAINT "SnoozeBattle_challengerId_fkey" FOREIGN KEY ("challengerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SnoozeBattle" ADD CONSTRAINT "SnoozeBattle_opponentId_fkey" FOREIGN KEY ("opponentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SnoozeBattle" ADD CONSTRAINT "SnoozeBattle_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountabilityGroup" ADD CONSTRAINT "AccountabilityGroup_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "AccountabilityGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_initiatorId_fkey" FOREIGN KEY ("initiatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
