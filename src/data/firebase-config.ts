// إعدادات Firebase (عامة ومش سر: الحماية بقواعد Firestore بـ firestore.rules).
// لحتى يتفعّل الحفظ: عبّي القيم من Firebase Console ← Project settings ← Your apps ← Web app.
// إذا apiKey فاضي، الاختبارات بتشتغل وبتعطي العلامة، بس ما بتحفظ شي.
export const firebaseConfig = {
	apiKey: '',
	authDomain: '',
	projectId: '',
	appId: '',
};

/** إيميل حساب Google تبع المدرّس: وحده بيقدر يشوف النتائج (لازم يطابق firestore.rules) */
export const TEACHER_EMAIL = '';

export const firebaseReady = () => Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
