/**
 * Script to get Gmail OAuth2 Refresh Token
 * 
 * Usage:
 * 1. Run: bun scripts/get-gmail-token.ts
 * 2. Visit the URL in your browser
 * 3. Login with your Gmail account
 * 4. Copy the authorization code
 * 5. Paste it back in the terminal
 * 6. Copy the refresh_token to your .env file
 */

import { google } from "googleapis";
import * as readline from "node:readline";

const CLIENT_ID = "30729564242-to3o4bnhrfgegtcbjhhhot22negsni80.apps.googleusercontent.com";
const CLIENT_SECRET = "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";
const REDIRECT_URI = "http://localhost:3000/oauth2callback";

// Gmail scopes needed
const SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.metadata",
];

const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
);

// Generate the auth URL
const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline", // Important: this gives you the refresh token
    scope: SCOPES,
    prompt: "consent", // Force to show consent screen to get refresh_token
});

console.log("\n" + "=".repeat(80));
console.log("STEP 1: Authorize this app by visiting this URL:");
console.log("=".repeat(80));
console.log("\n" + authUrl + "\n");
console.log("=".repeat(80));
console.log("STEP 2: After authorizing, you'll be redirected to a URL like:");
console.log("http://localhost:3000/oauth2callback?code=XXXXX");
console.log("\nCopy the 'code' parameter from that URL");
console.log("=".repeat(80) + "\n");

// Get the code from user
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

rl.question("Paste the authorization code here: ", async (code) => {
    try {
        // Exchange code for tokens
        const { tokens } = await oauth2Client.getToken(code);

        console.log("\n" + "=".repeat(80));
        console.log("SUCCESS! Here are your tokens:");
        console.log("=".repeat(80));
        console.log("\nAccess Token (expires in 1 hour):");
        console.log(tokens.access_token);
        console.log("\n" + "=".repeat(80));
        console.log("REFRESH TOKEN (SAVE THIS IN YOUR .env FILE):");
        console.log("=".repeat(80));
        console.log("\n" + tokens.refresh_token);
        console.log("\n" + "=".repeat(80));
        console.log("\nAdd this to your .env file:");
        console.log("=".repeat(80));
        console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`);
        console.log("=".repeat(80) + "\n");

    } catch (error: any) {
        console.error("\n❌ Error getting tokens:", error.message);
    }

    rl.close();
});
