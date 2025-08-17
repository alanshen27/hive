-- AlterTable
ALTER TABLE "public"."groups" ADD COLUMN     "descriptionTranslationMetadata" TEXT NOT NULL DEFAULT '{}',
ADD COLUMN     "nameTranslationMetadata" TEXT NOT NULL DEFAULT '{}';

-- AlterTable
ALTER TABLE "public"."messages" ADD COLUMN     "contentTranslationMetadata" TEXT NOT NULL DEFAULT '{}';
