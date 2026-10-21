// حفظ محاولات الاختبارات بـ Firestore (النسخة الخفيفة lite، بدون اتصال دائم).
// الطالب بيضيف بس (create)، والقراءة للمدرّس بعد تسجيل الدخول (بـ results).
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, addDoc, collection, serverTimestamp } from 'firebase/firestore/lite';
import { firebaseConfig, firebaseReady } from '../data/firebase-config';

export interface Attempt {
	quiz: string; // مثلاً ai2-s3 أو wireless-exam
	course: string;
	name: string;
	sid: string;
	score: number;
	total: number;
	answers: number[];
	client: string; // معرّف عشوائي للجهاز، لحتى نميّز المحاولات من نفس الجهاز
}

export const app = () => (getApps()[0] ?? initializeApp(firebaseConfig));

export async function saveAttempt(a: Attempt): Promise<'saved' | 'off' | 'error'> {
	if (!firebaseReady()) return 'off';
	try {
		await addDoc(collection(getFirestore(app()), 'attempts'), { ...a, at: serverTimestamp() });
		return 'saved';
	} catch (e) {
		console.warn('quiz save failed', e);
		return 'error';
	}
}
