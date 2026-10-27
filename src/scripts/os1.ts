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
