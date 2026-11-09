'use client';

import dynamic from 'next/dynamic';

const AIAssistant = dynamic(() => import('./AIAssistant'), {
  ssr: false,
  loading: () => null,
});

export default function AIAssistantLoader() {
  return <AIAssistant />;
}
