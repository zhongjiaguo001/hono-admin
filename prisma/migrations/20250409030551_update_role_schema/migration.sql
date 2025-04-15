/*
  Warnings:

  - You are about to drop the column `order_no` on the `sys_menu` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "sys_menu" DROP COLUMN "order_no";

-- AlterTable
ALTER TABLE "sys_role" ADD COLUMN     "order_no" INTEGER NOT NULL DEFAULT 0;
