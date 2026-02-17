-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Offer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "items" TEXT NOT NULL,
    "aiInsight" TEXT,
    "pitchNote" TEXT,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "engineConfig" TEXT NOT NULL,
    "totalValue" DECIMAL NOT NULL DEFAULT 0,
    "totalMargin" DECIMAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Offer_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Offer" ("aiInsight", "clientId", "createdAt", "engineConfig", "generatedAt", "id", "isEdited", "items") SELECT "aiInsight", "clientId", "createdAt", "engineConfig", "generatedAt", "id", "isEdited", "items" FROM "Offer";
DROP TABLE "Offer";
ALTER TABLE "new_Offer" RENAME TO "Offer";
CREATE INDEX "Offer_clientId_idx" ON "Offer"("clientId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
