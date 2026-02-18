import { SEO } from '@/modules/shared/components/SEO';
import { Link } from 'react-router-dom';

const ErasTourEbook = () => {
  return (
    <div className="container py-12 max-w-4xl mx-auto">
      <SEO
        title="Taylor Swift Eras Tour Ebook — Create Your Personalized Story"
        description="Turn your Eras Tour memories into a stunning AI-generated ebook. Personalized Taylor Swift stories with beautiful illustrations for every era. Start free today!"
        url="/taylor-swift-eras-tour-ebook"
        type="article"
      />

      <article className="prose prose-lg max-w-none">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-6">
          Taylor Swift Eras Tour Ebook: Your Story, Beautifully Told
        </h1>

        <p className="text-xl text-gray-600 text-center mb-12">
          Transform your Eras Tour experience into a personalized, AI-illustrated ebook that captures every magical moment.
        </p>

        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 mb-12">
          <h2 className="text-2xl font-semibold mb-4">Why Swifties Are Creating Eras Tour Ebooks</h2>
          <p>
            The Eras Tour wasn't just a concert — it was a once-in-a-lifetime experience that deserves to be remembered forever. With FlipMyEra, you can transform your personal Eras Tour journey into a beautifully crafted digital ebook complete with AI-generated illustrations that match the aesthetic of every era.
          </p>
          <p>
            Whether you attended one show or followed Taylor across the country, your Eras Tour ebook captures the emotions, the friendship bracelets, the outfit planning, and the unforgettable moments that made your experience unique. Each page is personalized to YOUR story — not a generic recap, but a deeply personal keepsake.
          </p>
        </div>

        <h2 className="text-2xl font-semibold mb-4">What's Inside Your Eras Tour Ebook?</h2>
        <p>
          Every FlipMyEra ebook is uniquely generated using advanced AI to create a one-of-a-kind reading experience. When you create your Taylor Swift Eras Tour ebook, you'll get:
        </p>
        <ul className="space-y-3 mb-8">
          <li><strong>Personalized storytelling</strong> — AI weaves your specific memories, concert dates, and experiences into a compelling narrative</li>
          <li><strong>Era-specific illustrations</strong> — Stunning artwork inspired by the visual aesthetic of each Taylor Swift era, from Lover's pastels to Reputation's dark edge</li>
          <li><strong>Custom chapter design</strong> — Each era gets its own beautifully designed chapter with era-appropriate typography and color palettes</li>
          <li><strong>Shareable format</strong> — Download as PDF or share a beautiful online preview with fellow Swifties</li>
          <li><strong>Multiple style options</strong> — Choose from watercolor, digital art, vintage photography, and more illustration styles</li>
        </ul>

        <h2 className="text-2xl font-semibold mb-4">How to Create Your Eras Tour Ebook in 3 Simple Steps</h2>
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white border rounded-xl p-6 text-center">
            <div className="text-3xl mb-3">✨</div>
            <h3 className="font-semibold mb-2">1. Share Your Story</h3>
            <p className="text-gray-600">Tell us about your Eras Tour experience — which shows you attended, your favorite moments, and the emotions you felt.</p>
          </div>
          <div className="bg-white border rounded-xl p-6 text-center">
            <div className="text-3xl mb-3">🎨</div>
            <h3 className="font-semibold mb-2">2. Choose Your Style</h3>
            <p className="text-gray-600">Pick the illustration style and era aesthetic that resonates with you. Mix and match across chapters!</p>
          </div>
          <div className="bg-white border rounded-xl p-6 text-center">
            <div className="text-3xl mb-3">📖</div>
            <h3 className="font-semibold mb-2">3. Get Your Ebook</h3>
            <p className="text-gray-600">Our AI generates your personalized ebook with custom illustrations in minutes. Download, share, and treasure forever.</p>
          </div>
        </div>

        <h2 className="text-2xl font-semibold mb-4">The Perfect Way to Preserve Your Eras Tour Memories</h2>
        <p>
          Concert tickets fade. Phone photos get buried in your camera roll. But a personalized ebook? That's a keepsake you'll return to again and again. Imagine flipping through pages that tell YOUR Eras Tour story — the anticipation of getting tickets, the outfit planning sessions with friends, the moment Taylor played your favorite song, and the post-concert glow that lasted for weeks.
        </p>
        <p>
          FlipMyEra uses cutting-edge AI to understand the emotional journey of your concert experience and translate it into beautiful prose paired with stunning illustrations. It's not just a book — it's a time capsule of one of the most magical experiences of your life.
        </p>

        <h2 className="text-2xl font-semibold mb-4">Popular Eras Tour Ebook Themes</h2>
        <p>Our most popular ebook themes among Swifties include:</p>
        <ul className="space-y-2 mb-8">
          <li>🦋 <strong>The Complete Eras Journey</strong> — A chapter for every era, from Debut to Midnights</li>
          <li>💜 <strong>Lavender Haze Dreams</strong> — Midnights-inspired aesthetic throughout</li>
          <li>🐍 <strong>Reputation Rising</strong> — Dark, moody, powerful storytelling</li>
          <li>🌸 <strong>Lover's Paradise</strong> — Pastel romance and dreamy illustrations</li>
          <li>🍂 <strong>Folklore & Evermore</strong> — Cottagecore woodland aesthetic</li>
        </ul>

        <div className="bg-gradient-to-r from-violet-600 to-pink-500 text-white rounded-2xl p-8 text-center mb-12">
          <h2 className="text-2xl font-bold mb-3 text-white">Ready to Create Your Eras Tour Ebook?</h2>
          <p className="text-lg mb-6 text-white/90">
            Join thousands of Swifties who've already preserved their Eras Tour memories. Start with 10 free credits — no credit card required.
          </p>
          <Link
            to="/auth"
            className="inline-block bg-white text-violet-600 font-semibold px-8 py-3 rounded-full hover:bg-gray-100 transition"
          >
            Start Creating Free →
          </Link>
        </div>

        <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions</h2>
        <div className="space-y-4 mb-8">
          <div>
            <h3 className="font-semibold">How long does it take to create an Eras Tour ebook?</h3>
            <p className="text-gray-600">Most ebooks are generated in under 5 minutes. You can preview and make edits before downloading your final version.</p>
          </div>
          <div>
            <h3 className="font-semibold">Can I include real photos from the concert?</h3>
            <p className="text-gray-600">Currently, FlipMyEra generates original AI illustrations based on your descriptions. This ensures every image is unique and copyright-free.</p>
          </div>
          <div>
            <h3 className="font-semibold">Is this an official Taylor Swift product?</h3>
            <p className="text-gray-600">No, FlipMyEra is an independent creative platform. We help fans create personalized stories inspired by their experiences — we're not affiliated with Taylor Swift or her management.</p>
          </div>
        </div>

        <div className="text-center text-gray-500 text-sm">
          <p>Explore more: <Link to="/swiftie-birthday-present-ideas" className="text-violet-600 hover:underline">Swiftie Gift Ideas</Link> · <Link to="/custom-taylor-swift-gifts" className="text-violet-600 hover:underline">Custom Taylor Swift Gifts</Link> · <Link to="/eras-tour-memories-book" className="text-violet-600 hover:underline">Eras Tour Memories Book</Link> · <Link to="/gallery" className="text-violet-600 hover:underline">Gallery</Link></p>
        </div>
      </article>
    </div>
  );
};

export default ErasTourEbook;
