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

interface SubmitJoinRequestData {
  circleId: string;
  displayName: string;
  relation: string;
  inviteId?: string;
}

interface OwnerJoinRequestActionData {
  circleId: string;
  requestId: string;
}

interface UpdateData {
  circleId: string;
  authorId: string;
  text: string;
  photoURL?: string;
  createdAt: admin.firestore.Timestamp;
}

// Helper function to generate invite link
async function generateInviteLink(inviteId: string): Promise<string> {
  const baseUrl = 'https://care-circle-15fd5.web.app';
  const inviteUrl = `${baseUrl}/inviteRedirect/${inviteId}`;
  
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
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
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
  try {
    const { circleId } = request.data as CreateInviteData;
    const userId = request.auth?.uid;

    if (!userId) {
      throw new Error('User must be authenticated');
    }

    if (!circleId) {
      throw new Error('Circle ID is required');
    }

    // Check if user is a member of the circle
    const circleDoc = await db.collection('circles').doc(circleId).get();
    if (!circleDoc.exists) {
      throw new Error('Circle not found');
    }

    const circleData = circleDoc.data()!;
    if (!circleData.members?.includes(userId)) {
      throw new Error('User is not a member of this circle');
    }

    // Create invite document
    const inviteId = db.collection('invites').doc().id;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    await db.collection('invites').doc(inviteId).set({
      circleId,
      createdBy: userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
      oneTime: true,
    });

    // Generate invite link
    const inviteLink = await generateInviteLink(inviteId);

    return {
      inviteId,
      inviteLink,
      expiresAt: expiresAt.toISOString(),
    };
  } catch (error) {
    console.error('Error creating invite:', error);
    throw error;
  }
});

// Cloud Function: Get Invite Info (for client to validate invite and resolve circleId)
export const getInviteInfo = onCall(async (request) => {
  try {
    const { inviteId } = request.data as { inviteId: string };
    // Optional: require auth but do not require membership
    const userId = request.auth?.uid;
    if (!userId) {
      throw new Error('User must be authenticated');
    }
    if (!inviteId) {
      throw new Error('Invite ID is required');
    }

    const inviteDoc = await db.collection('invites').doc(inviteId).get();
    if (inviteDoc.exists) {
      const data = inviteDoc.data()!;
      return {
        circleId: data.circleId,
        expiresAt: data.expiresAt ? data.expiresAt.toDate().toISOString() : null,
      };
    }

    // Fallback: treat code as a potential circle ID so self-invite can still proceed
    const circleDoc = await db.collection('circles').doc(inviteId).get();
    if (circleDoc.exists) {
      return { circleId: circleDoc.id, expiresAt: null };
    }

    throw new Error('Invite not found');
  } catch (error) {
    console.error('Error reading invite info:', error);
    throw error;
  }
});

// Cloud Function: Submit Join Request (authenticated users only)
export const submitJoinRequest = onCall(async (request) => {
  try {
    const { circleId, displayName, relation, inviteId } = request.data as SubmitJoinRequestData;
    const userId = request.auth?.uid;
    if (!userId) {
      throw new Error('User must be authenticated');
    }
    if (!circleId || !displayName || !relation) {
      throw new Error('Missing required fields');
    }

    const circleDoc = await db.collection('circles').doc(circleId).get();
    if (!circleDoc.exists) {
      throw new Error('Circle not found');
    }

    // Prevent duplicate requests
    const existing = await db
      .collection('circles')
      .doc(circleId)
      .collection('joinRequests')
      .where('userId', '==', userId)
      .limit(1)
      .get();
    if (!existing.empty) {
      return { success: true, duplicate: true };
    }

    const ref = await db
      .collection('circles')
      .doc(circleId)
      .collection('joinRequests')
      .add({
        userId,
        displayName,
        relation,
        status: 'pending',
        inviteId: inviteId || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    // Notify owners via push
    try {
      const owners: string[] = (circleDoc.data()!.ownerIds || [circleDoc.data()!.ownerId]).filter(Boolean);
      const ownerDocs = await Promise.all(owners.map((id) => db.collection('users').doc(id).get()));
      const notifications = ownerDocs
        .map((d) => ({ id: d.id, token: (d.data() || {}).expoPushToken }))
        .filter((u) => !!u.token);

      const title = 'New Join Request';
      const body = `${displayName} requested to join your circle`;
      const data = { type: 'join_request', circleId, requestId: ref.id };
      for (const n of notifications) {
        await sendPushNotification(n.token as string, title, body, data);
      }
    } catch (notifyErr) {
      console.error('Error notifying owners of join request:', notifyErr);
    }

    return { success: true, requestId: ref.id };
  } catch (error) {
    console.error('Error submitting join request:', error);
    throw error;
  }
});

// Cloud Function: List Pending Join Requests (owners only)
export const listJoinRequests = onCall(async (request) => {
  try {
    const { circleId } = request.data as { circleId: string };
    const userId = request.auth?.uid;
    if (!userId) throw new Error('User must be authenticated');
    if (!circleId) throw new Error('Circle ID is required');

    const circleDoc = await db.collection('circles').doc(circleId).get();
    if (!circleDoc.exists) throw new Error('Circle not found');
    const circleData = circleDoc.data()!;
    const isOwner = (circleData.ownerIds || [circleData.ownerId]).includes(userId);
    if (!isOwner) throw new Error('Only owners can view join requests');

    const snap = await db
      .collection('circles')
      .doc(circleId)
      .collection('joinRequests')
      .where('status', '==', 'pending')
      .get();

    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return { requests: items };
  } catch (error) {
    console.error('Error listing join requests:', error);
    throw error;
  }
});

// Cloud Function: Approve Join Request (owners only)
export const ownerApproveJoinRequest = onCall(async (request) => {
  try {
    const { circleId, requestId } = request.data as OwnerJoinRequestActionData;
    const userId = request.auth?.uid;
    if (!userId) throw new Error('User must be authenticated');
    if (!circleId || !requestId) throw new Error('Missing required fields');

    const circleRef = db.collection('circles').doc(circleId);
    const circleSnap = await circleRef.get();
    if (!circleSnap.exists) throw new Error('Circle not found');
    const circleData = circleSnap.data()!;
    const isOwner = (circleData.ownerIds || [circleData.ownerId]).includes(userId);
    if (!isOwner) throw new Error('Only owners can approve requests');

    const reqRef = circleRef.collection('joinRequests').doc(requestId);
    const reqSnap = await reqRef.get();
    if (!reqSnap.exists) throw new Error('Request not found');
    const reqData = reqSnap.data() as any;

    // Add member and role
    await circleRef.update({
      members: admin.firestore.FieldValue.arrayUnion(reqData.userId),
      [`roles.${reqData.userId}`]: 'member',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await reqRef.delete();
    return { success: true };
  } catch (error) {
    console.error('Error approving join request:', error);
    throw error;
  }
});

// Cloud Function: Decline Join Request (owners only)
export const ownerDeclineJoinRequest = onCall(async (request) => {
  try {
    const { circleId, requestId } = request.data as OwnerJoinRequestActionData;
    const userId = request.auth?.uid;
    if (!userId) throw new Error('User must be authenticated');
    if (!circleId || !requestId) throw new Error('Missing required fields');

    const circleRef = db.collection('circles').doc(circleId);
    const circleSnap = await circleRef.get();
    if (!circleSnap.exists) throw new Error('Circle not found');
    const circleData = circleSnap.data()!;
    const isOwner = (circleData.ownerIds || [circleData.ownerId]).includes(userId);
    if (!isOwner) throw new Error('Only owners can decline requests');

    const reqRef = circleRef.collection('joinRequests').doc(requestId);
    await reqRef.delete();
    return { success: true };
  } catch (error) {
    console.error('Error declining join request:', error);
    throw error;
  }
});

// Cloud Function: Accept Invite
export const acceptInvite = onCall(async (request) => {
  try {
    const { inviteId } = request.data as AcceptInviteData;
    const userId = request.auth?.uid;

    if (!userId) {
      throw new Error('User must be authenticated');
    }

    if (!inviteId) {
      throw new Error('Invite ID is required');
    }

    // Get invite document
    const inviteDoc = await db.collection('invites').doc(inviteId).get();
    if (!inviteDoc.exists) {
      throw new Error('Invite not found');
    }

    const inviteData = inviteDoc.data()!;

    // Check if invite has expired
    if (inviteData.expiresAt && inviteData.expiresAt.toDate() < new Date()) {
      throw new Error('Invite has expired');
    }

    // Check if user is already a member
    const circleDoc = await db.collection('circles').doc(inviteData.circleId).get();
    if (!circleDoc.exists) {
      throw new Error('Circle not found');
    }

    const circleData = circleDoc.data()!;
    if (circleData.members?.includes(userId)) {
      throw new Error('User is already a member of this circle');
    }

    // Add user to circle
    await db.collection('circles').doc(inviteData.circleId).update({
      members: admin.firestore.FieldValue.arrayUnion(userId),
      [`roles.${userId}`]: 'member',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Delete the invite (one-time use)
    await db.collection('invites').doc(inviteId).delete();

    return {
      success: true,
      circleId: inviteData.circleId,
      message: 'Successfully joined the circle',
    };
  } catch (error) {
    console.error('Error accepting invite:', error);
    throw error;
  }
});

// Cloud Function: On Update Created (Trigger)
export const onUpdateCreated = onDocumentCreated(
  'updates/{updateId}',
  async (event) => {
    try {
      const updateData = event.data?.data() as UpdateData;
      if (!updateData) return;

      const { circleId, authorId } = updateData;

      // Get circle members
      const circleDoc = await db.collection('circles').doc(circleId).get();
      if (!circleDoc.exists) return;

      const circleData = circleDoc.data()!;
      const members = circleData.members || [];

      // Get all member user documents to check for muted circles and push tokens
      const userPromises = members
        .filter((memberId: string) => memberId !== authorId) // Exclude the author
        .map(async (memberId: string) => {
          const userDoc = await db.collection('users').doc(memberId).get();
          if (!userDoc.exists) return null;

          const userData = userDoc.data()!;
          const circlesMuted = userData.circlesMuted || [];
          
          // Skip if user has muted this circle
          if (circlesMuted.includes(circleId)) {
            return null;
          }

          return {
            id: memberId,
            expoPushToken: userData.expoPushToken,
            displayName: userData.displayName,
          };
        });

      const users = (await Promise.all(userPromises)).filter(Boolean);
      
      // Update circle lastUpdateAt for unread indicators
      try {
        await db.collection('circles').doc(circleId).update({
          lastUpdateAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } catch (e) {
        console.error('Failed to update circle lastUpdateAt:', e);
      }

      // Send push notifications
      const notificationPromises = users.map(async (user) => {
        if (!user?.expoPushToken) {
          return;
        }

        const title = 'New Update in Care Circle';
        const body = `${user.displayName || 'Someone'} posted an update`;
        const data = {
          circleId,
          updateId: event.params.updateId,
          type: 'update',
        };

        await sendPushNotification(user.expoPushToken, title, body, data);
      });

      await Promise.all(notificationPromises);
    } catch (error) {
      console.error('Error in onUpdateCreated:', error);
    }
  }
);
