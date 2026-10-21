// إعدادات Firebase (عامة ومش سر: الحماية بقواعد Firestore بـ firestore.rules).
// لحتى يتفعّل الحفظ: عبّي القيم من Firebase Console ← Project settings ← Your apps ← Web app.
// إذا apiKey فاضي، الاختبارات بتشتغل وبتعطي العلامة، بس ما بتحفظ شي.
export const firebaseConfig = {
	apiKey: 'AIzaSyDDpm6vZw230Kd4bHwniAYJQNITK-G5zaI',
	authDomain: 'cordoba-labs.firebaseapp.com',
	projectId: 'cordoba-labs',
	appId: '1:856855814813:web:d51d8f202b75e840f96a74',
};

/** إيميل حساب Google تبع المدرّس: وحده بيقدر يشوف النتائج (لازم يطابق firestore.rules) */
export const TEACHER_EMAIL = 'hamidkano409@gmail.com';

export const firebaseReady = () => Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
