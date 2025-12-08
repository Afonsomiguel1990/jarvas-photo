import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.replace("Bearer ", "") : null;

    if (!token) {
        return NextResponse.json({ error: "Precisas de login" }, { status: 401 });
    }

    try {
        const decoded = await getAdminAuth().verifyIdToken(token);
        const uid = decoded.uid;
        const db = getAdminDb();

        const snapshot = await db
            .collection("users")
            .doc(uid)
            .collection("generations")
            .orderBy("createdAt", "desc")
            .limit(50)
            .get();

        const generations = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        return NextResponse.json({ generations });
    } catch (err) {
        console.error("user/history error", err);
        return NextResponse.json({ error: "Falha ao obter histórico" }, { status: 500 });
    }
}
