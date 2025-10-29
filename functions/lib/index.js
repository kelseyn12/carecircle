"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onUpdateCreated = exports.acceptInvite = exports.createInvite = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const expo_server_sdk_1 = require("expo-server-sdk");
// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();
const expo = new expo_server_sdk_1.Expo();
// Helper function to generate invite link
async function generateInviteLink(inviteId) {
    const baseUrl = 'https://care-circle-15fd5.web.app';
    const inviteUrl = `${baseUrl}/inviteRedirect/${inviteId}`;
    return inviteUrl;
}
// Helper function to send push notification
async function sendPushNotification(token, title, body, data) {
    try {
        const message = {
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
            }
            catch (error) {
                console.error('Error sending push notification:', error);
            }
        }
    }
    catch (error) {
        console.error('Error in sendPushNotification:', error);
    }
}
// Cloud Function: Create Invite
exports.createInvite = (0, https_1.onCall)(async (request) => {
    var _a, _b;
    try {
        const { circleId } = request.data;
        const userId = (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid;
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
        const circleData = circleDoc.data();
        if (!((_b = circleData.members) === null || _b === void 0 ? void 0 : _b.includes(userId))) {
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
    }
    catch (error) {
        console.error('Error creating invite:', error);
        throw error;
    }
});
// Cloud Function: Accept Invite
exports.acceptInvite = (0, https_1.onCall)(async (request) => {
    var _a, _b;
    try {
        const { inviteId } = request.data;
        const userId = (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid;
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
        const inviteData = inviteDoc.data();
        // Check if invite has expired
        if (inviteData.expiresAt && inviteData.expiresAt.toDate() < new Date()) {
            throw new Error('Invite has expired');
        }
        // Check if user is already a member
        const circleDoc = await db.collection('circles').doc(inviteData.circleId).get();
        if (!circleDoc.exists) {
            throw new Error('Circle not found');
        }
        const circleData = circleDoc.data();
        if ((_b = circleData.members) === null || _b === void 0 ? void 0 : _b.includes(userId)) {
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
    }
    catch (error) {
        console.error('Error accepting invite:', error);
        throw error;
    }
});
// Cloud Function: On Update Created (Trigger)
exports.onUpdateCreated = (0, firestore_1.onDocumentCreated)('updates/{updateId}', async (event) => {
    var _a;
    try {
        const updateData = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
        if (!updateData)
            return;
        const { circleId, authorId } = updateData;
        // Get circle members
        const circleDoc = await db.collection('circles').doc(circleId).get();
        if (!circleDoc.exists)
            return;
        const circleData = circleDoc.data();
        const members = circleData.members || [];
        // Get all member user documents to check for muted circles and push tokens
        const userPromises = members
            .filter((memberId) => memberId !== authorId) // Exclude the author
            .map(async (memberId) => {
            const userDoc = await db.collection('users').doc(memberId).get();
            if (!userDoc.exists)
                return null;
            const userData = userDoc.data();
            const circlesMuted = userData.circlesMuted || [];
            // Skip if user has muted this circle
            if (circlesMuted.includes(circleId)) {
                console.log(`🔕 Skipping user ${memberId}: Circle ${circleId} is muted`);
                return null;
            }
            return {
                id: memberId,
                expoPushToken: userData.expoPushToken,
                displayName: userData.displayName,
            };
        });
        const users = (await Promise.all(userPromises)).filter(Boolean);
        console.log(`📢 Processing notification for update in circle: ${circleId}`);
        console.log(`👥 Found ${users.length} eligible users to notify (excluding author and muted)`);
        // Send push notifications
        const notificationPromises = users.map(async (user) => {
            if (!(user === null || user === void 0 ? void 0 : user.expoPushToken)) {
                console.log(`⏭️ Skipping user ${user.id} (${user.displayName}): No push token`);
                return;
            }
            const title = 'New Update in Care Circle';
            const body = `${user.displayName || 'Someone'} posted an update`;
            const data = {
                circleId,
                updateId: event.params.updateId,
                type: 'update',
            };
            console.log(`📤 Sending notification to: ${user.displayName} (${user.expoPushToken.substring(0, 30)}...)`);
            await sendPushNotification(user.expoPushToken, title, body, data);
            console.log(`✅ Notification sent successfully to: ${user.displayName}`);
        });
        await Promise.all(notificationPromises);
        console.log(`✅ Finished processing notifications for circle: ${circleId}`);
    }
    catch (error) {
        console.error('Error in onUpdateCreated:', error);
    }
});
//# sourceMappingURL=index.js.map