import { Helmet } from "react-helmet";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  type?: 'website' | 'article' | 'profile';
  structuredData?: object;
  route?: string;
}

export const SEO = ({ 
  title = "Clip", 
  description = "Share your gaming moments",
  image = "/og-image.png",
  type = "website",
  structuredData,
  route
}: SEOProps) => {
  const baseUrl = window.location.origin;
  const currentUrl = route ? `${baseUrl}${route}` : window.location.href;

  // Default structured data for the organization
  const defaultStructuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Clip",
    "url": baseUrl,
    "logo": `${baseUrl}/og-image.png`,
    "description": "Share your gaming moments"
  };

  // Merge with any additional structured data
  const finalStructuredData = structuredData || defaultStructuredData;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={currentUrl} />

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={`${baseUrl}${image}`} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={currentUrl} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${baseUrl}${image}`} />

      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(finalStructuredData)}
      </script>
    </Helmet>
  );
};