// محرك مادة الزمن الحقيقي: حسابات بسيطة بدون DOM، فبتنجرب بـ node file.mts مباشرة.

// ===== الجلسة 1: إحصاءات قياسات زمنية (رد الفعل، ومؤقّت المتصفح) =====
export interface TimeStats {
	n: number;
	mean: number;
	min: number;
	max: number;
	jitter: number; // الفرق بين أكبر وأصغر قيمة
}

export function timeStats(xs: number[]): TimeStats {
	const n = xs.length;
	if (!n) return { n: 0, mean: NaN, min: NaN, max: NaN, jitter: NaN };
	const min = Math.min(...xs);
	const max = Math.max(...xs);
	const mean = xs.reduce((a, b) => a + b, 0) / n;
	return { n, mean, min, max, jitter: max - min };
}

// كم قيمة تجاوزت المهلة
export const missed = (xs: number[], deadline: number) => xs.filter((x) => x > deadline).length;

// العدد مع المعدود بالعربي: (1، 'مرة واحدة') (2، 'مرتين') (3–10، '3 مرات') (11+، '11 مرة')
export function countAr(n: number, one: string, two: string, few: string, many: string) {
	if (n === 1) return one;
	if (n === 2) return two;
	return `${n} ${n <= 10 ? few : many}`;
}

// نوع النظام لكل مثال بمسابقة الجلسة 1
export type RtKind = 'hard' | 'firm' | 'soft';
export const RT_KIND_NAME: Record<RtKind, string> = { hard: 'صارم', firm: 'ثابت', soft: 'مرن' };

// ===== الجلسة 2: المهام الدورية وأرقامها =====
// كل الأزمنة أعداد صحيحة بنفس الوحدة (ms مثلاً)
export interface Task {
	name: string;
	C: number; // زمن التنفيذ بأسوأ حالة
	T: number; // الدور
	D?: number; // المهلة النسبية (إذا ما انكتبت = T)
}

export const deadlineOf = (t: Task) => t.D ?? t.T;
export const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
export const lcm = (a: number, b: number) => (a / gcd(a, b)) * b;

// الدورة الكبرى: المضاعف المشترك الأصغر للأدوار، وبعدها كل شي بيتكرر
export const hyperperiod = (ts: Task[]) => ts.reduce((h, t) => lcm(h, t.T), 1);

// نسبة استخدام المعالج U = مجموع C/T
export const utilization = (ts: Task[]) => ts.reduce((u, t) => u + t.C / t.T, 0);

// أرقام الدورة الكبرى: كم مرة بتشتغل كل مهمة، وكم وقت شغل ووقت فراغ
export function hyperStats(ts: Task[]) {
	const H = hyperperiod(ts);
	const jobs = ts.map((t) => H / t.T);
	const busy = ts.reduce((s, t, i) => s + t.C * jobs[i], 0);
	return { H, jobs, busy, idle: H - busy, U: utilization(ts) };
}

// «الطلب» لكل وحدة زمن: لو كل مهمة اشتغلت لحالها أول ما توصل، كم مهمة بدها المعالج بنفس اللحظة؟
// (للجلسة 2: بيبيّن التعارض يلي بيخلينا نحتاج جدولة)
export function demandAlone(ts: Task[], horizon: number) {
	const d = new Array(horizon).fill(0);
	ts.forEach((t) => {
		for (let r = 0; r < horizon; r += t.T) for (let k = r; k < Math.min(r + t.C, horizon); k++) d[k]++;
	});
	return d;
}

// ===== الجلسة 3: الجدولة الدورية (إطارات ثابتة) =====
// شروط حجم الإطار f (Baker & Shaw):
// 1) f ≥ أكبر C (كل نسخة بتخلص جوّا إطار واحد بدون مقاطعة)
// 2) f بيقسم الدورة الكبرى H
// 3) 2f − gcd(f, T) ≤ D لكل مهمة (بين وصول النسخة ومهلتها في إطار كامل على الأقل)
export function frameCheck(ts: Task[], f: number) {
	const H = hyperperiod(ts);
	const fits = f >= Math.max(...ts.map((t) => t.C));
	const divides = H % f === 0;
	const each = ts.map((t) => 2 * f - gcd(f, t.T) <= deadlineOf(t));
	return { f, fits, divides, each, enough: each.every(Boolean), ok: fits && divides && each.every(Boolean) };
}

// كل الأحجام من 1 للدورة الكبرى (أو قواسمها بس إذا كانت طويلة)
export function frameTable(ts: Task[]) {
	const H = hyperperiod(ts);
	const fs = H <= 24 ? Array.from({ length: H }, (_, i) => i + 1) : Array.from({ length: H }, (_, i) => i + 1).filter((f) => H % f === 0);
	return fs.map((f) => frameCheck(ts, f));
}

export interface CJob {
	task: number;
	k: number; // رقم النسخة من 0
	release: number;
	deadline: number;
	C: number;
}

export function jobsOf(ts: Task[], H = hyperperiod(ts)): CJob[] {
	const js: CJob[] = [];
	ts.forEach((t, i) => {
		for (let k = 0; k * t.T < H; k++) js.push({ task: i, k, release: k * t.T, deadline: k * t.T + deadlineOf(t), C: t.C });
	});
	return js;
}

// هل النسخة مسموح تنحط بالإطار رقم j؟ لازم الإطار يبدأ بعد وصولها ويخلص قبل مهلتها
export function frameWindow(job: CJob, j: number, f: number): 'ok' | 'early' | 'late' {
	if (j * f < job.release) return 'early';
	if ((j + 1) * f > job.deadline) return 'late';
	return 'ok';
}

// حل بالتجريب والرجوع (للزر «أرني حلاً»): بيرجع رقم الإطار لكل نسخة، أو null
export function cyclicSolve(ts: Task[], f: number): number[] | null {
	const H = hyperperiod(ts);
	const n = H / f;
	const js = jobsOf(ts, H);
	// الأضيق نافذة والأكبر أولاً لحتى يخلص التجريب بسرعة
	const order = js.map((_, i) => i).sort((a, b) => js[a].deadline - js[a].release - (js[b].deadline - js[b].release) || js[b].C - js[a].C);
	const load = new Array(n).fill(0);
	const at = new Array(js.length).fill(-1);
	const go = (p: number): boolean => {
		if (p === order.length) return true;
		const i = order[p];
		for (let j = 0; j < n; j++) {
			if (frameWindow(js[i], j, f) !== 'ok' || load[j] + js[i].C > f) continue;
			load[j] += js[i].C;
			at[i] = j;
			if (go(p + 1)) return true;
			load[j] -= js[i].C;
		}
		return false;
	};
	return go(0) ? at : null;
}

// ===== الجلسات 4 و 5: محاكاة الجدولة بالأولويات (مع مقاطعة) =====
// 'rm': الأقصر دوراً أولويته أعلى (ثابتة). 'order': الأولوية حسب ترتيب الجدول (للمقارنة).
// 'edf': بكل لحظة بتشتغل النسخة يلي مهلتها أقرب.
export type Policy = 'rm' | 'order' | 'edf';

export interface SimSlice {
	task: number;
	start: number;
	end: number;
}
export interface SimJob extends CJob {
	finish: number; // -1 إذا ما خلصت
	missed: boolean;
}
export interface SimResult {
	slices: SimSlice[];
	jobs: SimJob[];
	misses: number;
	preemptions: number;
	horizon: number;
}

// الأولوية الثابتة لكل مهمة (0 = الأعلى)
export function rmRanks(ts: Task[]) {
	const idx = ts.map((_, i) => i).sort((a, b) => ts[a].T - ts[b].T || a - b);
	const rank = new Array(ts.length);
	idx.forEach((i, r) => (rank[i] = r));
	return rank as number[];
}

// خطوة زمنية = وحدة وحدة. النسخة يلي بتفوت مهلتها منوقفها عندها (منعلّمها ✕ ومنكمّل بالباقي)
export function simulate(ts: Task[], policy: Policy, horizon = hyperperiod(ts)): SimResult {
	const jobs: SimJob[] = jobsOf(ts, horizon).map((j) => ({ ...j, finish: -1, missed: false }));
	const left = jobs.map((j) => j.C);
	const rank = policy === 'rm' ? rmRanks(ts) : ts.map((_, i) => i);
	const slices: SimSlice[] = [];
	let preemptions = 0;
	let prev = -1; // النسخة يلي اشتغلت بالوحدة الماضية
	for (let t = 0; t < horizon; t++) {
		// المهل يلي وصلت لهون وما خلصت
		jobs.forEach((j, i) => {
			if (!j.missed && j.finish < 0 && j.deadline <= t && left[i] > 0) j.missed = true;
		});
		let best = -1;
		jobs.forEach((j, i) => {
			if (j.release > t || left[i] <= 0 || j.missed) return;
			if (best < 0) return void (best = i);
			const b = jobs[best];
			const better =
				policy === 'edf'
					? j.deadline < b.deadline || (j.deadline === b.deadline && (j.task < b.task || (j.task === b.task && j.k < b.k)))
					: rank[j.task] < rank[b.task] || (j.task === b.task && j.k < b.k);
			if (better) best = i;
		});
		if (best < 0) {
			prev = -1;
			continue;
		}
		if (prev >= 0 && prev !== best && left[prev] > 0 && !jobs[prev].missed) preemptions++;
		const last = slices[slices.length - 1];
		if (last && last.task === jobs[best].task && last.end === t && prev === best) last.end = t + 1;
		else slices.push({ task: jobs[best].task, start: t, end: t + 1 });
		left[best]--;
		if (left[best] === 0) jobs[best].finish = t + 1;
		prev = best;
	}
	jobs.forEach((j, i) => {
		if (!j.missed && j.finish < 0 && left[i] > 0 && j.deadline <= horizon) j.missed = true;
	});
	return { slices, jobs, misses: jobs.filter((j) => j.missed).length, preemptions, horizon };
}

// حد Liu & Layland لـ n مهمة: n(2^(1/n) − 1)
export const llBound = (n: number) => n * (2 ** (1 / n) - 1);

// حكم اختبار الاستخدام لـ RM: 'sure' مضمون، 'maybe' لازم نرسم، 'no' مستحيل
export function rmTest(ts: Task[]) {
	const U = utilization(ts);
	const B = llBound(ts.length);
	return { U, B, verdict: (U <= B + 1e-12 ? 'sure' : U <= 1 + 1e-12 ? 'maybe' : 'no') as 'sure' | 'maybe' | 'no' };
}

// ===== الجلسة 6: الموارد المشتركة وانقلاب الأولوية =====
// نسخ لمرة وحدة (مش دورية) لحتى تبين الفكرة. كل نسخة أجزاء ورا بعض، والجزء res بيحتاج القفل الوحيد.
export interface LockJob {
	name: string;
	prio: number; // 0 = الأعلى
	release: number;
	parts: { len: number; res?: boolean }[];
	deadline?: number; // مطلقة (اختيارية)
}
export type LockProtocol = 'none' | 'inherit' | 'ceiling';
export interface LockSlice {
	job: number;
	start: number;
	end: number;
	res: boolean; // جوّا القسم الحرج
	prio: number; // الأولوية الفعلية وقتها (لتبيين الوراثة)
}

export function simulateLocks(js: LockJob[], proto: LockProtocol, horizon: number) {
	const part = js.map(() => 0);
	const left = js.map((j) => j.parts[0]?.len ?? 0);
	const finish = js.map(() => -1);
	const blocked: { job: number; start: number; end: number; lock: boolean }[] = [];
	const slices: LockSlice[] = [];
	let owner = -1;
	// سقف القفل: أعلى أولوية بين كل يلي بيستخدموه
	const ceiling = Math.min(...js.filter((j) => j.parts.some((p) => p.res)).map((j) => j.prio));
	for (let t = 0; t < horizon; t++) {
		const ready = js.map((j, i) => j.release <= t && finish[i] < 0);
		const wantsLock = (i: number) => !!js[i].parts[part[i]]?.res && owner !== i;
		const isBlocked = (i: number) => wantsLock(i) && owner >= 0;
		const eff = js.map((j, i) => {
			let p = j.prio;
			if (i === owner) {
				if (proto === 'ceiling') p = Math.min(p, ceiling);
				if (proto === 'inherit') js.forEach((o, k) => ready[k] && isBlocked(k) && (p = Math.min(p, o.prio)));
			}
			return p;
		});
		let best = -1;
		js.forEach((_, i) => {
			if (!ready[i] || isBlocked(i)) return;
			// بالتساوي بتكمّل يلي ماسكة القفل (سقف الأولوية)، وبعدها الأقدم
			if (best < 0 || eff[i] < eff[best] || (eff[i] === eff[best] && i === owner)) best = i;
		});
		// الانتظار: جاهزة بس مش عم تشتغل (lock = عم تستنى القفل نفسه)
		js.forEach((_, i) => {
			if (!ready[i] || i === best) return;
			const lock = isBlocked(i);
			const last = [...blocked].reverse().find((x) => x.job === i);
			if (last && last.end === t && last.lock === lock) last.end = t + 1;
			else blocked.push({ job: i, start: t, end: t + 1, lock });
		});
		if (best < 0) continue;
		const res = !!js[best].parts[part[best]].res;
		if (res && owner < 0) owner = best;
		// بسقف الأولوية بترتفع أول ما تاخد القفل (من نفس الوحدة)
		const pr = res && proto === 'ceiling' ? Math.min(eff[best], ceiling) : eff[best];
		const prev = slices[slices.length - 1];
		if (prev && prev.job === best && prev.end === t && prev.res === res && prev.prio === pr) prev.end = t + 1;
		else slices.push({ job: best, start: t, end: t + 1, res, prio: pr });
		if (--left[best] === 0) {
			if (res) owner = -1;
			part[best]++;
			if (part[best] >= js[best].parts.length) finish[best] = t + 1;
			else left[best] = js[best].parts[part[best]].len;
		}
	}
	const response = js.map((j, i) => (finish[i] >= 0 ? finish[i] - j.release : -1));
	const missed = js.map((j, i) => j.deadline !== undefined && (finish[i] < 0 || finish[i] > j.deadline));
	return { slices, blocked, finish, response, missed };
}

// سيناريو الجلسة 6: L بتمسك القفل، H بتستناه، و M بطولها m بتقطع L
export function inversionScenario(m: number, deadline = 9): LockJob[] {
	return [
		{ name: 'H', prio: 0, release: 2, parts: [{ len: 1 }, { len: 1, res: true }, { len: 1 }], deadline },
		{ name: 'M', prio: 1, release: 3, parts: [{ len: m }] },
		{ name: 'L', prio: 2, release: 0, parts: [{ len: 1 }, { len: 3, res: true }, { len: 1 }] },
	];
}
