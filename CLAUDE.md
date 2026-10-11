# المختبر العملي – جامعة قرطبة

موقع لعرض المحتوى العملي لثلاث مواد بيدرّسها صاحب المشروع (مدرّس عملي بجامعة قرطبة):
**الذكاء الصنعي 2**، **الشبكات اللاسلكية**، **نظم التشغيل 1**. الطلاب بيفتحوه غالباً من الموبايل.
التواصل مع المستخدم بالعربي (لهجة شامية).

## التقنية

- Astro 7 + Starlight 0.42، موقع ثابت بدون قاعدة بيانات وبدون تسجيل دخول.
- عربي فقط، RTL (`locales.root = ar, dir rtl`)، خط IBM Plex Sans Arabic.
- المعادلات: `remark-math` + `rehype-katex` (ولازمهم `@astrojs/markdown-remark` لأن Astro 7 صار يستخدم Sätteri افتراضياً).
- البحث Pagefind (مدمج)، والوضع الليلي مدمج.
- النشر: GitHub Pages عن طريق `.github/workflows/deploy.yml`. الـ `site` والـ `base` بيجوا من متغيرات البيئة `SITE` و `BASE_PATH` (بيعبّيهم `actions/configure-pages`). محلياً الـ base هو `/`.

## البنية

```
src/content/docs/
  index.mdx            الرئيسية (splash): بطاقات المواد + آخر 3 إعلانات
  announcements.mdx    صفحة كل الإعلانات
  ai2/  wireless/  os1/
    index.mdx          خطة المادة (sidebar.order: 0) + جدول الجلسات (متاحة/قريباً)
    lab-NN-name.mdx    جلسة (sidebar.order: NN)
src/data/announcements.ts   مصدر الإعلانات (الأحدث أولاً). أول عنصر بيظهر بالشريط
src/components/Banner.astro override لشريط الإعلانات، بينسكر وبينحفظ بـ localStorage
src/styles/custom.css       الألوان، و .lab-meta، و details.answer، والكود/المعادلات LTR
public/files/<course>/      ملفات التحميل (.m، .c ...)
```

## قالب الجلسة (التزم فيه بكل جلسة جديدة)

1. شريط `<div class="lab-meta">`: المدة، المستوى، الأدوات، الملفات.
2. أهداف الجلسة، المتطلبات، ملخص نظري.
3. خطوات العملي (`<Steps>`، `<Tabs>`، `<Aside>`، `<FileTree>`).
4. النتيجة المتوقعة، أخطاء شائعة (جدول)، الوظيفة.
5. أسئلة المراجعة: `<details class="answer">`.

الروابط نسبية: من صفحة جلسة لملف تحميل `../../files/ai2/x.m`، ومن صفحة جلسة لجلسة تانية `../lab-02-.../`.

## حالة المحتوى (آخر تحديث 2026-10-11)

- **ذكاء 2** (الأولوية). توجيه الدكتور: «العملي لازم يركز على الماتلاب، والسيميولنك، وشلون ممكن نصمم fuzzy controller». ما في محتوى أكتر من هيك، والخطة الحالية مبنية عليه.
  - الخطة (8 جلسات، **كلهن مكتوبين كاملين**): 1 أساسيات MATLAB، 2 Simulink + PID، 3 أساسيات المنطق العائم (مثال المروحة)، 4 Fuzzy-PD + Simulink، 5 ضبط المتحكم (Ke/Kd/Ku، 3 مقابل 5 دوال انتماء)، 6 Sugeno + Fuzzy-PID (تكامل مشروط |e|<0.3)، 7 خزان مياه غير خطي (PI مقابل Fuzzy تزايدي)، 8 مشروع (محرك DC، سيارة، تدفئة غرفة) + معايير 15 علامة + نموذج امتحان عملي 10. ANFIS انشال عن قصد، وصار إضافة اختيارية بالمشروع.
  - النظام المستخدم بالجلسات 4–6: `G(s) = 1/(s(0.5s+1))`. معاملات الأساس `Ke=1, Kd=0.3, Ku=4`.
  - **كل الأرقام بالجلسات 3–8 محسوبة بمحاكاة JS بتقلّد `evalfis`** (Mamdani: min/max/centroid بـ 101 نقطة؛ Sugeno: prod/wtaver)، ومحاكاة أويلر بنفس الكود المكتوب بالجلسات، **بس ما انجربت على MATLAB حقيقي**. أهم النتائج: الجلسة 4 تجاوز 0.84% و Ts 2.1 s؛ الجلسة 5 التحدي (OS<2%، Ts<1.3 s، |u|≤5) بيتحقق بـ fis5 (1، 0.3، 6) أو fis3 (1.5، 0.4، 7)؛ الجلسة 6 Sugeno بهالإعداد = PD خطي بالضبط `u = 0.5(e+de)`؛ الجلسة 7 PI بدون Anti-windup تجاوز 39%، و PI بنفس المعاملات المكافئة مع Anti-windup قريب من Fuzzy (مذكورة بأمانة بالصفحة).
  - مواصفات مشاريع الجلسة 8 تحققت إنها ممكنة بـ PID بسيط مع Anti-windup.
- **شبكات لاسلكية:** خطة + جلسة 1 (WPA2 بـ Packet Tracer).
- **نظم تشغيل 1:** خطة + جلسة 1 (fork/exec/wait بـ C).
- توزيع العلامات بخطة ذكاء 2 مجرد مثال.

## Git والنشر

- المستودع: https://github.com/hamid-kano/cordoba-labs (الفرع `main`). الموقع منشور على https://hamid-kano.github.io/cordoba-labs/ وكل push على `main` بيعيد النشر لحاله.
- ما في `gh` على الجهاز، فإعدادات GitHub بيعملها المستخدم من المتصفح.
- لازم يكون **Settings ← Pages ← Source = GitHub Actions** مفعّل، وإلا `configure-pages` بيفشل بخطأ `Get Pages site failed ... Not Found`.

## التطوير

- شغّل السيرفر بالخلفية: `npx astro dev --background` (http://localhost:4321)، وللإيقاف `npx astro dev stop`، وللحالة `npx astro dev status`، وللسجلات `npx astro dev logs`.
- البناء: `npm run build`. لتجرب base فرعي من Git Bash: `MSYS_NO_PATHCONV=1 BASE_PATH=/cordoba-labs npm run build` (بدون `MSYS_NO_PATHCONV` بيخرب Git Bash المسار).
- بـ Bash على هالجهاز، heredoc طويل فيه عربي ممكن يفشل، فاستخدم أداة Write للملفات.
- هالملف (`CLAUDE.md`) هو المرجع الوحيد للمشروع، وهو ملف عادي مو symlink لأن الـ symlinks ما بتشتغل على Windows هون (`core.symlinks=false`). لازم يضل بـ git بالـ mode `100644` (تأكد بـ `git ls-files -s CLAUDE.md`)، لأنه إذا رجع `120000` بيفشل `checkout` بالـ CI.

## التوثيق

- Astro: https://docs.astro.build ([المحتوى](https://docs.astro.build/en/guides/content-collections/)، [المكوّنات](https://docs.astro.build/en/basics/astro-components/)، [اللغات](https://docs.astro.build/en/guides/internationalization/))
- Starlight: https://starlight.astro.build
