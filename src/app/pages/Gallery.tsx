import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/modules/shared/components/ui/card';
import { Badge } from '@/modules/shared/components/ui/badge';
import { Input } from '@/modules/shared/components/ui/input';
import { Button } from '@/modules/shared/components/ui/button';
import { Search, Star, BookOpen } from 'lucide-react';

// ── Types ──────────────────────────────────────────────

interface GalleryEbook {
  id: string;
  title: string;
  coverUrl: string;
  artist: string;
  era: string;
  creator: string;
  featured: boolean;
  createdAt: string;
}

// ── Mock Data (replace with Supabase query) ────────────

const SAMPLE_EBOOKS: GalleryEbook[] = [
  { id: '1', title: 'Midnight Confessions', coverUrl: '', artist: 'Taylor Swift', era: 'Midnights', creator: 'swiftie_writer', featured: true, createdAt: '2025-12-01' },
  { id: '2', title: 'Golden Hour Stories', coverUrl: '', artist: 'Harry Styles', era: 'Fine Line', creator: 'harry_fan', featured: true, createdAt: '2025-11-15' },
  { id: '3', title: 'Lemonade Chronicles', coverUrl: '', artist: 'Beyoncé', era: 'Lemonade', creator: 'bey_hive', featured: false, createdAt: '2025-11-20' },
  { id: '4', title: 'Wings of Youth', coverUrl: '', artist: 'BTS', era: 'Wings', creator: 'army_writer', featured: true, createdAt: '2025-10-30' },
  { id: '5', title: 'Folklore Tales', coverUrl: '', artist: 'Taylor Swift', era: 'Folklore/Evermore', creator: 'cardigan_queen', featured: false, createdAt: '2025-12-05' },
  { id: '6', title: 'Reputation Rising', coverUrl: '', artist: 'Taylor Swift', era: 'Reputation', creator: 'rep_era', featured: false, createdAt: '2025-11-10' },
];

// ── Gradient helper ────────────────────────────────────

const ERA_GRADIENTS: Record<string, string> = {
  Midnights: 'from-indigo-900 via-purple-800 to-blue-900',
  'Fine Line': 'from-pink-400 via-green-300 to-yellow-200',
  Lemonade: 'from-yellow-500 via-amber-600 to-yellow-700',
  Wings: 'from-black via-red-900 to-orange-600',
  'Folklore/Evermore': 'from-amber-700 via-stone-600 to-amber-800',
  Reputation: 'from-black via-gray-800 to-gray-900',
  Renaissance: 'from-yellow-400 via-amber-300 to-gray-300',
};

function getGradient(era: string) {
  return ERA_GRADIENTS[era] || 'from-purple-500 to-pink-500';
}

// ── Component ──────────────────────────────────────────

export function Gallery() {
  const [search, setSearch] = useState('');
  const [filterArtist, setFilterArtist] = useState<string | null>(null);

  const artists = useMemo(() => [...new Set(SAMPLE_EBOOKS.map((e) => e.artist))], []);

  const filtered = useMemo(() => {
    return SAMPLE_EBOOKS.filter((ebook) => {
      const matchesSearch =
        !search ||
        ebook.title.toLowerCase().includes(search.toLowerCase()) ||
        ebook.creator.toLowerCase().includes(search.toLowerCase());
      const matchesArtist = !filterArtist || ebook.artist === filterArtist;
      return matchesSearch && matchesArtist;
    });
  }, [search, filterArtist]);

  const featured = filtered.filter((e) => e.featured);
  const rest = filtered.filter((e) => !e.featured);

  return (
    <div className="container py-8 space-y-8 max-w-6xl mx-auto">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <BookOpen className="h-8 w-8" /> Ebook Gallery
        </h1>
        <p className="text-muted-foreground">
          Explore amazing fan-created ebooks across all eras
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search ebooks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={filterArtist === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterArtist(null)}
          >
            All
          </Button>
          {artists.map((artist) => (
            <Button
              key={artist}
              variant={filterArtist === artist ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterArtist(filterArtist === artist ? null : artist)}
            >
              {artist}
            </Button>
          ))}
        </div>
      </div>

      {/* Featured */}
      {featured.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
            <Star className="h-5 w-5 text-yellow-500" /> Featured
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featured.map((ebook) => (
              <EbookCard key={ebook.id} ebook={ebook} />
            ))}
          </div>
        </section>
      )}

      {/* All Ebooks */}
      {rest.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4">All Ebooks</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rest.map((ebook) => (
              <EbookCard key={ebook.id} ebook={ebook} />
            ))}
          </div>
        </section>
      )}

      {filtered.length === 0 && (
        <p className="text-center text-muted-foreground py-12">No ebooks found</p>
      )}
    </div>
  );
}

function EbookCard({ ebook }: { ebook: GalleryEbook }) {
  return (
    <Card className="overflow-hidden hover:ring-2 hover:ring-primary transition-all group cursor-pointer">
      {/* Cover art / gradient placeholder */}
      <div className={`h-32 bg-gradient-to-br ${getGradient(ebook.era)} flex items-end p-4`}>
        {ebook.featured && (
          <Badge className="bg-yellow-500 text-black">
            <Star className="h-3 w-3 mr-1" /> Featured
          </Badge>
        )}
      </div>
      <CardContent className="pt-4">
        <h3 className="font-semibold group-hover:text-primary transition-colors">{ebook.title}</h3>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="secondary">{ebook.artist}</Badge>
          <Badge variant="outline">{ebook.era}</Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          by {ebook.creator} · {new Date(ebook.createdAt).toLocaleDateString()}
        </p>
      </CardContent>
    </Card>
  );
}

export default Gallery;
