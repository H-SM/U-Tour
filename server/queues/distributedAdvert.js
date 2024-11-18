const Queue = require('bull');
const { PrismaClient } = require('@prisma/client');
const sgMail = require('@sendgrid/mail');

class SessionQueueManager {
  constructor() {
    this.prisma = new PrismaClient();
    this.sessionQueue = new Queue('session-queue', process.env.REDIS_URL);
    
    // Configure queue processing
    this.setupQueueProcessing();
    // this.setupNotificationJobs();
  }

  async setupQueueProcessing() {
    this.sessionQueue.process(async (job) => {
      const { sessionId } = job.data;
      
      // Fetch session details
      const session = await this.prisma.session.findUnique({
        where: { id: sessionId },
        include: { team: true }
      });

      // Slot allocation logic
      const slotsRequired = session.team ? session.team.size : 1;
      const availableSlots = await this.checkAvailableSlotsForTimeslot(
        session.departureTime, 
        slotsRequired
      );

      if (availableSlots) {
        // Proceed with session allocation
        await this.allocateSession(session);
      } else {
        // Reschedule or handle overflow
        await this.handleSessionOverflow(session);
      }
    });
  }

  async checkAvailableSlotsForTimeslot(departureTime, requiredSlots) {
    const hourStart = new Date(departureTime);
    hourStart.setMinutes(0, 0, 0);
    const hourEnd = new Date(hourStart);
    hourEnd.setHours(hourStart.getHours() + 1);

    const existingSessions = await this.prisma.session.findMany({
      where: {
        departureTime: {
          gte: hourStart,
          lt: hourEnd
        },
        state: {
          not: 'CANCEL'
        }
      },
      include: { team: true }
    });

    const currentOccupancy = existingSessions.reduce((total, session) => 
      total + (session.team ? session.team.size : 1), 0);

    return currentOccupancy + requiredSlots <= 8;
  }

  async allocateSession(session) {
    // Update session state to ACTIVE
    await this.prisma.session.update({
      where: { id: session.id },
      data: { state: 'ACTIVE' }
    });
  }

  async handleSessionOverflow(session) {
    // Find next available timeslot
    const nextHourSlot = new Date(session.departureTime);
    nextHourSlot.setHours(nextHourSlot.getHours() + 1);

    // Attempt to reschedule
    await this.prisma.session.update({
      where: { id: session.id },
      data: { departureTime: nextHourSlot }
    });

    // Re-add to queue
    await this.addSessionToQueue(session.id);
  }

  async addSessionToQueue(sessionId) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { team: true }
    });

    await this.sessionQueue.add(
      { sessionId },
      { 
        delay: 0, 
        priority: this.calculatePriority(session) 
      }
    );
  }

  calculatePriority(session) {
    // Priority based on departure time and team size
    const teamMultiplier = session.team ? session.team.size : 1;
    return Date.parse(session.departureTime) / teamMultiplier;
  }

  async setupNotificationJobs() {
    // Create a separate queue for notifications
    const notificationQueue = new Queue('session-notifications', process.env.REDIS_URL);

    notificationQueue.process(async (job) => {
      const { sessionId } = job.data;
      const session = await this.prisma.session.findUnique({
        where: { id: sessionId },
        include: { user: true }
      });

      // Send notification email
      await this.sendNotificationEmail(session);
    });

    // Schedule notifications for all active sessions
    this.scheduleSessionNotifications();
  }

  async scheduleSessionNotifications() {
    const upcomingSessions = await this.prisma.session.findMany({
      where: {
        departureTime: {
          gte: new Date(),
          lt: new Date(Date.now() + 24 * 60 * 60 * 1000) // next 24 hours
        },
        state: {
          not: 'CANCEL'
        }
      }
    });

    for (const session of upcomingSessions) {
      const notificationTime = new Date(session.departureTime);
      notificationTime.setHours(notificationTime.getHours() - 1);

      //TODO:
    //   await notificationQueue.add(
    //     { sessionId: session.id },
    //     { 
    //       delay: notificationTime.getTime() - Date.now(),
    //       removeOnComplete: true
    //     }
    //   );
    }
  }

  async sendNotificationEmail(session) {
    const msg = {
      to: session.userEmail,
      from: process.env.SENDGRID_SENDER,
      subject: 'Upcoming Tour Reminder',
      html: `Your tour to ${session.to} is starting in one hour!`
    };

    await sgMail.send(msg);
  }

  // API-like methods for external interaction
  async getAvailableSlots(date) {
    const dayStart = new Date(date);
    const dayEnd = new Date(date);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const hourlySlots = {};
    for (let hour = 9; hour <= 17; hour++) {
      const hourStart = new Date(date);
      hourStart.setHours(hour, 0, 0, 0);
      const hourEnd = new Date(hourStart);
      hourEnd.setHours(hourStart.getHours() + 1);

      const existingSessions = await this.prisma.session.findMany({
        where: {
          departureTime: {
            gte: hourStart,
            lt: hourEnd
          },
          state: {
            not: 'CANCEL'
          }
        },
        include: { team: true }
      });

      const currentOccupancy = existingSessions.reduce((total, session) => 
        total + (session.team ? session.team.size : 1), 0);

      hourlySlots[hour] = {
        availableSpots: 8 - currentOccupancy,
        sessions: existingSessions
      };
    }

    return hourlySlots;
  }

  async cancelSession(sessionId) {
    // Remove from queue and update session state
    await this.sessionQueue.removeJobs(sessionId);
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { state: 'CANCEL' }
    });
  }
}

module.exports = new SessionQueueManager();