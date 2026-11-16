// مشاريع المواد (نظم التشغيل 1، ونظم الزمن الحقيقي): التسجيل بمجموعات، وبيانات خاصة بكل مجموعة، والتسليم.
// Firestore (القواعد بـ firestore.rules، قسم «مشاريع المواد»)، كل مادة إلها فرعها proj/{course}:
//   proj/{course}                 {regFrom, regTo, subTo, regMode, subMode, cap}  الإعدادات (القراءة للكل، والكتابة للمدرّس)
//                                 مش موجودة = التسجيل والتسليم مقفولين (هيك بتبلش افتراضياً)
//   proj/{course}/groups/{gid}    {opt, slot, size, n1, s1, n2, s2, n3, s3, pin, at}  (للمدرّس بس)
//   proj/{course}/sids/{sid}      {g, at}     لحتى ما يتسجّل نفس الرقم الجامعي بمجموعتين بنفس المادة (get للكل، بدون list)
//   proj/{course}/slots/{opt_n}   {g, opt}    مقعد n بالخيار (n ≤ cap): منه منعدّ الأماكن الباقية (list للكل)
//   proj/{course}/subs/{gid}      {pin, url, kind, at}  التسليم، وبيتعدّل لحتى الموعد (للمدرّس بس)
// gid رمز المجموعة (4 أحرف، مش سر: منه بتطلع بيانات المجموعة)، و pin (6 أرقام) هو السر يلي بيسمح بالتسليم.
// الخيارات (opt) وأقل عدد بالمجموعة لكل مادة لازم يطابقوا optsOf و minSize بـ firestore.rules.
import type { SchedProc } from './os1';
import { utilization, hyperperiod, simulate, llBound, type Task } from './rts';

export type Course = 'os1' | 'rts';
export interface CourseProj {
	id: Course;
	opts: readonly string[];
	optName: Record<string, string>;
	optWord: string; // «الخوارزمية» أو «المشروع»
	minSize: number;
	maxSize: number;
}

// ===== نظم التشغيل 1: محاكي جدولة المعالج =====
// كل مجموعة بتنفّذ FCFS (الأساس) + خوارزمية وحدة من الخمسة، وبتقارن بيناتهن على بيانات خاصة فيها.
export const OS1: CourseProj = {
	id: 'os1',
	opts: ['sjf', 'srtf', 'rr', 'prio', 'pprio'],
	optName: { fcfs: 'FCFS', sjf: 'SJF', srtf: 'SRTF', rr: 'Round Robin', prio: 'الأولوية', pprio: 'الأولوية مع المقاطعة' },
	optWord: 'الخوارزمية',
	minSize: 2,
	maxSize: 3,
};

// ===== نظم الزمن الحقيقي: جهاز بـ 4 مهام دورية =====
// خمس أفكار (القصة وأسماء المهام ثابتة)، والأرقام C و T مولّدة من رمز المجموعة: U فوق حد RM (لازم يرسم)،
// والدورة الكبرى ≤ 60، ونص المجموعات تقريباً RM بيفشل عندها (و EDF دايماً بينجح لأن U ≤ 1).
export const RTS: CourseProj = {
	id: 'rts',
	opts: ['line', 'drone', 'parking', 'patient', 'traffic'],
	optName: { line: 'روبوت متتبع الخط', drone: 'طائرة مسيّرة', parking: 'حسّاس ركن السيارة', patient: 'جهاز مراقبة المريض', traffic: 'إشارة مرور ذكية' },
	optWord: 'المشروع',
	minSize: 1,
	maxSize: 3,
};
export const COURSES: Record<Course, CourseProj> = { os1: OS1, rts: RTS };

/** مهام كل فكرة بالـ RTS، من الأقصر دوراً للأطول (الاسم الإنكليزي للكود بـ Wokwi) */
export const RTS_TASKS: Record<string, { ar: string; en: string; job: string }[]> = {
	line: [
		{ ar: 'الحسّاسات', en: 'sensors', job: 'تقرأ حسّاسات الخط تحت الروبوت' },
		{ ar: 'المحرّكات', en: 'motors', job: 'تحسب سرعة كل عجلة' },
		{ ar: 'الشاشة', en: 'display', job: 'تعرض حالة الروبوت' },
		{ ar: 'البلوتوث', en: 'bluetooth', job: 'ترسل البيانات إلى الهاتف' },
	],
	drone: [
		{ ar: 'التوازن', en: 'gyro', job: 'تقرأ حسّاس الميلان' },
		{ ar: 'المراوح', en: 'motors', job: 'تضبط سرعة المراوح الأربع' },
		{ ar: 'الموقع', en: 'gps', job: 'تقرأ موقع GPS' },
		{ ar: 'الكاميرا', en: 'camera', job: 'ترسل الصورة إلى الهاتف' },
	],
	parking: [
		{ ar: 'المسافة', en: 'distance', job: 'تقيس المسافة إلى العائق' },
		{ ar: 'الفرامل', en: 'brakes', job: 'تضغط الفرامل إذا اقترب العائق جداً' },
		{ ar: 'التنبيه', en: 'buzzer', job: 'تصدر صوت التنبيه' },
		{ ar: 'الشاشة', en: 'display', job: 'تعرض المسافة للسائق' },
	],
	patient: [
		{ ar: 'النبض', en: 'heart', job: 'تقرأ حسّاس نبض القلب' },
		{ ar: 'الأكسجين', en: 'oxygen', job: 'تقرأ نسبة الأكسجين في الدم' },
		{ ar: 'الإنذار', en: 'alarm', job: 'تطلق الإنذار إذا كانت القراءة خطرة' },
		{ ar: 'الشاشة', en: 'display', job: 'تعرض القراءات للممرّض' },
	],
	traffic: [
		{ ar: 'السيارات', en: 'cars', job: 'تعدّ السيارات عند الإشارة' },
		{ ar: 'زر المشاة', en: 'button', job: 'تقرأ زر عبور المشاة' },
		{ ar: 'الأضواء', en: 'lights', job: 'تبدّل الأضواء' },
		{ ar: 'التقرير', en: 'report', job: 'ترسل تقرير الازدحام إلى البلدية' },
	],
};

// ===== المواعيد =====
export type Mode = 'auto' | 'open' | 'closed';
export interface ProjSettings {
	regFrom: Date | null;
	regTo: Date | null;
	subTo: Date | null;
	regMode: Mode;
	subMode: Mode;
	cap: number;
}
export const DEFAULT_CAP = 12;
export const CLOSED: ProjSettings = { regFrom: null, regTo: null, subTo: null, regMode: 'closed', subMode: 'closed', cap: DEFAULT_CAP };

/** حالة التسجيل أو التسليم الآن (نفس منطق firestore.rules) */
export function regState(s: ProjSettings, now = new Date()): { open: boolean; until: Date | null; soon: Date | null } {
	if (s.regMode === 'open') return { open: true, until: null, soon: null };
	if (s.regMode === 'closed' || !s.regFrom || !s.regTo) return { open: false, until: null, soon: null };
	if (now < s.regFrom) return { open: false, until: null, soon: s.regFrom };
	return { open: now < s.regTo, until: s.regTo, soon: null };
}
export function subState(s: ProjSettings, now = new Date()): { open: boolean; until: Date | null } {
	if (s.subMode === 'open') return { open: true, until: null };
	if (s.subMode === 'closed' || !s.subTo) return { open: false, until: null };
	return { open: now < s.subTo, until: s.subTo };
}

// ===== الرموز =====
// رمز المجموعة: بدون الأحرف يلي بتتلخبط (O و 0، I و 1 و L)
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const rnd = (n: number) => {
	const a = new Uint32Array(1);
	crypto.getRandomValues(a);
	return a[0] % n;
};
export const newCode = () => Array.from({ length: 4 }, () => CODE_CHARS[rnd(CODE_CHARS.length)]).join('');
export const newPin = () => String(100000 + rnd(900000));
export const CODE_RE = /^[A-HJ-NP-Z2-9]{4}$/;
export const normCode = (s: string) => s.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
/** الرقم الجامعي: أرقام وأحرف إنكليزية بس (نفس firestore.rules)، والأرقام العربية بتتحوّل */
export const normSid = (s: string) => s.trim().replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/\s+/g, '');
export const SID_RE = /^[0-9A-Za-z-]{3,20}$/;

/** مولّد أرقام عشوائية ثابت من نص (mulberry32): نفس الرمز = نفس البيانات دايماً */
function seeded(seed: string) {
	let h = 2166136261;
	for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
	const next = () => {
		h = (h + 0x6d2b79f5) | 0;
		let t = Math.imul(h ^ (h >>> 15), 1 | h);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
	return { next, int: (a: number, b: number) => a + Math.floor(next() * (b - a + 1)) };
}

// ===== بيانات مجموعة نظم التشغيل =====
/** 6 عمليات (وشريحة q لـ RR) مولّدة من رمز المجموعة (البذرة نفسها تبع الإصدار الأول، لا تغيّرها) */
export function os1Data(code: string): { procs: SchedProc[]; q: number } {
	const { int } = seeded(code);
	const procs: SchedProc[] = [];
	let arrival = 0;
	for (let i = 0; i < 6; i++) {
		if (i > 0) arrival += int(0, 3);
		procs.push({ name: `P${i + 1}`, arrival, burst: int(1, 9), prio: int(1, 5) });
	}
	return { procs, q: int(2, 4) };
}
/** ملف الإدخال بالصيغة الموحّدة */
export function os1Input(code: string, opt: string): string {
	const { procs, q } = os1Data(code);
	const lines = [`# group ${code} - algorithm: ${opt.toUpperCase()}`, '# name arrival burst priority'];
	for (const p of procs) lines.push(`${p.name} ${p.arrival} ${p.burst} ${p.prio}`);
	if (opt === 'rr') lines.push(`q ${q}`);
	return lines.join('\n') + '\n';
}

// ===== بيانات مجموعة الزمن الحقيقي =====
const RTS_T = [4, 5, 6, 8, 10, 12, 15, 20, 24, 30, 40, 60];
/** 4 مهام بأدوار مختلفة: 0.777 < U ≤ 1، والدورة الكبرى ≤ 60، و ≤ 24 نسخة بالدورة (ليترسم باليد)،
 * و RM بيفشل عند نص المجموعات تقريباً (القرعة من الرمز نفسه، فالصعوبة واحدة والنتيجة بتختلف) */
export function rtsData(code: string): Task[] {
	const { next, int } = seeded('rts:' + code);
	const wantFail = next() < 0.5;
	const LL = llBound(4);
	let last: Task[] = [];
	for (let i = 0; i < 20000; i++) {
		const set = new Set<number>();
		while (set.size < 4) set.add(RTS_T[int(0, RTS_T.length - 1)]);
		const Ts = [...set].sort((a, b) => a - b);
		const ts = Ts.map((T, k) => ({ name: `T${k + 1}`, C: int(1, Math.max(1, Math.floor(T / 2))), T }));
		const H = hyperperiod(ts);
		if (H > 60 || ts.reduce((s, t) => s + H / t.T, 0) > 24) continue;
		const U = utilization(ts);
		if (!(U > LL + 0.02 && U <= 1)) continue;
		last = ts;
		if (simulate(ts, 'rm').misses > 0 === wantFail) return ts;
	}
	return last; // ما بيصير عملياً (جرّبنا 400 رمز وكلهن لقوا حل)
}
/** أسطر جدول tasks بقالب Wokwi (الأولوية متروكة للطالب) */
export function rtsWokwi(code: string, opt: string): string {
	const names = RTS_TASKS[opt];
	return rtsData(code)
		.map((t, i) => `  { "${names[i].en}",${' '.repeat(Math.max(1, 11 - names[i].en.length))}${String(t.C).padStart(2)}, ${String(t.T).padStart(3)},  ?,  0, 0, 0 },`)
		.join('\n');
}

// ===== التسليم =====
// نفس التعابير بـ firestore.rules (حساسة لحالة الأحرف، لهيك منوحّد بداية الرابط بـ normUrl قبل الفحص والحفظ)
export const GITHUB_RE = /^https:\/\/(www\.)?github\.com\/[^ ]+$/;
export const URL_RE = /^https?:\/\/[^ ]+\.[^ ]+$/;
export const normUrl = (s: string) =>
	s.trim().replace(/^(https?:\/\/)?(www\.)?github\.com\//i, 'https://github.com/').replace(/^https?:\/\//i, (m) => m.toLowerCase());
export const linkKind = (url: string): 'github' | 'link' => (GITHUB_RE.test(url) ? 'github' : 'link');
/** علامة طريقة التسليم: GitHub = 2، أي رابط تاني = 1 (والتسليم اليدوي = 0) */
export const linkMark = (kind?: string) => (kind === 'github' ? 2 : kind === 'link' ? 1 : 0);

export const fmtWhen = (d: Date | null) =>
	d ? d.toLocaleString('ar-SY-u-nu-latn', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
export function left(d: Date, now = new Date()): string {
	const m = Math.max(0, Math.round((d.getTime() - now.getTime()) / 60000));
	const days = Math.floor(m / 1440), hrs = Math.floor((m % 1440) / 60), mins = m % 60;
	if (days) return `${days} يوم${hrs ? ' و' + hrs + ' ساعة' : ''}`;
	if (hrs) return `${hrs} ساعة${mins ? ' و' + mins + ' دقيقة' : ''}`;
	return `${mins} دقيقة`;
}

/** ما بيحفظه جهاز الطالب بعد التسجيل (لكل مادة لحالها) */
export interface LocalGroup { gid: string; pin: string; opt: string; names: string[]; url?: string; subAt?: number }
const lsKey = (c: Course) => (c === 'os1' ? 'os1-project' : `${c}-project`);
export const loadLocal = (c: Course): LocalGroup | null => {
	try {
		const x = JSON.parse(localStorage.getItem(lsKey(c)) ?? 'null');
		if (x && !x.opt && x.algo) x.opt = x.algo; // الإصدار الأول كان بيسمّيها algo
		return x;
	} catch {
		return null;
	}
};
export const saveLocal = (c: Course, g: LocalGroup) => {
	try {
		localStorage.setItem(lsKey(c), JSON.stringify(g));
	} catch {}
};
