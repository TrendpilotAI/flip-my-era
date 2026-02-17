import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  url?: string;
  image?: string;
  type?: string;
}

const DEFAULTS = {
  title: 'FlipMyEra — AI-Powered Personalized Storybooks',
  description:
    'Create stunning AI-generated personalized storybooks set in any era. Your story, your era, beautifully illustrated.',
  url: 'https://flipmyera.com',
  image: 'https://flipmyera.com/og-image.png',
};

export function SEO({ title, description, url, image, type = 'website' }: SEOProps) {
  const t = title ? `${title} | FlipMyEra` : DEFAULTS.title;
  const d = description || DEFAULTS.description;
  const u = url ? `${DEFAULTS.url}${url}` : DEFAULTS.url;
  const img = image || DEFAULTS.image;

  return (
    <Helmet>
      <title>{t}</title>
      <meta name="description" content={d} />
      <link rel="canonical" href={u} />
      <meta property="og:title" content={t} />
      <meta property="og:description" content={d} />
      <meta property="og:url" content={u} />
      <meta property="og:image" content={img} />
      <meta property="og:type" content={type} />
      <meta name="twitter:title" content={t} />
      <meta name="twitter:description" content={d} />
      <meta name="twitter:image" content={img} />
    </Helmet>
  );
}
