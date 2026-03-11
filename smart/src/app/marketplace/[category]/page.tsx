import React from 'react';

const CATEGORY_PAGES: Record<string, { title: string; image: string; paragraphs: string[] }> = {
  'smart-watches': {
    title: 'Smart Watches',
    image: '/images/smartwatch.png',
    paragraphs: [
      'Smart watches combine elegant wristwear with powerful health and connectivity features. Use them to track steps, heart rate, sleep, and workouts with real-time statistics.',
      'They keep you connected with call, message, and notification previews, and many models include GPS, contactless payments, and customizable watch faces to match your style.',
      'Choose a smart watch for fitness tracking, hands-free notifications, or simply as a sleek daily wearable that extends your phone’s capabilities.'
    ]
  },
  'smart-home': {
    title: 'Smart Home',
    image: '/images/laptop.png',
    paragraphs: [
      'Smart home devices let you automate lighting, control climate, and secure your property from anywhere. Start small with smart bulbs and plugs, then expand to cameras and thermostats.',
      'Integration with voice assistants and routines enables scenes like “Good Night” to turn off lights and lock doors automatically.',
      'A smart home improves convenience, energy efficiency, and peace of mind through remote control and automation.'
    ]
  },
  'audio-devices': {
    title: 'Audio Devices',
    image: '/images/earbuds.png',
    paragraphs: [
      'Audio devices include wireless earbuds, headphones, and speakers designed for immersive sound and portability. Look for features like active noise cancellation and spatial audio.',
      'High-quality audio devices enhance workouts, commutes, and home listening, offering clear calls and low-latency connections for videos and games.',
      'Choose an audio device based on battery life, comfort, and whether you prioritize isolation or awareness of your surroundings.'
    ]
  },
  'accessories': {
    title: 'Accessories',
    image: '/images/glasses.png',
    paragraphs: [
      'Accessories cover essentials like chargers, cables, mounts, cases, and power banks that keep your devices protected and powered.',
      'Good accessories improve daily usability — fast chargers reduce wait time, protective cases prevent accidental damage, and mounts keep devices accessible.'
    ]
  }
};

export default function CategoryPage({ params }: { params: { category?: string } }) {
  const slug = params?.category;

  if (!slug) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-2xl text-center">
          <h1 className="text-3xl font-bold">Category not found</h1>
          <p className="mt-4 text-gray-600">No category specified.</p>
        </div>
      </main>
    );
  }

  const content = CATEGORY_PAGES[slug];

  if (!content) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-2xl text-center">
          <h1 className="text-3xl font-bold">Category not found</h1>
          <p className="mt-4 text-gray-600">This category does not have a dedicated page yet.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start mb-12">
          <div className="md:col-span-2">
            <h1 className="text-4xl font-extrabold text-gray-900">{content.title}</h1>
            <p className="text-sm text-gray-500 mt-2">Debug slug: {slug}</p>
            <div className="mt-6 space-y-4 text-gray-700 text-lg">
              {content.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>

          <div className="flex items-start justify-center">
            <div className="w-64 h-64 rounded-2xl overflow-hidden shadow-lg bg-gray-50 flex items-center justify-center">
              <img src={content.image} alt={content.title + ' image'} className="w-56 h-56 object-contain" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
