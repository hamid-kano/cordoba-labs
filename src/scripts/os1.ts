// حسابات أدوات نظم التشغيل 1 (بدون واجهة)، لحتى نجربها بـ node ونتأكد من أرقام الصفحات.

// ===== جدولة القرص (الجلسة 1) =====
export type DiskAlgo = 'fcfs' | 'sstf' | 'scan' | 'cscan' | 'look' | 'clook';
export interface DiskResult {
	/** المسار الكامل لرأس القرص (بما فيه الأطراف 0 و max إذا وصلها) */
	path: number[];
	/** ترتيب خدمة الطلبات */
	order: number[];
	/** مجموع الحركة (بما فيها رجعة C-SCAN و C-LOOK) */
	total: number;
	/** طول القفزة الراجعة (C-SCAN و C-LOOK)، صفر لغيرهن */
	jump: number;
}

/**
 * up = true: الرأس ماشي لفوق (نحو الأرقام الأكبر).
 * max = آخر مسار (مثلاً 199).
 */
export function diskSchedule(algo: DiskAlgo, queue: number[], head: number, max: number, up: boolean): DiskResult {
	const path = [head];
	const order: number[] = [];
	let jump = 0;
	const lower = queue.filter((c) => c < head).sort((a, b) => b - a); // من الأقرب للأبعد نزولاً
	const higher = queue.filter((c) => c >= head).sort((a, b) => a - b); // من الأقرب للأبعد صعوداً
	const go = (c: number) => {
		path.push(c);
		order.push(c);
	};

	if (algo === 'fcfs') queue.forEach(go);
	else if (algo === 'sstf') {
		const left = [...queue];
		let pos = head;
		while (left.length) {
			let best = 0;
			for (let i = 1; i < left.length; i++) {
				const d = Math.abs(left[i] - pos);
				const bd = Math.abs(left[best] - pos);
				if (d < bd || (d === bd && left[i] < left[best])) best = i;
			}
			pos = left.splice(best, 1)[0];
			go(pos);
		}
	} else {
		const first = up ? higher : lower;
		const second = up ? lower : higher;
		first.forEach(go);
		if (algo === 'scan') {
			if (second.length) {
				path.push(up ? max : 0);
				second.forEach(go);
			}
		} else if (algo === 'look') second.forEach(go);
		else if (algo === 'cscan') {
			if (second.length) {
				const edge = up ? max : 0;
				const other = up ? 0 : max;
				path.push(edge, other);
				jump = max;
				[...second].reverse().forEach(go);
			}
		} else if (algo === 'clook') {
			if (second.length) {
				const rest = [...second].reverse();
				jump = Math.abs(rest[0] - path[path.length - 1]);
				rest.forEach(go);
			}
		}
	}
	let total = 0;
	for (let i = 1; i < path.length; i++) total += Math.abs(path[i] - path[i - 1]);
	return { path, order, total, jump };
}

// ===== RAID (الجلسة 2) =====
export type RaidLevel = 0 | 1 | 5 | 6 | 10;
export function raidInfo(level: RaidLevel, n: number, size: number) {
	switch (level) {
		case 0:
			return { ok: n >= 2, min: 2, usable: n * size, tolerate: 0, note: 'سرعة عالية، وبدون أي حماية' };
		case 1:
			return { ok: n >= 2, min: 2, usable: size, tolerate: n - 1, note: 'كل الأقراص نسخ عن بعض' };
		case 5:
			return { ok: n >= 3, min: 3, usable: (n - 1) * size, tolerate: 1, note: 'قرص واحد للتكافؤ موزّع على الكل' };
		case 6:
			return { ok: n >= 4, min: 4, usable: (n - 2) * size, tolerate: 2, note: 'قرصين للتكافؤ' };
		case 10:
			return { ok: n >= 4 && n % 2 === 0, min: 4, usable: (n / 2) * size, tolerate: 1, note: 'كل قرصين نسخ عن بعض، والبيانات موزعة على الأزواج' };
	}
}
export const xor = (vals: number[]) => vals.reduce((a, b) => a ^ b, 0);

// ===== النسخ الاحتياطي (الجلسة 4) =====
export type BackupKind = 'full' | 'incr' | 'diff';
/** day: 0 = يوم النسخة الكاملة، 1..6 الأيام بعدها. بترجع النسخ يلي لازم نرجّعها بالترتيب */
export function restoreChain(kind: BackupKind, day: number): number[] {
	if (kind === 'full' || day === 0) return [day];
	if (kind === 'diff') return [0, day];
	return Array.from({ length: day + 1 }, (_, i) => i);
}
/** حجم نسخة اليوم d (كامل = full، وكل يوم بيتغيّر change) */
export function backupSize(kind: BackupKind, d: number, full: number, change: number) {
	if (d === 0 || kind === 'full') return full;
	return kind === 'incr' ? change : change * d;
}

// ===== اقطع الكهرباء (الجلسة 3): حفظ نسخة جديدة من ملف، بسجل أو بدونه =====
// القرص 8 كتل. الملف report.txt بالكتلة 3، والنسخة الجديدة بتنكتب بالكتلة 6 (نسخ عند الكتابة).
export const PC_OLD = 3;
export const PC_NEW = 6;
export type PcStep = 'plan' | 'commit' | 'data' | 'table' | 'alloc' | 'free' | 'clear';
/** الخطوات بالترتيب. بدون سجل 4، ومع السجل 7 */
export const pcSteps = (journal: boolean): PcStep[] =>
	journal ? ['plan', 'commit', 'data', 'table', 'alloc', 'free', 'clear'] : ['data', 'table', 'alloc', 'free'];
export interface PcState {
	file: number; // الكتلة يلي بيأشّر عليها جدول الملفات
	used: number[]; // الكتل المعلّمة «مستخدمة» بخريطة المساحة الحرة (من 3 و 6 بس)
	newData: boolean; // هل النسخة الجديدة مكتوبة بالكتلة 6؟
	journal: 'empty' | 'plan' | 'commit';
}
/** حالة القرص بعد ما تخلص أول `done` خطوة (الخطوة يلي انقطعت بنصها ما بتنحسب) */
export function pcState(journal: boolean, done: number): PcState {
	const s: PcState = { file: PC_OLD, used: [PC_OLD], newData: false, journal: 'empty' };
	for (const st of pcSteps(journal).slice(0, done)) {
		if (st === 'plan') s.journal = 'plan';
		else if (st === 'commit') s.journal = 'commit';
		else if (st === 'data') s.newData = true;
		else if (st === 'table') s.file = PC_NEW;
		else if (st === 'alloc') s.used = [...s.used, PC_NEW];
		else if (st === 'free') s.used = s.used.filter((b) => b !== PC_OLD);
		else if (st === 'clear') s.journal = 'empty';
	}
	return s;
}
export type PcProblem = 'owned-free' | 'leak';
/** فحص التناسق: كتلة الملف لازم تكون مستخدمة، وكل كتلة مستخدمة لازم يملكها ملف */
export function pcCheck(s: PcState): { problem: PcProblem; block: number }[] {
	const out: { problem: PcProblem; block: number }[] = [];
	if (!s.used.includes(s.file)) out.push({ problem: 'owned-free', block: s.file });
	for (const b of s.used) if (b !== s.file) out.push({ problem: 'leak', block: b });
	return out;
}
/** إعادة التشغيل: مع السجل، الخطة المؤكدة بتتعاد كلها، وغير المؤكدة بتنلغى. بدون سجل ما في شي نعمله */
export function pcRecover(journal: boolean, done: number) {
	const before = pcState(journal, done);
	let action: 'none' | 'discard' | 'replay' = 'none';
	let after = before;
	if (journal && before.journal === 'plan') {
		action = 'discard';
		after = { ...before, journal: 'empty' };
	} else if (journal && before.journal === 'commit') {
		action = 'replay';
		after = pcState(true, pcSteps(true).length);
	}
	const problems = pcCheck(after);
	const version = problems.length ? 'broken' : after.file === PC_NEW ? 'new' : 'old';
	return { before, after, action, problems, ok: problems.length === 0, version } as const;
}
/** كل لحظات الانقطاع الممكنة (بعد 0 لـ n خطوة) وأي وحدة منها مؤذية */
export const pcTally = (journal: boolean) =>
	Array.from({ length: pcSteps(journal).length + 1 }, (_, done) => ({ done, ok: pcRecover(journal, done).ok }));

// ===== قاعدة 3-2-1 (الجلسة 3) =====
export type CopyLoc = 'laptop' | 'usb' | 'dock' | 'drawer' | 'cloud';
export const COPY_LOCS: { id: CopyLoc; media: string; place: 'bag' | 'home' | 'away'; online: boolean; mirror: boolean }[] = [
	{ id: 'laptop', media: 'ssd', place: 'bag', online: true, mirror: false }, // الأصل، دايماً موجود
	{ id: 'usb', media: 'flash', place: 'bag', online: false, mirror: false }, // فلاشة بحقيبة اللابتوب
	{ id: 'dock', media: 'hdd', place: 'home', online: true, mirror: true }, // قرص خارجي موصول دايماً، نسخة طبق الأصل كل ساعة
	{ id: 'drawer', media: 'hdd', place: 'home', online: false, mirror: false }, // قرص خارجي بالدرج، بينوصل مرة بالأسبوع
	{ id: 'cloud', media: 'cloud', place: 'away', online: true, mirror: true }, // مجلد مزامنة سحابي
];
export type Disaster = 'disk' | 'theft' | 'fire' | 'ransom' | 'delete' | 'surge';
export const DISASTERS: Disaster[] = ['disk', 'theft', 'fire', 'ransom', 'delete', 'surge'];
/** هل الكارثة d بتضيّع النسخة يلي بالمكان loc؟ */
export function disasterHits(d: Disaster, loc: CopyLoc): boolean {
	const L = COPY_LOCS.find((l) => l.id === loc)!;
	switch (d) {
		case 'disk': return loc === 'laptop'; // تعطّل قرص اللابتوب
		case 'theft': return L.place === 'bag'; // سرقة الحقيبة باللابتوب والفلاشة
		case 'fire': return L.place !== 'away'; // حريق بالبيت (الحقيبة كمان بالبيت بالليل)
		case 'ransom': return L.online; // الفدية بتشفّر كل شي موصول أو متزامن
		case 'delete': return loc === 'laptop' || L.mirror; // الحذف بالغلط بينتقل لكل نسخة طبق الأصل
		case 'surge': return loc === 'laptop' || loc === 'dock'; // صاعقة على الكهرباء: كل شي موصول بالشاحن
	}
}
/** النسخ يلي بتضل بعد الكارثة (اللابتوب دايماً من ضمنها) */
export const survivors = (locs: CopyLoc[], d: Disaster) => withLaptop(locs).filter((l) => !disasterHits(d, l));
const withLaptop = (locs: CopyLoc[]): CopyLoc[] => ['laptop', ...locs.filter((l) => l !== 'laptop')];
/** فحص القاعدة: 3 نسخ، ونوعين وسائط، وواحدة برّا البيت. و offline = في نسخة مفصولة؟ */
export function rule321(locs: CopyLoc[]) {
	const all = withLaptop(locs).map((id) => COPY_LOCS.find((l) => l.id === id)!);
	const copies = all.length;
	const media = new Set(all.map((l) => l.media)).size;
	const offsite = all.filter((l) => l.place === 'away').length;
	const offline = all.filter((l) => !l.online).length;
	return { copies, media, offsite, offline, ok: copies >= 3 && media >= 2 && offsite >= 1 };
}
/** كم كارثة (من 6) بتنجو منها الملفات إذا صارت لحالها */
export const disasterScore = (locs: CopyLoc[]) => DISASTERS.filter((d) => survivors(locs, d).length > 0).length;

// ===== فيروس الفدية (الجلسة 3) =====
// اليوم -1 = الجمعة الماضية، 0..4 = السبت..الأربعاء، والهجوم الخميس (5) الساعة 11 الصبح.
export const RW_ATTACK = 5;
export const RW_FILES: { name: string; edits: number[] }[] = [
	{ name: 'report.docx', edits: [1, 3, 5] },
	{ name: 'notes.txt', edits: [0, 2, 4] },
	{ name: 'grades.xlsx', edits: [4] },
	{ name: 'code.c', edits: [0, 1, 2, 3, 4, 5] },
	{ name: 'slides.pptx', edits: [2] },
	{ name: 'photo.jpg', edits: [] },
	{ name: 'thesis.pdf', edits: [3] },
	{ name: 'song.mp3', edits: [] },
];
export type RwProtect = 'none' | 'sync' | 'versions' | 'offline';
/** النسخ المتاحة للاستعادة: رقم الليلة، و RW_ATTACK = «الآن» (بعد الهجوم، مشفّرة) */
export function rwSnapshots(p: RwProtect): number[] {
	if (p === 'none') return [];
	if (p === 'sync') return [RW_ATTACK];
	if (p === 'offline') return [-1];
	return [-1, 0, 1, 2, 3, 4, RW_ATTACK];
}
/** استعادة النسخة snap: كل ملف إما مقفل، أو رجع مع عدد التعديلات يلي ضاعت */
export function rwRestore(snap: number) {
	const files = RW_FILES.map((f) =>
		snap >= RW_ATTACK
			? { name: f.name, locked: true, lost: 0 }
			: { name: f.name, locked: false, lost: f.edits.filter((d) => d > snap).length },
	);
	return {
		files,
		saved: files.filter((f) => !f.locked).length,
		lostEdits: files.reduce((a, f) => a + f.lost, 0),
		filesWithLoss: files.filter((f) => !f.locked && f.lost > 0).length,
	};
}
/** أحسن نتيجة لكل حماية (أحدث نسخة قبل الهجوم) */
export function rwBest(p: RwProtect) {
	const snaps = rwSnapshots(p).filter((s) => s < RW_ATTACK);
	if (!snaps.length) return { snap: null, saved: 0, lostEdits: 0, filesWithLoss: 0 };
	const snap = Math.max(...snaps);
	return { snap, ...rwRestore(snap) };
}
/** محتوى الملف i بلحظة t (بعد تعديلات الأيام <= t)، أو مشفّر. منه منحسب البصمة */
export const rwContent = (i: number, t: number, locked = false) =>
	locked ? `${RW_FILES[i].name}.locked#x9$${i}` : `${RW_FILES[i].name}@v${RW_FILES[i].edits.filter((d) => d <= t).length}`;
/** كم ملف تغيّرت بصمته الآن (الخميس) عن نسخة ليلة الأربعاء، قبل الهجوم وبعده */
export const rwChanged = (attacked: boolean) =>
	RW_FILES.filter((_, i) => miniHash(rwContent(i, RW_ATTACK, attacked)) !== miniHash(rwContent(i, RW_ATTACK - 1))).length;
/** بصمة صغيرة (FNV-1a، 8 خانات) بس للعرض: نفس فكرة SHA-256 بالأداة التانية */
export function miniHash(s: string): string {
	let h = 0x811c9dc5;
	for (let i = 0; i < s.length; i++) {
		h ^= s.charCodeAt(i);
		h = Math.imul(h, 0x01000193) >>> 0;
	}
	return h.toString(16).padStart(8, '0');
}

// ===== أداء المعالج (الجلسة 6) =====
/** زمن التنفيذ بالثواني = عدد التعليمات × CPI ÷ التردد بالهرتز */
export const cpuTime = (ic: number, cpi: number, hz: number) => (ic * cpi) / hz;
/** عدد الدورات لـ n تعليمة بـ k مراحل، مع وبدون Pipeline */
export const pipeline = (n: number, k: number) => ({ without: n * k, with: k + n - 1, speedup: (n * k) / (k + n - 1) });

// ===== المعالجات المتعددة (الجلسة 7) =====
export type LbPolicy = 'one' | 'rr' | 'least' | 'lpt';
export function balance(tasks: number[], cpus: number, policy: LbPolicy) {
	const lanes: { task: number; len: number; start: number }[][] = Array.from({ length: cpus }, () => []);
	const load = new Array(cpus).fill(0);
	const put = (c: number, i: number) => {
		lanes[c].push({ task: i, len: tasks[i], start: load[c] });
		load[c] += tasks[i];
	};
	const idx = tasks.map((_, i) => i);
	if (policy === 'one') idx.forEach((i) => put(0, i));
	else if (policy === 'rr') idx.forEach((i) => put(i % cpus, i));
	else {
		const order = policy === 'lpt' ? [...idx].sort((a, b) => tasks[b] - tasks[a] || a - b) : idx;
		order.forEach((i) => {
			let c = 0;
			for (let j = 1; j < cpus; j++) if (load[j] < load[c]) c = j;
			put(c, i);
		});
	}
	const makespan = Math.max(...load);
	const sum = tasks.reduce((a, b) => a + b, 0);
	return { lanes, load, makespan, utilization: sum / (makespan * cpus) };
}

// ===== الخيوط (الجلسة 5) =====
// خادم بيخدم طلبات: كل طلب = حساب على المعالج (cpu) ثم انتظار القرص أو الشبكة (io).
// كل خيط بياخد الطلب التالي من الطابور لما يفضى. المعالج بيروح للخيط الجاهز الأقدم، وبلا مقاطعة.
// الانتظار (io) ما بياخد معالج، ونفترض إنه أكتر من طلب بيقدر ينتظر بنفس الوقت.
export type ThState = 'run' | 'ready' | 'io' | 'idle';
export interface ThCell { s: ThState; req: number; core: number }
export interface ThResult {
	cells: ThCell[][]; // [خيط][لحظة]
	cores: number[][]; // [نواة][لحظة] = رقم الخيط أو -1
	end: number; // متى انتهى آخر طلب
	busy: number; // كم لحظة كان فيها معالج شغّال
	util: number; // الاستغلال من 0 لـ 1
	doneAt: number[]; // متى انتهى كل طلب
}
export function threadSim(requests: number, cpu: number, io: number, threads: number, cores: number): ThResult {
	type T = { s: ThState; req: number; left: number; since: number; core: number };
	const th: T[] = Array.from({ length: threads }, () => ({ s: 'idle', req: -1, left: 0, since: 0, core: -1 }));
	const cells: ThCell[][] = th.map(() => []);
	const coreRows: number[][] = Array.from({ length: cores }, () => []);
	const doneAt = new Array(requests).fill(0);
	let next = 0, finished = 0, t = 0, busy = 0;
	while (finished < requests && t < 500) {
		// 1. أي خيط فاضي بياخد الطلب التالي
		th.forEach((x) => {
			if (x.s === 'idle' && next < requests) Object.assign(x, { s: 'ready', req: next++, left: cpu, since: t });
		});
		// 2. النوى الفاضية للخيوط الجاهزة، الأقدم أولاً
		const used = new Set(th.filter((x) => x.s === 'run').map((x) => x.core));
		const waiting = th.map((x, i) => ({ x, i })).filter(({ x }) => x.s === 'ready').sort((a, b) => a.x.since - b.x.since || a.i - b.i);
		for (const { x } of waiting) {
			let c = 0;
			while (c < cores && used.has(c)) c++;
			if (c === cores) break;
			used.add(c);
			x.s = 'run';
			x.core = c;
		}
		// 3. سجّل اللحظة
		th.forEach((x, i) => cells[i].push({ s: x.s, req: x.req, core: x.s === 'run' ? x.core : -1 }));
		for (let c = 0; c < cores; c++) coreRows[c].push(th.findIndex((x) => x.s === 'run' && x.core === c));
		busy += used.size;
		// 4. تقدّم لحظة
		t++;
		const finish = (x: T) => {
			doneAt[x.req] = t;
			finished++;
			Object.assign(x, { s: 'idle', req: -1, core: -1 });
		};
		th.forEach((x) => {
			if (x.s === 'io' && --x.left === 0) finish(x);
			else if (x.s === 'run' && --x.left === 0) {
				if (io > 0) Object.assign(x, { s: 'io', left: io, core: -1 });
				else finish(x);
			}
		});
	}
	return { cells, cores: coreRows, end: t, busy, util: busy / (t * cores), doneAt };
}


// ===== جدولة المعالج (الجلسة 4) =====
// كل عملية: اسم، ووقت الوصول، وزمن التنفيذ، والأولوية (الرقم الأصغر = الأولوية الأعلى).
// الخوارزميات: fcfs، و sjf (بلا مقاطعة)، و srtf (SJF مع مقاطعة)، و rr (بالدور بشريحة q)، و prio (أولوية بلا مقاطعة)، و pprio (مع مقاطعة).
// عند التساوي: الأسبق وصولاً، ثم الأصغر رقماً. وبـ RR: الواصل بنفس لحظة انتهاء الشريحة بيدخل الطابور قبل يلي انقطع.
export type SchedAlgo = 'fcfs' | 'sjf' | 'srtf' | 'rr' | 'prio' | 'pprio';
export interface SchedProc { name: string; arrival: number; burst: number; prio: number }
export interface SchedSeg { p: number; start: number; end: number } // p = -1 يعني المعالج فارغ
export interface SchedRow { finish: number; turnaround: number; waiting: number; response: number }
export interface SchedResult { segs: SchedSeg[]; rows: SchedRow[]; avgWait: number; avgTurn: number; avgResp: number; switches: number; end: number }

export function cpuSched(procs: SchedProc[], algo: SchedAlgo, q = 2): SchedResult {
	const n = procs.length;
	const left = procs.map((p) => p.burst);
	const firstRun = new Array(n).fill(-1);
	const finish = new Array(n).fill(0);
	const segs: SchedSeg[] = [];
	const push = (p: number, s: number, e: number) => {
		const last = segs[segs.length - 1];
		if (last && last.p === p && last.end === s) last.end = e;
		else segs.push({ p, start: s, end: e });
	};
	const better = (a: number, b: number, key: (i: number) => number) =>
		key(a) - key(b) || procs[a].arrival - procs[b].arrival || a - b;
	let t = 0, done = 0;
	if (algo === 'rr') {
		const order = procs.map((_, i) => i).sort((a, b) => procs[a].arrival - procs[b].arrival || a - b);
		let next = 0;
		const queue: number[] = [];
		const admit = (upTo: number) => {
			while (next < n && procs[order[next]].arrival <= upTo) queue.push(order[next++]);
		};
		admit(0);
		while (done < n) {
			if (!queue.length) {
				const nt = procs[order[next]].arrival;
				push(-1, t, nt);
				t = nt;
				admit(t);
				continue;
			}
			const i = queue.shift()!;
			if (firstRun[i] < 0) firstRun[i] = t;
			const run = Math.min(q, left[i]);
			push(i, t, t + run);
			t += run;
			left[i] -= run;
			admit(t);
			if (left[i] > 0) queue.push(i);
			else { finish[i] = t; done++; }
		}
	} else {
		const pre = algo === 'srtf' || algo === 'pprio';
		const key = (i: number) => (algo === 'fcfs' ? procs[i].arrival : algo === 'sjf' ? procs[i].burst : algo === 'srtf' ? left[i] : procs[i].prio);
		while (done < n) {
			const ready = procs.map((_, i) => i).filter((i) => left[i] > 0 && procs[i].arrival <= t);
			if (!ready.length) {
				const nt = Math.min(...procs.map((p, i) => (left[i] > 0 ? p.arrival : Infinity)));
				push(-1, t, nt);
				t = nt;
				continue;
			}
			const i = ready.sort((a, b) => better(a, b, key))[0];
			if (firstRun[i] < 0) firstRun[i] = t;
			let run = left[i];
			if (pre) {
				// منشتغل لحتى ينتهي أو توصل عملية جديدة (منعيد القرار عند كل وصول)
				const arrivals = procs.map((p) => p.arrival).filter((a) => a > t);
				if (arrivals.length) run = Math.min(run, Math.min(...arrivals) - t);
			}
			push(i, t, t + run);
			t += run;
			left[i] -= run;
			if (left[i] === 0) { finish[i] = t; done++; }
		}
	}
	const rows = procs.map((p, i) => ({
		finish: finish[i],
		turnaround: finish[i] - p.arrival,
		waiting: finish[i] - p.arrival - p.burst,
		response: firstRun[i] - p.arrival,
	}));
	const avg = (k: keyof SchedRow) => rows.reduce((s, r) => s + r[k], 0) / n;
	const busy = segs.filter((s) => s.p >= 0);
	let switches = 0;
	for (let k = 1; k < busy.length; k++) if (busy[k].p !== busy[k - 1].p) switches++;
	return { segs, rows, avgWait: avg('waiting'), avgTurn: avg('turnaround'), avgResp: avg('response'), switches, end: t };
}

const mk = (a: [number, number, number][]): SchedProc[] => a.map(([arrival, burst, prio], i) => ({ name: `P${i + 1}`, arrival, burst, prio }));
/** الأمثلة الجاهزة بالمحاكي والمسائل المحلولة (أغلبها من كتاب Silberschatz) */
export const SCHED_SETS = {
	convoy: mk([[0, 24, 1], [0, 3, 1], [0, 3, 1]]),
	book: mk([[0, 6, 1], [0, 8, 1], [0, 7, 1], [0, 3, 1]]),
	arrive: mk([[0, 8, 1], [1, 4, 1], [2, 9, 1], [3, 5, 1]]),
	prio: mk([[0, 10, 3], [0, 1, 1], [0, 2, 4], [0, 1, 5], [0, 5, 2]]),
	solved: mk([[0, 5, 2], [1, 3, 1], [2, 1, 3], [3, 2, 2]]),
};
export const SCHED_NAMES: Record<SchedAlgo, string> = { fcfs: 'FCFS', sjf: 'SJF', srtf: 'SRTF', rr: 'RR', prio: 'أولوية', pprio: 'أولوية مع مقاطعة' };

// ===== التزامن (الجلسة 5) =====
// خيطان، كل واحد بيعمل x = x + 1 عدد n من المرات، وكل زيادة 3 خطوات: يقرأ، يجمع، يكتب.
// مع القفل: قبل القراءة «يقفل» وبعد الكتابة «يفتح» (5 خطوات)، والقفل المسكّر بيخلي الخطوة «انتظار» بدون تقدّم.
export type RaceOp = 'lock' | 'read' | 'add' | 'write' | 'unlock';
export const raceProgram = (n: number, locked: boolean): RaceOp[] =>
	Array.from({ length: n }, () => (locked ? ['lock', 'read', 'add', 'write', 'unlock'] : ['read', 'add', 'write']) as RaceOp[]).flat();
export interface RaceState { x: number; pc: [number, number]; reg: [number, number]; lock: number } // lock: 0 فاضي، 1 أو 2 مع مين
export const raceStart = (): RaceState => ({ x: 0, pc: [0, 0], reg: [0, 0], lock: 0 });
/** خطوة لخيط t (0 أو 1). بترجع false إذا الخيط انتظر (القفل مع غيره) أو خلص */
export function raceStep(s: RaceState, prog: RaceOp[], t: 0 | 1): boolean {
	if (s.pc[t] >= prog.length) return false;
	const op = prog[s.pc[t]];
	if (op === 'lock') {
		if (s.lock && s.lock !== t + 1) return false;
		s.lock = t + 1;
	} else if (op === 'read') s.reg[t] = s.x;
	else if (op === 'add') s.reg[t] += 1;
	else if (op === 'write') s.x = s.reg[t];
	else s.lock = 0;
	s.pc[t]++;
	return true;
}
/** تشغيل عشوائي: بكل خطوة منختار خيط عشوائي من يلي بيقدروا يتقدموا. بيرجع x النهائية */
export function raceRandom(n: number, locked: boolean, rnd: () => number = Math.random): number {
	const prog = raceProgram(n, locked);
	const s = raceStart();
	for (let guard = 0; guard < 10000; guard++) {
		const can = ([0, 1] as const).filter((t) => s.pc[t] < prog.length && !(prog[s.pc[t]] === 'lock' && s.lock && s.lock !== t + 1));
		if (!can.length) break;
		raceStep(s, prog, can[Math.floor(rnd() * can.length)]);
	}
	return s.x;
}

// المنتج والمستهلك على مخزن فيه size خانات. كل لحظة: المنتج بيتحرك كل pEvery لحظة، والمستهلك كل cEvery لحظة.
// mode: 'none' بلا حماية (بيكتب فوق الممتلئ وبيقرأ من الفاضي)، 'sem' بالإشارات الصحيحة، 'wrong' المنتج بيقفل mutex قبل empty (جمود لما يمتلئ).
export type PcMode = 'none' | 'sem' | 'wrong';
export interface PcSnap { t: number; buf: (number | null)[]; inP: number; outP: number; empty: number; full: number; mutex: number; made: number; eaten: number; lost: number; junk: number; pState: string; cState: string; dead: boolean; note: string }
export function prodCons(mode: PcMode, size: number, pEvery: number, cEvery: number, ticks: number): PcSnap[] {
	const buf: (number | null)[] = new Array(size).fill(null);
	let inP = 0, outP = 0, empty = size, full = 0, mutex = 1, made = 0, eaten = 0, lost = 0, junk = 0;
	// المنتج: 0 ينتج، 1 بيستنى empty (أو mutex بالترتيب الغلط)، ... منستخدم مراحل بسيطة
	let pStage = 0, cStage = 0;
	let pState = 'يعمل', cState = 'يعمل', dead = false;
	const out: PcSnap[] = [];
	const snap = (t: number, note: string) => out.push({ t, buf: [...buf], inP, outP, empty, full, mutex, made, eaten, lost, junk, pState, cState, dead, note });
	snap(0, 'البداية: المخزن فارغ.');
	for (let t = 1; t <= ticks && !dead; t++) {
		let note = '';
		if (t % pEvery === 0 || pStage > 0) {
			if (mode === 'none') {
				if (buf[inP] !== null) { lost++; note = `المنتج كتب فوق عنصر لم يُستهلك بعد (ضاع رقم ${buf[inP]})`; }
				buf[inP] = ++made; inP = (inP + 1) % size; pState = 'يعمل';
			} else if (mode === 'sem') {
				if (empty === 0) { pState = 'ينتظر خانة فارغة'; pStage = 1; }
				else { empty--; buf[inP] = ++made; inP = (inP + 1) % size; full++; pState = 'يعمل'; pStage = 0; }
			} else {
				// الترتيب الغلط: wait(mutex) ثم wait(empty)
				if (pStage === 0) { if (mutex === 1) { mutex = 0; pStage = 1; } }
				if (pStage === 1) {
					if (empty === 0) { pState = 'يحمل القفل وينتظر خانة فارغة'; }
					else { empty--; buf[inP] = ++made; inP = (inP + 1) % size; full++; mutex = 1; pStage = 0; pState = 'يعمل'; }
				}
			}
		}
		if (t % cEvery === 0 || cStage > 0) {
			if (mode === 'none') {
				if (buf[outP] === null) { junk++; note = 'المستهلك قرأ من خانة فارغة (قيمة لا معنى لها)'; }
				else { buf[outP] = null; eaten++; }
				outP = (outP + 1) % size; cState = 'يعمل';
			} else {
				if (full === 0) { cState = 'ينتظر عنصراً'; cStage = 1; }
				else if (mutex === 0) { cState = 'ينتظر القفل'; cStage = 1; }
				else { full--; buf[outP] = null; outP = (outP + 1) % size; eaten++; empty++; cState = 'يعمل'; cStage = 0; }
			}
		}
		if (mode === 'wrong' && mutex === 0 && empty === 0 && pStage === 1 && cStage === 1 && cState === 'ينتظر القفل') {
			dead = true;
			note = 'جمود: المنتج يحمل القفل وينتظر خانة فارغة، والمستهلك ينتظر القفل ليفرغ خانة. لن يتحرك أحد أبداً.';
		}
		snap(t, note);
	}
	return out;
}

// ===== الجمود (الجلسة 6) =====
// خوارزمية المصرفي: Need = Max − Allocation. فحص الأمان بيمشي على العمليات بالترتيب ويكمّل اللفة (مش من الأول بكل مرة)،
// متل حل كتاب Silberschatz: <P1, P3, P4, P0, P2>.
export const vecLe = (a: number[], b: number[]) => a.every((x, i) => x <= b[i]);
export const vecAdd = (a: number[], b: number[]) => a.map((x, i) => x + b[i]);
export const vecSub = (a: number[], b: number[]) => a.map((x, i) => x - b[i]);
export interface SafeStep { i: number; work: number[]; after: number[] }
export function bankerSafe(avail: number[], alloc: number[][], need: number[][]): { safe: boolean; seq: number[]; steps: SafeStep[] } {
	const n = alloc.length;
	let work = [...avail];
	const finish = new Array(n).fill(false);
	const seq: number[] = [], steps: SafeStep[] = [];
	let progress = true;
	while (progress) {
		progress = false;
		for (let i = 0; i < n; i++) {
			if (!finish[i] && vecLe(need[i], work)) {
				const after = vecAdd(work, alloc[i]);
				steps.push({ i, work, after });
				work = after;
				finish[i] = true;
				seq.push(i);
				progress = true;
			}
		}
	}
	return { safe: finish.every(Boolean), seq, steps };
}
export type BankerVerdict = 'too-much' | 'wait' | 'unsafe' | 'grant';
export function bankerRequest(avail: number[], alloc: number[][], max: number[][], p: number, req: number[]) {
	const need = max.map((m, i) => vecSub(m, alloc[i]));
	if (!vecLe(req, need[p])) return { verdict: 'too-much' as BankerVerdict };
	if (!vecLe(req, avail)) return { verdict: 'wait' as BankerVerdict };
	const a2 = vecSub(avail, req);
	const al2 = alloc.map((r, i) => (i === p ? vecAdd(r, req) : [...r]));
	const n2 = need.map((r, i) => (i === p ? vecSub(r, req) : [...r]));
	const res = bankerSafe(a2, al2, n2);
	return { verdict: (res.safe ? 'grant' : 'unsafe') as BankerVerdict, avail: a2, alloc: al2, need: n2, ...res };
}
/** مثال Silberschatz: 5 عمليات، والموارد A = 10 و B = 5 و C = 7 */
export const BANKER = {
	total: [10, 5, 7],
	alloc: [[0, 1, 0], [2, 0, 0], [3, 0, 2], [2, 1, 1], [0, 0, 2]],
	max: [[7, 5, 3], [3, 2, 2], [9, 0, 2], [2, 2, 2], [4, 3, 3]],
};

// كشف الجمود (موارد بعدة نسخ): Work = المتاح، والعملية يلي ما معها شي منتهية. بيرجع العمليات العالقة.
export function detectDeadlock(avail: number[], alloc: number[][], request: number[][]): number[] {
	let work = [...avail];
	const finish = alloc.map((r) => r.every((x) => x === 0));
	let progress = true;
	while (progress) {
		progress = false;
		for (let i = 0; i < alloc.length; i++) {
			if (!finish[i] && vecLe(request[i], work)) {
				work = vecAdd(work, alloc[i]);
				finish[i] = true;
				progress = true;
			}
		}
	}
	return finish.map((f, i) => (f ? -1 : i)).filter((i) => i >= 0);
}

// الفلاسفة الخمسة: الفيلسوف i عنده الشوكة i عيساره و (i+1)%5 عيمينه. المجدول بيختار فيلسوف عشوائي بكل خطوة.
// naive: كل واحد بياخد اليسار ثم اليمين. asym: الأخير بياخد اليمين أولاً. both: بياخد التنتين سوا أو ولا وحدة.
export type PhiloStrat = 'naive' | 'asym' | 'both';
export interface PhiloState { forks: number[]; st: ('think' | 'hungry' | 'one' | 'eat')[]; eatLeft: number[]; meals: number[]; dead: boolean }
export const philoStart = (): PhiloState => ({ forks: [-1, -1, -1, -1, -1], st: ['think', 'think', 'think', 'think', 'think'], eatLeft: [0, 0, 0, 0, 0], meals: [0, 0, 0, 0, 0], dead: false });
const firstFork = (i: number, strat: PhiloStrat) => (strat === 'asym' && i === 4 ? (i + 1) % 5 : i);
const secondFork = (i: number, strat: PhiloStrat) => (strat === 'asym' && i === 4 ? i : (i + 1) % 5);
/** خطوة للفيلسوف i. بترجع وصف قصير لشو صار (أو '' إذا ما قدر يعمل شي) */
export function philoStep(s: PhiloState, i: number, strat: PhiloStrat): string {
	const L = firstFork(i, strat), R = secondFork(i, strat);
	switch (s.st[i]) {
		case 'think':
			s.st[i] = 'hungry';
			return 'جاع';
		case 'hungry':
			if (strat === 'both') {
				if (s.forks[L] < 0 && s.forks[R] < 0) { s.forks[L] = s.forks[R] = i; s.st[i] = 'eat'; s.eatLeft[i] = 2; return 'أخذ الشوكتين معاً'; }
				return '';
			}
			if (s.forks[L] < 0) { s.forks[L] = i; s.st[i] = 'one'; return `أخذ الشوكة ${L + 1}`; }
			return '';
		case 'one':
			if (s.forks[R] < 0) { s.forks[R] = i; s.st[i] = 'eat'; s.eatLeft[i] = 2; return `أخذ الشوكة ${R + 1} وبدأ يأكل`; }
			return '';
		case 'eat':
			if (--s.eatLeft[i] > 0) return 'يأكل';
			s.forks[L] = s.forks[R] = -1;
			s.st[i] = 'think';
			s.meals[i]++;
			return 'شبع وأعاد الشوكتين';
	}
}
export const philoStuck = (s: PhiloState, strat: PhiloStrat) =>
	s.st.every((x, i) => (x === 'one' && s.forks[secondFork(i, strat)] >= 0) || (x === 'hungry' && (strat === 'both' ? s.forks[i] >= 0 || s.forks[(i + 1) % 5] >= 0 : s.forks[firstFork(i, strat)] >= 0)));
/** تشغيل عشوائي لحد steps خطوة: بيرجع إذا صار جمود وكم وجبة */
export function philoRun(strat: PhiloStrat, steps: number, rnd: () => number = Math.random) {
	const s = philoStart();
	for (let k = 0; k < steps; k++) {
		philoStep(s, Math.floor(rnd() * 5), strat);
		if (philoStuck(s, strat)) { s.dead = true; return { dead: true, at: k + 1, meals: s.meals.reduce((a, b) => a + b, 0) }; }
	}
	return { dead: false, at: steps, meals: s.meals.reduce((a, b) => a + b, 0) };
}

// ===== إدارة الذاكرة (الجلسة 7) =====
// التخصيص المتصل: الذاكرة قطع (مستخدمة أو فراغ). العملية بتاخد أول الفراغ، والباقي بيضل فراغ بعدها.
export type FitAlgo = 'first' | 'best' | 'worst';
export interface MemBlock { start: number; size: number; owner: string | null } // owner = null فراغ
export interface FitStep { name: string; size: number; hole: number; ok: boolean; mem: MemBlock[] } // hole = ترتيب الفراغ يلي انختار بين الفراغات (من 0)، أو −1
export function fitAlloc(mem0: MemBlock[], reqs: { name: string; size: number }[], algo: FitAlgo): FitStep[] {
	let mem = mem0.map((b) => ({ ...b }));
	const steps: FitStep[] = [];
	for (const r of reqs) {
		const holes = mem.map((b, i) => ({ b, i })).filter((x) => x.b.owner === null && x.b.size >= r.size);
		let pick: { b: MemBlock; i: number } | undefined;
		if (algo === 'first') pick = holes[0];
		else if (algo === 'best') pick = holes.sort((a, b) => a.b.size - b.b.size || a.i - b.i)[0];
		else pick = holes.sort((a, b) => b.b.size - a.b.size || a.i - b.i)[0];
		if (!pick) {
			steps.push({ name: r.name, size: r.size, hole: -1, ok: false, mem: mem.map((b) => ({ ...b })) });
			continue;
		}
		const holeOrder = mem.slice(0, pick.i).filter((b) => b.owner === null).length;
		const used: MemBlock = { start: pick.b.start, size: r.size, owner: r.name };
		const rest: MemBlock = { start: pick.b.start + r.size, size: pick.b.size - r.size, owner: null };
		mem = [...mem.slice(0, pick.i), used, ...(rest.size ? [rest] : []), ...mem.slice(pick.i + 1)];
		steps.push({ name: r.name, size: r.size, hole: holeOrder, ok: true, mem: mem.map((b) => ({ ...b })) });
	}
	return steps;
}
/** مثال Silberschatz: فراغات 100 و 500 و 200 و 300 و 600 KB، والطلبات 212 و 417 و 112 و 426 */
export const FIT_MEM: MemBlock[] = (() => {
	const parts: [string | null, number][] = [['OS', 200], [null, 100], ['A', 100], [null, 500], ['B', 100], [null, 200], ['C', 100], [null, 300], ['D', 100], [null, 600]];
	let s = 0;
	return parts.map(([owner, size]) => { const b = { start: s, size, owner }; s += size; return b; });
})();
export const FIT_REQS = [{ name: 'P1', size: 212 }, { name: 'P2', size: 417 }, { name: 'P3', size: 112 }, { name: 'P4', size: 426 }];

// الصفحات: العنوان المنطقي ← رقم الصفحة p والإزاحة d ← الإطار f ← العنوان الفيزيائي f × size + d
export function translate(addr: number, pageSize: number, table: number[]) {
	const p = Math.floor(addr / pageSize), d = addr % pageSize;
	if (p >= table.length) return { p, d, f: -1, phys: -1, bad: true };
	const f = table[p];
	return { p, d, f, phys: f * pageSize + d, bad: false };
}
export const PAGE_TABLE = [5, 2, 7, 0, 3, 9, 1, 6];
/** محاكي TLB صغير بـ LRU: بيرجع لكل وصول إذا كان hit */
export function tlbRun(pages: number[], size: number) {
	const tlb: number[] = [];
	return pages.map((p) => {
		const i = tlb.indexOf(p);
		const hit = i >= 0;
		if (hit) tlb.splice(i, 1);
		else if (tlb.length >= size) tlb.shift();
		tlb.push(p);
		return { p, hit, tlb: [...tlb] };
	});
}
/** متوسط زمن الوصول: hit بياخد وصول واحد للذاكرة، و miss وصولين (جدول الصفحات ثم البيانات). وزمن TLB مهمل */
export const eat = (hit: number, mem: number) => hit * mem + (1 - hit) * 2 * mem;

// ===== الذاكرة الافتراضية (الجلسة 8) =====
// استبدال الصفحات: FIFO و LRU و OPT (الأمثل: منطرد يلي رح يُطلب بعد أطول وقت، وعند التساوي/ما رح يُطلب أبداً: الأقدم دخولاً).
// كل خطوة: محتوى الإطارات بترتيب ثابت (الصفحة الجديدة بتاخد مكان المطرودة)، وإذا صار خطأ صفحة، ومين انطرد.
export type ReplAlgo = 'fifo' | 'lru' | 'opt';
export interface ReplStep { page: number; frames: (number | null)[]; fault: boolean; victim: number | null; slot: number }
export function replace(refs: number[], nFrames: number, algo: ReplAlgo): { steps: ReplStep[]; faults: number } {
	const frames: (number | null)[] = new Array(nFrames).fill(null);
	const loaded = new Array(nFrames).fill(-1); // متى دخلت الصفحة يلي بكل إطار
	const used = new Array(nFrames).fill(-1); // آخر استخدام
	const steps: ReplStep[] = [];
	let faults = 0;
	refs.forEach((page, t) => {
		let slot = frames.indexOf(page);
		if (slot >= 0) {
			used[slot] = t;
			steps.push({ page, frames: [...frames], fault: false, victim: null, slot });
			return;
		}
		faults++;
		let victim: number | null = null;
		slot = frames.indexOf(null);
		if (slot < 0) {
			const idx = frames.map((_, i) => i);
			if (algo === 'fifo') slot = idx.sort((a, b) => loaded[a] - loaded[b])[0];
			else if (algo === 'lru') slot = idx.sort((a, b) => used[a] - used[b])[0];
			else {
				const nextUse = (i: number) => { const k = refs.indexOf(frames[i]!, t + 1); return k < 0 ? Infinity : k; };
				slot = idx.sort((a, b) => nextUse(b) - nextUse(a) || loaded[a] - loaded[b])[0];
			}
			victim = frames[slot];
		}
		frames[slot] = page;
		loaded[slot] = t;
		used[slot] = t;
		steps.push({ page, frames: [...frames], fault: true, victim, slot });
	});
	return { steps, faults };
}
export const REF_BOOK = [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1];
export const REF_BELADY = [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5];
/** متوسط زمن الوصول مع أخطاء الصفحات: ذاكرة mem ns، وخطأ الصفحة fault ms، واحتمال الخطأ p */
export const eatFault = (p: number, memNs: number, faultMs: number) => (1 - p) * memNs + p * faultMs * 1e6;

// التخبّط: نموذج بسيط. كل عملية بتشغّل المعالج نسبة u0 من الوقت إذا أخذت مجموعة عملها W إطار كاملة.
// إذا مجموع W أكبر من الإطارات F، كل عملية بتاخد F/N وبتصير أخطاء الصفحات كتير، فبتنزل نسبة الشغل بقوة.
export function thrash(N: number, W: number, F: number, u0 = 0.2) {
	const share = Math.min(1, F / (N * W));
	const perProc = u0 * Math.pow(share, 6);
	return { util: Math.min(1, N * perProc), share };
}
