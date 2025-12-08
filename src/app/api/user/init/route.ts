import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.replace("Bearer ", "") : null;

  if (!token) {
    return NextResponse.json({ error: "Precisas de login" }, { status: 401 });
  }

  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    const uid = decoded.uid;
    const db = getAdminDb();
    const userRef = db.collection("users").doc(uid);
    const snap = await userRef.get();

    if (!snap.exists) {
      await userRef.set({
        email: decoded.email ?? "",
        displayName: decoded.name ?? "",
        photoURL: decoded.picture ?? "",
        credits: 1,
        createdAt: new Date().toISOString(),
      });
    }

    const fresh = await userRef.get();
    const credits = fresh.data()?.credits ?? 0;

    return NextResponse.json({ credits });
  } catch (err) {
    console.error("user/init error", err);
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }
}

