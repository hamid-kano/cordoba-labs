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
