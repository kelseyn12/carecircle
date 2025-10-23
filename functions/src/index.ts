import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { onCall } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();
const expo = new Expo();

// Types
interface CreateInviteData {
  circleId: string;
}

interface AcceptInviteData {
  inviteId: string;
}

interface UpdateData {
  circleId: string;
  authorId: string;
  text: string;
  photoURL?: string;
  createdAt: admin.firestore.Timestamp;
}

// Helper function to generate dynamic link
async function generateDynamicLink(inviteId: string): Promise<string> {
  const baseUrl = 'https://carecircle.page.link';
  const inviteUrl = `${baseUrl}/invite?inviteId=${inviteId}`;
  
  // In production, you would use Firebase Dynamic Links API here
  // For now, we'll return the direct URL
  return inviteUrl;
}

// Helper function to send push notification
async function sendPushNotification(
  token: string,
  title: string,
  body: string,
  data: any
): Promise<void> {
  try {
    const message: ExpoPushMessage = {
      to: token,
      sound: 'default',
      title,
      body,
      data,
    };

    const chunks = expo.chunkPushNotifications([message]);
    const tickets = [];

    for (const chunk of chunks) {
      try {
        const ticket = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticket);
      } catch (error) {
        console.error('Error sending push notification:', error);
      }
    }
  } catch (error) {
    console.error('Error in sendPushNotification:', error);
  }
}

// Cloud Function: Create Invite
export const createInvite = onCall(async (request) => {
  const data = request.data as CreateInviteData;
  const context = request.auth;
  
  // Check if user is authenticated
  if (!context) {
    throw new Error('User must be authenticated');
  }

  const { circleId } = data;
  const userId = context.uid;

  try {
    // Verify user is a member of the circle
    const circleDoc = await db.collection('circles').doc(circleId).get();
    
    if (!circleDoc.exists) {
      throw new Error('Circle not found');
    }

    const circleData = circleDoc.data();
    if (!circleData?.members?.includes(userId)) {
      throw new Error('User is not a member of this circle');
    }

    // Create invite document
    const inviteRef = db.collection('invites').doc();
    const inviteId = inviteRef.id;
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    await inviteRef.set({
      circleId,
      createdBy: userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
      oneTime: true,
    });

    // Generate dynamic link
    const dynamicLink = await generateDynamicLink(inviteId);

    return {
      inviteId,
      dynamicLink,
      expiresAt: expiresAt.toISOString(),
    };
  } catch (error) {
    console.error('Error creating invite:', error);
    throw error;
  }
});

// Cloud Function: Accept Invite
export const acceptInvite = onCall(async (request) => {
  const data = request.data as AcceptInviteData;
  const context = request.auth;
  
  // Check if user is authenticated
  if (!context) {
    throw new Error('User must be authenticated');
  }

  const { inviteId } = data;
  const userId = context.uid;

  try {
    // Get invite document
    const inviteDoc = await db.collection('invites').doc(inviteId).get();
    
    if (!inviteDoc.exists) {
      throw new Error('Invite not found');
    }

    const inviteData = inviteDoc.data();
    if (!inviteData) {
      throw new Error('Invite data not found');
    }

    // Check if invite is expired
    const now = new Date();
    const expiresAt = inviteData.expiresAt.toDate();
    if (now > expiresAt) {
      throw new Error('Invite has expired');
    }

    const { circleId } = inviteData;

    // Get circle document
    const circleDoc = await db.collection('circles').doc(circleId).get();
    if (!circleDoc.exists) {
      throw new Error('Circle not found');
    }

    const circleData = circleDoc.data();
    if (!circleData) {
      throw new Error('Circle data not found');
    }

    // Check if user is already a member
    if (circleData.members?.includes(userId)) {
      // User is already a member, just return circle info
      return {
        circleId,
        title: circleData.title,
        alreadyMember: true,
      };
    }

    // Add user to circle members
    await db.collection('circles').doc(circleId).update({
      members: admin.firestore.FieldValue.arrayUnion(userId),
    });

    // Delete invite if it's one-time
    if (inviteData.oneTime) {
      await db.collection('invites').doc(inviteId).delete();
    }

    return {
      circleId,
      title: circleData.title,
      alreadyMember: false,
    };
  } catch (error) {
    console.error('Error accepting invite:', error);
    throw error;
  }
});

// Cloud Function: Send notifications when update is created
export const onUpdateCreated = onDocumentCreated('updates/{updateId}', async (event) => {
  const updateData = event.data?.data() as UpdateData;
  const { circleId, authorId, text } = updateData;

  try {
    // Get circle document
    const circleDoc = await db.collection('circles').doc(circleId).get();
    if (!circleDoc.exists) {
      console.error('Circle not found:', circleId);
      return;
    }

    const circleData = circleDoc.data();
    if (!circleData?.members) {
      console.error('Circle has no members:', circleId);
      return;
    }

    // Get author name
    const authorDoc = await db.collection('users').doc(authorId).get();
    const authorName = authorDoc.data()?.displayName || 'Someone';

    // Get circle title
    const circleTitle = circleData.title;

    // Create notification payload
    const title = `New update in ${circleTitle}`;
    const body = `${authorName} posted an update: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`;
    const data = { circleId };

    // Get all members except the author
    const membersToNotify = circleData.members.filter((memberId: string) => memberId !== authorId);

    // Send notifications to all members
    const notificationPromises = membersToNotify.map(async (memberId: string) => {
      try {
        const userDoc = await db.collection('users').doc(memberId).get();
        const userData = userDoc.data();
        const expoPushToken = userData?.expoPushToken;
        const circlesMuted = userData?.circlesMuted || [];

        // Skip if user has muted this circle
        if (circlesMuted.includes(circleId)) {
          console.log(`Skipping notification for user ${memberId} - circle muted`);
          return;
        }

        if (expoPushToken) {
          await sendPushNotification(expoPushToken, title, body, data);
        }
      } catch (error) {
        console.error(`Error sending notification to user ${memberId}:`, error);
      }
    });

    await Promise.all(notificationPromises);
    console.log(`Sent notifications to ${membersToNotify.length} members for circle ${circleId}`);
  } catch (error) {
    console.error('Error in onUpdateCreated:', error);
  }
});