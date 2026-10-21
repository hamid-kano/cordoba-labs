// رسم رسم بياني بـ SVG بإحداثيات ثابتة (viewBox)، مع أصناف للعقد والأضلاع، وأوزان، وأسهم للموجّه.
// العقد والأضلاع قابلة للكبس: data-id للعقدة و data-e="a-b" للضلع.
import type { Graph } from './algo';

export interface GraphView {
	W: number; H: number;
	nodeCls?: (id: string) => string;
	edgeCls?: (a: string, b: string) => string;
	weights?: boolean;
	tag?: (id: string) => string;
	r?: number;
	wide?: boolean; // عقد مستطيلة بنص طويل (أسماء)
}

export const ekey = (a: string, b: string) => (a < b ? `${a}-${b}` : `${b}-${a}`);

export function drawGraph(svg: SVGSVGElement, g: Graph, v: GraphView) {
	const R = v.r ?? 18;
	svg.setAttribute('viewBox', `0 0 ${v.W} ${v.H}`);
	const pos = Object.fromEntries(g.nodes.map((n) => [n.id, n]));
	let h = g.directed ? `<defs><marker id="gd-ar" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M0 0 L10 5 L0 10 z" class="gd-arrow"></path></marker></defs>` : '';
	for (const e of g.edges) {
		const a = pos[e.a], b = pos[e.b];
		let x2 = b.x, y2 = b.y;
		if (g.directed) {
			// السهم بيوقف عند حافة العقدة
			const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1;
			// العقدة العريضة مستطيل: منقطع الخط عند حافته بالضبط (أقرب حافة أفقية أو عمودية)
			const hw = Math.max(56, b.label.length * 11 + 16) / 2;
			const s = v.wide ? Math.min(hw / (Math.abs(dx) || 1e-9), 16 / (Math.abs(dy) || 1e-9)) : (R + 3) / L;
			x2 = b.x - dx * s - (dx / L) * 3; y2 = b.y - dy * s - (dy / L) * 3;
		}
		const cls = v.edgeCls?.(e.a, e.b) ?? '';
		h += `<g class="gd-e ${cls}" data-e="${ekey(e.a, e.b)}"><line class="gd-hit" x1="${a.x}" y1="${a.y}" x2="${x2}" y2="${y2}"/><line class="gd-line" x1="${a.x}" y1="${a.y}" x2="${x2}" y2="${y2}"${g.directed ? ' marker-end="url(#gd-ar)"' : ''}/>`;
		if (v.weights && e.w !== undefined) {
			const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
			h += `<rect class="gd-wbg" x="${mx - 16}" y="${my - 10}" width="32" height="18" rx="4"/><text class="gd-w" x="${mx}" y="${my + 4}">${e.w}</text>`;
		}
		h += '</g>';
	}
	for (const n of g.nodes) {
		const cls = v.nodeCls?.(n.id) ?? '';
		if (v.wide) {
			const w = Math.max(56, n.label.length * 11 + 16);
			h += `<g class="gd-n tr-node ${cls}" data-id="${n.id}"><rect x="${n.x - w / 2}" y="${n.y - 16}" width="${w}" height="32" rx="16"/><text x="${n.x}" y="${n.y + 5}">${n.label}</text>`;
		} else h += `<g class="gd-n tr-node ${cls}" data-id="${n.id}"><circle cx="${n.x}" cy="${n.y}" r="${R}"/><text x="${n.x}" y="${n.y + 5}">${n.label}</text>`;
		const t = v.tag?.(n.id);
		if (t) h += `<text class="gd-tag" x="${n.x}" y="${n.y - (v.wide ? 22 : R + 6)}">${t}</text>`;
		h += '</g>';
	}
	svg.innerHTML = h;
}
