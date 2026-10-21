// سؤال اختيار من متعدد. النص ممكن يحتوي `كود` بين backticks (بيتحوّل لـ <code>).
// a = رقم الخيار الصحيح (من 0)، why = شرح قصير بيطلع بعد التسليم.
export interface QuizQ {
	q: string;
	options: string[];
	a: number;
	why: string;
}

/** مفاتيح كل مادة: s1..s8 لأسئلة الجلسات (5 لكل جلسة)، و exam لاختبار المادة (15 سؤال) */
export type CourseQuizzes = Record<string, QuizQ[]>;
