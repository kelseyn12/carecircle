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
// Cloud Function for handling invite redirects (replaces Firebase Dynamic Links)
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
exports.inviteRedirect = functions.https.onRequest(async (req, res) => {
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
        const inviteData = inviteDoc.data();
        // Check if invite has expired
        if (inviteData.expiresAt && inviteData.expiresAt.toDate() < new Date()) {
            res.status(410).send("Invite expired");
            return;
        }
        // Redirect to the fallback page with inviteId in the URL
        const fallbackUrl = `https://care-circle-15fd5.web.app/fallback.html?inviteId=${inviteId}`;
        res.redirect(302, fallbackUrl);
    }
    catch (error) {
        console.error('Error in inviteRedirect:', error);
        res.status(500).send("Internal server error");
    }
});
//# sourceMappingURL=inviteRedirect.js.map