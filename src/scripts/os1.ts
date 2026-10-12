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
