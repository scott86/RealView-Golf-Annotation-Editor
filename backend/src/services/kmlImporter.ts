import { prisma } from '../db/prisma.js';
import { KMLCourse, KMLAnnotation } from '../types/kml.js';

function flattenCoordinates(coordinates: { lat: number; lon: number }[]): number[] {
  const result: number[] = [];
  for (const coord of coordinates) {
    result.push(coord.lon, coord.lat);
  }
  return result;
}

export async function importCourse(kmlCourse: KMLCourse): Promise<void> {
  console.log(`Importing course: ${kmlCourse.name}`);

  // Check if course already exists
  const existingCourse = await prisma.course.findFirst({
    where: { name: kmlCourse.name }
  });

  // If exists, delete it (cascade will delete holes and annotations)
  if (existingCourse) {
    console.log(`Course "${kmlCourse.name}" already exists. Deleting...`);
    await prisma.course.delete({
      where: { id: existingCourse.id }
    });
  }

  // Create the course
  const course = await prisma.course.create({
    data: {
      name: kmlCourse.name,
      leaderboardCode: kmlCourse.leaderboardCode,
      achievementCode: kmlCourse.achievementCode
    }
  });

  console.log(`Created course with ID: ${course.id}`);

  // Create holes and their annotations
  for (const kmlHole of kmlCourse.holes) {
    const hole = await prisma.hole.create({
      data: {
        holeNumber: kmlHole.holeNumber,
        par: kmlHole.par,
        courseId: course.id
      }
    });

    console.log(`  Created hole ${kmlHole.holeNumber} (par ${kmlHole.par})`);

    // Create hole annotations
    for (const annotation of kmlHole.annotations) {
      const rawCoords = flattenCoordinates(annotation.coordinates);
      
      await prisma.holeAnnotation.create({
        data: {
          annotType: annotation.name,
          numCoords: annotation.coordinates.length,
          rawCoords: rawCoords,
          holeId: hole.id
        }
      });
    }

    console.log(`    Added ${kmlHole.annotations.length} annotations`);
  }

  // Create global (course-level) annotations
  for (const annotation of kmlCourse.globalAnnotations) {
    const rawCoords = flattenCoordinates(annotation.coordinates);
    
    await prisma.courseAnnotation.create({
      data: {
        annotType: annotation.name,
        numCoords: annotation.coordinates.length,
        rawCoords: rawCoords,
        courseId: course.id
      }
    });
  }

  console.log(`  Added ${kmlCourse.globalAnnotations.length} global annotations`);
  console.log(`Import complete for course: ${kmlCourse.name}`);
}

