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

randomQueue.process(async (job) => {
  console.log(`Processing job ${job.id}`);
  await new Promise((resolve) => setTimeout(resolve, 1000));
  console.log(job.data);
  return job.data;
});

randomQueue.on("error", (error) => {
  console.error("Queue error:", error);
});

randomQueue.on("failed", (job, err) => {
  console.error(`Job ${job.id} failed:`, err);
});

randomQueue.add({ foo: "bar", id: 1, data: "hello" });