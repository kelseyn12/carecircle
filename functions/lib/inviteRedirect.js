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
exports.inviteRedirect = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
if (!admin.apps.length) {
    admin.initializeApp();
}
exports.inviteRedirect = functions
    .region("us-central1")
    .https.onRequest(async (req, res) => {
    try {
        // 1️⃣ Extract inviteId from path or query
        const inviteId = req.path.split("/").pop() ||
            req.query.inviteId;
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
    }
    catch (error) {
        console.error("Error in inviteRedirect:", error);
        res.status(500).send("Internal server error");
    }
});
//# sourceMappingURL=inviteRedirect.js.map