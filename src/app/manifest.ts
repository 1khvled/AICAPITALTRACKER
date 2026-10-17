import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AI Capital Tracker',
    short_name: 'AICapitalTracker',
    description:
      'Independent, source-backed research database tracking investments, debt facilities, GPU collateral, cloud commitments, and power agreements behind AI infrastructure.',
    start_url: '/',
    display: 'standalone',
    background_color: '#09090b',
    theme_color: '#09090b',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
  };
}
