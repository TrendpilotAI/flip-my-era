import { SEO } from '@/modules/shared/components/SEO';
import { Link } from 'react-router-dom';

const ARTICLE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Eras Tour Digital Scrapbook: All the Memories, None of the Glue",
  "description": "Create a digital Eras Tour scrapbook with AI-generated illustrations. No scissors or glue needed — just your memories and our AI to create a stunning digital keepsake.",
  "url": "https://flipmyera.com/eras-tour-scrapbook-digital",
  "image": "https://flipmyera.com/og-image.png",
  "author": { "@type": "Organization", "name": "FlipMyEra" },
  "publisher": {
    "@type": "Organization",
    "name": "FlipMyEra",
    "logo": { "@type": "ImageObject", "url": "https://flipmyera.com/logo.png" }
  },
  "datePublished": "2025-11-01",
  "dateModified": "2026-01-15",
  "mainEntityOfPage": { "@type": "WebPage", "@id": "https://flipmyera.com/eras-tour-scrapbook-digital" }
};

const ErasTourScrapbook = () => {
  return (
    <div className="container py-12 max-w-4xl mx-auto">
      <SEO
        title="Eras Tour Scrapbook Digital — AI-Illustrated Digital Keepsake"
        description="Create a digital Eras Tour scrapbook with AI-generated illustrations. No scissors or glue needed — just your memories and our AI to create a stunning digital keepsake."
        url="/eras-tour-scrapbook-digital"
        type="article"
        jsonLd={ARTICLE_SCHEMA}
        keywords="Eras Tour digital scrapbook, Taylor Swift digital scrapbook, AI Swiftie scrapbook, Eras Tour memory book"
      />

      <article className="prose prose-lg max-w-none">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-6">
          Eras Tour Digital Scrapbook: All the Memories, None of the Glue
        </h1>

        <p className="text-xl text-gray-600 text-center mb-12">
          The charm of a handmade scrapbook meets the magic of AI illustration. Create your digital Eras Tour keepsake in minutes.
        </p>

        <div className="bg-gradient-to-r from-orange-50 to-pink-50 rounded-2xl p-8 mb-12">
          <h2 className="text-2xl font-semibold mb-4">Scrapbooking Reimagined for Digital Swifties</h2>
          <p>
            Scrapbooking has always been about preserving memories with a personal creative touch. But let's be real — not everyone has the time, supplies, or crafting skills to create a beautiful physical scrapbook. And in 2025, a digital keepsake makes so much more sense: it's shareable, it can't get damaged, and it lives forever on your devices.
          </p>
          <p>
            FlipMyEra's digital scrapbook combines the personal, memory-preserving spirit of traditional scrapbooking with AI technology that generates stunning original illustrations. You provide the memories, we provide the art. The result is a digital scrapbook that looks like it was crafted by a professional designer — but takes just minutes to create.
          </p>
        </div>

        <h2 className="text-2xl font-semibold mb-4">What Makes a Digital Scrapbook Special?</h2>
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="border rounded-xl p-6">
            <h3 className="font-semibold text-lg mb-2">🎨 AI Illustrations</h3>
            <p className="text-gray-600">Instead of cutting and pasting photos, our AI creates original artwork based on your memories. Each illustration is unique and captures the feeling of the moment.</p>
          </div>
          <div className="border rounded-xl p-6">
            <h3 className="font-semibold text-lg mb-2">📝 Personalized Narratives</h3>
            <p className="text-gray-600">AI-generated text that reads like your own journal entries, weaving your specific details into a compelling narrative alongside the illustrations.</p>
          </div>
          <div className="border rounded-xl p-6">
            <h3 className="font-semibold text-lg mb-2">🎭 Era-Themed Design</h3>
            <p className="text-gray-600">Each section is styled to match the aesthetic of the corresponding Taylor Swift era — fonts, colors, borders, and mood all shift as you move through the eras.</p>
          </div>
          <div className="border rounded-xl p-6">
            <h3 className="font-semibold text-lg mb-2">📱 Share Anywhere</h3>
            <p className="text-gray-600">Send a beautiful preview link to friends, download as PDF for printing, or keep it as a digital treasure on your phone and tablet.</p>
          </div>
        </div>

        <h2 className="text-2xl font-semibold mb-4">Digital Scrapbook Page Ideas</h2>
        <p>Not sure what to include? Here are popular page themes our Swifties create:</p>
        <ul className="space-y-3 mb-8">
          <li>🎫 <strong>The Ticket Page</strong> — How you got your tickets, the Ticketmaster saga, the exact moment you knew you were going</li>
          <li>👗 <strong>The Outfit Spread</strong> — Your era-inspired outfit planning, inspiration photos, and the final look</li>
          <li>📿 <strong>Bracelet Wall</strong> — All the friendship bracelets you made and traded, with the stories behind each one</li>
          <li>🎤 <strong>Setlist Highlights</strong> — Your top moments from each era, surprise songs, and emotional peaks</li>
          <li>👯 <strong>The Squad Page</strong> — The friends you went with, the pre-show rituals, and group memories</li>
          <li>🌟 <strong>The Surprise Songs</strong> — What Taylor played as surprise songs at your show and why they hit so hard</li>
          <li>😭 <strong>The Emotional Moments</strong> — When you cried, laughed, screamed, and felt completely alive</li>
          <li>🏟️ <strong>The Venue</strong> — The city, the stadium, the atmosphere, and the local Swiftie culture</li>
        </ul>

        <h2 className="text-2xl font-semibold mb-4">Why Go Digital?</h2>
        <p>
          Physical scrapbooks are lovely, but digital scrapbooks have some serious advantages for the modern Swiftie:
        </p>
        <ul className="space-y-2 mb-8">
          <li>✅ <strong>No craft supplies needed</strong> — save your money for concert tickets</li>
          <li>✅ <strong>Ready in minutes</strong> — not weeks of cutting and gluing</li>
          <li>✅ <strong>Easily shareable</strong> — send to friends, post on social media, or keep private</li>
          <li>✅ <strong>Never gets damaged</strong> — no water damage, torn pages, or faded photos</li>
          <li>✅ <strong>Eco-friendly</strong> — no paper waste or plastic supplies</li>
          <li>✅ <strong>Unlimited copies</strong> — print one or share a thousand</li>
        </ul>

        <h2 className="text-2xl font-semibold mb-4">Combine with Physical Keepsakes</h2>
        <p>
          The best of both worlds: use your FlipMyEra digital scrapbook as the illustrated narrative, and pair it with a physical shadow box or memory jar containing your actual concert mementos — ticket stubs, friendship bracelets, confetti, and wristbands. The digital book tells the story; the physical items are the artifacts. Together, they create the ultimate Eras Tour memory collection.
        </p>

        <div className="bg-gradient-to-r from-violet-600 to-pink-500 text-white rounded-2xl p-8 text-center mb-12">
          <h2 className="text-2xl font-bold mb-3 text-white">Create Your Digital Scrapbook</h2>
          <p className="text-lg mb-6 text-white/90">
            All the charm of scrapbooking, powered by AI. Start with 10 free credits — no glue gun required.
          </p>
          <Link
            to="/auth"
            className="inline-block bg-white text-violet-600 font-semibold px-8 py-3 rounded-full hover:bg-gray-100 transition"
          >
            Start Creating Free →
          </Link>
        </div>

        <div className="text-center text-gray-500 text-sm">
          <p>Explore more: <Link to="/personalized-eras-tour-photo-book" className="text-violet-600 hover:underline">Photo Book</Link> · <Link to="/eras-tour-memories-book" className="text-violet-600 hover:underline">Memories Book</Link> · <Link to="/taylor-swift-fan-art-book" className="text-violet-600 hover:underline">Fan Art Book</Link> · <Link to="/gallery" className="text-violet-600 hover:underline">Gallery</Link></p>
        </div>
      </article>
    </div>
  );
};

export default ErasTourScrapbook;
