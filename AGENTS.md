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

- **ذكاء 2** (الأولوية؛ العملي بيركز على MATLAB و Simulink وتصميم Fuzzy Controller):
  - الجلسات 1 (أساسيات MATLAB)، و2 (Simulink + PID)، و3 (Fuzzy-PD Mamdani) مكتوبين كاملين.
  - النظام المستخدم بكل الجلسات: `G(s) = 1/(s(0.5s+1))`.
  - معاملات الـ Fuzzy بالجلسة 3: `Ke=1, Kd=0.3, Ku=4`. تحققت منها بمحاكاة مكافئة بـ JS (تجاوز أقل من 1%، وزمن استقرار حوالي 2 ثانية)، بس **ما انجربت على MATLAB حقيقي**.
  - الجلسات 4 لـ 8 عناوين مقترحة («قريباً»).
  - المستخدم عنده محتوى المادة الحقيقي وممكن يبعته، ووقتها لازم نعدّل خطة الجلسات لتطابقه.
- **شبكات لاسلكية:** خطة + جلسة 1 (WPA2 بـ Packet Tracer).
- **نظم تشغيل 1:** خطة + جلسة 1 (fork/exec/wait بـ C).
- توزيع العلامات بخطة ذكاء 2 مجرد مثال.

## Git والنشر

- المستودع المحلي فيه commit أول على فرع `main`. **لسا ما انرفع على GitHub**: ما في `gh` ولا حساب مربوط على الجهاز.
- لما يرفعه المستخدم: `git remote add origin https://github.com/USERNAME/cordoba-labs.git` بعدين `git push -u origin main`، وبعدها **Settings ← Pages ← Source = GitHub Actions**.

## التطوير

- شغّل السيرفر بالخلفية: `npx astro dev --background` (http://localhost:4321)، وللإيقاف `npx astro dev stop`، وللحالة `npx astro dev status`، وللسجلات `npx astro dev logs`.
- البناء: `npm run build`. لتجرب base فرعي من Git Bash: `MSYS_NO_PATHCONV=1 BASE_PATH=/cordoba-labs npm run build` (بدون `MSYS_NO_PATHCONV` بيخرب Git Bash المسار).
- بـ Bash على هالجهاز، heredoc طويل فيه عربي ممكن يفشل، فاستخدم أداة Write للملفات.
- `CLAUDE.md` رابط (symlink) لهالملف، فعدّل `AGENTS.md` مباشرة.

## التوثيق

- Astro: https://docs.astro.build ([المحتوى](https://docs.astro.build/en/guides/content-collections/)، [المكوّنات](https://docs.astro.build/en/basics/astro-components/)، [اللغات](https://docs.astro.build/en/guides/internationalization/))
- Starlight: https://starlight.astro.build
