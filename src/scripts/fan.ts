// نظام المروحة تبع الجلسة 3 (نفس lab03_fuzzy_basics.m). مصدر واحد لكل أدوات الجلسة
// (FanLab و TwoRoomsLab و MyMembershipLab و SeesawLab) لحتى تضل الأرقام متطابقة.
import type { Fis, Mf } from './control';

export const TEMP_MFS: Mf[] = [
	{ name: 'بارد', type: 'trapmf', p: [0, 0, 10, 20] },
	{ name: 'معتدل', type: 'trimf', p: [10, 20, 30] },
	{ name: 'حار', type: 'trapmf', p: [20, 30, 40, 40] },
];
export const SPEED_MFS: Mf[] = [
	{ name: 'بطيئة', type: 'trimf', p: [0, 0, 50] },
	{ name: 'متوسطة', type: 'trimf', p: [25, 50, 75] },
	{ name: 'سريعة', type: 'trimf', p: [50, 100, 100] },
];
export const HUM_MFS: Mf[] = [
	{ name: 'قليلة', type: 'trapmf', p: [0, 0, 30, 60] },
	{ name: 'عالية', type: 'trapmf', p: [40, 70, 100, 100] },
];

const copy = (m: Mf[]) => m.map((x) => ({ ...x, p: [...x.p] }));

/** مدخل واحد (الحرارة) */
export const FAN_FIS: Fis = {
	type: 'mamdani',
	inputs: [{ name: 'temp', range: [0, 40], mfs: copy(TEMP_MFS) }],
	output: { name: 'speed', range: [0, 100], mfs: copy(SPEED_MFS) },
	rules: [[1, 1], [2, 2], [3, 3]],
};

/** مدخلين (الحرارة والرطوبة) */
export const FAN_FIS_HUM: Fis = {
	...FAN_FIS,
	inputs: [FAN_FIS.inputs[0], { name: 'hum', range: [0, 100], mfs: copy(HUM_MFS) }],
	rules: [[1, 0, 1], [2, 1, 2], [2, 2, 3], [3, 0, 3]],
};

// ===== يوم مسرّع لـ TwoRoomsLab =====
export const DAY_START = 6;
export const DAY_END = 22;
/** حرارة الغرفة خلال اليوم: 15.5° الصبح، 32° الضهر (الساعة 14)، وبترجع 15.5° بالليل */
export function dayTemp(h: number, noise = false) {
	let T = 21 + 11 * Math.cos((2 * Math.PI * (h - 14)) / 24);
	// تذبذب ثابت (مش عشوائي) لحتى الرسمة والعدّاد يطلعوا نفسهن كل مرة
	if (noise) T += 0.7 * Math.sin(h * 41.3) + 0.45 * Math.sin(h * 67.9 + 1) + 0.25 * Math.sin(h * 113.7 + 2);
	return T;
}
/** المفتاح العادي: 'onoff' = 0 أو 100 عند 25°، و 'steps' = ثلاث درجات */
export function crispSpeed(T: number, mode: 'onoff' | 'steps') {
	if (mode === 'onoff') return T >= 25 ? 100 : 0;
	return T < 18 ? 20 : T < 25 ? 50 : 100;
}
