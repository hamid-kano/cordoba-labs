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
6. بآخر الصفحة `<details>` (بدون class) بعنوان «للمدرّس: كيف تدير الجلسة» (توزيع الوقت وشو يركّز عليه). بيطلع بصندوق منقّط.

**أسلوب ذكاء 2 (طلب المستخدم):** المدرّس والطلاب مستواهن مو عالي، فالشرح لازم يكون **مبسّط جداً**: مربع «الفكرة ببساطة» بأول الصفحة بمثال من الحياة، رياضيات بالحد الأدنى، خطوات قصيرة، وبعد كل خطوة «شو لازم تشوف». الكود المعقد بيتخبّى بالملفين المساعدين `simFuzzy.m` و `buildFuzzyPD.m` (بـ `public/files/ai2/`).

**ما تنشر حلول المشاريع أو الامتحانات بالموقع**: الموقع والمستودع مفتوحين للطلاب. الحلول بتنعطى للمستخدم بالمحادثة بس.

الروابط نسبية: من صفحة جلسة لملف تحميل `../../files/ai2/x.m`، ومن صفحة جلسة لجلسة تانية `../lab-02-.../`.

## حالة المحتوى (آخر تحديث 2026-10-11)

- **ذكاء 2** (الأولوية). توجيه الدكتور: «العملي لازم يركز على الماتلاب، والسيميولنك، وشلون ممكن نصمم fuzzy controller». ما في محتوى أكتر من هيك، والخطة الحالية مبنية عليه.
  - الخطة (8 جلسات، **كلهن مكتوبين كاملين بالأسلوب المبسّط**) + صفحة `glossary.mdx` (قاموس مصطلحات): 1 أول خطوة بـ MATLAB، 2 Simulink + PID (مثال الكاسة والسيارة)، 3 المنطق العائم (مروحة بمدخل واحد، والرطوبة زيادة)، 4 أول متحكم عائم (9 قواعد + `simFuzzy` + Simulink)، 5 ضبط الأزرار Ke/Kd/Ku (3 مقابل 5 مجموعات)، 6 Sugeno + التكامل ضد الاضطراب، 7 خزان مياه (PI مقابل Fuzzy تزايدي، سكربت جاهز، Simulink اختياري)، 8 مشروع (ذراع روبوت `1/(s(s+1))`، سرعة محرك `1/((s+1)(0.2s+1))`، فرن `1/(10s+1)` بحدود [0 5]) + علامات 15 + امتحان 10.
  - `simFuzzy(fis, Ke, Kd, Ku, ...)`: محاكاة أويلر صريحة على `ss(Plant)` بـ dt = 0.01، وخيارات `'Plant'`، `'Time'`، `'Reference'`، `'Ki'`، `'Disturbance'` (عند `'DistTime'` = 5)، `'Limits'`، و`'Band'` (التكامل بيشتغل لما |Ke·e| < 0.5؛ 0.3 كان بيعلّق مشروع المحرك عند خطأ 0.31).
  - النظام بالجلسات 4–6: `G(s) = 1/(s(0.5s+1))`، والأساس `Ke=1, Kd=0.3, Ku=4`.
  - **كل الأرقام محسوبة بمحاكاة JS بتقلّد `evalfis` و `simFuzzy`، وما انجربت على MATLAB حقيقي.** أهمها: الجلسة 3 المروحة 24° ← 62.9% (و[24 45] ← 63.8%)؛ الجلسة 4 تجاوز 0.9% و Ts 2.1 s؛ الجلسة 5 التحدي (OS<2%، Ts<1.5 s) بـ Ku=8؛ الجلسة 6 بدون تكامل بيستقر عند 1.21، ومع Ki=1 بيرجع لـ 1 بتجاوز 10.6%، وبـ Simulink بتكامل عادي Ki=0.5 تجاوز ≈ 20%؛ الجلسة 7 PI تجاوز 39%، و Fuzzy 0.2%.
  - حلول المشاريع محفوظة بالذاكرة المحلية لـ Claude (مش بالمستودع).
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
