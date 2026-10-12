// رسمة خطوط SVG بسيطة بدون مكتبات. الألوان من أصناف CSS (ai-c1 ... ) فبتتبع الوضع الليلي والنهاري.

export interface Series {
	x: number[];
	y: number[];
	cls: string; // ai-c1 | ai-c2 | ai-c3 | ai-ref | ai-ghost
	fill?: boolean; // تعبئة تحت الخط (لأشكال المنطق الضبابي)
}
export interface ChartOpts {
	series: Series[];
	xMin?: number;
	xMax?: number;
	yMin?: number;
	yMax?: number;
	xLabel?: string;
	yLabel?: string;
	vlines?: { x: number; cls: string; label?: string }[];
	hlines?: { y: number; cls: string }[];
	points?: { x: number; y: number; cls: string }[];
	height?: number;
}

const PAD = { l: 44, r: 12, t: 12, b: 30 };

function niceStep(range: number, target = 5) {
	const raw = range / target;
	const mag = 10 ** Math.floor(Math.log10(raw));
	const n = raw / mag;
	return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * mag;
}
const fmt = (v: number) => {
	const r = Math.round(v * 1000) / 1000;
	return String(r);
};

export function drawChart(svg: SVGSVGElement, o: ChartOpts) {
	// عرض الرسمة = عرضها الحقيقي بالبكسل، لحتى يضل حجم الكتابة ثابت عالموبايل
	const W = Math.max(300, Math.min(900, Math.round(svg.getBoundingClientRect().width) || 600));
	const H = Math.round((o.height ?? 240) * (W < 500 ? 0.85 : 1));
	svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
	const finite = (a: number[]) => a.filter((v) => Number.isFinite(v));
	const allX = o.series.flatMap((s) => finite(s.x));
	const allY = o.series.flatMap((s) => finite(s.y));
	const xMin = o.xMin ?? Math.min(...allX);
	const xMax = o.xMax ?? Math.max(...allX);
	let yMin = o.yMin ?? Math.min(0, ...allY);
	let yMax = o.yMax ?? Math.max(...allY);
	if (o.yMax === undefined) yMax += (yMax - yMin) * 0.08;
	if (yMax - yMin < 1e-9) {
		yMax += 1;
		yMin -= 1;
	}
	const X = (v: number) => PAD.l + ((v - xMin) / (xMax - xMin)) * (W - PAD.l - PAD.r);
	const Y = (v: number) => H - PAD.b - ((Math.min(Math.max(v, yMin), yMax) - yMin) / (yMax - yMin)) * (H - PAD.t - PAD.b);
	let g = '';
	const xs = niceStep(xMax - xMin);
	for (let v = Math.ceil(xMin / xs) * xs; v <= xMax + 1e-9; v += xs) {
		g += `<line class="ai-grid" x1="${X(v)}" x2="${X(v)}" y1="${PAD.t}" y2="${H - PAD.b}"/>`;
		g += `<text class="ai-tick" x="${X(v)}" y="${H - PAD.b + 15}" text-anchor="middle">${fmt(v)}</text>`;
	}
	const ys = niceStep(yMax - yMin, 4);
	for (let v = Math.ceil(yMin / ys) * ys; v <= yMax + 1e-9; v += ys) {
		g += `<line class="ai-grid" x1="${PAD.l}" x2="${W - PAD.r}" y1="${Y(v)}" y2="${Y(v)}"/>`;
		g += `<text class="ai-tick" x="${PAD.l - 6}" y="${Y(v) + 4}" text-anchor="end">${fmt(v)}</text>`;
	}
	g += `<rect class="ai-frame" x="${PAD.l}" y="${PAD.t}" width="${W - PAD.l - PAD.r}" height="${H - PAD.t - PAD.b}"/>`;
	for (const h of o.hlines ?? []) g += `<line class="${h.cls}" x1="${PAD.l}" x2="${W - PAD.r}" y1="${Y(h.y)}" y2="${Y(h.y)}"/>`;
	for (const s of o.series) {
		// تخفيف النقاط لحتى تضل الرسمة خفيفة
		const step = Math.max(1, Math.floor(s.x.length / 600));
		let d = '';
		for (let i = 0; i < s.x.length; i += step) {
			if (!Number.isFinite(s.y[i])) continue;
			d += `${d ? 'L' : 'M'}${X(s.x[i]).toFixed(1)},${Y(s.y[i]).toFixed(1)}`;
		}
		const last = s.x.length - 1;
		if (last % step && Number.isFinite(s.y[last])) d += `L${X(s.x[last]).toFixed(1)},${Y(s.y[last]).toFixed(1)}`;
		if (s.fill && d) {
			const base = Y(Math.max(yMin, 0));
			g += `<path class="${s.cls} ai-area" d="${d}L${X(s.x[last]).toFixed(1)},${base}L${X(s.x[0]).toFixed(1)},${base}Z"/>`;
		}
		g += `<path class="${s.cls} ai-line" d="${d}"/>`;
	}
	for (const v of o.vlines ?? []) {
		g += `<line class="${v.cls}" x1="${X(v.x)}" x2="${X(v.x)}" y1="${PAD.t}" y2="${H - PAD.b}"/>`;
		if (v.label) g += `<text class="ai-vlabel ${v.cls}" x="${X(v.x) + 4}" y="${PAD.t + 12}">${v.label}</text>`;
	}
	for (const p of o.points ?? []) g += `<circle class="${p.cls}" cx="${X(p.x)}" cy="${Y(p.y)}" r="5"/>`;
	if (o.xLabel) g += `<text class="ai-axis" x="${W - PAD.r}" y="${H - 2}" text-anchor="end">${o.xLabel}</text>`;
	if (o.yLabel) g += `<text class="ai-axis" x="4" y="${PAD.t + 2}" dominant-baseline="hanging">${o.yLabel}</text>`;
	svg.innerHTML = g;
}

/** رقم مع وحدة، معزول عن اتجاه الجملة العربية */
export const num = (v: number, digits = 2, unit = '') =>
	`<bdi dir="ltr">${Number.isFinite(v) ? Number(v.toFixed(digits)).toString() : '∞'}${unit ? ' ' + unit : ''}</bdi>`;
