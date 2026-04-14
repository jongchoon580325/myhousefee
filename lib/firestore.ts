import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  deleteDoc,
  writeBatch,
  QueryConstraint,
} from "firebase/firestore";
import { db } from "./firebase";
import type { ManagementRecord, RawSheet } from "./store";

export async function loadData(uid: string) {
  try {
    const recordsSnap = await getDocs(collection(db, "users", uid, "records"));
    const records: ManagementRecord[] = [];
    recordsSnap.forEach((doc) => {
      records.push(doc.data() as ManagementRecord);
    });

    const rawSheetsSnap = await getDocs(collection(db, "users", uid, "rawSheets"));
    const rawSheets: { [key: string]: RawSheet } = {};
    rawSheetsSnap.forEach((doc) => {
      rawSheets[doc.id] = doc.data() as RawSheet;
    });

    return { records, rawSheets };
  } catch (error) {
    console.error("Error loading data from Firestore:", error);
    return { records: [], rawSheets: {} };
  }
}

export async function saveRecord(uid: string, key: string, record: ManagementRecord) {
  try {
    const recordRef = doc(db, "users", uid, "records", key);
    await setDoc(recordRef, record, { merge: true });
  } catch (error) {
    console.error("Error saving record:", error);
    throw error;
  }
}

export async function saveAllRecords(uid: string, records: ManagementRecord[]) {
  try {
    const batch = writeBatch(db);
    records.forEach((record, index) => {
      const recordRef = doc(db, "users", uid, "records", String(index));
      batch.set(recordRef, record, { merge: true });
    });
    await batch.commit();
  } catch (error) {
    console.error("Error saving all records:", error);
    throw error;
  }
}

export async function saveRawSheet(uid: string, yearMonth: string, sheet: RawSheet) {
  try {
    const sheetRef = doc(db, "users", uid, "rawSheets", yearMonth);
    await setDoc(sheetRef, sheet, { merge: true });
  } catch (error) {
    console.error("Error saving raw sheet:", error);
    throw error;
  }
}

export async function saveAllRawSheets(uid: string, rawSheets: { [key: string]: RawSheet }) {
  try {
    const batch = writeBatch(db);
    Object.entries(rawSheets).forEach(([yearMonth, sheet]) => {
      const sheetRef = doc(db, "users", uid, "rawSheets", yearMonth);
      batch.set(sheetRef, sheet, { merge: true });
    });
    await batch.commit();
  } catch (error) {
    console.error("Error saving all raw sheets:", error);
    throw error;
  }
}

export async function deleteRecord(uid: string, key: string) {
  try {
    await deleteDoc(doc(db, "users", uid, "records", key));
  } catch (error) {
    console.error("Error deleting record:", error);
    throw error;
  }
}

export async function deleteRawSheet(uid: string, yearMonth: string) {
  try {
    await deleteDoc(doc(db, "users", uid, "rawSheets", yearMonth));
  } catch (error) {
    console.error("Error deleting raw sheet:", error);
    throw error;
  }
}

export async function deleteAll(uid: string) {
  try {
    const batch = writeBatch(db);

    const recordsSnap = await getDocs(collection(db, "users", uid, "records"));
    recordsSnap.forEach((doc) => {
      batch.delete(doc.ref);
    });

    const rawSheetsSnap = await getDocs(collection(db, "users", uid, "rawSheets"));
    rawSheetsSnap.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  } catch (error) {
    console.error("Error deleting all data:", error);
    throw error;
  }
}

export async function saveUserProfile(
  uid: string,
  profile: { apartmentName?: string; address?: string }
) {
  try {
    const profileRef = doc(db, "users", uid, "profile", "data");
    await setDoc(profileRef, { ...profile, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (error) {
    console.error("Error saving user profile:", error);
    throw error;
  }
}

export async function loadUserProfile(
  uid: string
): Promise<{ apartmentName?: string; address?: string }> {
  try {
    const profileRef = doc(db, "users", uid, "profile", "data");
    const profileSnap = await getDoc(profileRef);
    if (profileSnap.exists()) {
      return profileSnap.data() as { apartmentName?: string; address?: string };
    }
    return {};
  } catch (error) {
    console.error("Error loading user profile:", error);
    return {};
  }
}
