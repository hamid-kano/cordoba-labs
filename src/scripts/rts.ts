// محرك مادة الزمن الحقيقي: حسابات بسيطة بدون DOM، فبتنجرب بـ node file.mts مباشرة.

// ===== الجلسة 1: إحصاءات قياسات زمنية (رد الفعل، ومؤقّت المتصفح) =====
export interface TimeStats {
	n: number;
	mean: number;
	min: number;
	max: number;
	jitter: number; // الفرق بين أكبر وأصغر قيمة
}

export function timeStats(xs: number[]): TimeStats {
	const n = xs.length;
	if (!n) return { n: 0, mean: NaN, min: NaN, max: NaN, jitter: NaN };
	const min = Math.min(...xs);
	const max = Math.max(...xs);
	const mean = xs.reduce((a, b) => a + b, 0) / n;
	return { n, mean, min, max, jitter: max - min };
}

// كم قيمة تجاوزت المهلة
export const missed = (xs: number[], deadline: number) => xs.filter((x) => x > deadline).length;

// العدد مع المعدود بالعربي: (1، 'مرة واحدة') (2، 'مرتين') (3–10، '3 مرات') (11+، '11 مرة')
export function countAr(n: number, one: string, two: string, few: string, many: string) {
	if (n === 1) return one;
	if (n === 2) return two;
	return `${n} ${n <= 10 ? few : many}`;
}

// نوع النظام لكل مثال بمسابقة الجلسة 1
export type RtKind = 'hard' | 'firm' | 'soft';
export const RT_KIND_NAME: Record<RtKind, string> = { hard: 'صارم', firm: 'ثابت', soft: 'مرن' };
