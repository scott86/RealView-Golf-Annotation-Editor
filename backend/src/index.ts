import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { prisma } from './db/prisma.js';
import { parseKML } from './services/kmlParser.js';
import { importCourse } from './services/kmlImporter.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    // Test database connection with Prisma
    await prisma.$queryRaw`SELECT NOW()`;
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// KML Import endpoint
app.post('/api/import-kml', upload.single('kml'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No KML file uploaded' });
    }

    // Parse the KML file
    const kmlContent = req.file.buffer.toString('utf-8');
    console.log('Parsing KML file...');
    const parsedCourse = parseKML(kmlContent);

    // Import into database
    console.log('Importing course into database...');
    await importCourse(parsedCourse);

    res.json({
      message: 'Course imported successfully',
      courseName: parsedCourse.name,
      holes: parsedCourse.holes.length,
      globalAnnotations: parsedCourse.globalAnnotations.length
    });
  } catch (error) {
    console.error('Error importing KML:', error);
    res.status(500).json({
      error: 'Failed to import KML',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all courses (for dropdown)
app.get('/api/courses-list', async (req: Request, res: Response) => {
  try {
    const courses = await prisma.course.findMany({
      select: {
        id: true,
        name: true
      },
      orderBy: {
        name: 'asc'
      }
    });
    res.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// Course endpoints
app.get('/api/courses', async (req: Request, res: Response) => {
  try {
    const courses = await prisma.course.findMany({
      include: {
        holes: true,
        annotations: true
      }
    });
    res.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/courses/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const course = await prisma.course.findUnique({
      where: { id: parseInt(id) },
      include: {
        holes: {
          include: {
            annotations: true
          }
        },
        annotations: true
      }
    });
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.json(course);
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/courses', async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    const course = await prisma.course.create({
      data: { name }
    });
    res.status(201).json(course);
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/courses/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const course = await prisma.course.update({
      where: { id: parseInt(id) },
      data: { name }
    });
    res.json(course);
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/courses/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.course.delete({
      where: { id: parseInt(id) }
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Hole endpoints
app.get('/api/holes', async (req: Request, res: Response) => {
  try {
    const holes = await prisma.hole.findMany({
      include: {
        course: true,
        annotations: true
      }
    });
    res.json(holes);
  } catch (error) {
    console.error('Error fetching holes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/courses/:courseId/holes', async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const holes = await prisma.hole.findMany({
      where: { courseId: parseInt(courseId) },
      include: {
        annotations: true
      }
    });
    res.json(holes);
  } catch (error) {
    console.error('Error fetching holes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/holes', async (req: Request, res: Response) => {
  try {
    const { holeNumber, par, courseId } = req.body;
    const hole = await prisma.hole.create({
      data: { holeNumber, par, courseId }
    });
    res.status(201).json(hole);
  } catch (error) {
    console.error('Error creating hole:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/holes/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { holeNumber, par } = req.body;
    const hole = await prisma.hole.update({
      where: { id: parseInt(id) },
      data: { holeNumber, par }
    });
    res.json(hole);
  } catch (error) {
    console.error('Error updating hole:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/holes/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.hole.delete({
      where: { id: parseInt(id) }
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting hole:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// HoleAnnotation endpoints
app.get('/api/holes/:holeId/annotations', async (req: Request, res: Response) => {
  try {
    const { holeId } = req.params;
    const annotations = await prisma.holeAnnotation.findMany({
      where: { holeId: parseInt(holeId) }
    });
    res.json(annotations);
  } catch (error) {
    console.error('Error fetching hole annotations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/hole-annotations', async (req: Request, res: Response) => {
  try {
    const { annotType, numCoords, rawCoords, holeId } = req.body;
    const annotation = await prisma.holeAnnotation.create({
      data: { annotType, numCoords, rawCoords, holeId }
    });
    res.status(201).json(annotation);
  } catch (error) {
    console.error('Error creating hole annotation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/hole-annotations/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { annotType, numCoords, rawCoords } = req.body;
    const annotation = await prisma.holeAnnotation.update({
      where: { id: parseInt(id) },
      data: { annotType, numCoords, rawCoords }
    });
    res.json(annotation);
  } catch (error) {
    console.error('Error updating hole annotation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/hole-annotations/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.holeAnnotation.delete({
      where: { id: parseInt(id) }
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting hole annotation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// CourseAnnotation endpoints
app.get('/api/courses/:courseId/annotations', async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const annotations = await prisma.courseAnnotation.findMany({
      where: { courseId: parseInt(courseId) }
    });
    res.json(annotations);
  } catch (error) {
    console.error('Error fetching course annotations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/course-annotations', async (req: Request, res: Response) => {
  try {
    const { annotType, numCoords, rawCoords, courseId } = req.body;
    const annotation = await prisma.courseAnnotation.create({
      data: { annotType, numCoords, rawCoords, courseId }
    });
    res.status(201).json(annotation);
  } catch (error) {
    console.error('Error creating course annotation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/course-annotations/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { annotType, numCoords, rawCoords } = req.body;
    const annotation = await prisma.courseAnnotation.update({
      where: { id: parseInt(id) },
      data: { annotType, numCoords, rawCoords }
    });
    res.json(annotation);
  } catch (error) {
    console.error('Error updating course annotation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/course-annotations/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.courseAnnotation.delete({
      where: { id: parseInt(id) }
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting course annotation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

