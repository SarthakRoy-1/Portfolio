import type { Metadata } from 'next';

export const siteConfig = {
  name: 'Sarthak Roy — AI / ML Engineer',
  shortName: 'Sarthak Roy',
  title: 'Sarthak Roy — AI / ML Engineer | Computer Vision, GenAI & Robotics',
  description:
    'Production portfolio of Sarthak Roy — AI / ML Engineer specializing in Computer Vision, Generative AI, Deep Learning, Robotics Sensor Fusion, and Machine Learning Systems.',
  url: 'https://sarthakroy40.dev',
  author: 'Sarthak Roy',
  links: {
    github: 'https://github.com/SarthakRoy-1',
    linkedin: 'https://www.linkedin.com/in/sarthakroy40',
    email: 'sarthakroy40@gmail.com',
  },
};

export function constructMetadata({
  title = siteConfig.title,
  description = siteConfig.description,
  image = '/og-image.png',
  canonical,
  noIndex = false,
}: {
  title?: string;
  description?: string;
  image?: string;
  canonical?: string;
  noIndex?: boolean;
} = {}): Metadata {
  return {
    title,
    description,
    authors: [{ name: siteConfig.author }],
    creator: siteConfig.author,
    metadataBase: new URL(siteConfig.url),
    alternates: {
      canonical: canonical || siteConfig.url,
    },
    icons: {
      icon: '/Profile SVG.png',
      apple: '/Profile SVG.png',
    },
    openGraph: {
      title,
      description,
      url: canonical || siteConfig.url,
      siteName: siteConfig.name,
      locale: 'en_US',
      type: 'website',
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
      creator: '@sarthakroy40',
    },
    robots: {
      index: !noIndex,
      follow: !noIndex,
    },
  };
}
