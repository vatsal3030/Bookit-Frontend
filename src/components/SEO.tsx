import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
}

export default function SEO({ 
  title = "Bookit", 
  description = "Find and book local service providers near you instantly. Bookit connects you with top-rated professionals for healthcare, beauty, home services, and more.", 
  keywords = "booking, service providers, appointments, local services, Bookit, professionals" 
}: SEOProps) {
  const fullTitle = title === 'Bookit' ? 'Bookit' : `${title} - Bookit`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
    </Helmet>
  );
}
