import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { prisma } from './db/prisma.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

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

// Markers endpoints
app.get('/api/markers', async (req: Request, res: Response) => {
  try {
    const markers = await prisma.marker.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(markers);
  } catch (error) {
    console.error('Error fetching markers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/markers', async (req: Request, res: Response) => {
  try {
    const { label, latitude, longitude, iconStyle } = req.body;
    const marker = await prisma.marker.create({
      data: { label, latitude, longitude, iconStyle }
    });
    res.status(201).json(marker);
  } catch (error) {
    console.error('Error creating marker:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Polygons endpoints
app.get('/api/polygons', async (req: Request, res: Response) => {
  try {
    const polygons = await prisma.polygon.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(polygons);
  } catch (error) {
    console.error('Error fetching polygons:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/polygons', async (req: Request, res: Response) => {
  try {
    const { label, coordinates, fillColor, fillOpacity, strokeColor, strokeWeight } = req.body;
    const polygon = await prisma.polygon.create({
      data: { label, coordinates, fillColor, fillOpacity, strokeColor, strokeWeight }
    });
    res.status(201).json(polygon);
  } catch (error) {
    console.error('Error creating polygon:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

