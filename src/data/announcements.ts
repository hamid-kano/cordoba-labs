// أضف الإعلان الجديد في أول القائمة. أول إعلان بيظهر بالشريط أعلى كل الصفحات.
export interface Announcement {
	date: string; // YYYY-MM-DD
	course?: 'ai2' | 'wireless' | 'os1';
	title: string;
	body?: string;
	link?: string; // رابط داخلي بدون / بالبداية، مثل: ai2/lab-03-fuzzy-basics
}

export const announcements: Announcement[] = [
	{
		date: '2026-10-11',
		course: 'ai2',
		title: 'اكتملت جلسات الذكاء الصنعي 2 الثمانية',
		body: 'صارت كل الجلسات متاحة، ومنها تفاصيل المشروع العملي ومعايير تقييمه بالجلسة 8.',
		link: 'ai2/lab-08-project',
	},
	{
		date: '2026-10-11',
		course: 'ai2',
		title: 'تحديث خطة الذكاء الصنعي 2: جلسة جديدة لأساسيات المنطق العائم',
		body: 'صارت الجلسة 3 لأساسيات المنطق العائم، وجلسة تصميم المتحكم Fuzzy-PD صارت الجلسة 4.',
		link: 'ai2/lab-03-fuzzy-basics',
	},
	{
		date: '2026-10-11',
		course: 'ai2',
		title: 'نُشرت جلسة تصميم المتحكم العائم (Fuzzy Controller)',
		body: 'يرجى تجهيز MATLAB مع Fuzzy Logic Toolbox و Simulink قبل الجلسة.',
		link: 'ai2/lab-04-fuzzy-pd-controller',
	},
	{
		date: '2026-10-08',
		title: 'بداية الجلسات العملية للفصل الأول',
		body: 'تبدأ الجلسات العملية للمواد الثلاث في الأسبوع القادم حسب البرنامج المعتمد.',
	},
];

export const courseNames = {
	ai2: 'الذكاء الصنعي 2',
	wireless: 'الشبكات اللاسلكية',
	os1: 'نظم التشغيل 1',
} as const;
