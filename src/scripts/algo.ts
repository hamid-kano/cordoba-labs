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
