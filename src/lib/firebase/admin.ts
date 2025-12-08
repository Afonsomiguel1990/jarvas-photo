import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth as getAdminAuthCore } from "firebase-admin/auth";
import { getFirestore as getAdminDbCore } from "firebase-admin/firestore";
import { getStorage as getAdminStorageCore } from "firebase-admin/storage";

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  console.warn("Firebase Admin envs em falta. Verifica .env.");
}

const app =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });

export function getAdminAuth() {
  return getAdminAuthCore(app);
}

export function getAdminDb() {
  return getAdminDbCore(app);
}

export function getAdminStorage() {
  return getAdminStorageCore(app);
}

