// سؤال اختيار من متعدد. النص ممكن يحتوي `كود` بين backticks (بيتحوّل لـ <code>).
// a = رقم الخيار الصحيح (من 0)، why = شرح قصير بيطلع بعد التسليم (باختبار الجلسة بس).
// time = ثواني السؤال (الافتراضي 45). أسئلة الأدوات (يلي جوابها من محاكي الجلسة) بتاخد 90.
export interface QuizQ {
	q: string;
	options: string[];
	a: number;
	why: string;
	time?: number;
}

/** مفاتيح كل مادة: s1..s8 بنك أسئلة الجلسة (10، والاختبار بيسحب 5 عشوائياً)، و exam لاختبار المادة (15) */
export type CourseQuizzes = Record<string, QuizQ[]>;
