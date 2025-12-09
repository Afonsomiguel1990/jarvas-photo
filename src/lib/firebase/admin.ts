import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth as getAdminAuthCore } from "firebase-admin/auth";
import { getFirestore as getAdminDbCore } from "firebase-admin/firestore";
import { getStorage as getAdminStorageCore } from "firebase-admin/storage";

let app: any;

function getFirebaseApp() {
  if (app) return app;

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (getApps().length > 0) {
    app = getApps()[0];
    return app;
  }

  // If we have explicit credentials, use them
  if (projectId && clientEmail && privateKey) {
    app = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  } else {
    // Otherwise, try ADC (Application Default Credentials)
    // This works on Cloud Run / App Hosting if the service account has permission
    console.log("Initializing Firebase Admin with ADC...");
    app = initializeApp({
      projectId: projectId || undefined,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  }

  return app;
}

export function getAdminAuth() {
  return getAdminAuthCore(getFirebaseApp());
}

export function getAdminDb() {
  return getAdminDbCore(getFirebaseApp());
}

export function getAdminStorage() {
  return getAdminStorageCore(getFirebaseApp());
}

