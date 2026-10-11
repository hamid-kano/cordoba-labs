# المختبر العملي – جامعة قرطبة

موقع المحتوى العملي لمواد: **الذكاء الصنعي 2**، **الشبكات اللاسلكية**، **نظم التشغيل 1**.
مبني بـ [Astro Starlight](https://starlight.astro.build)، وبينتشر تلقائياً على GitHub Pages.

## التشغيل على جهازك

```bash
npm install
npm run dev      # http://localhost:4321
```

## إضافة جلسة جديدة

1. انسخ ملف جلسة موجود، مثلاً `src/content/docs/ai2/lab-04-fuzzy-pd-controller.mdx`، وسمّيه
   `lab-05-tuning.mdx`.
2. عدّل `title` و `description` و `sidebar.order` بأول الملف، واكتب المحتوى.
3. حط الملفات اللي بدك ياها للتحميل بـ `public/files/ai2/`، واربطها هيك:
   `<a href="../../files/ai2/اسم_الملف.m" download>اسم_الملف.m</a>`
4. حدّث جدول الجلسات بـ `src/content/docs/ai2/index.mdx` (غيّر «قريباً» لـ «متاحة» وضيف الرابط).
5. اعمل `git push`، والموقع بيتحدث لحاله خلال دقيقتين تقريباً.

### قالب الجلسة

أهداف الجلسة ← المتطلبات ← ملخص نظري ← خطوات العملي ← النتيجة المتوقعة ← أخطاء شائعة ← الوظيفة ← أسئلة المراجعة.

## إضافة إعلان

عدّل `src/data/announcements.ts` وضيف الإعلان **بأول** القائمة. آخر إعلان بيظهر بالشريط أعلى كل الصفحات، وبصفحة الإعلانات، وبالصفحة الرئيسية.

## أدوات متاحة بالدروس

| الأداة | الاستخدام |
| --- | --- |
| `<Aside type="tip">` | ملاحظة أو تنبيه (`note`، `tip`، `caution`، `danger`) |
| `<Steps>` | خطوات مرقمة |
| `<Tabs>` / `<TabItem>` | تبويبات (مثلاً: بالكود / بالأداة الرسومية) |
| `<FileTree>` | شجرة ملفات |
| `<details class="answer">` | سؤال وجوابه مخفي |
| `$...$` و `$$...$$` | معادلات رياضية (KaTeX) |

## النشر على GitHub Pages (مرة وحدة)

1. أنشئ مستودع جديد على GitHub (مثلاً `cordoba-labs`).
2. ارفع المشروع:
   ```bash
   git init -b main
   git add .
   git commit -m "Initial site"
   git remote add origin https://github.com/USERNAME/cordoba-labs.git
   git push -u origin main
   ```
3. بالمستودع: **Settings ← Pages ← Source = GitHub Actions**.
4. الموقع رح يكون على: `https://USERNAME.github.io/cordoba-labs/`
