-- Replace CASCADE with RESTRICT on listing FK (preserve licenses when listings are deleted)
ALTER TABLE "purchased_licenses" DROP CONSTRAINT "purchased_licenses_listingId_fkey";
ALTER TABLE "purchased_licenses" ADD CONSTRAINT "purchased_licenses_listingId_fkey"
  FOREIGN KEY ("listingId") REFERENCES "marketplace_listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add FK for transactionId
ALTER TABLE "purchased_licenses" ADD CONSTRAINT "purchased_licenses_transactionId_fkey"
  FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
