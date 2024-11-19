import express from "express";
import { PrismaClient } from "@prisma/client";
import { generateCustomId } from "./../utils/idGenerator.js";

const router = express.Router();
const prisma = new PrismaClient();

// Create a new tour or add session to existing tour
async function manageTourForSession(session) {
  const sessionTimestamp = new Date(session.departureTime);
  const hourStart = new Date(
    sessionTimestamp.getFullYear(),
    sessionTimestamp.getMonth(),
    sessionTimestamp.getDate(),
    sessionTimestamp.getHours(),
    0,
    0
  );

  // Check if a tour exists for this timestamp
  let tour = await prisma.tour.findFirst({
    where: {
      timestamp: hourStart,
    },
    include: {
      sessions: true,
    },
  });

  const sessionTeamSize = session.team ? session.team.size : 1;
  const totalCurrentSize = tour ? tour.totalSize : 0;

  // Special case: Single team with > 10 members gets its own tour
  if (sessionTeamSize > 10 && !tour) {
    tour = await prisma.tour.create({
      data: {
        id: generateCustomId(),
        timestamp: hourStart,
        totalSize: sessionTeamSize,
        sessions: {
          connect: { id: session.id },
        },
      },
    });
    return tour.id;
  }

  // If no existing tour
  if (!tour) {
    tour = await prisma.tour.create({
      data: {
        id: generateCustomId(),
        timestamp: hourStart,
        totalSize: sessionTeamSize,
        sessions: {
          connect: { id: session.id },
        },
      },
    });
  } else if (totalCurrentSize + sessionTeamSize > 10) {
    // Throw an error if the hour is fully booked
    throw new Error(
      "This hour is fully booked. No more sessions can be added."
    );
  } else {
    // Add to existing tour
    await prisma.tour.update({
      where: { id: tour.id },
      data: {
        totalSize: totalCurrentSize + sessionTeamSize,
        sessions: {
          connect: { id: session.id },
        },
      },
    });
  }
  return tour.id;
}

// Get tour details with sessions and team information
router.get("/:tourId", async (req, res) => {
  try {
    const { tourId } = req.params;

    const tour = await prisma.tour.findUnique({
      where: { id: tourId },
      include: {
        sessions: {
          include: {
            team: true,
          },
        },
      },
    });

    if (!tour) {
      return res.status(404).json({ error: "Tour not found" });
    }

    res.json(tour);
  } catch (error) {
    console.error("Error fetching tour details:", error);
    res.status(500).json({ error: "Failed to fetch tour details" });
  }
});

// Get fully booked hours for a specific day
router.post("/booked-hours", async (req, res) => {
  try {
    const { date } = req.body;
    if (!date) {
      return res.status(400).json({ error: "Date is required" });
    }
    const startOfDay = new Date(date);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const tours = await prisma.tour.findMany({
      where: {
        timestamp: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
    });

    const bookedHoursWithSize = tours.map((tour) => ({
      hour: tour.timestamp.getHours(),
      totalSize: tour.totalSize,
    }));

    res.json(bookedHoursWithSize);
  } catch (error) {
    console.error("Error fetching booked hours:", error);
    res.status(500).json({ error: "Failed to fetch booked hours" });
  }
});

// Get all sessions for a specific day
router.post("/day-sessions", async (req, res) => {
  try {
    const { date } = req.body;
    if (!date) {
      return res.status(400).json({ error: "Date is required" });
    }

    const startOfDay = new Date(date);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const tours = await prisma.tour.findMany({
      where: {
        timestamp: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
      include: {
        sessions: {
          include: {
            team: true,
          },
        },
      },
      orderBy: {
        timestamp: "asc",
      },
    });

    res.json(tours);
  } catch (error) {
    console.error("Error fetching day sessions:", error);
    res.status(500).json({ error: "Failed to fetch day sessions" });
  }
});

// Get all tours for a specific day
router.post("/day-tours", async (req, res) => {
  try {
    const { date } = req.body;
    if (!date) {
      return res.status(400).json({ error: "Date is required" });
    }

    const startOfDay = new Date(date);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const tours = await prisma.tour.findMany({
      where: {
        timestamp: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
      orderBy: {
        timestamp: "asc",
      },
    });

    res.json(tours);
  } catch (error) {
    console.error("Error fetching day sessions:", error);
    res.status(500).json({ error: "Failed to fetch day sessions" });
  }
});

export { manageTourForSession };
export default router;
