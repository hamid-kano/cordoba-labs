// محرك محاكاة صغير بيقلّد MATLAB: evalfis (Mamdani و Sugeno بالإعدادات الافتراضية)،
// و buildFuzzyPD.m، و simFuzzy.m، و step() لحلقة PID، ومحاكاة خزان الجلسة 7.
// الأدوات التفاعلية بصفحات الذكاء الصنعي 2 كلها بتستخدمه.

export type MfType = 'trimf' | 'trapmf';
export interface Mf { name: string; type: MfType; p: number[] }
export interface Fis {
	type: 'mamdani' | 'sugeno';
	inputs: { name: string; range: [number, number]; mfs: Mf[] }[];
	output: { name: string; range: [number, number]; mfs: Mf[]; consts?: number[] };
	/** كل قاعدة: أرقام المجموعات للمدخلات (من 1، و 0 = ما في) وبالآخر رقم مجموعة الخرج */
	rules: number[][];
}

export function trimf(x: number, [a, b, c]: number[]) {
	const l = a === b ? (x >= a ? 1 : 0) : (x - a) / (b - a);
	const r = b === c ? (x <= c ? 1 : 0) : (c - x) / (c - b);
	return Math.max(0, Math.min(l, r));
}
export function trapmf(x: number, [a, b, c, d]: number[]) {
	const l = a === b ? (x >= a ? 1 : 0) : (x - a) / (b - a);
	const r = c === d ? (x <= d ? 1 : 0) : (d - x) / (d - c);
	return Math.max(0, Math.min(l, 1, r));
}
export const mf = (x: number, m: Mf) => (m.type === 'trimf' ? trimf(x, m.p) : trapmf(x, m.p));

export interface FisDetail {
	value: number;
	/** درجات الانتماء لكل مدخل */
	degrees: number[][];
	/** قوة كل قاعدة */
	strengths: number[];
	/** الشكل الناتج (Mamdani): نقاط الخرج والارتفاع */
	samples?: { x: number[]; agg: number[]; perRule: number[][] };
}

const N_SAMPLES = 101; // الافتراضي بـ MATLAB

export function evalfisDetail(fis: Fis, x: number[]): FisDetail {
	const xin = x.map((v, i) => Math.min(Math.max(v, fis.inputs[i].range[0]), fis.inputs[i].range[1]));
	const degrees = fis.inputs.map((inp, i) => inp.mfs.map((m) => mf(xin[i], m)));
	const sug = fis.type === 'sugeno';
	const strengths = fis.rules.map((r) => {
		let v = sug ? 1 : Infinity;
		r.slice(0, -1).forEach((k, i) => {
			if (k) v = sug ? v * degrees[i][k - 1] : Math.min(v, degrees[i][k - 1]);
		});
		return v === Infinity ? 0 : v;
	});
	const [lo, hi] = fis.output.range;
	if (sug) {
		let n = 0;
		let d = 0;
		fis.rules.forEach((r, j) => {
			n += strengths[j] * fis.output.consts![r[r.length - 1] - 1];
			d += strengths[j];
		});
		return { value: d === 0 ? (lo + hi) / 2 : n / d, degrees, strengths };
	}
	const xs: number[] = [];
	const agg: number[] = [];
	const perRule: number[][] = fis.rules.map(() => []);
	let n = 0;
	let d = 0;
	for (let i = 0; i < N_SAMPLES; i++) {
		const s = lo + ((hi - lo) * i) / (N_SAMPLES - 1);
		let a = 0;
		fis.rules.forEach((r, j) => {
			const v = Math.min(strengths[j], mf(s, fis.output.mfs[r[r.length - 1] - 1]));
			perRule[j].push(v);
			a = Math.max(a, v);
		});
		xs.push(s);
		agg.push(a);
		n += s * a;
		d += a;
	}
	return { value: d === 0 ? (lo + hi) / 2 : n / d, degrees, strengths, samples: { x: xs, agg, perRule } };
}

/** نسخة سريعة بدون تفاصيل (للمحاكاة) */
export function evalfis(fis: Fis, x: number[]): number {
	const sug = fis.type === 'sugeno';
	const deg = fis.inputs.map((inp, i) => {
		const v = Math.min(Math.max(x[i], inp.range[0]), inp.range[1]);
		return inp.mfs.map((m) => mf(v, m));
	});
	const w = fis.rules.map((r) => {
		let v = sug ? 1 : Infinity;
		for (let i = 0; i < r.length - 1; i++) if (r[i]) v = sug ? v * deg[i][r[i] - 1] : Math.min(v, deg[i][r[i] - 1]);
		return v === Infinity ? 0 : v;
	});
	const [lo, hi] = fis.output.range;
	if (sug) {
		let n = 0;
		let d = 0;
		fis.rules.forEach((r, j) => {
			n += w[j] * fis.output.consts![r[r.length - 1] - 1];
			d += w[j];
		});
		return d === 0 ? (lo + hi) / 2 : n / d;
	}
	let n = 0;
	let d = 0;
	for (let i = 0; i < N_SAMPLES; i++) {
		const s = lo + ((hi - lo) * i) / (N_SAMPLES - 1);
		let a = 0;
		for (let j = 0; j < fis.rules.length; j++) {
			if (w[j] <= a) continue;
			const r = fis.rules[j];
			a = Math.max(a, Math.min(w[j], mf(s, fis.output.mfs[r[r.length - 1] - 1])));
		}
		n += s * a;
		d += a;
	}
	return d === 0 ? (lo + hi) / 2 : n / d;
}

/** نفس buildFuzzyPD.m */
export function buildFuzzyPD(n: 3 | 5 = 3, type: 'mamdani' | 'sugeno' = 'mamdani'): Fis {
	const nOut = n + 2;
	const all = ['NB', 'NM', 'NS', 'Z', 'PS', 'PM', 'PB'];
	const inNames = n === 3 ? ['N', 'Z', 'P'] : ['NB', 'NS', 'Z', 'PS', 'PB'];
	const outNames = nOut === 5 ? [0, 2, 3, 4, 6].map((i) => all[i]) : all;
	const part = (k: number, names: string[]): Mf[] => {
		const w = 2 / (k - 1);
		return names.map((name, i) => {
			const c = -1 + i * w;
			return { name, type: 'trimf', p: [c - w, c, c + w] };
		});
	};
	const outMfs = part(nOut, outNames);
	const ci = (n + 1) / 2;
	const co = (nOut + 1) / 2;
	const rules: number[][] = [];
	for (let i = 1; i <= n; i++)
		for (let j = 1; j <= n; j++) rules.push([i, j, Math.min(Math.max(i - ci + (j - ci), -(co - 1)), co - 1) + co]);
	return {
		type,
		inputs: [
			{ name: 'e', range: [-1, 1], mfs: part(n, inNames) },
			{ name: 'de', range: [-1, 1], mfs: part(n, inNames) },
		],
		output: { name: 'u', range: [-1, 1], mfs: outMfs, consts: outMfs.map((m) => m.p[1]) },
		rules,
	};
}

/** تمثيل حالة لتابع تحويل (num و den بقوى s النازلة) */
export function tf2ss(num: number[], den: number[]) {
	const a0 = den[0];
	const a = den.map((v) => v / a0);
	const n = a.length - 1;
	const b = new Array(n + 1 - num.length).fill(0).concat(num.map((v) => v / a0));
	if (Math.abs(b[0]) > 1e-12) throw new Error('D ≠ 0');
	// الشكل القانوني القابل للتحكم: x' = A x + B u ، y = C x
	const A: number[][] = Array.from({ length: n }, (_, i) =>
		Array.from({ length: n }, (_, j) => (i < n - 1 ? (j === i + 1 ? 1 : 0) : -a[n - j])),
	);
	const C = Array.from({ length: n }, (_, j) => b[n - j]);
	return { A, C, n };
}

export interface SimOpts {
	num?: number[];
	den?: number[];
	time?: number;
	reference?: number;
	ki?: number;
	disturbance?: number;
	distTime?: number;
	limits?: [number, number];
	band?: number;
}
export interface SimResult { t: number[]; y: number[]; u: number[]; ein: number[]; dein: number[] }

/** نفس simFuzzy.m: أويلر صريح بـ dt = 0.01 */
export function simFuzzy(fis: Fis, Ke: number, Kd: number, Ku: number, o: SimOpts = {}): SimResult {
	const { A, C, n } = tf2ss(o.num ?? [1], o.den ?? [0.5, 1, 0]);
	const T = o.time ?? 10;
	const r = o.reference ?? 1;
	const Ki = o.ki ?? 0;
	const dist = o.disturbance ?? 0;
	const distT = o.distTime ?? 5;
	const [lo, hi] = o.limits ?? [-Infinity, Infinity];
	const band = o.band ?? 0.5;
	const dt = 0.01;
	const steps = Math.round(T / dt);
	let x = new Array(n).fill(0);
	let yk = 0;
	let ePrev = r - yk;
	let I = 0;
	const res: SimResult = { t: [], y: [], u: [], ein: [], dein: [] };
	const clamp = (v: number) => Math.min(Math.max(v, -1), 1);
	for (let k = 0; k <= steps; k++) {
		const tk = k * dt;
		const e = r - yk;
		const de = (e - ePrev) / dt;
		ePrev = e;
		if (Ki !== 0 && Math.abs(Ke * e) < band) I += e * dt;
		const ein = clamp(Ke * e);
		const dein = clamp(Kd * de);
		let uk = Ku * evalfis(fis, [ein, dein]) + Ki * I;
		uk = Math.min(Math.max(uk, lo), hi);
		const d = tk >= distT ? dist : 0;
		const nx = x.map((xi, i) => {
			let dx = i === n - 1 ? uk + d : 0;
			for (let j = 0; j < n; j++) dx += A[i][j] * x[j];
			return xi + dx * dt;
		});
		x = nx;
		yk = C.reduce((s, c, j) => s + c * x[j], 0);
		res.t.push(tk);
		res.y.push(yk);
		res.u.push(uk);
		res.ein.push(ein);
		res.dein.push(dein);
	}
	return res;
}

/** استجابة الخطوة لـ feedback(pid(P,I,D)*G, 1) بشكل دقيق (RK4) */
export function stepPid(P: number, I: number, D: number, num = [1], den = [0.5, 1, 0], T = 10) {
	// C = (D s² + P s + I)/s  →  الحلقة المغلقة = C·N / (s·Den + C·N)
	const cn = [D, P, I];
	const polyMul = (p: number[], q: number[]) => {
		const out = new Array(p.length + q.length - 1).fill(0);
		p.forEach((a, i) => q.forEach((b, j) => (out[i + j] += a * b)));
		return out;
	};
	const polyAdd = (p: number[], q: number[]) => {
		const L = Math.max(p.length, q.length);
		const pp = new Array(L - p.length).fill(0).concat(p);
		const qq = new Array(L - q.length).fill(0).concat(q);
		return pp.map((v, i) => v + qq[i]);
	};
	let clNum = polyMul(cn, num);
	const clDen = polyAdd(polyMul([1, 0], den), clNum);
	while (clNum.length > 1 && Math.abs(clNum[0]) < 1e-12) clNum = clNum.slice(1);
	const { A, C, n } = tf2ss(clNum, clDen);
	const dt = 0.002;
	const f = (x: number[]) =>
		x.map((_, i) => {
			let s = i === n - 1 ? 1 : 0;
			for (let j = 0; j < n; j++) s += A[i][j] * x[j];
			return s;
		});
	let x = new Array(n).fill(0);
	const t: number[] = [0];
	const y: number[] = [0];
	const every = 5;
	const steps = Math.round(T / dt);
	for (let k = 1; k <= steps; k++) {
		const k1 = f(x);
		const k2 = f(x.map((v, i) => v + (dt / 2) * k1[i]));
		const k3 = f(x.map((v, i) => v + (dt / 2) * k2[i]));
		const k4 = f(x.map((v, i) => v + dt * k3[i]));
		x = x.map((v, i) => v + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
		if (k % every === 0) {
			t.push(k * dt);
			y.push(C.reduce((s, c, j) => s + c * x[j], 0));
		}
	}
	return { t, y };
}

/** التجاوز وزمن الاستقرار (2%) والقيمة النهائية */
export function stepinfo(t: number[], y: number[], yfinal = y[y.length - 1], y0 = 0) {
	const amp = yfinal - y0;
	let peak = -Infinity;
	for (const v of y) if (Number.isFinite(v)) peak = Math.max(peak, v);
	const os = amp === 0 ? 0 : Math.max(0, ((peak - yfinal) / amp) * 100);
	let ts = 0;
	let settled = true;
	for (let k = y.length - 1; k >= 0; k--) {
		if (!Number.isFinite(y[k]) || Math.abs(y[k] - yfinal) > 0.02 * Math.abs(amp)) {
			if (k === y.length - 1) settled = false;
			ts = t[k + 1] ?? t[k];
			break;
		}
	}
	return { os, ts: settled ? ts : Infinity, final: y[y.length - 1], peak };
}

// ===== خزان الجلسة 7 (نفس lab07_tank.m) =====
export interface TankRun { t: number[]; r: number[]; h: number[]; q: number[] }
export function simTank(ctrl: 'pi' | 'pi-aw' | 'fuzzy', o: { Kp?: number; Ki?: number; Ke?: number; Kd?: number; Ku?: number } = {}): TankRun {
	const qmax = 0.5;
	const T = 300;
	const ref = (t: number) => 1 + 2 * (t >= 10 ? 1 : 0) - 1.5 * (t >= 120 ? 1 : 0);
	const kout = (t: number) => 0.2 + 0.1 * (t >= 220 ? 1 : 0);
	const Kp = o.Kp ?? 0.38;
	const Ki = o.Ki ?? 0.09;
	const fis = buildFuzzyPD(3);
	const Ke = o.Ke ?? 1;
	const Kd = o.Kd ?? 4;
	const Ku = o.Ku ?? 0.3;
	const dt = 0.05;
	const steps = Math.round(T / dt);
	let h = 1;
	let ePrev = ref(0) - h;
	let I = 0.2;
	let qs = 0.2;
	const R: TankRun = { t: [], r: [], h: [], q: [] };
	for (let k = 0; k <= steps; k++) {
		const t = k * dt;
		const r = ref(t);
		const e = r - h;
		const de = (e - ePrev) / dt;
		ePrev = e;
		let q: number;
		if (ctrl === 'fuzzy') {
			const ein = Math.min(Math.max(Ke * e, -1), 1);
			const dein = Math.min(Math.max(Kd * de, -1), 1);
			qs = Math.min(Math.max(qs + Ku * evalfis(fis, [ein, dein]) * dt, 0), qmax);
			q = qs;
		} else {
			const u = Kp * e + I;
			const us = Math.min(Math.max(u, 0), qmax);
			if (ctrl === 'pi' || us === u || Math.sign(e) !== Math.sign(u - us)) I += Ki * e * dt;
			q = u;
		}
		q = Math.min(Math.max(q, 0), qmax);
		h = Math.max(h + (q - kout(t) * Math.sqrt(Math.max(h, 0))) * dt, 0);
		R.t.push(t);
		R.r.push(r);
		R.h.push(h);
		R.q.push(q);
	}
	return R;
}
export function tankInfo(R: TankRun) {
	let maxUp = -Infinity;
	let minDown = Infinity;
	let dev = 0;
	R.t.forEach((t, k) => {
		if (t >= 10 && t < 120) maxUp = Math.max(maxUp, R.h[k]);
		if (t >= 120 && t < 220) minDown = Math.min(minDown, R.h[k]);
		if (t >= 220) dev = Math.max(dev, Math.abs(R.h[k] - 1.5));
	});
	return {
		osUp: Math.max(0, ((maxUp - 3) / 2) * 100),
		osDown: Math.max(0, ((1.5 - minDown) / 1.5) * 100),
		dev,
	};
}
