// محاكي Git مبسّط للتدريب: ملفات بالذاكرة، و add/commit/branch/switch/merge/log/status.
// ما في تعارضات: الدمج بياخد نسخة الفرع التاني لأي ملف تغيّر فيه من وقت الانفصال.

export interface Commit { id: string; msg: string; parents: string[]; files: Record<string, string>; lane: number }
export interface GitState {
	init: boolean;
	work: Record<string, string>;
	staged: Record<string, string>; // نسخة الملفات بالـ index (بتبدأ من آخر commit)
	commits: Commit[];
	branches: Record<string, string | null>;
	branchLane: Record<string, number>;
	head: string;
	n: number;
}

export const newGit = (): GitState => ({ init: false, work: {}, staged: {}, commits: [], branches: {}, branchLane: {}, head: 'main', n: 0 });

const HEX = ['a3f', '7c2', 'e91', '4b8', 'd05', '96e', '1fa', 'c4d', '58b', 'b70', '2e6', 'f13'];
export const byId = (g: GitState, id: string | null) => g.commits.find((c) => c.id === id) ?? null;
const tipFiles = (g: GitState) => byId(g, g.branches[g.head] ?? null)?.files ?? {};

function ancestors(g: GitState, id: string | null): Set<string> {
	const out = new Set<string>();
	const st = id ? [id] : [];
	while (st.length) {
		const x = st.pop()!;
		if (out.has(x)) continue;
		out.add(x);
		byId(g, x)?.parents.forEach((p) => st.push(p));
	}
	return out;
}

export function status(g: GitState) {
	const tip = tipFiles(g);
	const staged: string[] = [], modified: string[] = [], untracked: string[] = [];
	for (const f of Object.keys({ ...g.work, ...g.staged }).sort()) {
		if (f in g.staged && g.staged[f] !== tip[f]) staged.push(f);
		if (!(f in g.staged)) untracked.push(f);
		else if (f in g.work && g.work[f] !== g.staged[f]) modified.push(f);
	}
	return { staged, modified, untracked };
}

/** بيقسم سطر الأمر لكلمات، مع احترام "..." */
export function split(line: string): string[] {
	const out: string[] = [];
	const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
	let m: RegExpExecArray | null;
	while ((m = re.exec(line))) out.push(m[1] ?? m[2] ?? m[3]);
	return out;
}

/** بينفّذ أمر وبيرجّع { out, err } (err بالعربي، والطرفية بتعرضه RTL) */
export function run(g: GitState, line: string): { out?: string; err?: string } {
	const raw = line.trim();
	if (!raw) return {};
	// echo "x" > f  أو  >> f
	const echo = raw.match(/^echo\s+("([^"]*)"|'([^']*)'|(\S+))\s*(>>?)\s*(\S+)$/);
	if (echo) {
		const text = echo[2] ?? echo[3] ?? echo[4];
		const f = echo[6];
		g.work[f] = echo[5] === '>>' && f in g.work ? g.work[f] + '\n' + text : text;
		return {};
	}
	const a = split(raw);
	const cmd = a[0];
	if (cmd === 'ls') return { out: Object.keys(g.work).sort().join('  ') };
	if (cmd === 'cat') {
		if (!a[1]) return { err: 'اكتب اسم الملف بعد cat.' };
		return a[1] in g.work ? { out: g.work[a[1]] } : { err: `لا يوجد ملف اسمه ${a[1]}.` };
	}
	if (cmd === 'echo') return { err: 'لإنشاء ملف اكتب مثلاً: echo "Hello" > readme.txt' };
	if (cmd !== 'git') return { err: `الأمر ${cmd} غير معروف هنا. اكتب help لترى الأوامر.` };
	const sub = a[1];
	if (sub === 'init') {
		if (g.init) return { out: 'Reinitialized existing Git repository' };
		g.init = true;
		g.branches = { main: null };
		g.branchLane = { main: 0 };
		return { out: 'Initialized empty Git repository in /project/.git/' };
	}
	if (!g.init) return { err: 'هذا المجلد ليس مستودع Git بعد. ابدأ بالأمر git init' };
	if (sub === 'status') {
		const s = status(g);
		const L = [`On branch ${g.head}`];
		if (s.staged.length) L.push('Changes to be committed:', ...s.staged.map((f) => `    \x01${f}`));
		if (s.modified.length) L.push('Changes not staged for commit:', ...s.modified.map((f) => `    \x02modified: ${f}`));
		if (s.untracked.length) L.push('Untracked files:', ...s.untracked.map((f) => `    \x02${f}`));
		if (!s.staged.length && !s.modified.length && !s.untracked.length) L.push('nothing to commit, working tree clean');
		return { out: L.join('\n') };
	}
	if (sub === 'add') {
		const f = a[2];
		if (!f) return { err: 'اكتب اسم الملف بعد git add، أو نقطة . لإضافة كل الملفات.' };
		const list = f === '.' ? Object.keys(g.work) : [f];
		for (const x of list) {
			if (!(x in g.work)) return { err: `لا يوجد ملف اسمه ${x}. اكتب ls لترى الملفات.` };
			g.staged[x] = g.work[x];
		}
		return {};
	}
	if (sub === 'commit') {
		const i = a.indexOf('-m');
		if (i < 0 || !a[i + 1]) return { err: 'كل لقطة تحتاج رسالة تصف التغيير: git commit -m "رسالة"' };
		if (!status(g).staged.length) return { err: 'لا يوجد شيء في منطقة التجهيز. استخدم git add أولاً.' };
		const parent = g.branches[g.head];
		const c: Commit = { id: HEX[g.n++ % HEX.length], msg: a[i + 1], parents: parent ? [parent] : [], files: { ...g.staged }, lane: g.branchLane[g.head] };
		g.commits.push(c);
		g.branches[g.head] = c.id;
		const added = Object.keys(c.files).filter((f) => c.files[f] !== byId(g, parent)?.files[f]).length;
		return { out: `[${g.head} ${c.id}] ${c.msg}\n ${added} file${added === 1 ? '' : 's'} changed` };
	}
	if (sub === 'log') {
		const seen = [...ancestors(g, g.branches[g.head] ?? null)];
		if (!seen.length) return { err: 'لا توجد لقطات بعد.' };
		const list = g.commits.filter((c) => seen.includes(c.id)).reverse();
		return {
			out: list.map((c) => {
				const tags = Object.entries(g.branches).filter(([, id]) => id === c.id).map(([b]) => (b === g.head ? `HEAD -> ${b}` : b));
				return `\x03${c.id}\x04${tags.length ? ` (${tags.join(', ')})` : ''} ${c.msg}`;
			}).join('\n'),
		};
	}
	if (sub === 'branch') {
		const b = a[2];
		if (!b) return { out: Object.keys(g.branches).map((x) => (x === g.head ? `* ${x}` : `  ${x}`)).join('\n') };
		if (b in g.branches) return { err: `الفرع ${b} موجود أصلاً.` };
		if (!g.branches[g.head]) return { err: 'أنشئ لقطة واحدة على الأقل قبل إنشاء فرع.' };
		g.branches[b] = g.branches[g.head];
		g.branchLane[b] = Math.max(...Object.values(g.branchLane)) + 1;
		return {};
	}
	if (sub === 'switch' || sub === 'checkout') {
		let b = a[2];
		if (b === '-c' || b === '-b') {
			b = a[3];
			const r = run(g, `git branch ${b ?? ''}`);
			if (r.err) return r;
		}
		if (!b) return { err: 'اكتب اسم الفرع.' };
		if (!(b in g.branches)) return { err: `لا يوجد فرع اسمه ${b}. أنشئه أولاً بالأمر git branch ${b}` };
		const s = status(g);
		if (s.staged.length || s.modified.length) return { err: 'لديك تغييرات لم تُحفظ في لقطة. نفّذ commit أولاً، حتى لا تضيع.' };
		g.head = b;
		const files = tipFiles(g);
		// الملفات غير المتتبعة بتضل، والمتتبعة بتصير متل الفرع
		for (const f of Object.keys(g.staged)) if (!(f in files)) delete g.work[f];
		g.staged = { ...files };
		Object.assign(g.work, files);
		return { out: `Switched to branch '${b}'` };
	}
	if (sub === 'merge') {
		const b = a[2];
		if (!b || !(b in g.branches)) return { err: `اكتب اسم فرع موجود: git merge ${b ?? 'feature'}` };
		if (b === g.head) return { err: 'لا يمكن دمج الفرع مع نفسه.' };
		const ours = g.branches[g.head]!, theirs = g.branches[b]!;
		const ancOurs = ancestors(g, ours), ancTheirs = ancestors(g, theirs);
		if (ancOurs.has(theirs)) return { out: 'Already up to date.' };
		if (ancTheirs.has(ours)) {
			g.branches[g.head] = theirs;
			const files = byId(g, theirs)!.files;
			g.staged = { ...files };
			Object.assign(g.work, files);
			return { out: `Updating ${ours}..${theirs}\nFast-forward` };
		}
		// أقرب أب مشترك
		const base = [...g.commits].reverse().find((c) => ancOurs.has(c.id) && ancTheirs.has(c.id))!;
		const T = byId(g, theirs)!.files, O = byId(g, ours)!.files;
		const files = { ...O };
		for (const f of Object.keys(T)) if (T[f] !== base.files[f]) files[f] = T[f];
		const c: Commit = { id: HEX[g.n++ % HEX.length], msg: `Merge branch '${b}'`, parents: [ours, theirs], files, lane: g.branchLane[g.head] };
		g.commits.push(c);
		g.branches[g.head] = c.id;
		g.staged = { ...files };
		Object.assign(g.work, files);
		return { out: `Merge made by the 'ort' strategy.\n[${g.head} ${c.id}] ${c.msg}` };
	}
	return { err: `الأمر git ${sub ?? ''} غير موجود في هذا المحاكي. اكتب help.` };
}
