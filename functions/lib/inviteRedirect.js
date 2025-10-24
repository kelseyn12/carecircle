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
        // Create deep link for the app
        const deepLink = `carecircle://join?inviteId=${inviteId}`;
        // Set up HTML response for fallback
        const fallbackHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Join Care Circle</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            max-width: 400px;
            width: 100%;
        }
        .logo {
            font-size: 48px;
            margin-bottom: 20px;
        }
        h1 {
            color: #333;
            margin-bottom: 10px;
            font-size: 28px;
        }
        p {
            color: #666;
            margin-bottom: 30px;
            line-height: 1.6;
        }
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 30px;
            border-radius: 25px;
            text-decoration: none;
            font-weight: 600;
            margin: 10px;
            transition: transform 0.2s;
        }
        .button:hover {
            transform: translateY(-2px);
        }
        .app-links {
            margin-top: 20px;
        }
        .app-link {
            display: block;
            background: #f8f9fa;
            border: 2px solid #e9ecef;
            border-radius: 15px;
            padding: 15px;
            margin: 10px 0;
            text-decoration: none;
            color: #333;
            transition: all 0.2s;
        }
        .app-link:hover {
            background: #e9ecef;
            border-color: #667eea;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">💙</div>
        <h1>Join Care Circle</h1>
        <p>You've been invited to join a Care Circle! Download the app to get started.</p>
        
        <div class="app-links">
            <a href="https://apps.apple.com/app/care-circle" class="app-link">
                📱 Download for iOS
            </a>
            <a href="https://play.google.com/store/apps/details?id=com.carecircle.app" class="app-link">
                🤖 Download for Android
            </a>
        </div>
        
        <p style="margin-top: 30px; font-size: 14px; color: #999;">
            Already have the app? <a href="${deepLink}" style="color: #667eea;">Open in app</a>
        </p>
    </div>
    
    <script>
        // Try to open the app first
        window.location.href = "${deepLink}";
        
        // Fallback after 2 seconds if app doesn't open
        setTimeout(() => {
            // Show download options
            document.querySelector('.app-links').style.display = 'block';
        }, 2000);
    </script>
</body>
</html>`;
        // Set headers for proper redirect
        res.setHeader('Content-Type', 'text/html');
        res.send(fallbackHtml);
    }
    catch (error) {
        console.error('Error in inviteRedirect:', error);
        res.status(500).send("Internal server error");
    }
});
//# sourceMappingURL=inviteRedirect.js.map