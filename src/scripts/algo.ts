// محرك مرجع الخوارزميات: كل خوارزمية بترجّع «خطوات» (trace) فالأدوات بترسمها خطوة خطوة،
// والأرقام بالصفحات لازم تطابق هالملف (بيتجرّب بـ node file.mts).

// ===================== 1. الروبوت على الشبكة =====================
export type Cmd = 'F' | 'L' | 'R';
export interface RobotLevel { w: number; h: number; start: [number, number, number]; goal: [number, number]; walls: [number, number][]; best: number }
/** الاتجاه: 0 يمين، 1 تحت، 2 يسار، 3 فوق (الشبكة: x لليمين، y لتحت) */
const DX = [1, 0, -1, 0], DY = [0, 1, 0, -1];
export const ROBOT_LEVELS: RobotLevel[] = [
	{ w: 5, h: 1, start: [0, 0, 0], goal: [4, 0], walls: [], best: 4 },
	{ w: 4, h: 4, start: [0, 0, 0], goal: [3, 3], walls: [[1, 1], [2, 1], [1, 2]], best: 7 },
	{ w: 5, h: 5, start: [0, 4, 3], goal: [4, 0], walls: [[0, 1], [1, 1], [2, 1], [2, 3], [3, 3], [4, 3]], best: 10 },
];
export interface RobotStep { x: number; y: number; d: number; ok: boolean; why?: string }
export function runRobot(lv: RobotLevel, prog: Cmd[]): { steps: RobotStep[]; reached: boolean } {
	let [x, y, d] = lv.start;
	const steps: RobotStep[] = [{ x, y, d, ok: true }];
	for (const c of prog) {
		if (c === 'L') d = (d + 3) % 4;
		else if (c === 'R') d = (d + 1) % 4;
		else {
			const nx = x + DX[d], ny = y + DY[d];
			if (nx < 0 || ny < 0 || nx >= lv.w || ny >= lv.h) { steps.push({ x, y, d, ok: false, why: 'edge' }); return { steps, reached: false }; }
			if (lv.walls.some(([a, b]) => a === nx && b === ny)) { steps.push({ x, y, d, ok: false, why: 'wall' }); return { steps, reached: false }; }
			x = nx; y = ny;
		}
		steps.push({ x, y, d, ok: true });
	}
	return { steps, reached: x === lv.goal[0] && y === lv.goal[1] };
}

// ===================== 2. التعقيد =====================
export const GROWTH = [
	{ k: 'c', label: 'O(1)', f: (_n: number) => 1 },
	{ k: 'log', label: 'O(log n)', f: (n: number) => Math.max(1, Math.ceil(Math.log2(n))) },
	{ k: 'n', label: 'O(n)', f: (n: number) => n },
	{ k: 'nlog', label: 'O(n log n)', f: (n: number) => n * Math.max(1, Math.ceil(Math.log2(n))) },
	{ k: 'n2', label: 'O(n²)', f: (n: number) => n * n },
	{ k: 'exp', label: 'O(2ⁿ)', f: (n: number) => 2 ** n },
] as const;
/** الزمن إذا كل عملية = 1 ميكروثانية، كنص مقروء */
export function humanTime(ops: number): string {
	const s = ops / 1e6;
	if (s < 1e-3) return `${+(s * 1e6).toPrecision(3)} µs`;
	if (s < 1) return `${+(s * 1e3).toPrecision(3)} ms`;
	if (s < 60) return `${+s.toPrecision(3)} s`;
	if (s < 3600) return `${+(s / 60).toPrecision(3)} min`;
	if (s < 86400) return `${+(s / 3600).toPrecision(3)} h`;
	if (s < 3.15e7) return `${+(s / 86400).toPrecision(3)} days`;
	const y = s / 3.15576e7;
	return y < 1e6 ? `${Math.round(y).toLocaleString('en')} years` : `${y.toExponential(1)} years`;
}
/** عدّاد عمليات لمقاطع الكود: حلقة، حلقتين متداخلتين، حلقة بتنقسم */
export const loopOps = {
	single: (n: number) => n,
	nested: (n: number) => n * n,
	triangle: (n: number) => (n * (n - 1)) / 2,
	halving: (n: number) => { let c = 0; for (let i = n; i >= 1; i = Math.floor(i / 2)) c++; return c; },
};

// ===================== 3. البحث =====================
export interface BinStep { lo: number; hi: number; mid: number; cmp: -1 | 0 | 1 }
/** بحث ثنائي بالأعداد من lo لـ hi عن target: كل خطوة نطاقها ونقطة النص */
export function binarySearchRange(lo: number, hi: number, target: number): BinStep[] {
	const out: BinStep[] = [];
	while (lo <= hi) {
		const mid = Math.floor((lo + hi) / 2);
		const cmp = target === mid ? 0 : target < mid ? -1 : 1;
		out.push({ lo, hi, mid, cmp });
		if (cmp === 0) break;
		if (cmp < 0) hi = mid - 1; else lo = mid + 1;
	}
	return out;
}
export const worstBinary = (n: number) => Math.floor(Math.log2(n)) + 1;
export function linearSearch(a: number[], t: number) { for (let i = 0; i < a.length; i++) if (a[i] === t) return { index: i, cmps: i + 1 }; return { index: -1, cmps: a.length }; }
export function binarySearch(a: number[], t: number) {
	let lo = 0, hi = a.length - 1, cmps = 0;
	while (lo <= hi) { const m = (lo + hi) >> 1; cmps++; if (a[m] === t) return { index: m, cmps }; if (a[m] < t) lo = m + 1; else hi = m - 1; }
	return { index: -1, cmps };
}

// ===================== 4. الترتيب البسيط =====================
export interface SortStep { a: number[]; hi: number[]; kind: 'cmp' | 'swap' | 'shift' | 'done' | 'start'; sorted: number[]; note: string; cmps: number; swaps: number }
export type SimpleSort = 'bubble' | 'selection' | 'insertion';
export function sortTrace(input: number[], algo: SimpleSort): SortStep[] {
	const a = [...input], n = a.length, out: SortStep[] = [];
	let cmps = 0, swaps = 0;
	const sorted = new Set<number>();
	const push = (hi: number[], kind: SortStep['kind'], note: string) => out.push({ a: [...a], hi, kind, sorted: [...sorted], note, cmps, swaps });
	push([], 'start', 'start');
	if (algo === 'bubble') {
		for (let i = 0; i < n - 1; i++) {
			let swapped = false;
			for (let j = 0; j < n - 1 - i; j++) {
				cmps++; push([j, j + 1], 'cmp', `cmp ${a[j]} ${a[j + 1]}`);
				if (a[j] > a[j + 1]) { [a[j], a[j + 1]] = [a[j + 1], a[j]]; swaps++; swapped = true; push([j, j + 1], 'swap', `swap ${a[j + 1]} ${a[j]}`); }
			}
			sorted.add(n - 1 - i);
			if (!swapped) { for (let k = 0; k < n; k++) sorted.add(k); push([], 'done', 'early'); return out; }
		}
	} else if (algo === 'selection') {
		for (let i = 0; i < n - 1; i++) {
			let m = i;
			for (let j = i + 1; j < n; j++) { cmps++; push([m, j], 'cmp', `cmp ${a[m]} ${a[j]}`); if (a[j] < a[m]) m = j; }
			if (m !== i) { [a[i], a[m]] = [a[m], a[i]]; swaps++; push([i, m], 'swap', `swap ${a[m]} ${a[i]}`); }
			sorted.add(i);
		}
	} else {
		sorted.add(0);
		for (let i = 1; i < n; i++) {
			let j = i;
			while (j > 0) {
				cmps++; push([j - 1, j], 'cmp', `cmp ${a[j - 1]} ${a[j]}`);
				if (a[j - 1] > a[j]) { [a[j - 1], a[j]] = [a[j], a[j - 1]]; swaps++; push([j - 1, j], 'shift', `shift ${a[j]}`); j--; }
				else break;
			}
			sorted.add(i);
		}
	}
	for (let k = 0; k < n; k++) sorted.add(k);
	push([], 'done', 'done');
	return out;
}
export const SORT_PRESETS: Record<string, number[]> = {
	random: [5, 2, 8, 1, 9, 3, 7, 4],
	sorted: [1, 2, 3, 4, 5, 7, 8, 9],
	reversed: [9, 8, 7, 5, 4, 3, 2, 1],
	nearly: [1, 2, 3, 5, 4, 7, 8, 9],
};

// ===================== 5. العودية =====================
export interface Frame { call: string; ret?: string }
export interface RecStep { stack: Frame[]; note: string }
/** المضروب: الخطوات = نزول (نزيد إطار) ثم طلوع (نرجّع قيمة) */
export function factTrace(n: number): RecStep[] {
	const out: RecStep[] = [];
	const stack: Frame[] = [];
	const go = (k: number): number => {
		stack.push({ call: `fact(${k})` });
		out.push({ stack: stack.map((f) => ({ ...f })), note: k <= 1 ? 'base' : 'call' });
		let r: number;
		if (k <= 1) r = 1;
		else { r = k * go(k - 1); }
		stack[stack.length - 1].ret = String(r);
		out.push({ stack: stack.map((f) => ({ ...f })), note: `return ${r}` });
		stack.pop();
		return r;
	};
	go(n);
	out.push({ stack: [], note: 'empty' });
	return out;
}
export function fibCalls(n: number, memo = false): { value: number; calls: number } {
	let calls = 0;
	const m = new Map<number, number>();
	const f = (k: number): number => {
		calls++;
		if (k < 2) return k;
		if (memo && m.has(k)) return m.get(k)!;
		const v = f(k - 1) + f(k - 2);
		if (memo) m.set(k, v);
		return v;
	};
	return { value: f(n), calls };
}
/** شجرة استدعاءات fib (لرسمها): كل عقدة n وأولادها */
export interface FibNode { n: number; kids: FibNode[]; id: number }
export function fibTree(n: number): FibNode {
	let id = 0;
	const b = (k: number): FibNode => ({ n: k, id: id++, kids: k < 2 ? [] : [b(k - 1), b(k - 2)] });
	return b(n);
}
export function hanoi(n: number, from = 0, to = 2, via = 1, out: [number, number][] = []): [number, number][] {
	if (n === 0) return out;
	hanoi(n - 1, from, via, to, out);
	out.push([from, to]);
	hanoi(n - 1, via, to, from, out);
	return out;
}

// ===================== صياغة العدد بالعربي =====================
/** 1 → one، 2 → two، 3..10 → «n plural»، وغير ذلك «n singular» (تمييز مفرد) */
export function arCount(n: number, one: string, two: string, plural: string, singular: string): string {
	if (n === 1) return one;
	if (n === 2) return two;
	if (n >= 3 && n <= 10) return `${n} ${plural}`;
	if (n === 0) return `0 ${plural}`;
	return `${n} ${singular}`;
}
