import Bull from "bull";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { locations } from "../utils/constant.js"; 

dotenv.config();
const prisma = new PrismaClient();

// Create a queue for tours
const tourQueue = new Bull("tour-queue", {
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
    tls: {},
    connectTimeout: 10000,
    maxRetriesPerRequest: 3,
  },
  defaultJobOptions: {
    priority: 1, // Lower number means higher priority
    removeOnComplete: false,
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
  },
});

// Function to add a tour to the queue
async function addTourToQueue(tour) {
  try {
    // Use timestamp as priority (earlier timestamps have higher priority)
    const job = await tourQueue.add(
      {
        tourId: tour.id,
        timestamp: tour.timestamp,
      },
      {
        priority: tour.timestamp.getTime(),
        jobId: tour.id, // Use tour ID as unique job identifier
      }
    );
    return job;
  } catch (error) {
    console.error("Error adding tour to queue:", error);
  }
}

// Function to check and remove empty tours from queue
async function cleanEmptyTours() {
  const jobs = await tourQueue.getCompleted();
  for (const job of jobs) {
    const tour = await prisma.tour.findUnique({
      where: { id: job.data.tourId },
      include: { sessions: true },
    });

    if (!tour || tour.sessions.length === 0) {
      await job.remove();
      if (tour) {
        await prisma.tour.delete({
          where: { id: tour.id },
        });
      }
    }
  }
}

// Function to get the next tour in queue without removing it
async function peekNextTour() {
  const jobs = await tourQueue.getCompleted();
  if (jobs.length > 0) {
    // Sort jobs by priority (timestamp)
    const sortedJobs = jobs.sort((a, b) => a.opts.priority - b.opts.priority);
    const nextJob = sortedJobs[0];
    return {
      jobId: nextJob.id,
      tourId: nextJob.data.tourId,
      timestamp: new Date(nextJob.data.timestamp),
    };
  }
  return null;
}

// remove empty tours from the queue
async function removeEmptyTours() {
  try {
    const jobs = await tourQueue.getJobs([
      "waiting", 
      "active", 
      "delayed", 
      "completed"
    ]);

    for (const job of jobs) {
      const tour = await prisma.tour.findUnique({
        where: { id: job.data.tourId },
        include: { sessions: true }
      });

      // Remove tour if it has no sessions
      if (!tour || tour.sessions.length === 0) {
        await job.remove();
        console.log(`Removed empty tour ${tour.id} from queue`);
        if (tour) {
          await prisma.tour.delete({
            where: { id: tour.id }
          });
        }
      }
    }
  } catch (error) {
    console.error("Error removing empty tours:", error);
  }
}

// New function to handle expired tours
async function processExpiredTours() {
  try {
    const currentTime = new Date();
    const jobs = await tourQueue.getJobs([
      "waiting", 
      "active", 
      "delayed", 
      "completed"
    ]);

    for (const job of jobs) {
      const jobTimestamp = new Date(job.data.timestamp);
      
      // Check if tour is expired
      if (jobTimestamp < currentTime) {
        const tour = await prisma.tour.findUnique({
          where: { id: job.data.tourId },
          include: { sessions: true }
        });

        if (tour) {
          // Update all associated sessions
          await prisma.session.updateMany({
            where: { tourId: tour.id },
            data: { 
              state: "CANCEL",
              message: "The session wasn't able to get queued, it missed the timeline. Please try making another session"
            }
          });
          console.log(`Expired tour ${tour.id} removed from queue`);
          // Remove the job from the queue
          await job.remove();
        }
      }
    }
  } catch (error) {
    console.error("Error processing expired tours:", error);
  }
}

// New function to pop the top tour from the queue
async function popTopTourFromQueue() {
  try {
    // Get all jobs sorted by priority
    const jobs = await tourQueue.getJobs([
      "waiting", 
      "active", 
      "delayed", 
      "completed"
    ]);

    // Sort jobs by priority (timestamp)
    const sortedJobs = jobs.sort((a, b) => a.opts.priority - b.opts.priority);

    if (sortedJobs.length === 0) {
      return null;
    }

    // Get the top job
    const topJob = sortedJobs[0];
    
    // Fetch complete tour details
    const tour = await prisma.tour.findUnique({
      where: { id: topJob.data.tourId },
      include: {
        sessions: {
          include: {
            team: true
          }
        }
      }
    });

    // Remove the job from the queue
    await topJob.remove();

    return {
      jobId: topJob.id,
      tourId: topJob.data.tourId,
      timestamp: new Date(topJob.data.timestamp),
      tourDetails: tour
    };
  } catch (error) {
    console.error("Error popping top tour from queue:", error);
    return null;
  }
}

async function getAllQueuedToursRemoving() {
  const waitingJobs = await tourQueue.getWaiting();
  const activeJobs = await tourQueue.getActive();

  // Combine and sort jobs
  const allJobs = [...waitingJobs, ...activeJobs].sort(
    (a, b) => a.opts.priority - b.opts.priority
  );

  // Map jobs to tour details
  const queuedTours = await Promise.all(
    allJobs.map(async (job) => {
      const tour = await prisma.tour.findUnique({
        where: { id: job.data.tourId },
        include: {
          sessions: {
            include: {
              team: true,
            },
          },
        },
      });

      return {
        jobId: job.id,
        tourId: job.data.tourId,
        timestamp: new Date(job.data.timestamp),
        priority: job.opts.priority,
        tourDetails: tour,
      };
    })
  );

  return queuedTours;
}

async function getAllQueuedTours() {
  const jobs = await tourQueue.getJobs([
    "waiting",
    "active",
    "delayed",
    "completed",
  ]);

  // Safely sort jobs by priority without modifying the queue
  const sortedJobs = [...jobs].sort(
    (a, b) => a.opts.priority - b.opts.priority
  );

  // Map jobs to tour details
  const queuedTours = await Promise.all(
    sortedJobs.map(async (job) => {
      const tour = await prisma.tour.findUnique({
        where: { id: job.data.tourId },
        include: {
          sessions: {
            include: {
              team: true,
            },
          },
        },
      });

      return {
        jobId: job.id,
        tourId: job.data.tourId,
        timestamp: new Date(job.data.timestamp),
        priority: job.opts.priority,
        state: job.state,
        tourDetails: tour,
      };
    })
  );

  return queuedTours;
}

const formatLocation = (locationValue) => {
  const foundLocation = locations.find(location => location.value === locationValue);
  return foundLocation ? foundLocation.label : locationValue;
};

async function getAllQueuedToursConcise() {
  const jobs = await tourQueue.getJobs([
    "waiting",
    "active",
    "delayed",
    "completed",
  ]);

  // Safely sort jobs by priority without modifying the queue
  const sortedJobs = [...jobs].sort(
    (a, b) => a.opts.priority - b.opts.priority
  );

  // Map jobs to tour details

  const queuedTours = await Promise.all(
    sortedJobs.map(async (job) => {
      const tour = await prisma.tour.findUnique({
        where: { id: job.data.tourId },
      });

      return {
        jobId: job.id,
        tourId: job.data.tourId,
        timestamp: new Date(job.data.timestamp),
        priority: job.opts.priority,
        state: job.state,
        to: formatLocation(tour.to),
        from: formatLocation(tour.from),
      };
    })
  );

  return queuedTours;
}

// Error handling
tourQueue.on("error", (error) => {
  console.error("Tour Queue Error:", error);
});

tourQueue.on("failed", (job, err) => {
  console.error(`Tour Job ${job.id} failed:`, err);
});

// Process tours (example processor)
tourQueue.process(async (job) => {
  const { tourId, timestamp } = job.data;

  try {
    // Fetch tour details
    const tour = await prisma.tour.findUnique({
      where: { id: tourId },
      include: { sessions: true },
    });

    // Process tour logic here
    console.log(`Processing Tour ${tourId} at ${timestamp}`);

    // Optional: Implement tour processing logic
    return { success: true, tourId };
  } catch (error) {
    console.error(`Error processing tour ${tourId}:`, error);
    throw error;
  }
});

// Utility function to display queue status
async function displayTourQueueStatus() {
  try {
    const waitingJobs = await tourQueue.getWaiting();
    const activeJobs = await tourQueue.getActive();
    const completedJobs = await tourQueue.getCompleted();

    console.log("\nTour Queue Status:");
    console.log("Waiting Jobs:", waitingJobs.length);
    console.log("Active Jobs:", activeJobs.length);
    console.log("Completed Jobs:", completedJobs.length);

    const nextTour = await peekNextTour();
    if (nextTour) {
      console.log("Next Tour in Queue:", nextTour);
    }
  } catch (error) {
    console.error("Error displaying tour queue status:", error);
  }
}

// Cron job to clean up empty tours (can be run periodically)
async function runTourCleanup() {
  await cleanEmptyTours();
}

export {
  tourQueue,
  addTourToQueue,
  peekNextTour,
  cleanEmptyTours,
  displayTourQueueStatus,
  getAllQueuedTours,
  getAllQueuedToursConcise,
  runTourCleanup,
  removeEmptyTours,
  processExpiredTours,
  popTopTourFromQueue
};
