/** Prints a fresh VAPID key pair for Web Push. Paste into the hosting provider's env, never into git. */
import webpush from "web-push";

const keys = webpush.generateVAPIDKeys();
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
console.log("VAPID_SUBJECT=mailto:you@example.edu");
