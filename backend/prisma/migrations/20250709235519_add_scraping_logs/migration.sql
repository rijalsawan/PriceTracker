-- CreateTable
CREATE TABLE "scraping_logs" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "priceFound" DOUBLE PRECISION,
    "priceSource" TEXT,
    "errorMessage" TEXT,
    "responseCode" INTEGER,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "productId" TEXT,

    CONSTRAINT "scraping_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "scraping_logs" ADD CONSTRAINT "scraping_logs_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
