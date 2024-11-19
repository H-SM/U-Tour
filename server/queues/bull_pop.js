import Bull from "bull";
import dotenv from "dotenv";
dotenv.config();

const randomQueue = new Bull("random-queue", {
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
    // ssl: true,
    tls: {},
    connectTimeout: 10000,
    maxRetriesPerRequest: 3
  },
});

// Function to display all jobs in the queue
async function displayQueueData() {
  try {
    // Get all waiting jobs
    const waitingJobs = await randomQueue.getWaiting();
    console.log('\nWaiting Jobs:');
    for (const job of waitingJobs) {
      console.log(`Job ${job.id}:`, job.data);
    }

    // Get all active jobs
    const activeJobs = await randomQueue.getActive();
    console.log('\nActive Jobs:');
    for (const job of activeJobs) {
      console.log(`Job ${job.id}:`, job.data);
    }

    // Get completed jobs
    const completedJobs = await randomQueue.getCompleted();
    console.log('\nCompleted Jobs:');
    for (const job of completedJobs) {
      console.log(`Job ${job.id}:`, job.data);
    }
  } catch (error) {
    console.error('Error displaying queue data:', error);
  }
}

// Function to manually process and remove a job
async function processNextJob() {
  try {
    // Get the next job without processing it
    const job = await randomQueue.getNextJob();
    
    if (job) {
      console.log(`\nProcessing job ${job.id}`);
      console.log('Job data:', job.data);
      
      // Manually complete the job
      await job.moveToCompleted();
      await job.remove();
      console.log(`Job ${job.id} processed and removed`);
    } else {
      console.log('No jobs in queue');
    }
  } catch (error) {
    console.error('Error processing job:', error);
  }
}

// Error handling
randomQueue.on("error", (error) => {
  console.error("Queue error:", error);
});

randomQueue.on("failed", (job, err) => {
  console.error(`Job ${job.id} failed:`, err);
});

// Example usage
async function main() {
  // Add some example jobs
  await randomQueue.add({ foo: "bar", id: 1, data: "hello" });
  await randomQueue.add({ foo: "baz", id: 2, data: "world" });
  
  // Display initial queue state
  console.log('Initial queue state:');
  await displayQueueData();
  
  // Process and remove jobs one by one
  console.log('\nProcessing jobs:');
  await processNextJob();
  await processNextJob();
  
  // Display final queue state
  console.log('\nFinal queue state:');
  await displayQueueData();
  
  // Close the queue connection when done
  await randomQueue.close();
}

main().catch(console.error);