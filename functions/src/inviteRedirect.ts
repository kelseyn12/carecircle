// Cloud Function for handling invite redirects (replaces Firebase Dynamic Links)
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

export const inviteRedirect = functions.https.onRequest(async (req, res) => {
  try {
    // Extract inviteId from URL path
    const inviteId = req.path.split("/").pop();
    if (!inviteId) {
      res.status(400).send("Missing inviteId");
      return;
    }

    // Get invite document from Firestore
    const inviteDoc = await admin.firestore().doc(`invites/${inviteId}`).get();
    if (!inviteDoc.exists) {
      res.status(404).send("Invite not found");
      return;
    }

    const inviteData = inviteDoc.data()!;
    
    // Check if invite has expired
    if (inviteData.expiresAt && inviteData.expiresAt.toDate() < new Date()) {
      res.status(410).send("Invite expired");
      return;
    }

    // Create deep link for the app
    const deepLink = `carecircle://join?inviteId=${inviteId}`;
    
    // Redirect to the fallback page with inviteId in the URL
    const fallbackUrl = `https://carecircle.web.app/fallback.html?inviteId=${inviteId}`;
    res.redirect(302, fallbackUrl);

  } catch (error) {
    console.error('Error in inviteRedirect:', error);
    res.status(500).send("Internal server error");
  }
});
