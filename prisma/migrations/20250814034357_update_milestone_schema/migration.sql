/*
  Warnings:

  - You are about to drop the column `status` on the `milestones` table. All the data in the column will be lost.
  - Made the column `description` on table `milestones` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."milestone_submissions" ADD COLUMN     "aiComment" TEXT,
ADD COLUMN     "aiVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "files" TEXT[];

-- AlterTable
ALTER TABLE "public"."milestones" DROP COLUMN "status",
ADD COLUMN     "completed" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "description" SET NOT NULL;
