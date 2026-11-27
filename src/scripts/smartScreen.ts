// الشاشة الذكية (الجلسة 9): متحكمين ضبابيين بنفس المدخلين (ضوء الغرفة وضجيجها).
// الأول بيقرر سطوع الشاشة، والتاني صوت التنبيه. مصدر واحد للمكوّن ولأرقام الصفحة.
import { evalfisDetail, type Fis, type Mf } from './control';

export const LEVEL_MFS: Mf[] = [
	{ name: 'منخفض', type: 'trapmf', p: [0, 0, 15, 40] },
	{ name: 'متوسط', type: 'trimf', p: [20, 50, 80] },
	{ name: 'عالٍ', type: 'trapmf', p: [60, 85, 100, 100] },
];
export const LIGHT_NAMES = ['مظلم', 'متوسط', 'ساطع'];
export const NOISE_NAMES = ['هادئ', 'متوسط', 'صاخب'];
export const OUT_MFS: Mf[] = [
	{ name: 'منخفض', type: 'trimf', p: [0, 0, 50] },
	{ name: 'متوسط', type: 'trimf', p: [25, 50, 75] },
	{ name: 'عالٍ', type: 'trimf', p: [50, 100, 100] },
];
export const OUT_NAMES = ['منخفض', 'متوسط', 'عالٍ'];

/** جدول القواعد: [الضوء][الضجيج] = رقم مجموعة الخرج (1 منخفض، 2 متوسط، 3 عالٍ) */
export type RuleTable = number[][];
export const BRIGHT_RULES: RuleTable = [
	[1, 1, 2], // مظلم: هادئ، متوسط، صاخب
	[2, 2, 2], // متوسط
	[3, 3, 3], // ساطع
];
export const VOLUME_RULES: RuleTable = [
	[1, 2, 2], // مظلم: بالليل ما منعلّي كتير
	[1, 2, 3],
	[2, 2, 3],
];

const copy = (m: Mf[]) => m.map((x) => ({ ...x, p: [...x.p] }));

export function makeFis(table: RuleTable): Fis {
	const rules: number[][] = [];
	for (let l = 0; l < 3; l++) for (let n = 0; n < 3; n++) rules.push([l + 1, n + 1, table[l][n]]);
	return {
		type: 'mamdani',
		inputs: [
			{ name: 'light', range: [0, 100], mfs: copy(LEVEL_MFS) },
			{ name: 'noise', range: [0, 100], mfs: copy(LEVEL_MFS) },
		],
		output: { name: 'out', range: [0, 100], mfs: copy(OUT_MFS) },
		rules,
	};
}

export function decide(light: number, noise: number, bright: RuleTable = BRIGHT_RULES, volume: RuleTable = VOLUME_RULES) {
	return { b: evalfisDetail(makeFis(bright), [light, noise]), v: evalfisDetail(makeFis(volume), [light, noise]) };
}

/** متوسط سطوع صورة الكاميرا (0..255) ← ضوء 0..100 */
export const lightFromLuma = (y: number) => Math.max(0, Math.min(100, (y / 255) * 100 * 1.25));
/** شدة الصوت بالديسيبل (من −70 للهدوء التام لـ −15 للصراخ) ← ضجيج 0..100 */
export const noiseFromDb = (db: number) => Math.max(0, Math.min(100, ((db + 70) / 55) * 100));
