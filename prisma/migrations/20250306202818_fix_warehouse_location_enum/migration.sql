/*
  Warnings:

  - The values [ILUPEJU,SANGO_TEDO,MOWE] on the enum `WarehouseName` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[location]` on the table `Warehouse` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `location` on the `Warehouse` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "WarehouseLocation" AS ENUM ('ILUPEJU', 'SANGO_TEDO', 'MOWE');

-- AlterEnum
BEGIN;
CREATE TYPE "WarehouseName_new" AS ENUM ('SwiftStock', 'PrimeStorage', 'NextGen');
ALTER TABLE "Warehouse" ALTER COLUMN "name" TYPE "WarehouseName_new" USING ("name"::text::"WarehouseName_new");
ALTER TYPE "WarehouseName" RENAME TO "WarehouseName_old";
ALTER TYPE "WarehouseName_new" RENAME TO "WarehouseName";
DROP TYPE "WarehouseName_old";
COMMIT;

-- AlterTable
ALTER TABLE "Warehouse" DROP COLUMN "location",
ADD COLUMN     "location" "WarehouseLocation" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Warehouse_location_key" ON "Warehouse"("location");
