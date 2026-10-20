# المختبر العملي – جامعة قرطبة

موقع لعرض المحتوى العملي لأربع مواد بيدرّسها صاحب المشروع (ومعها قسم «المراجع» لمواد تانية) (مدرّس عملي بجامعة قرطبة):
**الذكاء الصنعي 2**، **الشبكات اللاسلكية**، **نظم التشغيل 1**، **نظم الزمن الحقيقي**. الطلاب بيفتحوه غالباً من الموبايل.
التواصل مع المستخدم بالعربي (لهجة شامية). **بس محتوى الموقع كله بالفصحى المبسّطة** (شوف «لغة المحتوى» تحت).

## التقنية

- Astro 7 + Starlight 0.42، موقع ثابت بدون قاعدة بيانات وبدون تسجيل دخول.
- عربي فقط، RTL (`locales.root = ar, dir rtl`)، خط IBM Plex Sans Arabic **محلي** من `@fontsource/ibm-plex-sans-arabic` (بـ `customCss`، مش Google Fonts)، لحتى الموقع يشتغل كله بدون إنترنت. ما تضيف أي ملف من CDN.
- المعادلات: `remark-math` + `rehype-katex` (ولازمهم `@astrojs/markdown-remark` لأن Astro 7 صار يستخدم Sätteri افتراضياً).
- البحث Pagefind (مدمج)، والوضع الليلي مدمج. نصوص البحث العربية بـ `src/content/i18n/ar.json` (ناقصة بترجمة Starlight)، و Pagefind بيستخدم left/right ثابتين فقلبناهن للـ RTL بآخر `custom.css` (وإلا العدسة بتطلع على زر «إلغاء» بالموبايل).
- **إحصائيات الزيارات: Umami Cloud** (اللوحة على cloud.umami.is، المستخدم ما حب شكل GoatCounter). بدون سكربتهم الخارجي: سطر JS بـ `head` بـ `astro.config.mjs` بيبعت نفس طلبهم (`POST https://gateway.umami.is/api/send` مع `x-umami-website-id`)، بس على الدومين المنشور (مش localhost ولا XAMPP)، وبدون أسماء ولا كوكيز. الـ ID بـ `const umamiId` (مش سر). استثناء جهاز: `localStorage.umami.disabled = 1`. **بيانات الطلاب (اسم ورقم جامعي) لسا مش مطلوبة**: المستخدم بدها بس وقت يحط اختبارات، بخانتين بسيطتين (بدون تسجيل دخول)، والأرجح مع Firebase بقواعد «إضافة بس» (مفاتيح Firebase عادي تكون عامة، والحماية بالـ Security Rules).
- النشر: GitHub Pages عن طريق `.github/workflows/deploy.yml`. الـ `site` والـ `base` بيجوا من متغيرات البيئة `SITE` و `BASE_PATH` (بيعبّيهم `actions/configure-pages`). محلياً الـ base هو `/`.

## البنية

```
src/content/docs/
  index.mdx            الرئيسية (splash): بطاقات المواد (ما في إعلانات ولا شريط تنبيه: المستخدم طلب شيلهن، 2026-10-13)
  ai2/  wireless/  os1/  rts/
    index.mdx          خطة المادة (sidebar.order: 0) + جدول الجلسات (متاحة/قريباً)
    lab-NN-name.mdx    جلسة (sidebar.order: NN)
src/components/PanelToggles.astro override لـ SocialIcons: 3 أزرار بالهيدر (كمبيوتر بس): إخفاء القائمة الجانبية، و«على هذه الصفحة»، و«وضع العرض» لشاشة الإسقاط
                            (data-present: بدون هيدر ولا قوائم، محتوى 68rem وخط 112.5%، بيضل بنفس التبويب بـ sessionStorage، والخروج بـ Esc أو زر بالزاوية).
                            ولما القائمتين مخفيتين المحتوى بيتوسّع لـ 62rem.
                            (بيحطوا data-hide-nav / data-hide-toc على <html>، والـ CSS بآخر custom.css، والحالة بـ localStorage)
src/styles/custom.css       الألوان، و .lab-meta، و details.answer، والكود/المعادلات LTR
public/files/<course>/      ملفات التحميل (.m، .c ...)
src/assets/brand/           هوية جامعة قرطبة الخاصة (شوف تحت)
public/favicon.png, apple-touch-icon.png, og-image.png   أيقونات وصورة المعاينة، مولّدين من اللوغو
```

### الهوية البصرية

- الألوان من اللوغو: أخضر غامق `#006738`، أخضر `#009344`، وأسود الكتابة `#232020` (متغيرات `--cpu-*` بـ `custom.css`). الـ accent بالوضع النهاري هو الأخضر الغامق، وبالليلي `#2fb36b` لحتى يبيّن.
- `src/assets/brand/`:
  - `cordoba-logo-horizontal-original.png`: الأصلي يلي بعته المستخدم (شفاف). منه انعمل كل شي.
  - `cordoba-logo-horizontal(-dark).png`: مقصوص الحواف، ونسخة `-dark` الكتابة فيها بيضا (انعملت بتبديل البكسلات الرمادية، `saturation<0.3`، لأبيض).
  - `cordoba-logo-hero(-dark).png`: نفسه بمربع شفاف 1000×1000، لأن Starlight بيقص صورة الـ hero لمربع 400×400.
  - `cordoba-emblem.png`: الرمز لحاله (بدون كتابة) لهيدر الموقع والـ favicon.
  - `cordoba-logo-cpu-square.jpg`: أيقونة الشاشة الرئيسية للموبايل (`apple-touch-icon.png`).
  - `cordoba-seal.jpg`: الختم الدائري بأسفل الصفحة الرئيسية.
- أدوات الصور على الجهاز: ImageMagick (`magick`) و sharp. ما في Python. للتأكد بصرياً: `msedge --headless=new --screenshot` على السيرفر المحلي.

## قالب الجلسة (التزم فيه بكل جلسة جديدة)

1. شريط `<div class="lab-meta">`: المدة، المستوى، الأدوات، الملفات.
2. أهداف الجلسة، المتطلبات، ملخص نظري.
3. خطوات العملي (`<Steps>`، `<Tabs>`، `<Aside>`، `<FileTree>`).
4. النتيجة المتوقعة، أخطاء شائعة (جدول)، الوظيفة.
5. أسئلة المراجعة: `<details class="answer">`.
6. **ما في صندوق «خطة الجلسة»** بآخر الصفحة (المستخدم طلب ينشال من كل الجلسات بكل المواد، 2026-10-12). ما تضيفه بأي جلسة جديدة.
7. **إثراء نظري (بكل المواد):** بطاقة `<Concept term="..." en="...">` بالملخص النظري **أول مرة** بيمر فيها مفهوم كبير بالمادة (مرة وحدة بس بالمادة): شو هو بمثال من الحياة، و«ليش منستخدمه؟»، و«وين بينستخدم؟». والمصطلحات الصغيرة بالنص والجداول والخطوات بـ `<Term t="..." en="..." def="..." />` (بتنكبس وبيطلع تعريفها). الـ `def` جملة أو تنتين مبسّطين، بدون `"` (استخدم «») وبدون `|`. ما تحط `<Concept>` جوّا `<Steps>`، وسيب سطر فاضي بعد `</Concept>`. **وكل اختصار** (CISC، RAID، SSID، PID...) أو كلمة إنكليزية مش مشروحة، بيصير `<Term>` **بأول مرة بيمر فيها بكل صفحة** (حتى لو بمربع «الفكرة ببساطة»)، والـ `en` هو الاسم الكامل، والـ `def` معناه ببساطة. ما بيصير بالعناوين، ولا بنص الروابط، ولا جوّا الكود أو المعادلات أو `<summary>`. المكوّنات بـ `src/components/Concept.astro` و `Term.astro`.

**لغة المحتوى (طلب المستخدم، 2026-10-13):** كل نص بيوصل للطالب (الصفحات، وتعريفات `<Term>`، ونصوص الأدوات والرسومات) **بالعربية الفصحى المبسّطة**، مش باللهجة الشامية: جمل قصيرة وكلمات مألوفة («ماذا يجب أن ترى؟»، «اضغط»، «الهاتف»، «الحاسوب»، «في المتصفح»، «نحو»، «لا يوجد»)، بدون «شو، ليش، هيك، هلق، يلي، كتير، مش، بـ+فعل». أسماء الأزرار المذكورة بالصفحة لازم تطابق نصها بالمكوّن. التعليقات بالكود عادي تضل شامية. والحديث مع المستخدم بالمحادثة يضل شامي.

**أسلوب ذكاء 2 (طلب المستخدم):** المدرّس والطلاب مستواهن مو عالي، فالشرح لازم يكون **مبسّط جداً**: مربع «الفكرة ببساطة» بأول الصفحة بمثال من الحياة، رياضيات بالحد الأدنى، خطوات قصيرة، وبعد كل خطوة «ماذا يجب أن ترى؟». الكود المعقد بيتخبّى بالملفين المساعدين `simFuzzy.m` و `buildFuzzyPD.m` (بـ `public/files/ai2/`).

**إنكليزي جوّا نص عربي:** الكود والمعادلات بالسطر منعزلين تلقائياً (`unicode-bidi: isolate` بـ `custom.css`)، والتعليقات العربية جوّا الكود كمان (`plaintext`). فاكتب الكود عادي بين backticks. بس تجنّب كلمات إنكليزية بين قوسين بـ **العناوين** (`title` والعناوين `##`)، لأنها لما تنقسم على سطرين بتطلع الأقواس محيّرة. حطها بالنص تحت العنوان.

**الرسومات:** ممنوع رسومات بالحروف (ASCII بـ `─ │ ►` جوّا ```text)، لأنها بتخرب مع العربي. كل رسمة مكوّن SVG بـ `figure.wl-fig` وأصناف `d-*` (ذكاء 2: `LoopDiagram`، `FuzzyPdDiagram`، `SimulinkFuzzyDiagram`، `IntegralDiagram`، `TankDiagram` بـ `src/components/ai2/`). الرسمة العريضة (بلوكات Simulink) بتاخد `wl-wide` مع `<div class="wl-scroll">` فبتنسحب عالموبايل، والرسمة العادية بتاخد `class="d-big"` على الـ svg لكتابة أكبر. الأسهم `markerUnits="userSpaceOnUse"`.

**المصطلح:** «المنطق الضبابي» و«المتحكم الضبابي» (Fuzzy)، لأنه المصطلح المستخدم بالعملي. ما تستخدم «عائم».

**ما تنشر حلول المشاريع أو الامتحانات بالموقع**: الموقع والمستودع مفتوحين للطلاب. الحلول بتنعطى للمستخدم بالمحادثة بس. (استثناء وافق عليه المستخدم: محاكي المشاريع بالجلسة 8 مسموح، والطالب بيوصل للأزرار بالتجريب، بس الأرقام الصحيحة ما بتنكتب بالصفحة.)

الروابط نسبية: من صفحة جلسة لملف تحميل `../../files/ai2/x.m`، ومن صفحة جلسة لجلسة تانية `../lab-02-.../`.

## حالة المحتوى (آخر تحديث 2026-10-11)

- **ذكاء 2** (الأولوية). توجيه الدكتور: «العملي لازم يركز على الماتلاب، والسيميولنك، وشلون ممكن نصمم fuzzy controller». ما في محتوى أكتر من هيك، والخطة الحالية مبنية عليه.
  - الخطة (8 جلسات، **كلهن مكتوبين كاملين بالأسلوب المبسّط**) + صفحة `pid-fuzzy.mdx` (شرح رموز PID والضبابي بمثال السيارة، وانتباه إنه `Kd` بالضبابي غير `Kd` تبع PID، وكيف منضبط كل واحد (يدوي و Ziegler–Nichols مع ملاحظة إنها ما بتنطبق على نظامنا)، ومثالين سخان مي مقابل روبوت متتبع خط، والدمج كمشرف ضبابي فوق PID مع تنبيه إنه «Fuzzy-PID» إلها معنيين وغير يلي بالجلسة 6، والأردوينو كجسد والمتحكم كعقل مع كود PID مبسّط. رسومات: `FuzzySupervisorDiagram` و `ArduinoLoopDiagram`) + صفحة `keywords.mdx` («بطاقة الكلمات»: حوالي 60 بلوك وأمر ورمز لازم ينحفظوا، بتنطبع) + صفحة `glossary.mdx` (قاموس مصطلحات). مصدر الكلمات واحد: `src/data/ai2-words.ts` (`s` = أول جلسة بتمر فيها، والكود بين backticks)، ومنه `WordTable` للبطاقة و `<SessionWords s={N} />` (مربع «كلمات هالجلسة» قبل الملخص النظري بالجلسات 1–7). أي كلمة جديدة بجلسة بتنضاف لهالملف: 1 أول خطوة بـ MATLAB، 2 Simulink + PID (مثال الكاسة والسيارة)، 3 المنطق الضبابي (مروحة بمدخل واحد، والرطوبة زيادة)، 4 أول متحكم ضبابي (9 قواعد + `simFuzzy` + Simulink)، 5 ضبط الأزرار Ke/Kd/Ku (3 مقابل 5 مجموعات)، 6 Sugeno + التكامل ضد الاضطراب، 7 خزان مياه (PI مقابل Fuzzy تزايدي، سكربت جاهز، Simulink اختياري)، 8 مشروع (ذراع روبوت `1/(s(s+1))`، سرعة محرك `1/((s+1)(0.2s+1))`، فرن `1/(10s+1)` بحدود [0 5]) + نموذج امتحان عملي (10). جدول «توزيع العلامات (15)» انشال بطلب المستخدم (2026-10-20).
  - `simFuzzy(fis, Ke, Kd, Ku, ...)`: محاكاة أويلر صريحة على `ss(Plant)` بـ dt = 0.01، وخيارات `'Plant'`، `'Time'`، `'Reference'`، `'Ki'`، `'Disturbance'` (عند `'DistTime'` = 5)، `'Limits'`، و`'Band'` (التكامل بيشتغل لما |Ke·e| < 0.5؛ 0.3 كان بيعلّق مشروع المحرك عند خطأ 0.31).
  - النظام بالجلسات 4–6: `G(s) = 1/(s(0.5s+1))`، والأساس `Ke=1, Kd=0.3, Ku=4`.
  - **كل الأرقام محسوبة بمحاكاة JS بتقلّد `evalfis` و `simFuzzy`، وما انجربت على MATLAB حقيقي.** أهمها: الجلسة 3 المروحة 24° ← 62.9% (و[24 45] ← 63.8%)؛ الجلسة 4 تجاوز 0.9% و Ts 2.1 s؛ الجلسة 5 التحدي (OS<2%، Ts<1.5 s) بـ Ku=8؛ الجلسة 6 بدون تكامل بيستقر عند 1.21، ومع Ki=1 بيرجع لـ 1 بتجاوز 10.6%، وبـ Simulink بتكامل عادي Ki=0.5 تجاوز ≈ 20%؛ الجلسة 7 PI تجاوز 39%، و Fuzzy 0.2%.
  - حلول المشاريع محفوظة بالذاكرة المحلية لـ Claude (مش بالمستودع).
  - **محاكيات بالمتصفح** (خيار تاني جنب MATLAB، قسم `## جرّب في المتصفح` قبل «خطوات العملي» بالجلسات 2–8): المحرك `src/scripts/control.ts` (نسخة TS من `evalfis` و `buildFuzzyPD` و `simFuzzy` و `step` لـ PID وخزان الجلسة 7، و `pidTerms` لأجزاء معادلة PID بكل لحظة: بالجلسة 2 مؤشر «اختر لحظة t» بيحسب `u = P·e + I·∫e + D·de/dt` بالأرقام ورسمة تانية للأجزاء. المثال المحلول بالصفحة: التجربة د عند t = 0.5 → 0.580 + 0.129 − 1.132 = −0.423، والقيم بتتقرّب لـ 3 خانات قبل الضرب لحتى يطابق الجمع) والرسم `src/scripts/chart.ts` (SVG، أصناف `ai-c1..5`، `ai-ref`، `ai-ghost`). المكوّنات بـ `src/components/ai2/`: `PidLab` (2)، `FanLab` (3)، `FuzzyLab mode="s4|s5|s6|proj"` (4، 5، 6، 8)، `TankLab` (7). أي رقم جديد بالصفحات لازم يطابق المحرك (بيشتغل بـ `node file.mts` مباشرة).
- **شبكات لاسلكية:** نفس الأسلوب المبسّط جداً. **بدون Packet Tracer** (طلب المستخدم): كل التطبيق محاكيات وحاسبات تفاعلية جوّا الصفحات (مكوّنات Astro بـ `src/components/wireless/` مع `<script>` عادي، بدون مكتبات)، وتجارب حقيقية على أجهزة الطلاب (قياس dBm للواي فاي، `ipconfig`، `ping`، `netsh wlan`). وكل صفحة مدعومة برسومات SVG مضمّنة بتتبع الوضع الليلي/النهاري بمتغيرات Starlight.
  - مصدر المحتوى: محاضرات Part 1 و Part 2، والعملي «القسم الأول» (بخط اليد) و«القسم الثاني» (مسائل محلولة). الملفات بالمحادثة بس، والمكان المقترح لحفظها `_sources/wireless/` (مستثنى من git).
  - الخطة 8 جلسات: 1 أساسيات الشبكات، 2 OSI و TCP/IP، 3 عناوين IP، 4 الديسيبل و SNR، 5 فقد المسار، 6 أول شبكة واي فاي، 7 تشارك الهوا (CSMA/CA، القنوات، FDMA/TDMA/CDMA، الطيف المنثور)، 8 Ad-hoc و DSR/DSDV. توزيع كل مسائل الملفات على الجلسات مكتوب بـ `wireless/index.mdx`.
  - **كل الجلسات الثمانية مكتوبة**، وكل وحدة فيها أداة تفاعلية ورسومات ومسائل الملفات وتجربة حقيقية:
    1 `lab-01-network-basics` (HubSwitchSim، NetSizesDiagram، NetArchDiagram)، 2 `lab-02-osi-model` (EncapsulationSim، SegmentCalc، OsiDiagram، TcpUdpDiagram)، 3 `lab-03-ip-addressing` (SubnetCalc، IpClassDiagram)، 4 `lab-04-decibel` (DbLab tool=convert/chain/snr، CommSystemDiagram، LinkBudgetChart)، 5 `lab-05-path-loss` (PathLossLab، LinkDiagram، LinkBudgetChart؛ القانون `L = 20log f + 10 n log d − 147.56`)، 6 `lab-06-wifi-network` (WifiJoinSim، JoinSeqDiagram، FrameDiagram، WlanModesDiagram)، 7 `lab-07-sharing-air` (CsmaSim، ChannelPlanner، SpreadLab tool=dsss/cdma، AccessDiagram، RtsCtsDiagram)، 8 `lab-08-adhoc-routing` (DsrSim و DsdvSim بنفس أمثلة المحاضرة بالضبط، MultiHopDiagram).
  - **CSS مشترك** بـ `custom.css`: الأدوات `class="not-content wl-box"` (`not-content` بيمنع تنسيقات Starlight)، وأزرار `wl-btn`، ومخرجات `wl-out`، وجداول `wl-table`. والرسومات `figure.wl-fig` مع أصناف `d-*`.
  - **اتجاه نص الرسومات:** `.wl-fig svg text` اتجاهه RTL افتراضياً. أي نص إنكليزي أو أرقام بوحدات (متل `+Gt` و `2 B`) لازم ياخد الصنف المشترك `d-ltr` (الستايل الداخلي للمكوّن ما بيغلب القاعدة العامة). وبالـ RTL، `text-anchor: end` = الطرف اليساري. والأرقام جوّا جمل عربية بالـ JS بتنلف بـ `<bdi dir="ltr">`.
  - **الفحص:** `playwright-core` مع Edge الموجود على الجهاز (`executablePath`) على `astro preview`، بيكبس الأدوات وبياخد صور شاشة بالوضعين وبيفحص أخطاء الكونسول والفيضان العرضي على الموبايل. السكربت بيتكتب بالـ scratchpad (مش بالمستودع).
  - جلسة Packet Tracer القديمة (`lab-01-wlan-setup`) انحذفت.
  - أخطاء بملفات المادة (صحّحها بالجلسات بهدوء): القانون بخط اليد ‎(2πdf/c)² والصح ‎(4πdf/c)²؛ «IP Version 5» والصح IPv6؛ Class D للـ Multicast مش «عسكرية»؛ 127 للـ loopback؛ MAC فيه `5t`؛ OSI من ISO مش IEEE؛ RTP بدل RIP؛ Probe Response مش Probe Request.
  - **لا تحط معادلات KaTeX فيها كلمات عربية** (بتعطي تحذير unknownSymbol)، اكتب الكلام العربي برّا المعادلة.
- **نظم تشغيل 1:** المنهج النظري هو **الفصول 12 لـ 19** (يبدو كتاب Deitel، صورة جدول الأسابيع من المستخدم): الأقراص، و RAID، والملفات، والنسخ، وقواعد البيانات، وتصميم المعالج، والمعالجات المتعددة، والشبكات والأنظمة الموزعة وخدمات الويب، والأمن. ما فيه عمليات ولا جدولة معالج (جلسة `fork` القديمة انحذفت). نفس الأسلوب المبسّط، و**كل الجلسات من المتصفح** (المستخدم طلب 8 جلسات بأمثلة وتمارين بسيطة).
  - الجلسات (2026-10-12، بعد ما المستخدم قال إنه جدولة القرص و RAID ما بيلزموا): 1 `lab-01-command-line` (مش من المنهج بس مهارة عملية. **ويندوز أولاً** بطلب المستخدم: `WinTerminalSim` طرفية cmd وهمية بمجموعتين مهمات بتتصحّح لحالها (الملفات 9، والنظام والشبكة 9: tasklist و `| find` و taskkill و ipconfig و ping و systeminfo و `%USERNAME%` و attrib و xcopy، وكمان find و fc و set)، ومش حساسة لحالة الأحرف متل ويندوز، وبتدل على البديل إذا كتب الطالب أمر لينكس. و `TerminalSim` (لينكس) بتبويب «Linux (اختياري)»)، 2 `lab-02-file-systems` (FileAlloc على 24 كتلة)، 3 `lab-03-backup-recovery` (BackupLab، HashLab)، 4 `lab-04-databases` (SqlLab، RelationalDiagram)، 5 `lab-05-processor-design` (CpuLab tool=time/pipe)، 6 `lab-06-multiprocessors` (MultiLab tool=balance/race، UmaNumaDiagram)، 7 `lab-07-distributed-web` (NetLab tool=url/request، ClientServerDiagram)، 8 `lab-08-security` (NetLab tool=caesar/password، HashLab، PhishQuiz).
  - **أرشيف:** `src/content/docs/os1-archive/` (`disk-scheduling` و `raid`، مع DiskSched و DiskDiagram و RaidLab): طلعوا من الخطة بس المستخدم طلب **أرشفة مش حذف**، لأنهن من المنهج (الأسبوع 1 و 2). بيظهروا بمجموعة «أرشيف للمراجعة» مسكّرة تحت نظم التشغيل بالقائمة (بـ `astro.config.mjs`)، وبأولهن ملاحظة «جلسة مؤرشفة».
  - المكوّنات بـ `src/components/os1/`، والحسابات بـ `src/scripts/os1.ts` (جدولة القرص، و RAID، والنسخ، والأداء، والموازنة)، وبتنجرب بـ `node file.mts`. أرقام الصفحات كلها من هالمحرك: مثال 1 (طلبات Silberschatz، الرأس 53، لتحت) FCFS 640، SSTF 236، SCAN 236، LOOK 208؛ مثال 2 (الرأس 50، لفوق) 642، 208، 332، C-SCAN 391 مع القفزة، LOOK 314، C-LOOK 341.
  - **SqlLab** بيستخدم `sql.js` (مثبّت `1.11.0`)، وملف `public/files/os1/sql-wasm.wasm` منسوخ من `node_modules/sql.js/dist` (إذا تحدّثت المكتبة لازم ينسخ من جديد). و NetLab بيطلب `public/files/os1/students.json` من نفس الموقع.
  - التجارب الحقيقية على ويندوز (Task Manager، و PowerShell `Get-PhysicalDisk` و `Get-FileHash` و `Get-CimInstance Win32_Processor`، و `tree`).
- **نظم الزمن الحقيقي** (`rts/`، مادة رابعة انضافت 2026-10-15): نفس الأسلوب المبسّط، و**كل الجلسات من المتصفح**. ما في منهج من الدكتور لهلق، فالخطة هي المنهج المعتاد للمادة (المستخدم وافق عليها):
  **كل الجلسات التمانية مكتوبة** (2026-10-16):
  1 `lab-01-what-is-realtime` (المهلة، وزمن الاستجابة، والتذبذب، وصارم/ثابت/مرن. `ReactionLab`، `TimerLab` بيقيس دقة `setInterval`، `KindsQuiz`، `ResponseDiagram`، `TimeValueDiagram`، وتجربة `ping -n 20`)، 2 `lab-02-tasks` (C و T و D، و WCET، و U، والدورة الكبرى. `TaskLab` بيرسم كل مهمة لحالها وبيعلّم التعارض على المعالج، `TaskParamsDiagram`، و Task Manager)، 3 `lab-03-cyclic-executive` (الجدولة الدورية، وشروط الإطار التلاتة. `FrameLab` فاحص f، و `CyclicBuilder` لعبة بناء الجدول للمكيّف (4 مهام، f = 4)، و `CyclicTableDiagram`)، 4 `lab-04-rate-monotonic` (RM والمقاطعة وحد Liu & Layland. `SchedLab mode="rm"` مع خيار «حسب ترتيب الجدول»، و `UtilZonesDiagram`)، 5 `lab-05-edf` (`SchedLab mode="compare"` RM جنب EDF، ومثال الحمل الزائد يلي فيه EDF بيخسّر التوازن)، 6 `lab-06-priority-inversion` (القفل، و Mars Pathfinder، والوراثة والسقف. `InversionLab` بطول M بيتغيّر، و `InversionDiagram`)، 7 `lab-07-freertos` (أربع تجارب Wokwi بملفات `public/files/rts/` (`diagram.json` و `lab07-*.ino`)، و `DelayLab` لـ `vTaskDelay` مقابل `vTaskDelayUntil`، و `TaskStatesDiagram`)، 8 `lab-08-project` (تلات مشاريع A و B و C، و `lab08-template.ino` بيقيس worst و misses، و `ProjectChecklist` قائمة تسليم بـ localStorage). **حلول المشاريع بالذاكرة المحلية لـ Claude بس، مش بالصفحة.**
  - المكوّنات بـ `src/components/rts/`، والحسابات بـ `src/scripts/rts.ts` (`hyperStats`، `frameCheck`/`cyclicSolve`، `simulate` لـ rm/order/edf بيوقّف النسخة يلي بتفوت مهلتها، `simulateLocks` لـ none/inherit/ceiling، `delayStarts`)، وبتنجرب بـ `node file.mts`. أي رقم بالصفحات لازم يطابقه. والخط الزمني المشترك `src/scripts/timeline.ts` (`drawTimeline`، أصناف `rts-*` بآخر `custom.css`).
  - الأولوية بمحاكي الجلسة 4: 1 هي الأعلى، وبـ FreeRTOS الرقم الأكبر هو الأعلى (مكتوب تنبيه بالجلسة 7).
  - الستايلات يلي بتنطبق على HTML بينضاف بالـ JS لازم تكون `<style is:global>` (الـ scoped ما بتوصله).
- **المراجع** (`refs/`، انضافت 2026-10-20): مواد **ما بيدرّسها** المستخدم، صفحات مرجعية مش جلسات. المستخدم بدها **تفاعلية وأفكار خارج الصندوق** لتمثيل المفهوم (توقّع ثم تأكّد، خطوة خطوة، حاول تخرّبه، قصة بتختار طريقها، رتّب واسحب، قبل وبعد، تحدّي بنقاط...). مجموعة «المراجع» مسكّرة بآخر القائمة (بـ `astro.config.mjs`، مادة = مجموعة فرعية بـ `autogenerate` على `refs/<مادة>`)، وبطاقة بقسم «المراجع» بالرئيسية.
  - **قالب الصفحة المرجعية** (أبسط من الجلسة: بلا lab-meta ولا وظيفة ولا خطوات عملي): «الفكرة ببساطة»، و«ماذا ستتعلم؟»، والشرح مع Concept/Term والأدوات التفاعلية، و«الخلاصة»، و«أسئلة المراجعة»، و«للاستزادة» (كتب وروابط رسمية، **ما منرفع PDF لكتب منشورة**). صفحة `index.mdx` لكل مادة: Concept المادة وجدول المواضيع (متاح/قريباً).
  - **هندسة البرمجيات** (`refs/se/`): المنهج المعتاد (Sommerville و Pressman). **17 موضوع مكتوبين** (2026-10-20، بعد ما المستخدم اشتكى إنه السبعة الأولى مختصرة)، وكل واحد فيه أدوات تفاعلية (المكوّنات بـ `src/components/se/`، والحساب بـ `src/scripts/se.ts`، وبيتجرّب بـ `node file.mts`، وأي رقم بالصفحات لازم يطابقه). الترتيب (`sidebar.order` = الرقم): 1 `sdlc`، 2 `process-models` (V و `VModelLab`، تزايدي، حلزوني، نموذج أولي)، 3 `scrum` (`ScrumBoard` 7 بطاقات 28 نقطة، 10 أيام، طاقة 3 باليوم، WIP 2، مخطط الإنجاز بـ `idealBurn`)، 4 `requirements` (+ طرق الجمع، و SRS، وحالة استخدام «سحب نقود» بـ `OrderGame`، والتحقق)، 5 `uml`، 6 `uml-2` (`RelationsDiagram`، `ActivityLab` صراف بقرارين وحلقة، `StateMachineLab` حالات طلب والانتقال الممنوع بيترفض)، 7 `architecture`، 8 `design-patterns` (`MvcLab` مع «اكسر النمط»، `ObserverLab` مع مقارنة السؤال المتكرر 60 دقيقة، `SingletonLab`، المصنع، و SOLID بـ Tabs)، 9 `testing`، 10 `white-box-tdd` (`CoverageLab` على دالة الشحن: (150، عضو) ← أسطر 100% فروع 50% مسارات 25%، وبإضافة (50، غير عضو) ← 100/100/50، و4 اختبارات ← الكل؛ `TddLab` السنة الكبيسة 7 خطوات)، 11 `project-management`، 12 `estimation-risk` (`EstimateLab tool=cocomo|fp`: 32 ألف سطر عضوي 91.3 / 13.9 / 6.6، ومدمج 230.4؛ الصيدلية 57 نقطة × 50 سطر ≈ 2850 ← 3 KLOC = 7.6 و 5.4 شهر؛ `PokerLab`؛ `RiskMatrix`)، 13 `quality-maintenance`، 14 `quality-metrics` (ISO 25010، `ComplexityLab` 3/3/4، `ReviewGame` 5 مشاكل، `CmmiLadder`)، 15 `git` (`GitLab` طرفية بـ 12 مهمة ورسمة لقطات، والمحرك `src/scripts/gitsim.ts` بدون تعارضات)، 16 `devops` (`PipelineLab` والمثال من `deploy.yml` تبع الموقع)، 17 `ethics` (`EthicsStory` قصتين بتختار طريقها، وميثاق ACM/IEEE، والرخص، والتحيّز). الأصناف المشتركة `se-hint` و `se-note` و `wl-btn.right/.wrong` صاروا بآخر `custom.css`. التفاصيل القديمة للمواضيع الأصلية:
    1 `sdlc` (`PhaseOrder` لعبة ترتيب، `ProcessRace` توقّع أولاً ثم سباق شلال/رشيق: بدون تغيير 12 مقابل 13، تغيير بالأسبوع 3 تعادل 14، بالأسبوع 9: 18 مقابل 14، `ModelPicker`، `SdlcModelsDiagram`)، 2 `requirements` (`ReqChat` محادثة مع صاحب صيدلية بتطلع رسالة رسالة والطالب بيصنّف: وظيفي/غير وظيفي/ليس متطلباً، وبالآخر قائمة المتطلبات؛ و `ChoiceQuiz` للغامض←القابل للقياس وللتناقض)، 3 `uml` (`UseCaseDiagram`، `NounVerbLab` بيكبس الكلمات صنف/صفة/عملية وبتطلع رسمة الأصناف، `SequenceStepper` رسائل تسجيل الدخول خطوة خطوة)، 4 `architecture` (`CouplingLab` لغز تبديل 9 وظائف بين 3 وحدات (3 بكل وحدة): البداية ترابط 11، والأفضل 2 بحل وحيد، و `LayersDiagram`، وأين يوضع الكود)، 5 `testing` (`BugHunt` دالة علامة فيها خطأين (الحد 60 وفوق 100) مع عدّاد تغطية، وبينفتح الكود بعد ما يلاقيهن؛ `TestPyramid`)، 6 `project-management` (`CpmLab` Gantt بـ −/+ والمسار الحرج: 13 أسبوع، و D بتوصل لـ 6 بلا تأخير (سماحية 2) وبـ 7 بيصير 14؛ `BrooksLab` شبكة الفريق ومنحني المدة: الأفضل 8 أشخاص 13.8، و 15 شخص 44.4)، 7 `quality-maintenance` (`DebtGame` 8 دورات سريع/نظيف/تنظيف: نظيف دايماً 80، سريع دايماً 35، سريع×2 ثم تنظيف ثم نظيف 73؛ أنواع الصيانة؛ و Tabs قبل/بعد إعادة الهيكلة).
    - `ChoiceQuiz` مكوّن عام (خيارات مشتركة أو لكل سؤال، والسبب بعد الجواب) لأي اختبار بالمراجع.
    - بالكود جوّا `<pre>` بقالب Astro: الأقواس `{}` بتنقرأ تعبير، فالكود بيتحط كنص بالـ frontmatter مع `set:html`. والنصوص جوّا الكود LTR تكون إنكليزي (العربي بيتلخبط).
- **ما في قسم «التقييم» ولا توزيع علامات بخطط المواد** (المستخدم طلب شيله، 2026-10-14). ما تضيفه بأي مادة.

## Git والنشر

- المستودع: https://github.com/hamid-kano/cordoba-labs (الفرع `main`). الموقع منشور على https://hamid-kano.github.io/cordoba-labs/ وكل push على `main` بيعيد النشر لحاله.
- ما في `gh` على الجهاز، فإعدادات GitHub بيعملها المستخدم من المتصفح.
- لازم يكون **Settings ← Pages ← Source = GitHub Actions** مفعّل، وإلا `configure-pages` بيفشل بخطأ `Get Pages site failed ... Not Found`.

## التطوير

- شغّل السيرفر بالخلفية: `npx astro dev --background` (http://localhost:4321)، وللإيقاف `npx astro dev stop`، وللحالة `npx astro dev status`، وللسجلات `npx astro dev logs`.
- البناء: `npm run build`. ولـ XAMPP (http://localhost/cordoba-labs/dist/): `npm run build:xampp` (بياخد `SITE` و `BASE_PATH` من `.env.xampp`). لتجرب base فرعي من Git Bash: `MSYS_NO_PATHCONV=1 BASE_PATH=/cordoba-labs npm run build` (بدون `MSYS_NO_PATHCONV` بيخرب Git Bash المسار).
- بـ Bash على هالجهاز، heredoc طويل فيه عربي ممكن يفشل، فاستخدم أداة Write للملفات.
- هالملف (`CLAUDE.md`) هو المرجع الوحيد للمشروع، وهو ملف عادي مو symlink لأن الـ symlinks ما بتشتغل على Windows هون (`core.symlinks=false`). لازم يضل بـ git بالـ mode `100644` (تأكد بـ `git ls-files -s CLAUDE.md`)، لأنه إذا رجع `120000` بيفشل `checkout` بالـ CI.

## التوثيق

- Astro: https://docs.astro.build ([المحتوى](https://docs.astro.build/en/guides/content-collections/)، [المكوّنات](https://docs.astro.build/en/basics/astro-components/)، [اللغات](https://docs.astro.build/en/guides/internationalization/))
- Starlight: https://starlight.astro.build
