// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// SITE و BASE_PATH بتنضبط تلقائياً من GitHub Actions حسب اسم المستودع
const site = process.env.SITE || 'http://localhost:4321';
const base = process.env.BASE_PATH || '/';
const withBase = (path) => `${base.replace(/\/$/, '')}/${path}`;
// صورة المعاينة لما ينبعت رابط الموقع على واتساب أو تلغرام (لازم رابط كامل)
const ogImage = new URL(withBase('og-image.png'), site).href;

// إحصائيات الزيارات (Umami Cloud، اللوحة على cloud.umami.is): بدون أسماء ولا كوكيز.
// بدل سكربتهم الخارجي، منبعت نفس الطلب يلي بيبعته (POST لـ /api/send) بسطر صغير، فالموقع بيضل يشتغل بلا إنترنت.
// الـ ID مش سر. وبيعدّ بس على الموقع المنشور (مش localhost ولا XAMPP)، وفاضي = مطفي.
// لتستثني جهازك من العدّ: افتح الموقع واكتب بالكونسول localStorage.setItem('umami.disabled', '1')
const umamiId = '29ab7711-9a08-4c63-a633-b86386fd36c7';
const countHost = new URL(site).hostname;
const counterScript = umamiId && {
	tag: 'script',
	content: `(function(){try{var h=location.hostname;if(h!==${JSON.stringify(countHost)}||navigator.webdriver)return;try{if(localStorage.getItem('umami.disabled'))return}catch(_){}var id=${JSON.stringify(umamiId)},r=document.referrer;if(r.indexOf(location.origin+'/')===0)r=r.slice(location.origin.length);var send=function(){fetch('https://gateway.umami.is/api/send',{method:'POST',keepalive:true,credentials:'omit',headers:{'Content-Type':'application/json','x-umami-website-id':id,'x-umami-hostname':h},body:JSON.stringify({type:'event',payload:{website:id,hostname:h,url:location.href,title:document.title,referrer:r,language:navigator.language,screen:screen.width+'x'+screen.height}})}).catch(function(){})};if(document.readyState==='loading')addEventListener('DOMContentLoaded',send);else send();}catch(_){}})();`,
};

export default defineConfig({
	// sql.js (محرر SQL بجلسة نظم التشغيل 5) مكتوبة بصيغة قديمة (CommonJS)، فمنخلّي Vite يجهّزها
	// من أول ما يشتغل السيرفر، وإلا أول فتحة للصفحة بتعلق بخطأ «Outdated Optimize Dep».
	vite: { optimizeDeps: { include: ['sql.js/dist/sql-wasm.js'] } },
	site,
	base,
	markdown: { remarkPlugins: [remarkMath], rehypePlugins: [rehypeKatex] },
	integrations: [
		starlight({
			title: 'المختبر العملي',
			description: 'المحتوى العملي لمواد الشبكات اللاسلكية والذكاء الصنعي 2 ونظم التشغيل 1 ونظم الزمن الحقيقي – جامعة قرطبة',
			defaultLocale: 'root',
			locales: {
				root: { label: 'العربية', lang: 'ar', dir: 'rtl' },
			},
			logo: { src: './src/assets/brand/cordoba-emblem.png', alt: 'جامعة قرطبة الخاصة', replacesTitle: false },
			favicon: '/favicon.png',
			// الخط محلي (fontsource) لحتى الموقع يشتغل بدون إنترنت
			customCss: [
				'@fontsource/ibm-plex-sans-arabic/400.css',
				'@fontsource/ibm-plex-sans-arabic/500.css',
				'@fontsource/ibm-plex-sans-arabic/700.css',
				'katex/dist/katex.min.css',
				'./src/styles/custom.css',
			],
			head: [
				{ tag: 'link', attrs: { rel: 'apple-touch-icon', href: withBase('apple-touch-icon.png') } },
				{ tag: 'meta', attrs: { name: 'theme-color', content: '#006738' } },
				{ tag: 'meta', attrs: { property: 'og:image', content: ogImage } },
				{ tag: 'meta', attrs: { name: 'twitter:image', content: ogImage } },
				...(counterScript ? [counterScript] : []),
			],
			components: {
				SocialIcons: './src/components/PanelToggles.astro',
			},
			lastUpdated: true,
			pagination: true,
			tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 3 },
			sidebar: [
				{
					label: 'الذكاء الصنعي 2',
					collapsed: false,
					items: [{ autogenerate: { directory: 'ai2' } }],
				},
				{
					label: 'الشبكات اللاسلكية',
					collapsed: true,
					items: [{ autogenerate: { directory: 'wireless' } }],
				},
				{
					label: 'نظم التشغيل 1',
					collapsed: true,
					items: [
						{ autogenerate: { directory: 'os1' } },
						// جلسات طلعت من الخطة، بس خليناها للمراجعة لأنها من منهج النظري
						{ label: 'أرشيف للمراجعة', collapsed: true, items: [{ autogenerate: { directory: 'os1-archive' } }] },
					],
				},
				{
					label: 'نظم الزمن الحقيقي',
					collapsed: true,
					items: [{ autogenerate: { directory: 'rts' } }],
				},
				// مراجع تفاعلية لمواد ما بيدرّسها المستخدم (مش جلسات): كل مادة بمجلد تحت refs/
				{
					label: 'المراجع',
					collapsed: true,
					items: [{ label: 'هندسة البرمجيات', collapsed: true, items: [{ autogenerate: { directory: 'refs/se' } }] }],
				},
			],
		}),
	],
});
