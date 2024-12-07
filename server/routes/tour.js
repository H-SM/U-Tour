import express from "express";
import { PrismaClient } from "@prisma/client";
import { generateCustomId } from "./../utils/idGenerator.js";

const router = express.Router();
const prisma = new PrismaClient();
import admin from "firebase-admin";

import {
  addTourToQueue,
  peekNextTour,
  cleanEmptyTours,
  displayTourQueueStatus,
  getAllQueuedTours,
  getAllQueuedToursConcise,
  tourQueue,
  removeEmptyTours,
  processExpiredTours,
  popTopTourFromQueue,
} from "./../queues/tourQueue.js";

import sgMail from "@sendgrid/mail";
import { htmlTemplate } from "../templates/template.js";
import { generateResponse, locations } from "../utils/constant.js";
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const formatLocation = (locationValue) => {
  const foundLocation = locations.find(
    (location) => location.value === locationValue
  );
  return foundLocation ? foundLocation.label : locationValue;
};

const convertToIST = (date) => {
  // Create a new Date object to avoid mutating the original
  const istDate = new Date(date);

  // Assuming your server is in UTC, convert to IST (UTC+5:30)
  istDate.setHours(istDate.getHours() + 5);
  istDate.setMinutes(istDate.getMinutes() + 30);

  return istDate;
};

// Create a new tour or add session to existing tour
async function manageTourForSession(session) {
  const sessionTimestamp = new Date(session.departureTime);
  // const hourStart = new Date(
  //   sessionTimestamp.getFullYear(),
  //   sessionTimestamp.getMonth(),
  //   sessionTimestamp.getDate(),
  //   sessionTimestamp.getHours(),
  //   0,
  //   0
  // );

  // Check if a tour exists for this timestamp
  let tour = await prisma.tour.findFirst({
    where: {
      timestamp: sessionTimestamp,
    },
    include: {
      sessions: true,
    },
  });

  //TODO: think about how to handle the destination and the starting point for a tour
  // Changed to a single session tour for now
  const sessionTeamSize = session.team ? session.team.size : 1;
  // const totalCurrentSize = tour ? tour.totalSize : 0;

  // Special case: Single team with > 10 members gets its own tour
  // if (sessionTeamSize > 10 && !tour) {
  //   tour = await prisma.tour.create({
  //     data: {
  //       id: generateCustomId(),
  //       timestamp: hourStart,
  //       totalSize: sessionTeamSize,
  //       sessions: {
  //         connect: { id: session.id },
  //       },
  //     },
  //   });

  //   // Add tour to queue
  //   await addTourToQueue(tour);
  //   return tour.id;
  // }

  // If no existing tour
  if (!tour) {
    tour = await prisma.tour.create({
      data: {
        id: generateCustomId(),
        timestamp: sessionTimestamp,
        totalSize: sessionTeamSize,
        to: session.to,
        from: session.from,
        sessions: {
          connect: { id: session.id },
        },
      },
    });

    // Add tour to queue
    await addTourToQueue(tour);
  } else {
    // Throw an error if the hour is fully booked
    throw new Error(
      "This hour is fully booked. No more sessions can be added."
    );
  }

  // if (!tour) {
  //   tour = await prisma.tour.create({
  //     data: {
  //       id: generateCustomId(),
  //       timestamp: hourStart,
  //       totalSize: sessionTeamSize,
  //       sessions: {
  //         connect: { id: session.id },
  //       },
  //     },
  //   });

  //   // Add tour to queue
  //   await addTourToQueue(tour);
  // } else if (totalCurrentSize + sessionTeamSize > 10) {
  //   // Throw an error if the hour is fully booked
  //   throw new Error(
  //     "This hour is fully booked. No more sessions can be added."
  //   );
  // } else {
  //   // Add to existing tour
  //   tour = await prisma.tour.update({
  //     where: { id: tour.id },
  //     data: {
  //       totalSize: totalCurrentSize + sessionTeamSize,
  //       sessions: {
  //         connect: { id: session.id },
  //       },
  //     },
  //   });
  // }
  return tour.id;
}

// Route to process next tour and update session states
router.post("/pop-tour", async (req, res) => {
  try {
    const { state, message } = req.body;
    if (!["ACTIVE", "CANCEL"].includes(state)) {
      const result = generateResponse(false, "Invalid state. Must be either 'ACTIVE' or 'CANCEL'");
      return res.status(400).json(result);
    }
    let customMessage = message;
    if (state == "CANCEL" && !customMessage) {
      customMessage =
        "Robot was under maintenance, please try making another booking.";
    }
    const topTour = await popTopTourFromQueue();
    if (!topTour) {
      const result = generateResponse(false, "No tours in queue");
      return res.status(404).json(result);
    }
    // Update sessions and get the updated sessions in one operation
    const updateResult = await prisma.session.updateMany({
      where: { tourId: topTour.tourId },
      data: {
        state,
        ...(customMessage && { message: customMessage }),
      },
    });

    // If state is ACTIVE, send email notifications to all users in the tour
    if (state == "ACTIVE") {
      // Fetch sessions with updated state directly
      const sessions = await prisma.session.findMany({
        where: { 
          tourId: topTour.tourId,
          state: "ACTIVE" 
        },
        include: {
          team: true,
        },
      });

      // Send emails to all session users
      const emailPromises = sessions.map(async (session) => {
        let userEmail, userName;
        try {
          const userRecord = await admin.auth().getUser(session.userId);
          userEmail = userRecord.email;
          userName = userRecord.displayName;
        } catch (firebaseError) {
          const prismaUser = await prisma.user.findUnique({
            where: { id: session.userId },
          });
          if (!prismaUser) {
            console.error(`User not found for session ${session.id}`);
            return;
          }
          userEmail = prismaUser.email;
          userName = prismaUser.displayName;
        }
        // Format the date and time
        const departureTime = new Date(session.departureTime);
        const formattedTime = departureTime.toLocaleString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
        const emailData = {
          To: formatLocation(session.to),
          From: formatLocation(session.from),
          Time: formattedTime,
          TourType: session.tourType || "Standard Tour",
        };
        const combinedMsg = {
          personalizations: [
            {
              to: [{ email: userEmail }],
              substitutions: {
                ...emailData,
                Name: userName || "Valued Customer",
                Email: userEmail,
                Role: "Please reach the starting point.",
                AdditionalInfo:
                  "Please arrive 5 minutes before your scheduled departure time. Your robot guide will be waiting at the starting location.",
              },
            },
          ],
          from: process.env.SENDGRID_SENDER,
          subject: "Your U Robot Tour Guide Session is Starting!",
          html: htmlTemplate,
        };
        await sgMail.send(combinedMsg);
        console.log(`Email sent successfully to ${userEmail}`);
      });
      // Wait for all emails to be sent
      await Promise.all(emailPromises);
    }
    const result = generateResponse(true, `Tour ${topTour.tourId} processed successfully`, {
      updatedState: state,
      tour: topTour,
      updatedCount: updateResult.count,
    });
    res.json(result);
  } catch (error) {
    console.error("Error processing next tour:", error);
    const result = generateResponse(false, "Failed to process next tour");
    res.status(500).json(result);
  }
});

// Route to update all session states for a specific tour
router.patch("/:tourId/sessions", async (req, res) => {
  try {
    const { tourId } = req.params;
    const { state, message } = req.body;

    if (!["DONE", "ACTIVE", "QUEUED", "CANCEL", "ERROR"].includes(state)) {
      const result = generateResponse(false, "Invalid session state");
      return res.status(400).json(result);
    }

    // First verify the tour exists
    const tour = await prisma.tour.findUnique({
      where: { id: tourId },
      include: { sessions: true },
    });

    if (!tour) {
      const result = generateResponse(false, "Tour not found");
      return res.status(404).json(result);
    }

    // Update all sessions for this tour
    const updatedSessions = await prisma.session.updateMany({
      where: { tourId },
      data: {
        state,
        ...(message && { message }),
      },
    });

    // If the state is CANCEL, we might want to remove the tour from the queue
    if (state === "CANCEL") {
      await removeEmptyTours();
    }

    const result = generateResponse(true, `Updated ${updatedSessions.count} sessions for tour ${tourId}`, {
      tourId,
      newState: state,
      updatedCount: updatedSessions.count,
    });
    res.json(result);
  } catch (error) {
    console.error("Error updating tour sessions:", error);
    const result = generateResponse(false, "Failed to update tour sessions");
    res.status(500).json(result);
  }
});

// New route to get next tour in queue
router.get("/next-tour", async (req, res) => {
  try {
    const nextTour = await peekNextTour();
    if (!nextTour) {
      const result = generateResponse(false, "No tours in queue");
      return res.status(404).json(result);
    }
    const result = generateResponse(true, null, nextTour);
    res.json(result);
  } catch (error) {
    console.error("Error fetching next tour:", error);
    const result = generateResponse(false, "Failed to fetch next tour");
    res.status(500).json(result);
  }
});

// Add new routes to the existing router in your tours route file
router.post("/remove-empty-tours", async (req, res) => {
  try {
    await removeEmptyTours();
    const result = generateResponse(true, "Empty tours removed successfully");
    res.json(result);
  } catch (error) {
    console.error("Error removing empty tours:", error);
    const result = generateResponse(false, "Failed to remove empty tours");
    res.status(500).json(result);
  }
});

router.post("/process-expired-tours", async (req, res) => {
  try {
    await processExpiredTours();
    const result = generateResponse(true, "Expired tours processed successfully");
    res.json(result);
  } catch (error) {
    console.error("Error processing expired tours:", error);
    const result = generateResponse(false, "Failed to process expired tours");
    res.status(500).json(result);
  }
});

router.post("/pop-top-tour", async (req, res) => {
  try {
    const topTour = await popTopTourFromQueue();
    if (!topTour) {
      const result = generateResponse(false, "No tours in queue");
      return res.status(404).json(result);
    }
    const result = generateResponse(true, null, topTour);
    res.json(result);
  } catch (error) {
    console.error("Error popping top tour:", error);
    const result = generateResponse(false, "Failed to pop top tour");
    res.status(500).json(result);
  }
});

// Route to get next tour by priority (without removing)
router.get("/next-tour-priority", async (req, res) => {
  try {
    const queuedTours = await getAllQueuedTours();

    if (queuedTours.length === 0) {
      const result = generateResponse(false, "No tours in queue");
      return res.status(404).json(result);
    }

    // Return the first (highest priority) tour
    const result = generateResponse(true, null, queuedTours[0]);
    res.json(result);
  } catch (error) {
    console.error("Error fetching next tour by priority:", error);
    const result = generateResponse(false, "Failed to fetch next tour by priority");
    res.status(500).json(result);
  }
});

// Route to get all queued tours
router.get("/queued-tours", async (req, res) => {
  try {
    const queuedTours = await getAllQueuedTours();
    const result = generateResponse(true, null, queuedTours);
    res.json(result);
  } catch (error) {
    console.error("Error fetching queued tours:", error);
    const result = generateResponse(false, "Failed to fetch queued tours");
    res.status(500).json(result);
  }
});

router.get("/queued-tours-concise", async (req, res) => {
  try {
    const queuedTours = await getAllQueuedToursConcise();
    const result = generateResponse(true, null, queuedTours);
    res.json(result);
  } catch (error) {
    console.error("Error fetching queued tours:", error);
    const result = generateResponse(false, "Failed to fetch queued tours");
    res.status(500).json(result);
  }
});

// Route to clean up empty tours
router.get("/cleanup", async (req, res) => {
  try {
    const startTime = new Date();
    console.log(`[${startTime.toISOString()}] Starting daily tour cleanup`);

    // Run cleanup tasks
    await cleanEmptyTours();
    console.log(`[${new Date().toISOString()}] Cleaned empty tours`);

    await processExpiredTours();
    console.log(`[${new Date().toISOString()}] Processed expired tours`);

    const endTime = new Date();
    const duration = endTime - startTime;

    console.log(
      `[${endTime.toISOString()}] Cleanup completed in ${duration}ms`
    );

    res.json({
      message: "Tour cleanup completed",
      timestamp: endTime.toISOString(),
      duration: `${duration}ms`,
    });
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] Error during tour cleanup:`,
      error
    );
    res.status(500).json({ error: "Failed to clean up tours" });
  }
});

// Route to display queue status
router.get("/queue-status", async (req, res) => {
  try {
    const waitingJobs = await tourQueue.getWaiting();
    const activeJobs = await tourQueue.getActive();
    const completedJobs = await tourQueue.getCompleted();
    displayTourQueueStatus();
    const result = generateResponse(true, null, {
      waitingJobs: waitingJobs.length,
      activeJobs: activeJobs.length,
      completedJobs: completedJobs.length,
    });
    res.json(result);
  } catch (error) {
    console.error("Error fetching queue status:", error);
    const result = generateResponse(false, "Failed to fetch queue status");
    res.status(500).json(result);
  }
});

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
      const result = generateResponse(false, "Tour not found");
      return res.status(404).json(result);
    }

    const result = generateResponse(true, null, tour);
    res.json(result);
  } catch (error) {
    console.error("Error fetching tour details:", error);
    const result = generateResponse(false, "Failed to fetch tour details");
    res.status(500).json(result);
  }
});

// Get fully booked hours for a specific day
router.post("/booked-hours", async (req, res) => {
  try {
    const { date } = req.body;
    if (!date) {
      const result = generateResponse(false, "Date is required");
      return res.status(400).json(result);
    }
    // Convert the input date to IST
    const inputDate = new Date(date);
    console.log(inputDate);
    const istDate = new Date(inputDate);

    // Set to start of day in IST
    istDate.setHours(0, 0, 0, 0);

    const endOfDay = new Date(istDate);
    endOfDay.setDate(endOfDay.getDate() + 1);

    console.log(istDate, endOfDay);
    const tours = await prisma.tour.findMany({
      where: {
        timestamp: {
          gte: istDate,
          lt: endOfDay,
        },
      },
    });

    console.log(tours);
    const bookedHoursWithSize = tours.map((tour) => {
      // Convert tour timestamp to IST
      const istTourTimestamp = new Date(
        tour.timestamp.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
      );

      return {
        hour: istTourTimestamp.getHours(),
        totalSize: tour.totalSize,
      };
    });

    const result = generateResponse(true, null, bookedHoursWithSize);
    res.json(result);
  } catch (error) {
    console.error("Error fetching booked hours:", error);
    const result = generateResponse(false, "Failed to fetch booked hours");
    res.status(500).json(result);
  }
});

// Get all sessions for a specific day
router.post("/day-sessions", async (req, res) => {
  try {
    const { date } = req.body;
    if (!date) {
      const result = generateResponse(false, "Date is required");
      return res.status(400).json(result);
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

    const result = generateResponse(true, null, tours);
    res.json(result);
  } catch (error) {
    console.error("Error fetching day sessions:", error);
    const result = generateResponse(false, "Failed to fetch day sessions");
    res.status(500).json(result);
  }
});

// Get all tours for a specific day
router.post("/day-tours", async (req, res) => {
  try {
    const { date } = req.body;
    if (!date) {
      const result = generateResponse(false, "Date is required");
      return res.status(400).json(result);
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
    const result = generateResponse(true, null, tours);
    res.json(result);
  } catch (error) {
    console.error("Error fetching day sessions:", error);
    const result = generateResponse(false, "Failed to fetch day sessions");
    res.status(500).json(result);
  }
});

export { manageTourForSession };
export default router;
