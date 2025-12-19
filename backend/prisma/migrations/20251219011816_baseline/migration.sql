-- CreateTable
CREATE TABLE "markers" (
    "id" SERIAL NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "icon_style" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "markers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "polygons" (
    "id" SERIAL NOT NULL,
    "label" VARCHAR(100),
    "coordinates" JSONB NOT NULL,
    "fill_color" VARCHAR(7) NOT NULL DEFAULT '#00FF00',
    "fill_opacity" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    "stroke_color" VARCHAR(7) NOT NULL DEFAULT '#000000',
    "stroke_weight" INTEGER NOT NULL DEFAULT 2,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "polygons_pkey" PRIMARY KEY ("id")
);
