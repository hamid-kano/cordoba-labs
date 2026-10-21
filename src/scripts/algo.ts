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

// ===================== 6. الترتيب بالدمج =====================
export interface MNode { id: number; lo: number; hi: number; depth: number; vals: number[]; merged: number[]; kids: number[] }
export interface MEvent { kind: 'split' | 'merge'; id: number; cmps: number }
/** شجرة الدمج: كل عقدة جزء من المصفوفة، والأحداث بترتيب التنفيذ الحقيقي (تقسيم ثم دمج) */
export function mergeTrace(input: number[]) {
	const nodes: MNode[] = [];
	const events: MEvent[] = [];
	let cmps = 0;
	const go = (vals: number[], lo: number, depth: number): MNode => {
		const node: MNode = { id: nodes.length, lo, hi: lo + vals.length - 1, depth, vals, merged: vals, kids: [] };
		nodes.push(node);
		if (vals.length > 1) {
			const mid = Math.ceil(vals.length / 2);
			events.push({ kind: 'split', id: node.id, cmps });
			const L = go(vals.slice(0, mid), lo, depth + 1), R = go(vals.slice(mid), lo + mid, depth + 1);
			node.kids = [L.id, R.id];
			const out: number[] = [];
			let i = 0, j = 0;
			while (i < L.merged.length && j < R.merged.length) { cmps++; out.push(L.merged[i] <= R.merged[j] ? L.merged[i++] : R.merged[j++]); }
			node.merged = [...out, ...L.merged.slice(i), ...R.merged.slice(j)];
			events.push({ kind: 'merge', id: node.id, cmps });
		}
		return node;
	};
	go([...input], 0, 0);
	return { nodes, events, cmps };
}

// ===================== 6. الترتيب السريع =====================
export type PivotRule = 'last' | 'middle' | 'random';
export interface QStep { a: number[]; lo: number; hi: number; p: number; i: number; j: number; kind: 'range' | 'cmp' | 'swap' | 'place' | 'done'; depth: number; cmps: number; swaps: number; fixed: number[] }
/** Lomuto: المحور بينحط بالآخر، و i حدود «الأصغر من المحور». seed لتكرار العشوائي */
export function quickTrace(input: number[], rule: PivotRule, seed = 7) {
	const a = [...input], out: QStep[] = [], fixed = new Set<number>();
	let cmps = 0, swaps = 0, maxDepth = 0, s = seed;
	const rnd = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
	const push = (lo: number, hi: number, p: number, i: number, j: number, kind: QStep['kind'], depth: number) =>
		out.push({ a: [...a], lo, hi, p, i, j, kind, depth, cmps, swaps, fixed: [...fixed] });
	const sort = (lo: number, hi: number, depth: number) => {
		if (lo > hi) return;
		maxDepth = Math.max(maxDepth, depth);
		if (lo === hi) { fixed.add(lo); return; }
		const pi = rule === 'last' ? hi : rule === 'middle' ? (lo + hi) >> 1 : lo + Math.floor(rnd() * (hi - lo + 1));
		if (pi !== hi) { [a[pi], a[hi]] = [a[hi], a[pi]]; swaps++; }
		push(lo, hi, hi, lo, lo, 'range', depth);
		let i = lo;
		for (let j = lo; j < hi; j++) {
			cmps++;
			push(lo, hi, hi, i, j, 'cmp', depth);
			if (a[j] < a[hi]) { if (i !== j) { [a[i], a[j]] = [a[j], a[i]]; swaps++; push(lo, hi, hi, i, j, 'swap', depth); } i++; }
		}
		if (i !== hi) { [a[i], a[hi]] = [a[hi], a[i]]; swaps++; }
		fixed.add(i);
		push(lo, hi, i, i, hi, 'place', depth);
		sort(lo, i - 1, depth + 1);
		sort(i + 1, hi, depth + 1);
	};
	sort(0, a.length - 1, 1);
	for (let k = 0; k < a.length; k++) fixed.add(k);
	push(0, a.length - 1, -1, -1, -1, 'done', 0);
	return { steps: out, cmps, swaps, depth: maxDepth, sorted: a };
}

// ===================== 6. الترتيب بالعدّ =====================
export function countingSort(a: number[], max: number) {
	const count = new Array(max + 1).fill(0);
	for (const x of a) count[x]++;
	const out: number[] = [];
	count.forEach((c, v) => { for (let k = 0; k < c; k++) out.push(v); });
	return { count, out };
}

// ===================== 8. التجزئة =====================
export type HashFn = 'first' | 'sum' | 'poly';
export function hashOf(key: string, m: number, fn: HashFn): number {
	if (fn === 'first') return key.charCodeAt(0) % m;
	if (fn === 'sum') { let s = 0; for (const ch of key) s += ch.charCodeAt(0); return s % m; }
	let h = 0;
	for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) % m;
	return h;
}
export interface HashTable { m: number; fn: HashFn; mode: 'chain' | 'probe'; slots: string[][] }
export const newTable = (m: number, fn: HashFn, mode: 'chain' | 'probe'): HashTable => ({ m, fn, mode, slots: Array.from({ length: m }, () => []) });
/** بيرجّع الخانات يلي انفحصت بالترتيب، والخانة النهائية (−1 إذا الجدول مليان) */
export function hashInsert(t: HashTable, key: string): { path: number[]; slot: number; collided: boolean } {
	const h = hashOf(key, t.m, t.fn);
	if (t.mode === 'chain') { const collided = t.slots[h].length > 0; t.slots[h].push(key); return { path: [h], slot: h, collided }; }
	const path: number[] = [];
	for (let k = 0; k < t.m; k++) {
		const s = (h + k) % t.m;
		path.push(s);
		if (!t.slots[s].length) { t.slots[s].push(key); return { path, slot: s, collided: k > 0 }; }
	}
	return { path, slot: -1, collided: true };
}
/** المقارنات مع المفاتيح لحتى نلاقي المفتاح أو نتأكد إنه مش موجود */
export function hashFind(t: HashTable, key: string): { path: number[]; found: boolean; cmps: number } {
	const h = hashOf(key, t.m, t.fn);
	if (t.mode === 'chain') { const i = t.slots[h].indexOf(key); return { path: [h], found: i >= 0, cmps: i >= 0 ? i + 1 : t.slots[h].length }; }
	const path: number[] = [];
	for (let k = 0; k < t.m; k++) {
		const s = (h + k) % t.m;
		path.push(s);
		if (!t.slots[s].length) return { path, found: false, cmps: k };
		if (t.slots[s][0] === key) return { path, found: true, cmps: k + 1 };
	}
	return { path, found: false, cmps: t.m };
}
/** احتمال أن يتشارك اثنان على الأقل بخانة واحدة (مسألة عيد الميلاد) */
export function birthday(k: number, m = 365) { let p = 1; for (let i = 0; i < k; i++) p *= (m - i) / m; return 1 - p; }

// ===================== 9. شجرة البحث الثنائية =====================
export interface BNode { v: number; l: BNode | null; r: BNode | null }
export function bstInsert(root: BNode | null, v: number): { root: BNode; path: number[]; dup: boolean } {
	const path: number[] = [];
	if (!root) return { root: { v, l: null, r: null }, path, dup: false };
	let cur = root;
	for (;;) {
		path.push(cur.v);
		if (v === cur.v) return { root, path, dup: true };
		const side = v < cur.v ? 'l' : 'r';
		if (!cur[side]) { cur[side] = { v, l: null, r: null }; return { root, path, dup: false }; }
		cur = cur[side]!;
	}
}
export function bstSearch(root: BNode | null, v: number) {
	const path: number[] = [];
	let c = root;
	while (c) { path.push(c.v); if (v === c.v) return { path, found: true }; c = v < c.v ? c.l : c.r; }
	return { path, found: false };
}
/** الحذف: ورقة، أو ابن واحد، أو ابنين (منبدّل بالخلف: أصغر عنصر بالفرع اليمين) */
export function bstDelete(root: BNode | null, v: number): { root: BNode | null; kind: 'leaf' | 'one' | 'two' | 'none'; succ?: number } {
	let kind: 'leaf' | 'one' | 'two' | 'none' = 'none';
	let succ: number | undefined;
	const del = (n: BNode | null, x: number): BNode | null => {
		if (!n) return null;
		if (x < n.v) { n.l = del(n.l, x); return n; }
		if (x > n.v) { n.r = del(n.r, x); return n; }
		if (kind === 'none') kind = !n.l && !n.r ? 'leaf' : !n.l || !n.r ? 'one' : 'two';
		if (!n.l) return n.r;
		if (!n.r) return n.l;
		let s = n.r;
		while (s.l) s = s.l;
		if (succ === undefined) succ = s.v;
		n.v = s.v;
		n.r = del(n.r, s.v);
		return n;
	};
	const r = del(root, v);
	return { root: r, kind, succ };
}
export const bstHeight = (n: BNode | null): number => (n ? 1 + Math.max(bstHeight(n.l), bstHeight(n.r)) : 0);
export function traverse(n: BNode | null, order: 'in' | 'pre' | 'post' | 'level'): number[] {
	const out: number[] = [];
	if (order === 'level') {
		const q = n ? [n] : [];
		while (q.length) { const x = q.shift()!; out.push(x.v); if (x.l) q.push(x.l); if (x.r) q.push(x.r); }
		return out;
	}
	const go = (x: BNode | null) => {
		if (!x) return;
		if (order === 'pre') out.push(x.v);
		go(x.l);
		if (order === 'in') out.push(x.v);
		go(x.r);
		if (order === 'post') out.push(x.v);
	};
	go(n);
	return out;
}
export function bstFrom(vals: number[]) { let r: BNode | null = null; for (const v of vals) r = bstInsert(r, v).root; return r; }
/** شجرة متوازنة من قائمة مرتبة: النص جذر، وكل نص لحاله */
export function bstBalanced(sorted: number[]): BNode | null {
	if (!sorted.length) return null;
	const m = sorted.length >> 1;
	return { v: sorted[m], l: bstBalanced(sorted.slice(0, m)), r: bstBalanced(sorted.slice(m + 1)) };
}

// ===================== 10. الكومة =====================
export interface HeapStep { a: number[]; hi: [number, number] | null; note: 'add' | 'up' | 'stop' | 'take' | 'down' }
/** كومة عظمى: إضافة بالآخر ثم «طفو» لفوق */
export function heapPush(a: number[], v: number): HeapStep[] {
	const st: HeapStep[] = [];
	a.push(v);
	let i = a.length - 1;
	st.push({ a: [...a], hi: [i, i], note: 'add' });
	while (i > 0) {
		const p = (i - 1) >> 1;
		if (a[p] >= a[i]) { st.push({ a: [...a], hi: [p, i], note: 'stop' }); break; }
		[a[p], a[i]] = [a[i], a[p]];
		st.push({ a: [...a], hi: [p, i], note: 'up' });
		i = p;
	}
	return st;
}
/** سحب الأكبر: آخر عنصر بيطلع للجذر وبينزل */
export function heapPop(a: number[]): { top: number; steps: HeapStep[] } {
	const steps: HeapStep[] = [];
	const top = a[0];
	const last = a.pop()!;
	if (!a.length) return { top, steps: [{ a: [], hi: null, note: 'take' }] };
	a[0] = last;
	steps.push({ a: [...a], hi: [0, 0], note: 'take' });
	let i = 0;
	for (;;) {
		const l = 2 * i + 1, r = l + 1;
		let m = i;
		if (l < a.length && a[l] > a[m]) m = l;
		if (r < a.length && a[r] > a[m]) m = r;
		if (m === i) { steps.push({ a: [...a], hi: [i, i], note: 'stop' }); break; }
		[a[i], a[m]] = [a[m], a[i]];
		steps.push({ a: [...a], hi: [i, m], note: 'down' });
		i = m;
	}
	return { top, steps };
}
export function heapSort(input: number[]) {
	const h: number[] = [];
	for (const x of input) heapPush(h, x);
	const out: number[] = [];
	while (h.length) out.unshift(heapPop(h).top);
	return out;
}

// ===================== 11. الرسوم البيانية: تمثيل وتجوال =====================
export interface GNode { id: string; label: string; x: number; y: number }
export interface GEdge { a: string; b: string; w?: number }
export interface Graph { nodes: GNode[]; edges: GEdge[]; directed?: boolean }
export function adjacency(g: Graph): Record<string, string[]> {
	const adj: Record<string, string[]> = {};
	g.nodes.forEach((n) => (adj[n.id] = []));
	for (const e of g.edges) { adj[e.a].push(e.b); if (!g.directed) adj[e.b].push(e.a); }
	Object.values(adj).forEach((l) => l.sort());
	return adj;
}
export interface WalkStep { cur: string | null; frontier: string[]; visited: string[]; order: string[]; note: 'start' | 'take' | 'add' | 'skip' | 'done'; who?: string; dist?: Record<string, number> }
/** BFS بطابور أو DFS بمكدس، مع حالة البنية بعد كل خطوة */
export function graphWalk(g: Graph, start: string, kind: 'bfs' | 'dfs'): WalkStep[] {
	const adj = adjacency(g);
	const steps: WalkStep[] = [];
	const visited = new Set<string>([start]);
	const order: string[] = [];
	const dist: Record<string, number> = { [start]: 0 };
	let frontier = [start];
	const snap = (cur: string | null, note: WalkStep['note'], who?: string) =>
		steps.push({ cur, frontier: [...frontier], visited: [...visited], order: [...order], note, who, dist: { ...dist } });
	snap(null, 'start');
	while (frontier.length) {
		const cur = kind === 'bfs' ? frontier.shift()! : frontier.pop()!;
		order.push(cur);
		snap(cur, 'take');
		// DFS: منحط الجيران بالعكس لحتى يطلع الأصغر أول من المكدس
		const nb = kind === 'bfs' ? adj[cur] : [...adj[cur]].reverse();
		for (const n of nb) {
			if (visited.has(n)) continue;
			visited.add(n);
			dist[n] = dist[cur] + 1;
			frontier.push(n);
			snap(cur, 'add', n);
		}
	}
	snap(null, 'done');
	return steps;
}

// المتاهة: شبكة نصوص، # حيط، S بداية، E نهاية
export interface MazeRun { visitOrder: [number, number][]; path: [number, number][]; found: boolean }
export function solveMaze(rows: string[], kind: 'bfs' | 'dfs'): MazeRun {
	const H = rows.length, W = rows[0].length;
	let s: [number, number] = [0, 0], e: [number, number] = [0, 0];
	rows.forEach((r, y) => [...r].forEach((c, x) => { if (c === 'S') s = [x, y]; if (c === 'E') e = [x, y]; }));
	const key = (x: number, y: number) => y * W + x;
	const prev = new Map<number, number>();
	const seen = new Set<number>([key(...s)]);
	const visitOrder: [number, number][] = [];
	const fr: [number, number][] = [s];
	// الترتيب: يمين، تحت، يسار، فوق
	const D = [[1, 0], [0, 1], [-1, 0], [0, -1]];
	let found = false;
	while (fr.length) {
		const [x, y] = kind === 'bfs' ? fr.shift()! : fr.pop()!;
		visitOrder.push([x, y]);
		if (x === e[0] && y === e[1]) { found = true; break; }
		const dirs = kind === 'bfs' ? D : [...D].reverse();
		for (const [dx, dy] of dirs) {
			const nx = x + dx, ny = y + dy;
			if (nx < 0 || ny < 0 || nx >= W || ny >= H || rows[ny][nx] === '#') continue;
			const k = key(nx, ny);
			if (seen.has(k)) continue;
			seen.add(k);
			prev.set(k, key(x, y));
			fr.push([nx, ny]);
		}
	}
	const path: [number, number][] = [];
	if (found) { let k: number | undefined = key(...e); while (k !== undefined) { path.unshift([k % W, Math.floor(k / W)]); k = prev.get(k); } }
	return { visitOrder, path, found };
}

// ===================== 12. أقصر طريق: Dijkstra =====================
export interface DStep { cur: string | null; dist: Record<string, number>; prev: Record<string, string | null>; done: string[]; relax?: { to: string; old: number; neu: number; better: boolean }; note: 'start' | 'pick' | 'relax' | 'done' }
export function dijkstra(g: Graph, src: string): DStep[] {
	const dist: Record<string, number> = {}, prev: Record<string, string | null> = {};
	g.nodes.forEach((n) => { dist[n.id] = Infinity; prev[n.id] = null; });
	dist[src] = 0;
	const done = new Set<string>();
	const steps: DStep[] = [];
	const snap = (cur: string | null, note: DStep['note'], relax?: DStep['relax']) => steps.push({ cur, dist: { ...dist }, prev: { ...prev }, done: [...done], relax, note });
	snap(null, 'start');
	for (;;) {
		let cur: string | null = null;
		for (const n of g.nodes) if (!done.has(n.id) && dist[n.id] < Infinity && (cur === null || dist[n.id] < dist[cur])) cur = n.id;
		if (cur === null) break;
		done.add(cur);
		snap(cur, 'pick');
		for (const e of g.edges) {
			const to = e.a === cur ? e.b : !g.directed && e.b === cur ? e.a : null;
			if (!to || done.has(to)) continue;
			const neu = dist[cur] + (e.w ?? 1), old = dist[to];
			const better = neu < old;
			if (better) { dist[to] = neu; prev[to] = cur; }
			snap(cur, 'relax', { to, old, neu, better });
		}
	}
	snap(null, 'done');
	return steps;
}
export function pathTo(prev: Record<string, string | null>, t: string): string[] { const p: string[] = []; let c: string | null = t; while (c) { p.unshift(c); c = prev[c]; } return p; }

// ===================== 13. الشجرة الممتدة الصغرى =====================
export interface KStep { edge: GEdge | null; take: boolean; chosen: GEdge[]; total: number; groups: Record<string, string>; note: 'start' | 'take' | 'cycle' | 'done' }
/** Kruskal مع Union-Find: الأضلاع بالترتيب، وكل ضلع بيوصل مجموعتين مختلفتين بينأخذ */
export function kruskal(g: Graph): KStep[] {
	const parent: Record<string, string> = {};
	g.nodes.forEach((n) => (parent[n.id] = n.id));
	const find = (x: string): string => (parent[x] === x ? x : (parent[x] = find(parent[x])));
	const sorted = [...g.edges].sort((a, b) => (a.w ?? 0) - (b.w ?? 0) || (a.a + a.b).localeCompare(b.a + b.b));
	const chosen: GEdge[] = [];
	let total = 0;
	const groups = () => Object.fromEntries(g.nodes.map((n) => [n.id, find(n.id)]));
	const steps: KStep[] = [{ edge: null, take: false, chosen: [], total: 0, groups: groups(), note: 'start' }];
	for (const e of sorted) {
		if (chosen.length === g.nodes.length - 1) break;
		const ra = find(e.a), rb = find(e.b);
		if (ra !== rb) { parent[ra] = rb; chosen.push(e); total += e.w ?? 0; steps.push({ edge: e, take: true, chosen: [...chosen], total, groups: groups(), note: 'take' }); }
		else steps.push({ edge: e, take: false, chosen: [...chosen], total, groups: groups(), note: 'cycle' });
	}
	steps.push({ edge: null, take: false, chosen: [...chosen], total, groups: groups(), note: 'done' });
	return steps;
}
/** Prim: من عقدة، كل مرة أرخص ضلع بيطلع من الشجرة */
export function prim(g: Graph, start: string): { order: GEdge[]; total: number } {
	const inT = new Set([start]);
	const order: GEdge[] = [];
	let total = 0;
	while (inT.size < g.nodes.length) {
		let best: GEdge | null = null;
		for (const e of g.edges) if (inT.has(e.a) !== inT.has(e.b) && (!best || (e.w ?? 0) < (best.w ?? 0))) best = e;
		if (!best) break;
		inT.add(best.a); inT.add(best.b);
		order.push(best); total += best.w ?? 0;
	}
	return { order, total };
}
/** هل الأضلاع المختارة فيها حلقة؟ وكم مجموعة بتعمل؟ */
export function forestInfo(nodes: string[], edges: GEdge[]) {
	const parent: Record<string, string> = {};
	nodes.forEach((n) => (parent[n] = n));
	const find = (x: string): string => (parent[x] === x ? x : (parent[x] = find(parent[x])));
	let cycle = false;
	for (const e of edges) { const ra = find(e.a), rb = find(e.b); if (ra === rb) cycle = true; else parent[ra] = rb; }
	const comps = new Set(nodes.map(find)).size;
	return { cycle, comps };
}

// ===================== 14. الترتيب الطوبولوجي =====================
export interface TStep { indeg: Record<string, number>; queue: string[]; order: string[]; cur: string | null; note: 'start' | 'take' | 'done' | 'cycle' }
/** Kahn: كل مرة منأخذ عقدة ما إلها متطلبات باقية */
export function kahn(g: Graph): TStep[] {
	const indeg: Record<string, number> = {};
	g.nodes.forEach((n) => (indeg[n.id] = 0));
	g.edges.forEach((e) => indeg[e.b]++);
	const queue = g.nodes.filter((n) => indeg[n.id] === 0).map((n) => n.id);
	const order: string[] = [];
	const steps: TStep[] = [{ indeg: { ...indeg }, queue: [...queue], order: [], cur: null, note: 'start' }];
	while (queue.length) {
		const cur = queue.shift()!;
		order.push(cur);
		for (const e of g.edges) if (e.a === cur) { indeg[e.b]--; if (indeg[e.b] === 0) queue.push(e.b); }
		steps.push({ indeg: { ...indeg }, queue: [...queue], order: [...order], cur, note: 'take' });
	}
	steps.push({ indeg: { ...indeg }, queue: [], order: [...order], cur: null, note: order.length === g.nodes.length ? 'done' : 'cycle' });
	return steps;
}
/** هل الترتيب يحترم كل الأسهم؟ بيرجّع أول سهم مكسور */
export function checkTopo(g: Graph, order: string[]): GEdge | null {
	const pos = Object.fromEntries(order.map((x, i) => [x, i]));
	return g.edges.find((e) => pos[e.a] === undefined || pos[e.b] === undefined ? false : pos[e.a] > pos[e.b]) ?? null;
}

// ===================== الرسوم الجاهزة للصفحات =====================
export const G_SMALL: Graph = {
	nodes: [
		{ id: 'A', label: 'A', x: 60, y: 60 }, { id: 'B', label: 'B', x: 200, y: 40 }, { id: 'C', label: 'C', x: 60, y: 190 },
		{ id: 'D', label: 'D', x: 200, y: 160 }, { id: 'E', label: 'E', x: 340, y: 90 }, { id: 'F', label: 'F', x: 330, y: 220 }, { id: 'G', label: 'G', x: 460, y: 160 },
	],
	edges: [{ a: 'A', b: 'B' }, { a: 'A', b: 'C' }, { a: 'B', b: 'D' }, { a: 'C', b: 'D' }, { a: 'B', b: 'E' }, { a: 'D', b: 'F' }, { a: 'E', b: 'G' }, { a: 'F', b: 'G' }],
};
export const MAZE = [
	'S..#.......',
	'.#.#.###.#.',
	'.#...#...#.',
	'.####.#.##.',
	'......#....',
	'.##.#####.#',
	'..#.....#..',
	'#.#.###.##.',
	'..........E',
];
/** مدن سورية بمسافات طرق تقريبية بالكيلومتر (للتوضيح فقط) */
export const G_CITIES: Graph = {
	nodes: [
		{ id: 'alp', label: 'حلب', x: 300, y: 50 }, { id: 'lat', label: 'اللاذقية', x: 80, y: 95 }, { id: 'ham', label: 'حماة', x: 280, y: 170 },
		{ id: 'tar', label: 'طرطوس', x: 90, y: 215 }, { id: 'hom', label: 'حمص', x: 250, y: 260 }, { id: 'raq', label: 'الرقة', x: 500, y: 85 },
		{ id: 'dez', label: 'دير الزور', x: 610, y: 190 }, { id: 'pal', label: 'تدمر', x: 450, y: 290 }, { id: 'dam', label: 'دمشق', x: 220, y: 400 }, { id: 'dar', label: 'درعا', x: 190, y: 500 },
	],
	edges: [
		{ a: 'alp', b: 'ham', w: 145 }, { a: 'alp', b: 'lat', w: 185 }, { a: 'alp', b: 'raq', w: 190 }, { a: 'lat', b: 'tar', w: 90 },
		{ a: 'tar', b: 'hom', w: 95 }, { a: 'ham', b: 'hom', w: 47 }, { a: 'hom', b: 'dam', w: 160 }, { a: 'hom', b: 'pal', w: 155 },
		{ a: 'dam', b: 'pal', w: 230 }, { a: 'pal', b: 'dez', w: 210 }, { a: 'raq', b: 'dez', w: 140 }, { a: 'dam', b: 'dar', w: 100 }, { a: 'ham', b: 'lat', w: 150 },
	],
};
export const G_VILLAGES: Graph = {
	nodes: [
		{ id: 'A', label: 'الوادي', x: 70, y: 70 }, { id: 'B', label: 'التل', x: 260, y: 40 }, { id: 'C', label: 'النبع', x: 440, y: 80 },
		{ id: 'D', label: 'السهل', x: 100, y: 230 }, { id: 'E', label: 'الجسر', x: 280, y: 190 }, { id: 'F', label: 'البيدر', x: 460, y: 250 }, { id: 'G', label: 'الطاحون', x: 270, y: 330 },
	],
	edges: [
		{ a: 'A', b: 'B', w: 7 }, { a: 'A', b: 'D', w: 5 }, { a: 'B', b: 'C', w: 8 }, { a: 'B', b: 'D', w: 9 }, { a: 'B', b: 'E', w: 7 },
		{ a: 'C', b: 'E', w: 5 }, { a: 'D', b: 'E', w: 15 }, { a: 'D', b: 'G', w: 6 }, { a: 'E', b: 'G', w: 8 }, { a: 'E', b: 'F', w: 9 },
		{ a: 'F', b: 'G', w: 11 }, { a: 'C', b: 'F', w: 12 },
	],
};
export const G_COURSES: Graph = {
	directed: true,
	nodes: [
		{ id: 'p1', label: 'برمجة 1', x: 70, y: 60 }, { id: 'm1', label: 'رياضيات 1', x: 70, y: 220 }, { id: 'p2', label: 'برمجة 2', x: 240, y: 60 },
		{ id: 'dm', label: 'رياضيات متقطعة', x: 240, y: 220 }, { id: 'ds', label: 'بنى المعطيات', x: 410, y: 60 }, { id: 'db', label: 'قواعد البيانات', x: 410, y: 300 },
		{ id: 'al', label: 'الخوارزميات', x: 560, y: 140 }, { id: 'ai', label: 'الذكاء الصنعي', x: 690, y: 240 },
	],
	edges: [
		{ a: 'p1', b: 'p2' }, { a: 'p2', b: 'ds' }, { a: 'm1', b: 'dm' }, { a: 'dm', b: 'al' }, { a: 'ds', b: 'al' },
		{ a: 'p2', b: 'db' }, { a: 'al', b: 'ai' }, { a: 'dm', b: 'db' },
	],
};

// ===================== 15. الخوارزميات الجشعة =====================
/** الفكّة الجشعة: أكبر قطعة ممكنة كل مرة */
export function greedyCoins(amount: number, coins: number[]): number[] {
	const out: number[] = [];
	const cs = [...coins].sort((a, b) => b - a);
	let left = amount;
	for (const c of cs) while (left >= c) { out.push(c); left -= c; }
	return left === 0 ? out : [];
}
/** أقل عدد قطع (برمجة ديناميكية)، مع القطع نفسها */
export function minCoins(amount: number, coins: number[]): number[] {
	const best: (number[] | null)[] = [[]];
	for (let a = 1; a <= amount; a++) {
		best[a] = null;
		for (const c of coins) {
			const prev = a - c >= 0 ? best[a - c] : null;
			if (prev && (!best[a] || prev.length + 1 < best[a]!.length)) best[a] = [...prev, c].sort((x, y) => y - x);
		}
	}
	return best[amount] ?? [];
}
/** أصغر مبلغ بيفشل فيه الجشع (أو 0 إذا ما في حتى max) */
export function firstGreedyFail(coins: number[], max = 100): number {
	for (let a = 1; a <= max; a++) if (greedyCoins(a, coins).length !== minCoins(a, coins).length) return a;
	return 0;
}
export interface Act { id: string; name: string; s: number; e: number }
export const ACTS: Act[] = [
	{ id: 'a', name: 'محاضرة رياضيات', s: 8, e: 10 },
	{ id: 'b', name: 'ورشة طويلة', s: 7.5, e: 15 },
	{ id: 'c', name: 'ندوة قصيرة', s: 9.5, e: 11 },
	{ id: 'd', name: 'نادي البرمجة', s: 10, e: 12 },
	{ id: 'e', name: 'امتحان', s: 11.5, e: 13 },
	{ id: 'f', name: 'محاضرة فيزياء', s: 12, e: 14 },
	{ id: 'g', name: 'تدريب', s: 13, e: 16 },
	{ id: 'h', name: 'حفل التخرج', s: 14, e: 17 },
];
export type ActRule = 'end' | 'start' | 'short';
/** جدولة القاعة: رتّب حسب القاعدة، وخذ كل نشاط ما بيتعارض مع يلي قبله */
export function greedySchedule(acts: Act[], rule: ActRule): Act[] {
	const sorted = [...acts].sort((x, y) => (rule === 'end' ? x.e - y.e : rule === 'start' ? x.s - y.s : (x.e - x.s) - (y.e - y.s)) || x.s - y.s);
	const out: Act[] = [];
	for (const a of sorted) if (out.every((b) => a.e <= b.s || a.s >= b.e)) out.push(a);
	return out.sort((x, y) => x.s - y.s);
}

// ===================== 16. البرمجة الديناميكية =====================
export interface Item { id: string; name: string; w: number; v: number }
export const ITEMS: Item[] = [
	{ id: 'tent', name: 'خيمة', w: 6, v: 30 },
	{ id: 'water', name: 'ماء', w: 3, v: 14 },
	{ id: 'food', name: 'طعام', w: 4, v: 16 },
	{ id: 'cam', name: 'كاميرا', w: 2, v: 9 },
];
export interface KCell { i: number; w: number; val: number; take: boolean; from: [number, number][] }
/** جدول حقيبة الظهر 0/1: T[i][w] أفضل قيمة بأول i أغراض وسعة w. كل خانة بخطوة */
export function knapsack(items: Item[], W: number) {
	const T: number[][] = Array.from({ length: items.length + 1 }, () => new Array(W + 1).fill(0));
	const cells: KCell[] = [];
	for (let i = 1; i <= items.length; i++) {
		const it = items[i - 1];
		for (let w = 0; w <= W; w++) {
			const skip = T[i - 1][w];
			const take = it.w <= w ? T[i - 1][w - it.w] + it.v : -1;
			T[i][w] = Math.max(skip, take);
			cells.push({ i, w, val: T[i][w], take: take > skip, from: take > skip ? [[i - 1, w - it.w]] : [[i - 1, w]] });
		}
	}
	// الرجوع من آخر خانة لنعرف شو أخدنا
	const chosen: Item[] = [];
	let w = W;
	for (let i = items.length; i >= 1; i--) if (T[i][w] !== T[i - 1][w]) { chosen.unshift(items[i - 1]); w -= items[i - 1].w; }
	return { T, cells, best: T[items.length][W], chosen };
}
/** أفضل قيمة بالطمع (أعلى قيمة لكل كيلو) للمقارنة */
export function greedyKnapsack(items: Item[], W: number) {
	const out: Item[] = [];
	let left = W;
	for (const it of [...items].sort((a, b) => b.v / b.w - a.v / a.w)) if (it.w <= left) { out.push(it); left -= it.w; }
	return { chosen: out, value: out.reduce((s, x) => s + x.v, 0) };
}
/** أطول تسلسل مشترك: الجدول، والتسلسل، وطريق الرجوع */
export function lcs(a: string, b: string) {
	const n = a.length, m = b.length;
	const T: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
	for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) T[i][j] = a[i - 1] === b[j - 1] ? T[i - 1][j - 1] + 1 : Math.max(T[i - 1][j], T[i][j - 1]);
	let i = n, j = m, s = '';
	const path: [number, number][] = [];
	while (i > 0 && j > 0) {
		if (a[i - 1] === b[j - 1]) { s = a[i - 1] + s; path.push([i, j]); i--; j--; }
		else if (T[i - 1][j] >= T[i][j - 1]) i--; else j--;
	}
	return { T, s, path };
}
/** فيبوناتشي من تحت لفوق: جدول القيم */
export const fibTable = (n: number) => { const f = [0, 1]; for (let k = 2; k <= n; k++) f.push(f[k - 1] + f[k - 2]); return f.slice(0, n + 1); };
/** عدد طرق صعود درج n، خطوة أو خطوتين */
export const stairs = (n: number) => { const f = [1, 1]; for (let k = 2; k <= n; k++) f.push(f[k - 1] + f[k - 2]); return f[n]; };

// ===================== 17. التراجع =====================
export interface QEvent { kind: 'try' | 'place' | 'clash' | 'remove' | 'solved'; row: number; col: number; board: number[] }
/** الملكات: ملكة بكل صف. board[r] = العمود. بيوقف عند أول حل، وبيسجّل كل محاولة */
export function nQueens(n: number, all = false) {
	const board: number[] = [];
	const events: QEvent[] = [];
	let solutions = 0, placements = 0;
	const ok = (r: number, c: number) => board.every((cc, rr) => cc !== c && Math.abs(cc - c) !== r - rr);
	const go = (r: number): boolean => {
		if (r === n) { solutions++; if (!all) { events.push({ kind: 'solved', row: r, col: -1, board: [...board] }); return true; } return false; }
		for (let c = 0; c < n; c++) {
			if (!ok(r, c)) { if (!all) events.push({ kind: 'clash', row: r, col: c, board: [...board] }); continue; }
			board.push(c); placements++;
			if (!all) events.push({ kind: 'place', row: r, col: c, board: [...board] });
			if (go(r + 1)) return true;
			board.pop();
			if (!all) events.push({ kind: 'remove', row: r, col: c, board: [...board] });
		}
		return false;
	};
	go(0);
	return { events, solutions, placements, first: events.at(-1)?.board ?? [] };
}
/** الخانات يلي بتهاجمها الملكات */
export function attacked(board: (number | null)[], n: number): boolean[][] {
	const A = Array.from({ length: n }, () => new Array(n).fill(false));
	board.forEach((c, r) => {
		if (c === null) return;
		for (let k = 0; k < n; k++) { A[r][k] = true; A[k][c] = true; }
		for (let d = -n; d <= n; d++) { const r1 = r + d, c1 = c + d, c2 = c - d; if (r1 >= 0 && r1 < n) { if (c1 >= 0 && c1 < n) A[r1][c1] = true; if (c2 >= 0 && c2 < n) A[r1][c2] = true; } }
	});
	return A;
}
/** سودوكو 4×4 بالتراجع: 0 = فاضي. بيسجّل كل كتابة ومسح */
export interface SEvent { kind: 'set' | 'undo' | 'solved'; r: number; c: number; v: number; grid: number[][] }
export function sudoku4(start: number[][]) {
	const g = start.map((r) => [...r]);
	const events: SEvent[] = [];
	const ok = (r: number, c: number, v: number) => {
		for (let k = 0; k < 4; k++) if (g[r][k] === v || g[k][c] === v) return false;
		const br = r - (r % 2), bc = c - (c % 2);
		for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) if (g[br + i][bc + j] === v) return false;
		return true;
	};
	const go = (p: number): boolean => {
		if (p === 16) { events.push({ kind: 'solved', r: -1, c: -1, v: 0, grid: g.map((r) => [...r]) }); return true; }
		const r = p >> 2, c = p & 3;
		if (g[r][c]) return go(p + 1);
		for (let v = 1; v <= 4; v++) {
			if (!ok(r, c, v)) continue;
			g[r][c] = v;
			events.push({ kind: 'set', r, c, v, grid: g.map((x) => [...x]) });
			if (go(p + 1)) return true;
			g[r][c] = 0;
			events.push({ kind: 'undo', r, c, v, grid: g.map((x) => [...x]) });
		}
		return false;
	};
	go(0);
	return events;
}
export const SUDOKU4 = [
	[0, 0, 0, 0],
	[0, 0, 0, 0],
	[0, 0, 0, 0],
	[0, 0, 4, 3],
];
/** كل المجموعات الجزئية بمجموع معيّن (شجرة القرار) */
export function subsetSum(nums: number[], target: number) {
	const out: number[][] = [];
	let calls = 0;
	const go = (k: number, cur: number[], sum: number) => {
		calls++;
		if (sum === target) { out.push([...cur]); return; }
		if (k === nums.length || sum > target) return;
		cur.push(nums[k]); go(k + 1, cur, sum + nums[k]); cur.pop();
		go(k + 1, cur, sum);
	};
	go(0, [], 0);
	return { out, calls };
}
