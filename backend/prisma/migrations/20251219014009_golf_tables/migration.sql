/*
  Warnings:

  - You are about to drop the `markers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `polygons` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "markers";

-- DropTable
DROP TABLE "polygons";

-- CreateTable
CREATE TABLE "Course" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hole" (
    "id" SERIAL NOT NULL,
    "holeNumber" INTEGER NOT NULL,
    "par" INTEGER NOT NULL,
    "courseId" INTEGER NOT NULL,

    CONSTRAINT "Hole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HoleAnnotation" (
    "id" SERIAL NOT NULL,
    "annotType" VARCHAR(20) NOT NULL,
    "numCoords" INTEGER NOT NULL,
    "rawCoords" DOUBLE PRECISION[],
    "holeId" INTEGER NOT NULL,

    CONSTRAINT "HoleAnnotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseAnnotation" (
    "id" SERIAL NOT NULL,
    "annotType" VARCHAR(20) NOT NULL,
    "numCoords" INTEGER NOT NULL,
    "rawCoords" DOUBLE PRECISION[],
    "courseId" INTEGER NOT NULL,

    CONSTRAINT "CourseAnnotation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Hole" ADD CONSTRAINT "Hole_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HoleAnnotation" ADD CONSTRAINT "HoleAnnotation_holeId_fkey" FOREIGN KEY ("holeId") REFERENCES "Hole"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseAnnotation" ADD CONSTRAINT "CourseAnnotation_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
