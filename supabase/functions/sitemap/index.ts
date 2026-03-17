const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>https://speakeasily.nexo-digital.app/</loc>
    <xhtml:link rel="alternate" hreflang="es" href="https://speakeasily.nexo-digital.app/" />
    <xhtml:link rel="alternate" hreflang="pt" href="https://speakeasily.nexo-digital.app/?lang=pt" />
    <xhtml:link rel="alternate" hreflang="en" href="https://speakeasily.nexo-digital.app/?lang=en" />
    <xhtml:link rel="alternate" hreflang="x-default" href="https://speakeasily.nexo-digital.app/" />
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  return new Response(sitemapXml, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
});
