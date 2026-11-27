// تمارين إضافية لذكاء 2: ضبط الكرة على لوح (BalanceLab) ولعبة الكتابة المتكيّفة (TypingLab).
// مصدر واحد للمكوّنات ولأرقام الصفحة، وبيتجرّب بـ npx tsx.
import { evalfis, evalfisDetail, type Fis, type Mf } from './control';

const part = (k: number, names: string[]): Mf[] => {
	const w = 2 / (k - 1);
	return names.map((name, i) => {
		const c = -1 + i * w;
		return { name, type: 'trimf', p: [c - w, c, c + w] };
	});
};

// ================= الكرة على اللوح =================
// الموقع x من −1 (طرف اليسار) لـ +1 (طرف اليمين)، والسرعة v بنفس الوحدة بالثانية.
// الخرج u من −1 (ميّل لليسار بقوة: الكرة بتنزل يسار) لـ +1.
export const BAL_POS = ['بعيدة يسار', 'قريبة يسار', 'في الوسط', 'قريبة يمين', 'بعيدة يمين'];
export const BAL_VEL = ['تتحرك يساراً', 'واقفة', 'تتحرك يميناً'];
export const BAL_OUT = ['يسار بقوة', 'يسار', 'مستوٍ', 'يمين', 'يمين بقوة'];

/** جدول القواعد [الموقع][الحركة] = رقم الخرج 1..5 */
export const BAL_RULES: number[][] = [
	[5, 5, 4], // بعيدة يسار: إذا عم تقرّب (تتحرك يميناً) منميّل شوي بس (فرامل)
	[5, 4, 2],
	[5, 3, 1],
	[4, 2, 1],
	[2, 1, 1], // بعيدة يمين وعم تقرّب ← يسار خفيف
];

export function balanceFis(rules = BAL_RULES): Fis {
	const r: number[][] = [];
	rules.forEach((row, i) => row.forEach((o, j) => r.push([i + 1, j + 1, o])));
	return {
		type: 'mamdani',
		inputs: [
			{ name: 'pos', range: [-1, 1], mfs: part(5, BAL_POS) },
			{ name: 'vel', range: [-1, 1], mfs: part(3, BAL_VEL) },
		],
		output: { name: 'tilt', range: [-1, 1], mfs: part(5, BAL_OUT) },
		rules: r,
	};
}

export const BAL = {
	tiltMax: 10, // درجة
	accel: ((5 / 7) * 9.81) / 0.5, // كرة بتتدحرج على لوح نص طوله 0.5 m، بالوحدة المعيارية
	damp: 0.15,
	ctrlHz: 20,
};
export const BAL_DEFAULT = { Ke: 1, Kd: 1, Ku: 1 };

export interface BalState { x: number; v: number; u: number }

/** خطوة فيزياء: tilt بالدرجات (موجب = اليمين واطي) */
export function balStep(s: BalState, tiltDeg: number, dt: number) {
	const a = BAL.accel * Math.sin((tiltDeg * Math.PI) / 180) - BAL.damp * s.v;
	s.v += a * dt;
	s.x += s.v * dt;
}

export const balCtrl = (fis: Fis, x: number, v: number, g = BAL_DEFAULT) =>
	g.Ku * evalfis(fis, [Math.max(-1, Math.min(1, g.Ke * x)), Math.max(-1, Math.min(1, g.Kd * v))]);

export const balDetail = (fis: Fis, x: number, v: number, g = BAL_DEFAULT) =>
	evalfisDetail(fis, [Math.max(-1, Math.min(1, g.Ke * x)), Math.max(-1, Math.min(1, g.Kd * v))]);

/** محاكاة كاملة بدون اضطراب: زمن التثبيت (|x| < 0.05 و |v| < 0.05 لمدة ثانية)، وأكبر تجاوز للجهة التانية */
export function balSim(x0 = 0.9, g = BAL_DEFAULT, rules = BAL_RULES, T = 15) {
	const fis = balanceFis(rules);
	const s: BalState = { x: x0, v: 0, u: 0 };
	const dt = 1 / 240;
	const every = Math.round(240 / BAL.ctrlHz);
	let calm = 0;
	let settle = NaN;
	let over = 0;
	let fell = false;
	for (let k = 0; k < T * 240; k++) {
		if (k % every === 0) s.u = balCtrl(fis, s.x, s.v, g);
		balStep(s, s.u * BAL.tiltMax, dt);
		if (Math.abs(s.x) > 1) { fell = true; break; }
		if (Math.sign(s.x) !== Math.sign(x0)) over = Math.max(over, Math.abs(s.x));
		if (Math.abs(s.x) < 0.05 && Math.abs(s.v) < 0.05) {
			calm += dt;
			if (calm >= 1 && Number.isNaN(settle)) settle = k / 240 - 1;
		} else calm = 0;
	}
	return { settle, over, fell };
}

// ================= لعبة الكتابة =================
export const TYP_SPEED = ['بطيء', 'متوسط', 'سريع'];
export const TYP_ERR = ['قليلة', 'متوسطة', 'كثيرة'];
export const TYP_OUT = ['خفّف كثيراً', 'خفّف', 'ثبّت', 'زِد', 'زِد كثيراً'];
/** [السرعة][الأخطاء] = رقم الخرج 1..5 */
export const TYP_RULES: number[][] = [
	[3, 2, 1], // بطيء
	[4, 3, 2], // متوسط
	[5, 4, 3], // سريع: إذا أخطاؤه كثيرة يعني عم يتسرّع، فمنثبّت
];

export function typingFis(rules = TYP_RULES): Fis {
	const r: number[][] = [];
	rules.forEach((row, i) => row.forEach((o, j) => r.push([i + 1, j + 1, o])));
	return {
		type: 'mamdani',
		inputs: [
			{ name: 'wpm', range: [0, 40], mfs: [
				{ name: TYP_SPEED[0], type: 'trapmf', p: [0, 0, 6, 14] },
				{ name: TYP_SPEED[1], type: 'trimf', p: [8, 16, 24] },
				{ name: TYP_SPEED[2], type: 'trapmf', p: [18, 26, 40, 40] },
			] },
			{ name: 'err', range: [0, 100], mfs: [
				{ name: TYP_ERR[0], type: 'trapmf', p: [0, 0, 10, 25] },
				{ name: TYP_ERR[1], type: 'trimf', p: [15, 30, 45] },
				{ name: TYP_ERR[2], type: 'trapmf', p: [35, 50, 100, 100] },
			] },
		],
		output: { name: 'dLevel', range: [-2, 2], mfs: part(5, TYP_OUT).map((m) => ({ ...m, p: m.p.map((v) => v * 2) })) },
		rules: r,
	};
}

/** المستوى من 1 لـ 10 ← زمن سقوط الكلمة (ثانية) والفاصل بين الكلمات (ثانية) */
export const levelFall = (L: number) => 12 - (L - 1);
export const levelGap = (L: number) => 3.2 - 0.25 * (L - 1);
export const TYP_ROUND = 10; // المتحكم بيقرر كل 10 ثواني
