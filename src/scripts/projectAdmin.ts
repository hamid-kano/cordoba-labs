// تبويبات مشاريع المواد بصفحة المدرّس (results.astro): المواعيد، والمجموعات، والتسليمات، والنتائج المتوقعة، و CSV.
// تبويب لكل مادة (os1، rts)، وكل وحدة بتقرا من proj/{course}. القراءة والكتابة مسموحة بس لإيميل المدرّس (firestore.rules).
import { getFirestore, doc, getDoc, getDocs, setDoc, collection, writeBatch, Timestamp } from 'firebase/firestore/lite';
import { app } from './quizStore';
import { cpuSched, type SchedAlgo } from './os1';
import { utilization, hyperperiod, simulate, llBound, frameTable, cyclicSolve, type SimResult, type Task } from './rts';
import {
	COURSES, CLOSED, DEFAULT_CAP, regState, subState, os1Data, rtsData, RTS_TASKS, linkMark, fmtWhen, left,
	type Course, type ProjSettings, type Mode,
} from './projects';

interface Group { gid: string; opt: string; slot: number; size: number; members: { n: string; s: string }[]; pin: string; at: Date | null }
interface Sub { url: string; kind: string; at: Date | null }

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const toDate = (v: unknown) => (v instanceof Timestamp ? v.toDate() : null);
const fmt = (d: Date | null) => (d ? d.toLocaleString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—');
// datetime-local بيشتغل بالتوقيت المحلي للجهاز
const toInput = (d: Date | null) => (d ? new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '');
const fromInput = (v: string) => (v ? new Date(v) : null);
const n2 = (x: number) => (Math.round(x * 100) / 100).toString();

// ===== النتائج الصحيحة (للمدرّس بس، ما بتنعرض للطالب) =====
function os1Expected(gid: string, opt: string, optName: Record<string, string>) {
	const { procs, q } = os1Data(gid);
	const fcfs = cpuSched(procs, 'fcfs'), mine = cpuSched(procs, opt as SchedAlgo, q);
	const gantt = (r: typeof fcfs) => r.segs.map((s) => `| ${s.p < 0 ? 'idle' : procs[s.p].name} ${s.start}-${s.end} `).join('') + '|';
	const table = (r: typeof fcfs) => '<table class="wl-table"><thead><tr><th>العملية</th><th>الانتهاء</th><th>الدوران</th><th>الانتظار</th><th>الاستجابة</th></tr></thead><tbody>' +
		r.rows.map((x, i) => `<tr><td>${procs[i].name}</td><td>${x.finish}</td><td>${x.turnaround}</td><td>${x.waiting}</td><td>${x.response}</td></tr>`).join('') +
		`</tbody><tfoot><tr><th>المتوسط</th><th></th><th>${n2(r.avgTurn)}</th><th>${n2(r.avgWait)}</th><th>${n2(r.avgResp)}</th></tr></tfoot></table>`;
	const name = optName[opt] + (opt === 'rr' ? ` (q = ${q})` : '');
	return `<p><b>البيانات:</b> <span class="num">${procs.map((p) => `${p.name}(${p.arrival}, ${p.burst}, ${p.prio})`).join('  ')}</span> <span class="se-note">(الوصول، التنفيذ، الأولوية)</span></p>
		<div class="pa-two"><div><h5>FCFS</h5><pre class="pj-file">${gantt(fcfs)}</pre>${table(fcfs)}</div>
		<div><h5>${name}</h5><pre class="pj-file">${gantt(mine)}</pre>${table(mine)}</div></div>`;
}
function rtsExpected(gid: string, opt: string) {
	const ts: Task[] = rtsData(gid);
	const names = RTS_TASKS[opt].map((x) => x.en);
	const U = utilization(ts), B = llBound(ts.length), H = hyperperiod(ts);
	const rm = simulate(ts, 'rm'), edf = simulate(ts, 'edf');
	const line = (r: SimResult) => {
		// نجمع الشرائح المتتالية لنفس المهمة
		const segs: { t: number; s: number; e: number }[] = [];
		for (const x of r.slices) {
			const last = segs[segs.length - 1];
			if (last && last.t === x.task && last.e === x.start) last.e = x.end;
			else segs.push({ t: x.task, s: x.start, e: x.end });
		}
		return segs.map((x) => `| ${x.t < 0 ? 'idle' : names[x.t]} ${x.s}-${x.e} `).join('') + '|';
	};
	const missList = (r: SimResult) => r.jobs.filter((j) => j.missed).map((j) => `${names[j.task]} (النسخة ${j.k + 1}، مهلتها ${j.deadline})`).join('، ');
	const frames = frameTable(ts).filter((x) => x.ok).map((x) => x.f);
	const cyc = frames.map((f) => `f = ${f}: ${cyclicSolve(ts, f) ? '✔ يوجد جدول' : '✘ لا يوجد جدول'}`);
	return `<div class="wl-scroll"><table class="wl-table"><thead><tr><th>المهمة</th><th>C</th><th>T</th><th>C/T</th></tr></thead><tbody>
		${ts.map((t, i) => `<tr><td class="num">${names[i]}</td><td>${t.C}</td><td>${t.T}</td><td>${n2(t.C / t.T)}</td></tr>`).join('')}</tbody></table></div>
		<p><b>U = ${n2(U)}</b> (${(U * 100).toFixed(1)}%)، وحد RM لأربع مهام ${n2(B)} ← <b>«لا نعرف»: يجب الرسم</b>. الدورة الكبرى <b>H = ${H}</b>.</p>
		<p><b>RM:</b> ${rm.misses ? `<span class="wl-bad">✘ يفشل</span>: ${missList(rm)}` : '<span class="wl-good">✔ ينجح</span>'} · <b>EDF:</b> ${edf.misses ? `✘ يفشل: ${missList(edf)}` : '✔ ينجح'} (U ≤ 1)</p>
		<h5>الرسم بـ RM (حتى ${H})</h5><pre class="pj-file">${line(rm)}</pre>
		<h5>الرسم بـ EDF</h5><pre class="pj-file">${line(edf)}</pre>
		<p><b>الجدول الثابت:</b> ${frames.length ? `الأطر المقبولة بالشروط الثلاثة: ${cyc.join(' · ')}` : 'لا يوجد حجم إطار يحقق الشروط الثلاثة: يجب أن يقترح الطالب تقسيم مهمة.'}</p>`;
}

export function mountProjectAdmin(root: HTMLElement, course: Course) {
	const cp = COURSES[course];
	const db = getFirestore(app());
	const P = ['proj', course] as const;
	const $ = <T extends HTMLElement = HTMLElement>(k: string) => root.querySelector<T>(`[data-pa="${k}"]`)!;
	const say = (t: string, cls = '') => { const m = $('msg'); m.className = 'wl-msg' + (cls ? ' ' + cls : ''); m.textContent = t; };
	let settings: ProjSettings = CLOSED;
	let groups: Group[] = [];
	let subs = new Map<string, Sub>();
	let loaded = false;

	function fillSettings() {
		$<HTMLInputElement>('regFrom').value = toInput(settings.regFrom);
		$<HTMLInputElement>('regTo').value = toInput(settings.regTo);
		$<HTMLInputElement>('subTo').value = toInput(settings.subTo);
		$<HTMLSelectElement>('regMode').value = settings.regMode;
		$<HTMLSelectElement>('subMode').value = settings.subMode;
		$<HTMLInputElement>('cap').value = String(settings.cap);
		renderState();
	}
	function renderState() {
		const r = regState(settings), s = subState(settings);
		const reg = r.open ? `🟢 التسجيل مفتوح${r.until ? ` حتى ${fmtWhen(r.until)} (بعد ${left(r.until)})` : ' (يدوياً، بلا موعد)'}` : r.soon ? `🟡 التسجيل يُفتح ${fmtWhen(r.soon)}` : '🔴 التسجيل مغلق';
		const sub = s.open ? `🟢 التسليم مفتوح${s.until ? ` حتى ${fmtWhen(s.until)} (بعد ${left(s.until)})` : ' (يدوياً، بلا موعد)'}` : '🔴 التسليم مغلق';
		$('state').innerHTML = `${reg}<br>${sub}`;
	}

	function render() {
		const counts = cp.opts.map((a) => {
			const n = groups.filter((g) => g.opt === a).length;
			return `<div class="wl-out"><span>${cp.optName[a]}</span><strong>${n} / ${settings.cap}</strong></div>`;
		});
		const students = groups.reduce((s, g) => s + g.size, 0);
		const done = groups.filter((g) => subs.has(g.gid)).length;
		$('counts').innerHTML = `<div class="wl-out"><span>مجموعات</span><strong>${groups.length}</strong></div><div class="wl-out"><span>طلاب</span><strong>${students}</strong></div><div class="wl-out"><span>سلّمت</span><strong>${done} / ${groups.length}</strong></div>` + counts.join('');
		const qtxt = $<HTMLInputElement>('q').value.trim().toLowerCase();
		const fa = $<HTMLSelectElement>('opt').value;
		const fs = $<HTMLSelectElement>('sub').value;
		const rows = groups
			.filter((g) => !fa || g.opt === fa)
			.filter((g) => !fs || (fs === 'yes') === subs.has(g.gid))
			.filter((g) => !qtxt || g.gid.toLowerCase().includes(qtxt) || g.members.some((m) => m.n.toLowerCase().includes(qtxt) || m.s.includes(qtxt)));
		$('table').innerHTML = `<thead><tr><th>الرمز</th><th>${cp.optWord}</th><th>الأعضاء</th><th>السري</th><th>التسجيل</th><th>التسليم</th><th>علامة التسليم</th><th></th></tr></thead><tbody>` +
			rows.map((g) => {
				const s = subs.get(g.gid);
				const mk = linkMark(s?.kind);
				return `<tr><td class="num"><b>${g.gid}</b></td><td>${cp.optName[g.opt] ?? esc(g.opt)}</td>
					<td class="pa-mem">${g.members.map((m) => `${esc(m.n)} <span class="num">(${esc(m.s)})</span>`).join('<br>')}</td>
					<td class="num">${g.pin}</td><td class="num">${fmt(g.at)}</td>
					<td class="pa-link" title="${s ? esc(s.url) : ''}">${s ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">${s.kind === 'github' ? 'GitHub ↗' : 'رابط ↗'}</a><br><span class="num">${fmt(s.at)}</span>` : '—'}</td>
					<td class="num ${mk === 2 ? 'hi' : mk ? '' : 'lo'}">${mk} / 2</td>
					<td class="pa-act"><button type="button" class="wl-btn" data-pa-exp="${g.gid}" title="البيانات والنتائج الصحيحة">🔍</button> <button type="button" class="wl-btn rs-del" data-pa-del="${g.gid}" title="حذف المجموعة">🗑</button></td></tr>`;
			}).join('') + '</tbody>';
		if (!rows.length) $('table').innerHTML += `<tbody><tr><td colspan="8">${groups.length ? 'لا نتائج للفلترة.' : 'لا توجد مجموعات بعد.'}</td></tr></tbody>`;
	}

	const expHtml = (g: Group) => `<div class="pa-exp-box">${course === 'os1' ? os1Expected(g.gid, g.opt, cp.optName) : rtsExpected(g.gid, g.opt)}</div>`;

	async function load() {
		say('جارٍ تحميل المشروع...');
		try {
			const [st, gs, ss] = await Promise.all([getDoc(doc(db, ...P)), getDocs(collection(db, ...P, 'groups')), getDocs(collection(db, ...P, 'subs'))]);
			if (st.exists()) {
				const x = st.data();
				const mode = (v: unknown): Mode => (v === 'open' || v === 'auto' ? v : 'closed');
				settings = { regFrom: toDate(x.regFrom), regTo: toDate(x.regTo), subTo: toDate(x.subTo), regMode: mode(x.regMode), subMode: mode(x.subMode), cap: typeof x.cap === 'number' ? x.cap : DEFAULT_CAP };
			} else settings = CLOSED;
			groups = gs.docs.map((d) => {
				const x = d.data();
				const members = [1, 2, 3].map((i) => ({ n: String(x['n' + i] ?? ''), s: String(x['s' + i] ?? '') })).filter((m) => m.s);
				return { gid: d.id, opt: String(x.opt), slot: x.slot, size: x.size, members, pin: String(x.pin ?? ''), at: toDate(x.at) };
			}).sort((a, b) => (a.at?.getTime() ?? 0) - (b.at?.getTime() ?? 0));
			subs = new Map(ss.docs.map((d) => [d.id, { url: String(d.data().url), kind: String(d.data().kind), at: toDate(d.data().at) }]));
			loaded = true;
			fillSettings();
			render();
			say(st.exists() ? `✓ ${groups.length} مجموعة.` : 'لم تُحفظ الإعدادات بعد: التسجيل والتسليم مغلقان.', st.exists() ? 'wl-good' : '');
		} catch (e) {
			console.error(e);
			say('تعذّر تحميل المشروع. هل نشرت قواعد Firestore الجديدة (قسم المشاريع)؟', 'wl-bad');
		}
	}

	async function save() {
		const regFrom = fromInput($<HTMLInputElement>('regFrom').value), regTo = fromInput($<HTMLInputElement>('regTo').value), subTo = fromInput($<HTMLInputElement>('subTo').value);
		const regMode = $<HTMLSelectElement>('regMode').value as Mode, subMode = $<HTMLSelectElement>('subMode').value as Mode;
		const cap = Math.round(Number($<HTMLInputElement>('cap').value));
		if (!(cap >= 1 && cap <= 100)) return say(`عدد المجموعات لكل خيار بين 1 و 100.`, 'wl-bad');
		if (regMode === 'auto' && (!regFrom || !regTo)) return say('الوضع التلقائي للتسجيل يحتاج موعد الفتح وموعد الإغلاق.', 'wl-bad');
		if (regFrom && regTo && regFrom >= regTo) return say('موعد إغلاق التسجيل يجب أن يكون بعد موعد فتحه.', 'wl-bad');
		if (subMode === 'auto' && !subTo) return say('الوضع التلقائي للتسليم يحتاج موعد الإغلاق.', 'wl-bad');
		const ts = (d: Date | null) => (d ? Timestamp.fromDate(d) : null);
		try {
			await setDoc(doc(db, ...P), { regFrom: ts(regFrom), regTo: ts(regTo), subTo: ts(subTo), regMode, subMode, cap });
			settings = { regFrom, regTo, subTo, regMode, subMode, cap };
			renderState();
			render();
			say('✓ حُفظت الإعدادات، وتظهر للطلاب فوراً.', 'wl-good');
		} catch (e) {
			console.error(e);
			say('تعذّر الحفظ. هل نشرت قواعد Firestore الجديدة؟', 'wl-bad');
		}
	}

	async function del(g: Group) {
		if (!confirm(`حذف المجموعة ${g.gid} (${g.members.map((m) => m.n).join('، ')})؟\nيُحذف تسجيلها وتسليمها، ويصبح أعضاؤها قادرين على التسجيل من جديد. لا يمكن التراجع.`)) return;
		try {
			const b = writeBatch(db);
			b.delete(doc(db, ...P, 'groups', g.gid));
			for (const m of g.members) b.delete(doc(db, ...P, 'sids', m.s));
			b.delete(doc(db, ...P, 'slots', `${g.opt}_${g.slot}`));
			b.delete(doc(db, ...P, 'subs', g.gid));
			await b.commit();
			groups = groups.filter((x) => x.gid !== g.gid);
			subs.delete(g.gid);
			render();
			say(`✓ حُذفت المجموعة ${g.gid}.`, 'wl-good');
		} catch (e) {
			console.error(e);
			say('تعذّر الحذف.', 'wl-bad');
		}
	}

	function csv() {
		const q = (s: string | number) => `"${String(s).replace(/"/g, '""')}"`;
		const lines: (string | number)[][] = [['الطالب', 'الرقم الجامعي', 'رمز المجموعة', cp.optWord, 'وقت التسجيل', 'رابط التسليم', 'وقت التسليم', 'علامة التسليم (من 2)']];
		for (const g of groups) {
			const s = subs.get(g.gid);
			for (const m of g.members) lines.push([m.n, m.s, g.gid, cp.optName[g.opt] ?? g.opt, fmt(g.at), s?.url ?? '', fmt(s?.at ?? null), linkMark(s?.kind)]);
		}
		const blob = new Blob(['﻿' + lines.map((l) => l.map(q).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
		const a = document.createElement('a');
		a.href = URL.createObjectURL(blob);
		a.download = `${course}-project-${new Date().toISOString().slice(0, 10)}.csv`;
		a.click();
		URL.revokeObjectURL(a.href);
	}

	$('save').addEventListener('click', save);
	$('reload').addEventListener('click', load);
	$('csv').addEventListener('click', csv);
	for (const k of ['q', 'opt', 'sub']) $(k).addEventListener(k === 'q' ? 'input' : 'change', render);
	root.addEventListener('click', (ev) => {
		const t = ev.target as HTMLElement;
		const d = t.closest<HTMLButtonElement>('[data-pa-del]');
		if (d) { const g = groups.find((x) => x.gid === d.dataset.paDel); if (g) del(g); return; }
		const e = t.closest<HTMLButtonElement>('[data-pa-exp]');
		const box = $('detail');
		if (e) {
			const g = groups.find((x) => x.gid === e.dataset.paExp)!;
			box.innerHTML = `<div class="wl-row"><b>المجموعة ${g.gid}: ${cp.optName[g.opt] ?? esc(g.opt)}</b> <span class="se-note">${g.members.map((m) => esc(m.n)).join('، ')}</span><button type="button" class="wl-btn" data-pa-close>✕ إغلاق</button></div>${expHtml(g)}`;
			box.hidden = false;
			box.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
		if (t.closest('[data-pa-close]')) box.hidden = true;
	});
	setInterval(() => loaded && renderState(), 60000);
	return { load: () => (loaded ? Promise.resolve() : load()) };
}
