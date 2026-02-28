import { SEO } from '@/modules/shared/components/SEO';
import { Link } from 'react-router-dom';

const ARTICLE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Taylor Swift Fan Art Book: AI-Powered Illustrations for Every Era",
  "description": "Create a stunning Taylor Swift fan art book with AI-generated illustrations for every era. Beautiful, unique artwork personalized to your vision. Start free today!",
  "url": "https://flipmyera.com/taylor-swift-fan-art-book",
  "image": "https://flipmyera.com/og-image.png",
  "author": { "@type": "Organization", "name": "FlipMyEra" },
  "publisher": {
    "@type": "Organization",
    "name": "FlipMyEra",
    "logo": { "@type": "ImageObject", "url": "https://flipmyera.com/logo.png" }
  },
  "mainEntityOfPage": { "@type": "WebPage", "@id": "https://flipmyera.com/taylor-swift-fan-art-book" }
};

const TaylorSwiftFanArtBook = () => {
  return (
    <div className="container py-12 max-w-4xl mx-auto">
      <SEO
        title="Taylor Swift Fan Art Book — AI-Generated Era Illustrations"
        description="Create a stunning Taylor Swift fan art book with AI-generated illustrations for every era. Beautiful, unique artwork personalized to your vision. Start free today!"
        url="/taylor-swift-fan-art-book"
        type="article"
        jsonLd={ARTICLE_SCHEMA}
      />

      <article className="prose prose-lg max-w-none">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-6">
          Taylor Swift Fan Art Book: AI-Powered Illustrations for Every Era
        </h1>

        <p className="text-xl text-gray-600 text-center mb-12">
          Imagine a book filled with breathtaking artwork inspired by every Taylor Swift era — and it's uniquely yours. That's what FlipMyEra creates.
        </p>

        <div className="bg-gradient-to-r from-amber-50 to-rose-50 rounded-2xl p-8 mb-12">
          <h2 className="text-2xl font-semibold mb-4">A New Kind of Fan Art</h2>
          <p>
            Fan art has always been central to the Swiftie community. From Tumblr drawings to TikTok paintings, Swifties are some of the most creative fans in the world. Now, FlipMyEra brings AI into the mix — letting you create an entire book of stunning, era-inspired illustrations that tell your personal Taylor Swift story.
          </p>
          <p>
            Unlike scrolling through fan art on social media, a FlipMyEra fan art book is curated, cohesive, and deeply personal. Each illustration is generated specifically for your story, matching the mood, colors, and aesthetic of whichever era you choose. Think of it as commissioning an entire art collection — except it takes minutes instead of months.
          </p>
        </div>

        <h2 className="text-2xl font-semibold mb-4">Art Styles for Every Era</h2>
        <p>FlipMyEra's AI can generate illustrations in a wide range of styles, each matched to the aesthetic of Taylor's different musical eras:</p>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6">
            <h3 className="font-semibold text-lg mb-2">🌿 Debut & Fearless</h3>
            <p className="text-gray-600">Warm golden tones, country landscapes, fairy-tale whimsy. Watercolor and soft pencil illustration styles capture the innocence and sparkle of early Taylor.</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-6">
            <h3 className="font-semibold text-lg mb-2">💜 Speak Now</h3>
            <p className="text-gray-600">Royal purple palettes, enchanted castle imagery, and storybook illustration styles that bring the fairy-tale princess era to life.</p>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-6">
            <h3 className="font-semibold text-lg mb-2">❤️ Red</h3>
            <p className="text-gray-600">Bold autumn colors, scarves blowing in the wind, and vintage photography-inspired artwork. Dramatic and emotionally rich.</p>
          </div>
          <div className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-xl p-6">
            <h3 className="font-semibold text-lg mb-2">🏙️ 1989</h3>
            <p className="text-gray-600">Polaroid aesthetics, New York City skylines, and pop-art influences. Clean, bright, and full of that moving-to-the-city energy.</p>
          </div>
          <div className="bg-gradient-to-br from-gray-50 to-zinc-100 rounded-xl p-6">
            <h3 className="font-semibold text-lg mb-2">🐍 Reputation</h3>
            <p className="text-gray-600">Dark, edgy, newspaper-clipping collages meet sleek digital art. Snakes, lightning, and stadium lights rendered in dramatic noir style.</p>
          </div>
          <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-6">
            <h3 className="font-semibold text-lg mb-2">🦋 Lover</h3>
            <p className="text-gray-600">Cotton-candy pastels, rainbow hearts, and dreamy romantic illustrations. Soft, warm, and unapologetically joyful.</p>
          </div>
          <div className="bg-gradient-to-br from-stone-50 to-amber-50 rounded-xl p-6">
            <h3 className="font-semibold text-lg mb-2">🍂 Folklore & Evermore</h3>
            <p className="text-gray-600">Misty forests, cozy cabins, and cottagecore aesthetics. Detailed pencil drawings and moody oil-painting styles bring the indie era to life.</p>
          </div>
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-6">
            <h3 className="font-semibold text-lg mb-2">🌙 Midnights</h3>
            <p className="text-gray-600">Midnight blue and lavender, starlit scenes, and ethereal digital artwork. Modern, glamorous, and tinged with sleepless nostalgia.</p>
          </div>
        </div>

        <h2 className="text-2xl font-semibold mb-4">What You Can Create</h2>
        <p>
          FlipMyEra isn't just about pretty pictures — it's about creating a narrative art experience. Your fan art book combines AI-generated illustrations with personalized storytelling to create something truly special:
        </p>
        <ul className="space-y-3 mb-8">
          <li><strong>Complete era art collections</strong> — Multiple illustrations per era, each capturing a different mood or moment</li>
          <li><strong>Story-driven artwork</strong> — Illustrations that accompany your personal narrative, not random images</li>
          <li><strong>Multiple art styles</strong> — Watercolor, digital art, pencil sketch, vintage photography, pop art, and more</li>
          <li><strong>Cover art generation</strong> — Create stunning custom cover designs for your storybook</li>
          <li><strong>Chapter illustrations</strong> — Beautiful scene-setting artwork for each chapter of your story</li>
        </ul>

        <h2 className="text-2xl font-semibold mb-4">From Fan to Creator</h2>
        <p>
          The beauty of FlipMyEra is that you don't need to be an artist to create beautiful art. Our AI handles the technical skill — you bring the vision and emotion. Tell the AI what mood you want, describe your favorite Taylor Swift moments, and watch as it generates illustrations that feel like they came straight from a professional illustrator's studio.
        </p>
        <p>
          Many Swifties use their FlipMyEra art books as:
        </p>
        <ul className="space-y-2 mb-8">
          <li>📱 Phone and desktop wallpapers</li>
          <li>🖼️ Printed wall art for their Swiftie shrine</li>
          <li>🎁 Gifts for other Taylor Swift fans</li>
          <li>📖 Personal keepsakes and memory books</li>
          <li>📲 Social media content to share with the fandom</li>
        </ul>

        <div className="bg-gradient-to-r from-violet-600 to-pink-500 text-white rounded-2xl p-8 text-center mb-12">
          <h2 className="text-2xl font-bold mb-3 text-white">Create Your Fan Art Book Now</h2>
          <p className="text-lg mb-6 text-white/90">
            No artistic skill required. Just your love for Taylor Swift and a few minutes of your time.
          </p>
          <Link
            to="/auth"
            className="inline-block bg-white text-violet-600 font-semibold px-8 py-3 rounded-full hover:bg-gray-100 transition"
          >
            Start Creating Free →
          </Link>
        </div>

        <div className="text-center text-gray-500 text-sm">
          <p>Explore more: <Link to="/taylor-swift-eras-tour-ebook" className="text-violet-600 hover:underline">Eras Tour Ebook</Link> · <Link to="/custom-taylor-swift-gifts" className="text-violet-600 hover:underline">Custom Gifts</Link> · <Link to="/eras-tour-scrapbook-digital" className="text-violet-600 hover:underline">Digital Scrapbook</Link> · <Link to="/gallery" className="text-violet-600 hover:underline">Gallery</Link></p>
        </div>
      </article>
    </div>
  );
};

export default TaylorSwiftFanArtBook;
