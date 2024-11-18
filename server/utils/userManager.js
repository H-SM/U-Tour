import { PrismaClient } from "@prisma/client";
import { generateCustomId } from "./../utils/idGenerator.js";

const prisma = new PrismaClient();

export async function handleUserCreation({ email, displayName }) {
  // This function only creates/gets non-Firebase users
  const existingUser = await prisma.user.findUnique({
    where: { email, migratedToFirebase: false },
  });

  if (existingUser) {
    return existingUser;
  }

  return await prisma.user.create({
    data: {
      id: generateCustomId(),
      email,
      displayName,
    },
  });
}

export async function migrateToFirebase(email, firebaseUid) {
  // Find the non-Firebase user
  const existingUser = await prisma.user.findFirst({
    where: {
      email,
      migratedToFirebase: false,
    },
  });

  if (!existingUser) {
    return { migrated: false, firebaseUid };
  }

  // Begin migration transaction
  await prisma.$transaction(async (prisma) => {
    // Update all sessions where user was the booker
    await prisma.session.updateMany({
      where: {
        bookingUserId: existingUser.id,
        isBookedByFirebaseUser: false,
      },
      data: {
        bookingUserId: firebaseUid,
        isBookedByFirebaseUser: true,
      },
    });

    // Update all sessions booked for the user
    await prisma.session.updateMany({
      where: {
        userId: existingUser.id,
        isUserFirebaseUser: false,
      },
      data: {
        userId: firebaseUid,
        isUserFirebaseUser: true,
      },
    });

    // Update teams where user was contact
    await prisma.team.updateMany({
      where: {
        contactId: existingUser.id,
        isFirebaseContact: false,
      },
      data: {
        contactId: firebaseUid,
        isFirebaseContact: true,
      },
    });

    // Mark the user as migrated
    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        migratedToFirebase: true,
        firebaseUid,
      },
    });
  });

  return { migrated: true, firebaseUid };
}

export default {
  handleUserCreation,
  migrateToFirebase
 };
