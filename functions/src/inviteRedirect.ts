import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

export const inviteRedirect = functions
  .region("us-central1")
  .https.onRequest(async (req, res) => {
    try {
      // 1️⃣ Extract inviteId from path or query
      const inviteId =
        req.path.split("/").pop() ||
        (req.query.inviteId as string | undefined);

      if (!inviteId) {
        res.status(400).send("Missing inviteId");
        return;
      }

      // 2️⃣ Fetch invite document
      const inviteRef = admin.firestore().doc(`invites/${inviteId}`);
      const inviteSnap = await inviteRef.get();

      if (!inviteSnap.exists) {
        res.status(404).send("Invite not found");
        return;
      }

      const inviteData = inviteSnap.data();
      if (!inviteData) {
        res.status(500).send("Invalid invite data");
        return;
      }

      // 3️⃣ Check expiration
      if (inviteData.expiresAt && inviteData.expiresAt.toDate() < new Date()) {
        res.status(410).send("Invite expired");
        return;
      }

      // 4️⃣ Construct deep link or web fallback
      const iosAppLink = `carecircle://inviteRedirect?inviteId=${inviteId}`;
      const androidAppLink = `https://care-circle-15fd5.web.app/inviteRedirect?inviteId=${inviteId}`;
      const fallbackUrl = `https://care-circle-15fd5.web.app/fallback.html?inviteId=${inviteId}`;

      // 5️⃣ Smart redirect logic
      const userAgent = req.get("user-agent") || "";
      const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
      const isAndroid = /Android/i.test(userAgent);

      // On iOS, try app scheme first (universal links may handle it)
      const redirectTarget = isIOS
        ? iosAppLink
        : isAndroid
        ? androidAppLink
        : fallbackUrl;

      // 6️⃣ Redirect
      res.redirect(302, redirectTarget);
    } catch (error) {
      console.error("Error in inviteRedirect:", error);
      res.status(500).send("Internal server error");
    }
  });

