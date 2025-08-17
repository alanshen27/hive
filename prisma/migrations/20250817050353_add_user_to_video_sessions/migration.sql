/*
  Warnings:

  - Added the required column `userId` to the `video_sessions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."video_sessions" ADD COLUMN     "userId" TEXT;

-- Update existing video sessions to use the first user as the creator
UPDATE "public"."video_sessions" 
SET "userId" = (SELECT "id" FROM "public"."users" LIMIT 1)
WHERE "userId" IS NULL;

-- Make the column NOT NULL after updating existing data
ALTER TABLE "public"."video_sessions" ALTER COLUMN "userId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."video_sessions" ADD CONSTRAINT "video_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
