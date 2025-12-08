import { getAdminDb } from "@/lib/firebase/admin";

const USERS = "users";

export async function getUserCredits(uid: string): Promise<number> {
  const db = getAdminDb();
  const snap = await db.collection(USERS).doc(uid).get();
  const data = snap.data();
  return data?.credits ?? 0;
}

export async function hasCredits(uid: string, cost: number) {
  const current = await getUserCredits(uid);
  return current >= cost;
}

export async function consumeCredits(uid: string, cost: number) {
  const db = getAdminDb();
  await db.runTransaction(async (tx) => {
    const ref = db.collection(USERS).doc(uid);
    const doc = await tx.get(ref);
    const credits = doc.data()?.credits ?? 0;
    if (credits < cost) throw new Error("Créditos insuficientes");
    tx.update(ref, { credits: credits - cost });
  });
}

export async function addCredits(uid: string, amount: number) {
  const db = getAdminDb();
  const ref = db.collection(USERS).doc(uid);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const credits = snap.data()?.credits ?? 0;
    tx.set(
      ref,
      {
        credits: credits + amount,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  });
}

