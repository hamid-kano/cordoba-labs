// رسمة خط زمني (Gantt) بـ SVG بدون مكتبات، لمادة الزمن الحقيقي.
// كل صف مهمة (أو المعالج)، والزمن من اليسار لليمين متل أي رسمة زمنية.
// الألوان من أصناف CSS (rts-k0..3، rts-idle، rts-clash...) بآخر custom.css، فبتتبع الوضع الليلي.

export interface TLBlock {
	start: number;
	end: number;
	cls: string;
	text?: string;
}
export interface TLMark {
	t: number;
	kind: 'release' | 'deadline' | 'miss';
}
export interface TLRow {
	label: string;
	blocks: TLBlock[];
	marks?: TLMark[];
}

const LABEL = 78;
const ROW = 34;
const TOP = 10;
const AXIS = 24;

// frame: إذا انبعت، منرسم خط سميك ببداية كل إطار (الجدولة الدورية)
export function drawTimeline(svg: SVGSVGElement, rows: TLRow[], horizon: number, frame = 0) {
	// العرض الحقيقي بالبكسل، لحتى يضل حجم الكتابة ثابت عالموبايل
	const W = Math.max(320, Math.min(900, Math.round(svg.getBoundingClientRect().width) || 600));
	const H = TOP + rows.length * ROW + AXIS;
	svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
	const cw = (W - LABEL - 14) / horizon;
	const X = (t: number) => LABEL + t * cw;
	const step = cw >= 18 ? 1 : cw >= 9 ? 2 : 5;
	let g = '';
	for (let t = 0; t <= horizon; t++) {
		g += `<line class="${t % step ? 'rts-grid2' : 'ai-grid'}" x1="${X(t)}" x2="${X(t)}" y1="${TOP}" y2="${H - AXIS}"/>`;
		if (t % step === 0) g += `<text class="ai-tick" x="${X(t)}" y="${H - AXIS + 15}" text-anchor="middle">${t}</text>`;
	}
	rows.forEach((r, i) => {
		const y = TOP + i * ROW;
		g += `<text class="rts-lbl" x="${LABEL - 8}" y="${y + ROW / 2 + 5}" text-anchor="end">${r.label}</text>`;
		g += `<line class="ai-frame" x1="${LABEL}" x2="${X(horizon)}" y1="${y + ROW - 4}" y2="${y + ROW - 4}"/>`;
		for (const b of r.blocks) {
			g += `<rect class="${b.cls}" x="${X(b.start) + 0.5}" y="${y + 7}" width="${Math.max(1, (b.end - b.start) * cw - 1)}" height="${ROW - 12}" rx="3"/>`;
			if (b.text && (b.end - b.start) * cw >= 14)
				g += `<text class="rts-btxt" x="${X((b.start + b.end) / 2)}" y="${y + ROW / 2 + 4}" text-anchor="middle">${b.text}</text>`;
		}
		for (const m of r.marks ?? []) {
			const x = X(m.t);
			if (m.kind === 'release') g += `<path class="rts-rel" d="M${x},${y + 2} l-4,7 h8 z"/><line class="rts-rel" x1="${x}" x2="${x}" y1="${y + 8}" y2="${y + ROW - 4}"/>`;
			else if (m.kind === 'deadline') g += `<path class="rts-dl" d="M${x},${y + ROW - 4} l-4,-7 h8 z"/>`;
			else g += `<circle class="rts-miss" cx="${x}" cy="${y + 6}" r="6"/><text class="rts-miss-x" x="${x}" y="${y + 10}" text-anchor="middle">✕</text>`;
		}
	});
	if (frame) for (let t = 0; t <= horizon; t += frame) g += `<line class="rts-fline" x1="${X(t)}" x2="${X(t)}" y1="4" y2="${H - AXIS}"/>`;
	svg.innerHTML = g;
}
