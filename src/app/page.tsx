"use client";

import Image from "next/image";
import {
  ChangeEvent,
  DragEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type ReferenceCategory = "Subject" | "Lighting" | "Color" | "Texture" | "Composition";

type ReferenceImage = {
  id: string;
  name: string;
  size: number;
  url: string;
  notes: string;
  categories: ReferenceCategory[];
  createdAt: number;
};

const categories: ReferenceCategory[] = [
  "Subject",
  "Lighting",
  "Color",
  "Texture",
  "Composition",
];

const formatBytes = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024))
  );
  const value = bytes / 1024 ** index;
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
};

const sortReferencesByDate = (references: ReferenceImage[]) =>
  [...references].sort((a, b) => b.createdAt - a.createdAt);

export default function Home() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const objectUrls = useRef(new Set<string>());
  const [references, setReferences] = useState<ReferenceImage[]>([]);
  const [activeCategory, setActiveCategory] = useState<"All" | ReferenceCategory>("All");
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const urls = objectUrls.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newReferences = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .map((file) => {
        const url = URL.createObjectURL(file);
        objectUrls.current.add(url);
        return {
          id: crypto.randomUUID(),
          name: file.name,
          size: file.size,
          url,
          notes: "",
          categories: [],
          createdAt: Date.now(),
        } satisfies ReferenceImage;
      });

    if (newReferences.length === 0) return;

    setReferences((previous) => sortReferencesByDate([...previous, ...newReferences]));
  }, []);

  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      handleFiles(event.target.files);
      event.target.value = "";
    },
    [handleFiles]
  );

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);
      handleFiles(event.dataTransfer.files);
    },
    [handleFiles]
  );

  const toggleCategory = useCallback((id: string, category: ReferenceCategory) => {
    setReferences((previous) =>
      previous.map((reference) => {
        if (reference.id !== id) return reference;

        const categoriesSet = new Set(reference.categories);
        if (categoriesSet.has(category)) {
          categoriesSet.delete(category);
        } else {
          categoriesSet.add(category);
        }

        return {
          ...reference,
          categories: Array.from(categoriesSet).sort(),
        };
      })
    );
  }, []);

  const updateNotes = useCallback((id: string, notes: string) => {
    setReferences((previous) =>
      previous.map((reference) =>
        reference.id === id ? { ...reference, notes } : reference
      )
    );
  }, []);

  const removeReference = useCallback((id: string) => {
    setReferences((previous) => {
      const reference = previous.find((item) => item.id === id);
      if (reference) {
        URL.revokeObjectURL(reference.url);
        objectUrls.current.delete(reference.url);
      }
      return previous.filter((item) => item.id !== id);
    });
  }, []);

  const filteredReferences = useMemo(() => {
    if (activeCategory === "All") return references;
    return references.filter((reference) =>
      reference.categories.includes(activeCategory)
    );
  }, [references, activeCategory]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-zinc-100">
      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-14">
        <header className="space-y-4 text-center sm:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400">
            Reference Hub
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Build your visual reference library in seconds.
          </h1>
          <p className="max-w-3xl text-sm text-zinc-400 sm:text-base">
            Drop any inspiration shots, lighting studies, textures, or mood frames.
            Tag them, jot down quick notes, and keep everything ready for your next
            project.
          </p>
        </header>

        <section
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`group relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-zinc-700/70 bg-zinc-900/60 px-8 py-16 text-center transition-all hover:border-zinc-500 hover:bg-zinc-900/80 ${
            isDragging ? "border-indigo-400 bg-indigo-500/10" : ""
          }`}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800/80 text-indigo-300">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 16V4m0 0L8 8m4-4 4 4M6 16.5v1.25A2.25 2.25 0 0 0 8.25 20h7.5A2.25 2.25 0 0 0 18 17.75V16.5M4.5 12h15"
              />
            </svg>
          </div>
          <div className="space-y-1">
            <p className="text-lg font-medium text-zinc-100">
              Drop images or click to upload
            </p>
            <p className="text-sm text-zinc-500">
              PNG, JPG, WEBP up to 10MB each. We&apos;ll keep everything private in
              your browser.
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleInputChange}
          />
        </section>

        <nav className="flex flex-wrap items-center gap-3">
          {(["All", ...categories] as const).map((category) => {
            const isActive = activeCategory === category;
            return (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`rounded-full border px-4 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 ${
                  isActive
                    ? "border-indigo-300 bg-indigo-300/20 text-indigo-200"
                    : "border-zinc-700 bg-zinc-900/40 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
                }`}
              >
                {category}
              </button>
            );
          })}
        </nav>

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredReferences.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 py-16 text-center text-zinc-500">
              <p className="text-sm font-medium text-zinc-400">
                No references yet.
              </p>
              <p className="max-w-md text-sm">
                Drop your first image to start building a board. You can add notes
                and tag what you want to remember.
              </p>
            </div>
          ) : (
            filteredReferences.map((reference) => (
              <article
                key={reference.id}
                className="flex flex-col gap-4 rounded-3xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-sm shadow-black/40"
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-950/80">
                  <Image
                    src={reference.url}
                    alt={reference.name}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                  <button
                    onClick={() => removeReference(reference.id)}
                    className="absolute right-3 top-3 rounded-full bg-zinc-900/80 p-2 text-zinc-300 transition hover:bg-red-500/20 hover:text-red-200"
                    aria-label={`Remove ${reference.name}`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0"
                      />
                    </svg>
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-zinc-100">
                        {reference.name}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {formatBytes(reference.size)}
                      </p>
                    </div>
                    <time className="text-xs uppercase tracking-wide text-zinc-500">
                      {new Date(reference.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => {
                      const selected = reference.categories.includes(category);
                      return (
                        <button
                          key={category}
                          onClick={() => toggleCategory(reference.id, category)}
                          className={`rounded-full px-3 py-1 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 ${
                            selected
                              ? "bg-indigo-400/20 text-indigo-200 border border-indigo-300/70"
                              : "border border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-200"
                          }`}
                        >
                          {category}
                        </button>
                      );
                    })}
                  </div>

                  <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                    Notes
                    <textarea
                      value={reference.notes}
                      onChange={(event) =>
                        updateNotes(reference.id, event.target.value)
                      }
                      placeholder="What stands out? Lighting, palette, mood, etc."
                      className="min-h-[90px] resize-none rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                    />
                  </label>
                </div>
              </article>
            ))
          )}
        </section>
      </main>
    </div>
  );
}
