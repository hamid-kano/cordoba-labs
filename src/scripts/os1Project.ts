// مشروع نظم التشغيل 1 (محاكي جدولة المعالج): التسجيل بمجموعات والتسليم.
// كل مجموعة بتنفّذ FCFS (الأساس) + خوارزمية وحدة من الخمسة، وبتقارن بيناتهن على بيانات خاصة فيها.
// Firestore (القواعد بـ firestore.rules، قسم «مشروع نظم التشغيل»):
//   settings/os1project  {regFrom, regTo, subTo, regMode, subMode, cap}  الإعدادات (القراءة للكل، والكتابة للمدرّس)
//                        مش موجودة = التسجيل والتسليم مقفولين (هيك بتبلش افتراضياً)
//   groups/{gid}         {algo, slot, size, n1, s1, n2, s2, n3, s3, pin, at}  (للمدرّس بس)
//   sids/{sid}           {g, at}      لحتى ما يتسجّل نفس الرقم الجامعي بمجموعتين (get للكل، بدون list)
//   slots/{algo_n}       {g, algo}    مقعد n بالخوارزمية (n ≤ cap): منه منعدّ الأماكن الباقية (list للكل)
//   subs/{gid}           {pin, url, kind, at}  التسليم، وبيتعدّل لحتى الموعد (للمدرّس بس)
// gid رمز المجموعة (4 أحرف، مش سر: منه بتطلع بيانات المجموعة)، و pin (6 أرقام) هو السر يلي بيسمح بالتسليم.
import { cpuSched, type SchedAlgo, type SchedProc } from './os1';

export const ALGOS = ['sjf', 'srtf', 'rr', 'prio', 'pprio'] as const;
export type ProjAlgo = (typeof ALGOS)[number];
export const ALGO_NAME: Record<ProjAlgo | 'fcfs', string> = {
	fcfs: 'FCFS',
	sjf: 'SJF',
	srtf: 'SRTF',
	rr: 'Round Robin',
	prio: 'الأولوية',
	pprio: 'الأولوية مع المقاطعة',
};
export const SETTINGS_PATH = ['settings', 'os1project'] as const;
export const DEFAULT_CAP = 12;
export type Mode = 'auto' | 'open' | 'closed';
export interface ProjSettings {
	regFrom: Date | null;
	regTo: Date | null;
	subTo: Date | null;
	regMode: Mode;
	subMode: Mode;
	cap: number;
}
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

/** بيانات المجموعة: 6 عمليات (وشريحة q لـ RR) مولّدة من رمزها، فكل مجموعة إلها نتائج مختلفة */
export function groupData(code: string): { procs: SchedProc[]; q: number } {
	let h = 2166136261;
	for (const c of code) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
	// mulberry32
	const next = () => {
		h = (h + 0x6d2b79f5) | 0;
		let t = Math.imul(h ^ (h >>> 15), 1 | h);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
	const int = (a: number, b: number) => a + Math.floor(next() * (b - a + 1));
	const procs: SchedProc[] = [];
	let arrival = 0;
	for (let i = 0; i < 6; i++) {
		if (i > 0) arrival += int(0, 3);
		procs.push({ name: `P${i + 1}`, arrival, burst: int(1, 9), prio: int(1, 5) });
	}
	return { procs, q: int(2, 4) };
}

/** ملف الإدخال بالصيغة الموحّدة */
export function inputFile(code: string, algo: ProjAlgo): string {
	const { procs, q } = groupData(code);
	const lines = [`# group ${code} - algorithm: ${algo.toUpperCase()}`, '# name arrival burst priority'];
	for (const p of procs) lines.push(`${p.name} ${p.arrival} ${p.burst} ${p.prio}`);
	if (algo === 'rr') lines.push(`q ${q}`);
	return lines.join('\n') + '\n';
}

/** النتائج المتوقعة (للمدرّس): FCFS وخوارزمية المجموعة */
export function expected(code: string, algo: ProjAlgo) {
	const { procs, q } = groupData(code);
	return { q, fcfs: cpuSched(procs, 'fcfs'), mine: cpuSched(procs, algo as SchedAlgo, q) };
}

/** علامة طريقة التسليم: GitHub = 2، أي رابط تاني = 1 (والتسليم اليدوي = 0) */
// نفس التعابير بـ firestore.rules (حساسة لحالة الأحرف، لهيك منوحّد بداية الرابط بـ normUrl قبل الفحص والحفظ)
export const GITHUB_RE = /^https:\/\/(www\.)?github\.com\/[^ ]+$/;
export const URL_RE = /^https?:\/\/[^ ]+\.[^ ]+$/;
export const normUrl = (s: string) =>
	s.trim().replace(/^(https?:\/\/)?(www\.)?github\.com\//i, 'https://github.com/').replace(/^https?:\/\//i, (m) => m.toLowerCase());
export const linkKind = (url: string): 'github' | 'link' => (GITHUB_RE.test(url) ? 'github' : 'link');
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

/** ما بيحفظه جهاز الطالب بعد التسجيل (لحتى ما يضطر يكتب الرمز كل مرة) */
export interface LocalGroup { gid: string; pin: string; algo: ProjAlgo; names: string[]; url?: string; subAt?: number }
const LS = 'os1-project';
export const loadLocal = (): LocalGroup | null => {
	try {
		return JSON.parse(localStorage.getItem(LS) ?? 'null');
	} catch {
		return null;
	}
};
export const saveLocal = (g: LocalGroup) => {
	try {
		localStorage.setItem(LS, JSON.stringify(g));
	} catch {}
};
