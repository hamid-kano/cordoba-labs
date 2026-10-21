// رسم شجرة ثنائية بـ SVG (للـ BST والكومة): كل عقدة إلها x كنسبة من 0 لـ 1 وعمق.
// الألوان من أصناف tr-* بـ custom.css فبتتبع الوضع الليلي والنهاري.
export interface TNode { id: string | number; label: string; fx: number; depth: number; cls?: string; parent?: string | number; tag?: string }

export function drawTree(svg: SVGSVGElement, nodes: TNode[], opts: { minW?: number; dy?: number; r?: number } = {}) {
	const R = opts.r ?? 17, DY = opts.dy ?? 58;
	const depth = nodes.reduce((m, n) => Math.max(m, n.depth), 0);
	const real = Math.round(svg.parentElement?.getBoundingClientRect().width || 600);
	const W = Math.max(opts.minW ?? 300, real), H = (depth + 1) * DY + R + 14;
	svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
	svg.style.width = `${W}px`;
	const X = (f: number) => R + 6 + f * (W - 2 * R - 12), Y = (d: number) => R + 8 + d * DY;
	const by = new Map(nodes.map((n) => [n.id, n]));
	let h = '';
	for (const n of nodes) {
		const p = n.parent !== undefined ? by.get(n.parent) : undefined;
		if (p) h += `<line class="tr-edge ${n.cls ?? ''}" x1="${X(p.fx)}" y1="${Y(p.depth)}" x2="${X(n.fx)}" y2="${Y(n.depth)}"/>`;
	}
	for (const n of nodes) {
		h += `<g class="tr-node ${n.cls ?? ''}"><circle cx="${X(n.fx)}" cy="${Y(n.depth)}" r="${R}"/><text x="${X(n.fx)}" y="${Y(n.depth) + 5}">${n.label}</text>`;
		if (n.tag) h += `<text class="tr-tag" x="${X(n.fx)}" y="${Y(n.depth) + R + 13}">${n.tag}</text>`;
		h += '</g>';
	}
	svg.innerHTML = h;
}

/** موقع عقدة رقم i بكومة (شجرة كاملة) */
export function heapPos(i: number) {
	const depth = Math.floor(Math.log2(i + 1));
	const first = 2 ** depth - 1, k = i - first, cnt = 2 ** depth;
	return { depth, fx: (k + 0.5) / cnt };
}
