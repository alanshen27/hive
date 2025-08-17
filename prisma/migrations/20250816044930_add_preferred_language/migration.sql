-- AlterTable
ALTER TABLE "public"."milestone_submissions" ADD COLUMN     "aiTranslationMetadata" TEXT NOT NULL DEFAULT '{}',
ADD COLUMN     "contentTranslationMetadata" TEXT NOT NULL DEFAULT '{}';

-- AlterTable
ALTER TABLE "public"."milestones" ADD COLUMN     "translation_metadata" TEXT NOT NULL DEFAULT '{}';

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "preferredLanguage" TEXT NOT NULL DEFAULT '{"code":"en","name":"English"}';

-- AlterTable
ALTER TABLE "public"."video_sessions" ADD COLUMN     "descriptionTranslationMetadata" TEXT NOT NULL DEFAULT '{}',
ADD COLUMN     "titleTranslationMetadata" TEXT NOT NULL DEFAULT '{}';
