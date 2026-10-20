// هندسة البرمجيات (المراجع): نموذج مبسّط لسباق «الشلال» و«الرشيق» على نفس المشروع.
// الأرقام للتوضيح بس، مش قياس حقيقي. الفكرة من منحنى Boehm: كل ما اكتشفنا التغيير متأخر، كل ما صار أغلى بالشلال.
// بيتجرّب بـ node file.mts

export type SegKind = 'phase' | 'rework' | 'sprint' | 'plan' | 'change';
export interface Seg { start: number; end: number; kind: SegKind; label: string }
export interface RaceResult {
	segs: Seg[];
	delivery: number; // متى بيوصل المنتج كامل للزبون
	firstVersion: number; // أول نسخة شغّالة بيقدر الزبون يجربها
	versions: number[]; // كل لحظة بيستلم فيها الزبون نسخة شغّالة
	extra: number; // أسابيع إضافية بسبب التغيير
}

/** مراحل الشلال: المدة بالأسابيع، وكلفة إعادة العمل إذا إجا التغيير خلال هالمرحلة */
export const WF_PHASES = [
	{ name: 'المتطلبات', weeks: 2, rework: 1 },
	{ name: 'التصميم', weeks: 2, rework: 2 },
	{ name: 'البرمجة', weeks: 4, rework: 4 },
	{ name: 'الاختبار', weeks: 3, rework: 6 },
	{ name: 'التسليم', weeks: 1, rework: 7 },
] as const;
export const WF_TOTAL = WF_PHASES.reduce((s, p) => s + p.weeks, 0); // 12

/** الرشيق: أسبوع تخطيط، وبعدين 6 دورات (Sprints) كل وحدة أسبوعين، والتغيير بيكلّف أسبوع زيادة بالدورة يلي هو فيها */
export const AGILE = { plan: 1, sprints: 6, sprintWeeks: 2, changeCost: 1 };

/** المرحلة يلي فيها الأسبوع c بالشلال (c بين 0 و WF_TOTAL) */
export function wfPhaseAt(c: number) {
	let t = 0;
	for (let i = 0; i < WF_PHASES.length; i++) {
		if (c < t + WF_PHASES[i].weeks) return i;
		t += WF_PHASES[i].weeks;
	}
	return WF_PHASES.length - 1;
}

/** الشلال: change = أسبوع وصول طلب التغيير، أو null بدون تغيير */
export function waterfall(change: number | null): RaceResult {
	const segs: Seg[] = [];
	let t = 0;
	let extra = 0;
	const ci = change === null ? -1 : wfPhaseAt(change);
	WF_PHASES.forEach((p, i) => {
		if (i === ci) {
			// المرحلة بتنقطع عند التغيير، منرجع نعيد الشغل، وبعدين منكمّل
			const done = change! - t;
			if (done > 0) segs.push({ start: t, end: t + done, kind: 'phase', label: p.name });
			segs.push({ start: t + done, end: t + done + p.rework, kind: 'rework', label: 'إعادة العمل' });
			extra = p.rework;
			const rest = p.weeks - done;
			if (rest > 0) segs.push({ start: t + done + p.rework, end: t + done + p.rework + rest, kind: 'phase', label: p.name });
			t += p.weeks + p.rework;
		} else {
			segs.push({ start: t, end: t + p.weeks, kind: 'phase', label: p.name });
			t += p.weeks;
		}
	});
	return { segs, delivery: t, firstVersion: t, versions: [t], extra };
}

/** الرشيق: نفس المشروع مقسوم على دورات قصيرة، وبآخر كل دورة نسخة شغّالة */
export function agile(change: number | null): RaceResult {
	const segs: Seg[] = [{ start: 0, end: AGILE.plan, kind: 'plan', label: 'تخطيط' }];
	const versions: number[] = [];
	let t = AGILE.plan;
	let extra = 0;
	let changed = false;
	for (let i = 1; i <= AGILE.sprints; i++) {
		segs.push({ start: t, end: t + AGILE.sprintWeeks, kind: 'sprint', label: `${i}` });
		t += AGILE.sprintWeeks;
		// التغيير بيدخل بالدورة يلي وصل خلالها (أو بأول دورة إذا وصل وقت التخطيط)
		if (change !== null && !changed && change < t) {
			segs.push({ start: t, end: t + AGILE.changeCost, kind: 'change', label: 'تعديل' });
			t += AGILE.changeCost;
			extra = AGILE.changeCost;
			changed = true;
		}
		versions.push(t);
	}
	return { segs, delivery: t, firstVersion: versions[0], versions, extra };
}

// ===================== إدارة المشروع: المسار الحرج (CPM) =====================
export interface PmTask { id: string; name: string; dur: number; deps: string[] }
export const PM_TASKS: PmTask[] = [
	{ id: 'A', name: 'تحليل المتطلبات', dur: 2, deps: [] },
	{ id: 'B', name: 'تصميم الواجهات', dur: 2, deps: ['A'] },
	{ id: 'C', name: 'تصميم قاعدة البيانات', dur: 3, deps: ['A'] },
	{ id: 'D', name: 'برمجة الواجهات', dur: 4, deps: ['B'] },
	{ id: 'E', name: 'برمجة الخادم', dur: 5, deps: ['C'] },
	{ id: 'F', name: 'الاختبار', dur: 2, deps: ['D', 'E'] },
	{ id: 'G', name: 'التسليم', dur: 1, deps: ['F'] },
];
/** أبكر بداية ونهاية، وأتأخر بداية، والسماحية (slack)، والمسار الحرج. المهام لازم تكون مرتبة (كل مهمة بعد يلي بتعتمد عليها) */
export function cpm(tasks: PmTask[]) {
	const es = new Map<string, number>(), ef = new Map<string, number>();
	for (const t of tasks) {
		const s = Math.max(0, ...t.deps.map((d) => ef.get(d)!));
		es.set(t.id, s);
		ef.set(t.id, s + t.dur);
	}
	const end = Math.max(...tasks.map((t) => ef.get(t.id)!));
	const lf = new Map<string, number>();
	for (const t of [...tasks].reverse()) {
		const succ = tasks.filter((x) => x.deps.includes(t.id));
		lf.set(t.id, succ.length ? Math.min(...succ.map((x) => lf.get(x.id)! - x.dur)) : end);
	}
	const rows = tasks.map((t) => {
		const slack = lf.get(t.id)! - ef.get(t.id)!;
		return { ...t, es: es.get(t.id)!, ef: ef.get(t.id)!, slack, critical: slack === 0 };
	});
	return { rows, end };
}

// ===================== قانون Brooks: حجم الفريق =====================
/** عمل المشروع بالأسابيع لشخص واحد، وكلفة كل قناة تواصل من أسبوع الشخص */
export const BROOKS = { work: 60, chanCost: 0.13 };
export const channels = (n: number) => (n * (n - 1)) / 2;
/** كم أسبوع بياخد المشروع بفريق من n أشخاص (نموذج مبسّط: كل قناة تواصل بتاكل من وقت الفريق) */
export function brooksWeeks(n: number) {
	const rate = n - BROOKS.chanCost * channels(n);
	return rate > 0 ? BROOKS.work / rate : Infinity;
}

// ===================== الدَّين التقني =====================
export type DebtChoice = 'fast' | 'clean' | 'refactor';
export const DEBT = { base: 10, fastBonus: 3, fastDebt: 3, refactorCost: 5, refactorPay: 6 };
/** بكل دورة: سريع = ميزات أكتر هلق ودَين أكتر؛ نظيف = عادي؛ تنظيف = ميزات أقل وبيسدّ من الدَّين */
export function debtRun(choices: DebtChoice[]) {
	let debt = 0, total = 0;
	const rows = choices.map((c) => {
		let out = DEBT.base - debt;
		if (c === 'fast') out += DEBT.fastBonus;
		if (c === 'refactor') out -= DEBT.refactorCost;
		out = Math.max(0, out);
		if (c === 'fast') debt += DEBT.fastDebt;
		if (c === 'refactor') debt = Math.max(0, debt - DEBT.refactorPay);
		total += out;
		return { choice: c, features: out, debt, total };
	});
	return { rows, total, debt };
}

// ===================== الترابط والتماسك =====================
export const COUPLING_FNS = [
	{ id: 'login', name: 'تسجيل الدخول', home: 0 },
	{ id: 'profile', name: 'عرض الملف الشخصي', home: 0 },
	{ id: 'pass', name: 'تغيير كلمة السر', home: 0 },
	{ id: 'add', name: 'إضافة إلى السلة', home: 1 },
	{ id: 'total', name: 'حساب المجموع', home: 1 },
	{ id: 'disc', name: 'تطبيق الخصم', home: 1 },
	{ id: 'card', name: 'الدفع بالبطاقة', home: 2 },
	{ id: 'bill', name: 'إصدار الفاتورة', home: 2 },
	{ id: 'mail', name: 'إرسال الإيصال', home: 2 },
];
/** مين بينادي مين */
export const COUPLING_LINKS: [string, string][] = [
	['login', 'profile'], ['login', 'pass'], ['profile', 'pass'],
	['add', 'total'], ['total', 'disc'], ['add', 'disc'],
	['card', 'bill'], ['bill', 'mail'], ['card', 'mail'],
	['total', 'card'], ['login', 'add'],
];
/** where: لكل وظيفة رقم الوحدة. الترابط = روابط بين وحدات مختلفة، والتماسك = روابط جوّا نفس الوحدة */
export function couplingScore(where: Record<string, number>) {
	let cross = 0, inside = 0;
	const crossList: [string, string][] = [];
	for (const [a, b] of COUPLING_LINKS) {
		if (where[a] === where[b]) inside++;
		else { cross++; crossList.push([a, b]); }
	}
	return { cross, inside, crossList };
}

// ===================== اصطد الأخطاء: دالة العلامة =====================
export type GradeOut = 'ناجح' | 'راسب' | 'علامة غير صحيحة';
/** المطلوب: العلامة من 0 إلى 100، و 60 فما فوق ناجح */
export function gradeSpec(m: number): GradeOut {
	if (m < 0 || m > 100) return 'علامة غير صحيحة';
	return m >= 60 ? 'ناجح' : 'راسب';
}
/** الكود يلي كتبه المبرمج، وفيه خطأين مخفيين: الحد 60، وما بيفحص فوق 100 */
export function gradeBuggy(m: number): GradeOut {
	if (m < 0) return 'علامة غير صحيحة';
	return m > 60 ? 'ناجح' : 'راسب';
}
/** الصنف يلي بتنتمي إله القيمة (لعدّاد التغطية) */
export function gradeClass(m: number) {
	if (m < 0) return 'neg';
	if (m > 100) return 'over';
	return m >= 60 ? 'pass' : 'fail';
}
export const GRADE_EDGES = [0, 59, 60, 100];
