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
			description: 'المحتوى العملي لمواد الشبكات اللاسلكية والذكاء الصنعي 2 ونظم التشغيل 1 – جامعة قرطبة',
			defaultLocale: 'root',
			locales: {
				root: { label: 'العربية', lang: 'ar', dir: 'rtl' },
			},
			logo: { src: './src/assets/brand/cordoba-emblem.png', alt: 'جامعة قرطبة الخاصة', replacesTitle: false },
			favicon: '/favicon.png',
			customCss: ['katex/dist/katex.min.css', './src/styles/custom.css'],
			head: [
				{ tag: 'link', attrs: { rel: 'apple-touch-icon', href: withBase('apple-touch-icon.png') } },
				{ tag: 'meta', attrs: { name: 'theme-color', content: '#006738' } },
				{ tag: 'meta', attrs: { property: 'og:image', content: ogImage } },
				{ tag: 'meta', attrs: { name: 'twitter:image', content: ogImage } },
				{ tag: 'link', attrs: { rel: 'preconnect', href: 'https://fonts.googleapis.com' } },
				{ tag: 'link', attrs: { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' } },
				{
					tag: 'link',
					attrs: {
						rel: 'stylesheet',
						href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;700&display=swap',
					},
				},
			],
			components: {
				Banner: './src/components/Banner.astro',
				SocialIcons: './src/components/PanelToggles.astro',
			},
			lastUpdated: true,
			pagination: true,
			tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 3 },
			sidebar: [
				{ label: 'الإعلانات', slug: 'announcements' },
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
			],
		}),
	],
});
