ALTER TABLE "users"
ADD COLUMN "usernameLowercase" TEXT,
ADD COLUMN "isOnboardingCompleted" BOOLEAN NOT NULL DEFAULT true;

UPDATE "users"
SET "usernameLowercase" = lower("username")
WHERE "usernameLowercase" IS NULL;

CREATE UNIQUE INDEX "users_usernameLowercase_key" ON "users"("usernameLowercase");
