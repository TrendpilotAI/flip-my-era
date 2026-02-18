import { SEO } from '@/modules/shared/components/SEO';
import { Link } from 'react-router-dom';

const ErasTourMemoriesBook = () => {
  return (
    <div className="container py-12 max-w-4xl mx-auto">
      <SEO
        title="Eras Tour Memories Book — Preserve Your Concert Experience Forever"
        description="Create a personalized Eras Tour memories book with AI-generated illustrations. Capture every magical moment from Taylor Swift's historic tour in a beautiful keepsake."
        url="/eras-tour-memories-book"
        type="article"
      />

      <article className="prose prose-lg max-w-none">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-6">
          Eras Tour Memories Book: Your Concert Story, Beautifully Preserved
        </h1>

        <p className="text-xl text-gray-600 text-center mb-12">
          The Eras Tour was the biggest concert tour in history. Your memories of it deserve more than a camera roll — they deserve a book.
        </p>

        <div className="bg-gradient-to-r from-violet-50 to-blue-50 rounded-2xl p-8 mb-12">
          <h2 className="text-2xl font-semibold mb-4">Why Your Eras Tour Memories Matter</h2>
          <p>
            Taylor Swift's Eras Tour broke every record in the book — but the real magic wasn't in the numbers. It was in the personal moments. The months of anticipation after finally getting tickets. The friendship bracelet-making sessions. The outfit planning that felt like its own creative project. The drive to the stadium with your heart pounding. The moment the lights went down and "Miss Americana" started playing.
          </p>
          <p>
            Those memories are precious, and they fade faster than you'd think. A FlipMyEra memories book captures them in vivid detail — not just what happened, but how it felt — illustrated with beautiful AI-generated artwork that brings every moment back to life.
          </p>
        </div>

        <h2 className="text-2xl font-semibold mb-4">What Goes Into an Eras Tour Memories Book?</h2>
        <p>Every memories book is uniquely generated, but here's what Swifties typically include:</p>

        <div className="space-y-4 mb-12">
          <div className="flex gap-4 items-start">
            <span className="text-2xl">🎫</span>
            <div>
              <h3 className="font-semibold">The Ticket Story</h3>
              <p className="text-gray-600">How you got your tickets — the Ticketmaster chaos, the group chat freakout, the moment you realized you were actually going.</p>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <span className="text-2xl">👗</span>
            <div>
              <h3 className="font-semibold">The Outfit Chapter</h3>
              <p className="text-gray-600">Era-inspired outfit planning, the DIY projects, the accessories, the friendship bracelets made in advance.</p>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <span className="text-2xl">🚗</span>
            <div>
              <h3 className="font-semibold">The Journey There</h3>
              <p className="text-gray-600">Road trips, flights, hotel rooms, pre-show tailgating, and the electric atmosphere of thousands of Swifties converging.</p>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <span className="text-2xl">🎤</span>
            <div>
              <h3 className="font-semibold">The Show Itself</h3>
              <p className="text-gray-600">Era by era — which moments gave you chills, which songs made you cry, the surprise songs, the energy of 70,000 people singing together.</p>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <span className="text-2xl">💫</span>
            <div>
              <h3 className="font-semibold">The Afterglow</h3>
              <p className="text-gray-600">Post-concert euphoria, the group chat recaps, watching videos the next morning, and the lasting impact on your life.</p>
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-semibold mb-4">Real Swiftie Memories We've Helped Preserve</h2>
        <p>Here are some of the amazing stories our users have created:</p>
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <blockquote className="border rounded-xl p-6 italic text-gray-600">
            "I went to 3 Eras Tour shows across the country and created a memories book for each one. The AI captured the different vibes of each city perfectly — LA glamour, Nashville country roots, and NYC energy."
          </blockquote>
          <blockquote className="border rounded-xl p-6 italic text-gray-600">
            "My daughter's first concert was the Eras Tour at age 13. I made her a memories book for Christmas and she literally sobbed. It's her most prized possession now."
          </blockquote>
        </div>

        <h2 className="text-2xl font-semibold mb-4">Multiple Shows? Create a Collection</h2>
        <p>
          Many dedicated Swifties attended multiple Eras Tour shows. FlipMyEra makes it easy to create a unique memories book for each show, or a comprehensive volume that covers your entire Eras Tour journey across all the cities and dates you attended.
        </p>
        <p>
          Each book can focus on different aspects — one might emphasize the surprise songs, another the friendships made while waiting in line, and another the different outfits you wore. Together, they form a complete archive of your Eras Tour experience.
        </p>

        <h2 className="text-2xl font-semibold mb-4">Beyond the Eras Tour</h2>
        <p>
          While the Eras Tour is our most popular theme, FlipMyEra memories books work for any Taylor Swift concert experience. Attended a 1989 World Tour show? Create a retro-styled memory book. Have Reputation Stadium Tour memories? Go dark and dramatic. Even smaller events like Secret Sessions or release night listening parties make incredible book themes.
        </p>

        <div className="bg-gradient-to-r from-violet-600 to-pink-500 text-white rounded-2xl p-8 text-center mb-12">
          <h2 className="text-2xl font-bold mb-3 text-white">Preserve Your Eras Tour Memories</h2>
          <p className="text-lg mb-6 text-white/90">
            Before the details fade, turn them into a beautiful book. Start free with 10 credits.
          </p>
          <Link
            to="/auth"
            className="inline-block bg-white text-violet-600 font-semibold px-8 py-3 rounded-full hover:bg-gray-100 transition"
          >
            Start Creating Free →
          </Link>
        </div>

        <div className="text-center text-gray-500 text-sm">
          <p>Explore more: <Link to="/taylor-swift-eras-tour-ebook" className="text-violet-600 hover:underline">Eras Tour Ebook</Link> · <Link to="/personalized-eras-tour-photo-book" className="text-violet-600 hover:underline">Personalized Photo Book</Link> · <Link to="/taylor-swift-concert-keepsake-gift" className="text-violet-600 hover:underline">Concert Keepsake Gift</Link> · <Link to="/gallery" className="text-violet-600 hover:underline">Gallery</Link></p>
        </div>
      </article>
    </div>
  );
};

export default ErasTourMemoriesBook;
