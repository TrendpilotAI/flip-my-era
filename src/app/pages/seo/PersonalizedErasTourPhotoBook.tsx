import { SEO } from '@/modules/shared/components/SEO';
import { Link } from 'react-router-dom';

const PersonalizedErasTourPhotoBook = () => {
  return (
    <div className="container py-12 max-w-4xl mx-auto">
      <SEO
        title="Personalized Eras Tour Photo Book — Custom AI Illustrations"
        description="Create a personalized Eras Tour photo book with AI-generated artwork. Better than photos — unique illustrations that capture the feeling of Taylor Swift's historic tour."
        url="/personalized-eras-tour-photo-book"
        type="article"
      />

      <article className="prose prose-lg max-w-none">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-6">
          Personalized Eras Tour Photo Book — But Better Than Photos
        </h1>

        <p className="text-xl text-gray-600 text-center mb-12">
          Your concert photos are blurry. Your memories aren't. FlipMyEra turns crystal-clear memories into stunning AI-illustrated books.
        </p>

        <div className="bg-gradient-to-r from-cyan-50 to-violet-50 rounded-2xl p-8 mb-12">
          <h2 className="text-2xl font-semibold mb-4">The Problem with Concert Photos</h2>
          <p>
            Let's be honest — most Eras Tour photos look the same. A tiny figure on a distant stage, screaming fans, and that one blurry video where you can barely make out which song is playing. They're precious to you, but they don't capture how the experience actually FELT.
          </p>
          <p>
            That's where FlipMyEra's personalized photo books come in. Instead of compiling grainy smartphone shots, our AI generates original illustrations that capture the emotion, energy, and magic of your specific Eras Tour experience. The result? A "photo book" that's actually more vivid and meaningful than any photograph could be.
          </p>
        </div>

        <h2 className="text-2xl font-semibold mb-4">What Makes Our Photo Books Different</h2>
        <ul className="space-y-3 mb-8">
          <li><strong>AI-generated original artwork</strong> — Not filtered photos, but entirely new illustrations created from your descriptions</li>
          <li><strong>Emotion-first design</strong> — We capture feelings, not just scenes. The butterflies in your stomach, the tears during "All Too Well," the euphoria of the finale</li>
          <li><strong>Era-accurate aesthetics</strong> — Each chapter matches the visual language of its corresponding Taylor Swift era</li>
          <li><strong>Personalized narrative</strong> — Your story accompanies the illustrations, making it a true keepsake</li>
          <li><strong>No copyright concerns</strong> — Every image is uniquely generated, so you can print, share, and display freely</li>
        </ul>

        <h2 className="text-2xl font-semibold mb-4">Popular Photo Book Layouts</h2>
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="border rounded-xl p-6 text-center">
            <h3 className="font-semibold mb-2">📖 The Full Journey</h3>
            <p className="text-gray-600 text-sm">From ticket purchase to post-concert glow — a complete illustrated timeline of your experience.</p>
          </div>
          <div className="border rounded-xl p-6 text-center">
            <h3 className="font-semibold mb-2">🎭 Era by Era</h3>
            <p className="text-gray-600 text-sm">Each era gets its own spread with themed illustrations capturing the set, songs, and your reactions.</p>
          </div>
          <div className="border rounded-xl p-6 text-center">
            <h3 className="font-semibold mb-2">👯 The Group Story</h3>
            <p className="text-gray-600 text-sm">Focus on the friends you went with — the planning, the inside jokes, and the shared experience.</p>
          </div>
        </div>

        <h2 className="text-2xl font-semibold mb-4">How It Works</h2>
        <ol className="space-y-3 mb-8">
          <li><strong>Share your concert details</strong> — Date, venue, who you went with, your seat location</li>
          <li><strong>Describe your highlights</strong> — Surprise songs, favorite era performances, emotional moments</li>
          <li><strong>Choose your art style</strong> — Watercolor, digital illustration, vintage Polaroid, or mixed media</li>
          <li><strong>AI generates your book</strong> — Beautiful illustrations paired with your personalized narrative</li>
          <li><strong>Download and share</strong> — Get your PDF instantly, share the online preview, or print at home</li>
        </ol>

        <h2 className="text-2xl font-semibold mb-4">Print-Ready Quality</h2>
        <p>
          While FlipMyEra delivers digital ebooks, many of our users print their photo books at home or through services like Shutterfly and Mixbook. The AI-generated illustrations are high-resolution and look stunning when printed on quality paper. Imagine a coffee table book filled with one-of-a-kind Eras Tour artwork — that's what you get with FlipMyEra.
        </p>
        <p>
          Some Swifties have even framed individual illustrations from their books as wall art, creating a gallery wall of their Eras Tour memories that sparks conversation every time someone visits.
        </p>

        <div className="bg-gradient-to-r from-violet-600 to-pink-500 text-white rounded-2xl p-8 text-center mb-12">
          <h2 className="text-2xl font-bold mb-3 text-white">Create Your Personalized Photo Book</h2>
          <p className="text-lg mb-6 text-white/90">
            Better than blurry concert photos. More personal than store-bought merch. Start free today.
          </p>
          <Link
            to="/auth"
            className="inline-block bg-white text-violet-600 font-semibold px-8 py-3 rounded-full hover:bg-gray-100 transition"
          >
            Start Creating Free →
          </Link>
        </div>

        <div className="text-center text-gray-500 text-sm">
          <p>Explore more: <Link to="/eras-tour-memories-book" className="text-violet-600 hover:underline">Eras Tour Memories Book</Link> · <Link to="/taylor-swift-fan-art-book" className="text-violet-600 hover:underline">Fan Art Book</Link> · <Link to="/eras-tour-scrapbook-digital" className="text-violet-600 hover:underline">Digital Scrapbook</Link> · <Link to="/gallery" className="text-violet-600 hover:underline">Gallery</Link></p>
        </div>
      </article>
    </div>
  );
};

export default PersonalizedErasTourPhotoBook;
