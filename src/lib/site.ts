import site from '../data/site.json';
import products from '../data/products.json';
export { site, products };
export const languages = ['en', 'my'] as const;
export type Language = typeof languages[number];
export type Product = typeof products[number];
export type Faq = { question: string; answer: string };
export type Crumb = { name: string; path: string };
export const origin = 'https://mingalaredu.com';
export const known = (value: unknown) => value !== 'TODO' && value !== 'Contact us' && value !== '' && value != null;
export const display = (value: string | number) => value === 'TODO' ? 'Contact us' : String(value);
export const productPath = (lang: string, product: Product) => `/${lang}/study-in-${product.country}/${product.slug}/`;
export const metadata = (subject: string, lang: string, suffix = 'Study abroad advice') => {
  const tail = ` | Mingalar Edu · ${lang === 'my' ? 'MY' : 'EN'}`;
  const heading = subject.length + tail.length < 50 ? `${subject}: ${suffix}` : subject;
  const title = `${heading.slice(0, 60 - tail.length).trimEnd()}${tail}`;
  const locale = lang === 'my' ? 'Myanmar' : 'English';
  const intro = `${locale} guide: ${subject.toLowerCase().slice(0, 32)}.`;
  const description = `${intro} Explore programmes and application support with Mingalar Edu. Contact our team to check current costs and plan your study journey.`;
  return { title, description: description.length < 150 ? `${description} Ask us.` : description.slice(0, 159).trimEnd() + '.' };
};
export function schemas(path: string, crumbs: Crumb[], faq: Faq[] = [], article?: { question: string; answer: string; data_asof: string; reviewer: string }) {
  const graph: Record<string, unknown>[] = [{
    '@type': 'Organization', '@id': `${origin}/#org`, name: site.brand,
    url: origin, telephone: site.phone, email: site.email,
    contactPoint: { '@type': 'ContactPoint', telephone: site.phone, contactType: 'student counselling' },
  }, {
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({ '@type': 'ListItem', position: index + 1, name: crumb.name, item: `${origin}${crumb.path}` })),
  }];
  if (faq.length) graph.push({ '@type': 'FAQPage', mainEntity: faq.map((item) => ({ '@type': 'Question', name: item.question, acceptedAnswer: { '@type': 'Answer', text: item.answer } })) });
  if (article) graph.push({ '@type': 'Article', headline: article.question, description: article.answer, dateModified: article.data_asof, author: { '@type': 'Person', name: article.reviewer }, publisher: { '@id': `${origin}/#org` }, mainEntityOfPage: `${origin}${path}` });
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
}
