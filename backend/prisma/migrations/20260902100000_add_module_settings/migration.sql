-- CreateTable
CREATE TABLE "module_settings" (
    "key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "module_settings_pkey" PRIMARY KEY ("key")
);
