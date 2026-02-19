import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/modules/shared/components/ui/card';
import { Button } from '@/modules/shared/components/ui/button';
import { Badge } from '@/modules/shared/components/ui/badge';
import { History, RotateCcw, Plus, ChevronDown, ChevronUp } from 'lucide-react';

// ── Types ──────────────────────────────────────────────

export interface EbookSnapshot {
  title: string;
  chapters: { title: string; content: string }[];
  era?: string;
  metadata?: Record<string, unknown>;
}

export interface EbookVersion {
  id: string;
  ebookId: string;
  version: number;
  snapshot: EbookSnapshot;
  createdAt: string;
  label?: string;
}

export interface VersionDiff {
  field: string;
  before: string;
  after: string;
}

// ── Version Logic ──────────────────────────────────────

const STORAGE_KEY = 'flipmyera_ebook_versions';

function loadVersions(): Record<string, EbookVersion[]> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveVersions(data: Record<string, EbookVersion[]>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function createVersion(ebookId: string, snapshot: EbookSnapshot, label?: string): EbookVersion {
  const all = loadVersions();
  const existing = all[ebookId] || [];
  const version: EbookVersion = {
    id: `v-${Date.now()}`,
    ebookId,
    version: existing.length + 1,
    snapshot: structuredClone(snapshot),
    createdAt: new Date().toISOString(),
    label,
  };
  all[ebookId] = [...existing, version];
  saveVersions(all);
  return version;
}

export function getVersionHistory(ebookId: string): EbookVersion[] {
  return (loadVersions()[ebookId] || []).sort((a, b) => b.version - a.version);
}

export function restoreVersion(ebookId: string, versionId: string): EbookSnapshot | null {
  const versions = loadVersions()[ebookId] || [];
  const found = versions.find((v) => v.id === versionId);
  return found ? structuredClone(found.snapshot) : null;
}

export function diffVersions(a: EbookSnapshot, b: EbookSnapshot): VersionDiff[] {
  const diffs: VersionDiff[] = [];
  if (a.title !== b.title) {
    diffs.push({ field: 'Title', before: a.title, after: b.title });
  }
  if (a.era !== b.era) {
    diffs.push({ field: 'Era', before: a.era || '(none)', after: b.era || '(none)' });
  }
  const maxChapters = Math.max(a.chapters.length, b.chapters.length);
  for (let i = 0; i < maxChapters; i++) {
    const ca = a.chapters[i];
    const cb = b.chapters[i];
    if (!ca && cb) {
      diffs.push({ field: `Chapter ${i + 1}`, before: '(not present)', after: cb.title });
    } else if (ca && !cb) {
      diffs.push({ field: `Chapter ${i + 1}`, before: ca.title, after: '(removed)' });
    } else if (ca && cb) {
      if (ca.title !== cb.title) {
        diffs.push({ field: `Chapter ${i + 1} title`, before: ca.title, after: cb.title });
      }
      if (ca.content !== cb.content) {
        const lenA = ca.content.length;
        const lenB = cb.content.length;
        diffs.push({
          field: `Chapter ${i + 1} content`,
          before: `${lenA} chars`,
          after: `${lenB} chars (${lenB > lenA ? '+' : ''}${lenB - lenA})`,
        });
      }
    }
  }
  return diffs;
}

// ── Component ──────────────────────────────────────────

interface EbookVersioningProps {
  ebookId: string;
  currentSnapshot: EbookSnapshot;
  onRestore?: (snapshot: EbookSnapshot) => void;
}

export function EbookVersioning({ ebookId, currentSnapshot, onRestore }: EbookVersioningProps) {
  const [versions, setVersions] = useState(() => getVersionHistory(ebookId));
  const [expandedDiff, setExpandedDiff] = useState<string | null>(null);

  const handleSaveVersion = useCallback(() => {
    createVersion(ebookId, currentSnapshot);
    setVersions(getVersionHistory(ebookId));
  }, [ebookId, currentSnapshot]);

  const handleRestore = useCallback(
    (versionId: string) => {
      const snapshot = restoreVersion(ebookId, versionId);
      if (snapshot) onRestore?.(snapshot);
    },
    [ebookId, onRestore]
  );

  const getDiffs = (version: EbookVersion) => {
    return diffVersions(version.snapshot, currentSnapshot);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <History className="h-5 w-5" /> Version History
        </CardTitle>
        <Button size="sm" onClick={handleSaveVersion}>
          <Plus className="h-4 w-4 mr-1" /> Save Version
        </Button>
      </CardHeader>
      <CardContent>
        {versions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No versions saved yet. Click "Save Version" to create a snapshot.
          </p>
        ) : (
          <div className="space-y-2">
            {versions.map((version) => {
              const isExpanded = expandedDiff === version.id;
              const diffs = isExpanded ? getDiffs(version) : [];
              return (
                <Card key={version.id} className="border">
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">v{version.version}</Badge>
                        <span className="text-sm font-medium">
                          {version.label || version.snapshot.title}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(version.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedDiff(isExpanded ? null : version.id)}
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRestore(version.id)}
                          title="Restore this version"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="mt-3 border-t pt-3">
                        <p className="text-xs font-medium text-muted-foreground mb-2">
                          Changes from this version to current:
                        </p>
                        {diffs.length === 0 ? (
                          <p className="text-xs text-muted-foreground">No changes</p>
                        ) : (
                          <div className="space-y-1">
                            {diffs.map((d, i) => (
                              <div key={i} className="text-xs grid grid-cols-3 gap-2">
                                <span className="font-medium">{d.field}</span>
                                <span className="text-red-500 line-through">{d.before}</span>
                                <span className="text-green-500">{d.after}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default EbookVersioning;
