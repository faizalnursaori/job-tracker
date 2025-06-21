/*
  Warnings:

  - You are about to drop the `application_documents` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `document_types` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "application_documents";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "document_types";
PRAGMA foreign_keys=on;
