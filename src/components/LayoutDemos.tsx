import { useState, useEffect, useRef } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BlogPost {
  id: string;
  title: string;
  description: string;
  date: string; // ISO string
  tags: string[];
}

export interface Project {
  id: string;
  title: string;
  description: string;
  tags: string[];
  repoUrl?: string;
  demoUrl?: string;
}

export interface AnnotationEntry {
  id: string;
  title: string;
  author: string;
  description: string;
}

interface Props {
  posts: BlogPost[];
  projects: Project[];
  annotations: AnnotationEntry[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BIO_TEXT =
  "Hi, my name is Anhad, and sometimes I go by ffledgling online. Welcome to my corner of the internet. I write about software, and occasionally about the many other things that catch my attention \u2014 finance, golf, mechanical keyboards, watches, art, and whatever else I\u2019m exploring.";

const SOCIAL_LINKS = [
  { name: "GitHub", url: "https://github.com/ffledgling", handle: "ffledgling" },
  { name: "LinkedIn", url: "https://linkedin.com/in/anhadjaisingh", handle: "anhadjaisingh" },
  { name: "Threads", url: "https://threads.net/@ffledgling", handle: "@ffledgling" },
];

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/blog", label: "Blog" },
  { href: "/annotations", label: "Annotations" },
  { href: "/projects", label: "Projects" },
];

// ---------------------------------------------------------------------------
// Layout definitions for the switcher
// ---------------------------------------------------------------------------

interface LayoutDef {
  id: string;
  name: string;
  description: string;
}

const LAYOUTS: LayoutDef[] = [
  { id: "minimalist", name: "Minimalist Bio", description: "Centered bio paragraph with social links below" },
  { id: "bento", name: "Bento Box Dashboard", description: "Multi-column grid of varied-size cards" },
  { id: "magazine", name: "Magazine / Editorial", description: "Content-forward with featured post hero" },
  { id: "blog-feed", name: "Blog-Forward Feed", description: "Reverse-chronological post list, minimal bio" },
  { id: "storytelling", name: "Storytelling Scroll", description: "Long-form vertical scroll with sections" },
  { id: "split-hero", name: "Split Hero + Content", description: "Two-column hero with content grid below" },
];

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function groupByYear(posts: BlogPost[]): Record<string, BlogPost[]> {
  const groups: Record<string, BlogPost[]> = {};
  for (const p of posts) {
    const yr = new Date(p.date).getFullYear().toString();
    if (!groups[yr]) groups[yr] = [];
    groups[yr].push(p);
  }
  return groups;
}

// ---------------------------------------------------------------------------
// Social link icon (simple inline SVGs)
// ---------------------------------------------------------------------------

function SocialIcon({ name }: { name: string }) {
  if (name === "GitHub") {
    return (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
      </svg>
    );
  }
  if (name === "LinkedIn") {
    return (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    );
  }
  // Threads
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.59 12c.025 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.187.408-2.281 1.332-3.08.898-.777 2.17-1.226 3.587-1.265.89-.025 1.737.046 2.535.209-.126-.793-.39-1.42-.786-1.868-.514-.582-1.27-.876-2.246-.876h-.057c-.755.01-1.417.222-1.97.63l-1.095-1.587c.863-.596 1.892-.915 3.07-.946h.08c1.504 0 2.716.548 3.6 1.628.79.965 1.244 2.296 1.35 3.953.391.17.754.37 1.09.597 1.19.81 2.063 1.907 2.525 3.178.736 2.024.563 4.58-1.413 6.545-2.026 2.014-4.488 2.787-7.746 2.81z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Layout 1: Minimalist Bio
// ---------------------------------------------------------------------------

function MinimalistBio({ posts: _posts, projects: _projects, annotations: _annotations }: Props) {
  return (
    <div className="py-8">
      <section className="mb-12">
        <div className="prose prose-stone prose-lg dark:prose-invert max-w-none">
          <p>
            Hi, my name is{" "}
            <span className="font-serif font-extrabold">Anhad</span>, and sometimes I
            go by <span className="font-serif font-extrabold">ffledgling</span> online.
            Welcome to my corner of the internet. I write about software, and
            occasionally about the many other things that catch my attention &mdash;
            finance, golf, mechanical keyboards, watches, art, and whatever else
            I&rsquo;m exploring.
          </p>
        </div>
      </section>

      <section className="mt-auto pt-16">
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm">
          {SOCIAL_LINKS.map((link) => (
            <a
              key={link.name}
              href={link.url}
              className="inline-flex items-center gap-1.5 text-stone-600 dark:text-stone-400 hover:text-accent transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              <SocialIcon name={link.name} />
              {link.handle}
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Layout 2: Bento Box Dashboard
// ---------------------------------------------------------------------------

function BentoBox({ posts, projects, annotations }: Props) {
  const featured = posts[0];
  const project = projects[0];
  const annotation = annotations[0];

  return (
    <div className="py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Featured post — spans 2 columns */}
        {featured && (
          <div className="md:col-span-2 border border-stone-200 dark:border-stone-700 rounded-xl p-6 hover:border-accent/40 transition-colors group">
            <span className="text-xs uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Latest Post
            </span>
            <h2 className="font-serif text-2xl mt-2 group-hover:text-accent transition-colors">
              {featured.title}
            </h2>
            <p className="text-stone-600 dark:text-stone-400 text-sm mt-1">
              {formatDate(featured.date)}
            </p>
            <p className="text-stone-700 dark:text-stone-300 mt-3 leading-relaxed">
              {featured.description}
            </p>
            <div className="flex gap-2 mt-4">
              {featured.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 px-2 py-0.5 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* About blurb */}
        <div className="border border-stone-200 dark:border-stone-700 rounded-xl p-6 hover:border-accent/40 transition-colors">
          <span className="text-xs uppercase tracking-wider text-stone-500 dark:text-stone-400">
            About
          </span>
          <p className="mt-3 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
            {BIO_TEXT}
          </p>
        </div>

        {/* Project card */}
        {project && (
          <div className="border border-stone-200 dark:border-stone-700 rounded-xl p-6 hover:border-accent/40 transition-colors">
            <span className="text-xs uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Project
            </span>
            <h3 className="font-serif text-xl mt-2">{project.title}</h3>
            <p className="text-stone-600 dark:text-stone-400 text-sm mt-2">
              {project.description}
            </p>
            <div className="flex gap-2 mt-3">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 px-2 py-0.5 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
            {project.repoUrl && (
              <a
                href={project.repoUrl}
                className="text-accent text-sm hover:underline mt-3 inline-block"
                target="_blank"
                rel="noopener noreferrer"
              >
                View Source &rarr;
              </a>
            )}
          </div>
        )}

        {/* Annotation card */}
        {annotation && (
          <div className="border border-stone-200 dark:border-stone-700 rounded-xl p-6 hover:border-accent/40 transition-colors">
            <span className="text-xs uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Reading
            </span>
            <h3 className="font-serif text-xl mt-2">{annotation.title}</h3>
            <p className="text-stone-500 dark:text-stone-400 text-sm mt-1">
              by {annotation.author}
            </p>
            <p className="text-stone-600 dark:text-stone-400 text-sm mt-2">
              {annotation.description}
            </p>
          </div>
        )}

        {/* Social links card */}
        <div className="border border-stone-200 dark:border-stone-700 rounded-xl p-6 hover:border-accent/40 transition-colors flex flex-col justify-center items-center">
          <span className="text-xs uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-4">
            Connect
          </span>
          <div className="flex gap-5">
            {SOCIAL_LINKS.map((link) => (
              <a
                key={link.name}
                href={link.url}
                className="text-stone-500 dark:text-stone-400 hover:text-accent transition-colors"
                target="_blank"
                rel="noopener noreferrer"
                title={link.name}
              >
                <SocialIcon name={link.name} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Layout 3: Magazine / Editorial
// ---------------------------------------------------------------------------

function Magazine({ posts, projects: _projects, annotations }: Props) {
  const featured = posts[0];
  const rest = posts.slice(1, 5);
  const annotation = annotations[0];

  return (
    <div className="py-8">
      {/* Featured hero post */}
      {featured && (
        <section className="mb-12 pb-10 border-b border-stone-200 dark:border-stone-700">
          <span className="text-xs uppercase tracking-wider text-accent font-semibold">
            Featured
          </span>
          <h1 className="font-serif text-4xl md:text-5xl mt-3 leading-tight">
            {featured.title}
          </h1>
          <p className="text-stone-500 dark:text-stone-400 mt-3">
            {formatDate(featured.date)}
          </p>
          <p className="text-stone-700 dark:text-stone-300 text-lg mt-4 leading-relaxed max-w-2xl">
            {featured.description}
          </p>
          <div className="flex gap-2 mt-4">
            {featured.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs border border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-400 px-2 py-0.5 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Recent posts grid */}
      {rest.length > 0 && (
        <section className="mb-12">
          <h2 className="font-serif text-2xl mb-6">Recent Writing</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {rest.map((post) => (
              <article key={post.id} className="group">
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {formatDate(post.date)}
                </p>
                <h3 className="font-serif text-lg mt-1 group-hover:text-accent transition-colors">
                  {post.title}
                </h3>
                <p className="text-stone-600 dark:text-stone-400 text-sm mt-1 line-clamp-2">
                  {post.description}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Readings row */}
      {annotation && (
        <section className="mb-12 pb-10 border-b border-stone-200 dark:border-stone-700">
          <h2 className="font-serif text-2xl mb-4">Readings</h2>
          <div className="flex items-start gap-4">
            <div className="w-1 shrink-0 bg-accent/40 self-stretch rounded-full" />
            <div>
              <h3 className="font-semibold">{annotation.title}</h3>
              <p className="text-stone-500 dark:text-stone-400 text-sm">
                by {annotation.author}
              </p>
              <p className="text-stone-600 dark:text-stone-400 text-sm mt-1">
                {annotation.description}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Bio blurb at bottom */}
      <section className="text-center text-sm text-stone-500 dark:text-stone-400 max-w-xl mx-auto">
        <p>{BIO_TEXT}</p>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Layout 4: Blog-Forward Feed
// ---------------------------------------------------------------------------

function BlogFeed({ posts, projects: _projects, annotations: _annotations }: Props) {
  const grouped = groupByYear(posts);
  const years = Object.keys(grouped).sort((a, b) => Number(b) - Number(a));

  return (
    <div className="py-8">
      {/* Tiny bio line */}
      <p className="text-stone-500 dark:text-stone-400 text-sm mb-10">
        <span className="font-serif font-bold text-stone-900 dark:text-stone-100">
          Anhad
        </span>{" "}
        / ffledgling &mdash; software, writing, and curiosities
      </p>

      {/* Post list grouped by year */}
      {years.map((year) => (
        <section key={year} className="mb-8">
          <h2 className="font-serif text-xl text-stone-400 dark:text-stone-500 mb-4 border-b border-stone-200 dark:border-stone-700 pb-2">
            {year}
          </h2>
          <ul className="space-y-3">
            {grouped[year].map((post) => (
              <li key={post.id} className="flex items-baseline gap-4 group">
                <time className="text-sm text-stone-400 dark:text-stone-500 shrink-0 tabular-nums w-24">
                  {formatDate(post.date)}
                </time>
                <span className="group-hover:text-accent transition-colors cursor-pointer">
                  {post.title}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {/* Bottom links */}
      <div className="mt-12 pt-6 border-t border-stone-200 dark:border-stone-700 flex gap-6 text-sm">
        {NAV_LINKS.filter((l) => l.label !== "Home" && l.label !== "Blog").map(
          (link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-accent hover:underline"
            >
              {link.label} &rarr;
            </a>
          ),
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Layout 5: Storytelling Scroll
// ---------------------------------------------------------------------------

function StorytellingScroll({ posts, projects, annotations }: Props) {
  const topPosts = posts.slice(0, 3);
  const project = projects[0];
  const annotation = annotations[0];

  return (
    <div>
      {/* Section 1: Hero name */}
      <section className="py-20 md:py-28 text-center">
        <h1 className="font-serif text-6xl md:text-7xl text-stone-900 dark:text-stone-100">
          Anhad
        </h1>
        <p className="text-stone-500 dark:text-stone-400 mt-4 text-lg">
          software, writing &amp; curiosities
        </p>
        <div className="mt-10 text-stone-400 dark:text-stone-600 animate-bounce">
          <svg
            className="w-6 h-6 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
      </section>

      {/* Section 2: About */}
      <section className="py-16 md:py-24 bg-stone-100/50 dark:bg-stone-900/20">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="font-serif text-3xl mb-6">About</h2>
          <p className="text-lg leading-relaxed text-stone-700 dark:text-stone-300">
            {BIO_TEXT}
          </p>
        </div>
      </section>

      {/* Section 3: Writing */}
      <section className="py-16 md:py-24">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="font-serif text-3xl mb-8">Writing</h2>
          <div className="space-y-8">
            {topPosts.map((post) => (
              <article
                key={post.id}
                className="group border-l-2 border-stone-200 dark:border-stone-700 pl-6 hover:border-accent transition-colors"
              >
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {formatDate(post.date)}
                </p>
                <h3 className="font-serif text-xl mt-1 group-hover:text-accent transition-colors">
                  {post.title}
                </h3>
                <p className="text-stone-600 dark:text-stone-400 mt-2 text-sm leading-relaxed">
                  {post.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4: Projects */}
      <section className="py-16 md:py-24 bg-stone-100/50 dark:bg-stone-900/20">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="font-serif text-3xl mb-8">Projects</h2>
          {project && (
            <div className="border border-stone-200 dark:border-stone-700 rounded-xl p-6">
              <h3 className="font-serif text-xl">{project.title}</h3>
              <p className="text-stone-600 dark:text-stone-400 mt-2">
                {project.description}
              </p>
              <div className="flex gap-2 mt-3">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400 px-2 py-0.5 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              {project.repoUrl && (
                <a
                  href={project.repoUrl}
                  className="text-accent text-sm hover:underline mt-3 inline-block"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Source &rarr;
                </a>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Section 5: Readings */}
      <section className="py-16 md:py-24">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="font-serif text-3xl mb-8">Readings</h2>
          {annotation && (
            <div className="border-l-4 border-accent/40 pl-6">
              <h3 className="font-semibold text-lg">{annotation.title}</h3>
              <p className="text-stone-500 dark:text-stone-400 text-sm">
                by {annotation.author}
              </p>
              <p className="text-stone-600 dark:text-stone-400 mt-2 leading-relaxed">
                {annotation.description}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Section 6: Connect */}
      <section className="py-16 md:py-24 bg-stone-100/50 dark:bg-stone-900/20">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="font-serif text-3xl mb-8">Connect</h2>
          <div className="flex justify-center gap-8">
            {SOCIAL_LINKS.map((link) => (
              <a
                key={link.name}
                href={link.url}
                className="flex flex-col items-center gap-2 text-stone-500 dark:text-stone-400 hover:text-accent transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <SocialIcon name={link.name} />
                <span className="text-sm">{link.name}</span>
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hero Visual Effects for Layout 6
// ---------------------------------------------------------------------------

type VisualEffect = "shimmer" | "rings" | "particles" | "blob" | "glitch" | "cards";

const EFFECT_OPTIONS: { id: VisualEffect; label: string }[] = [
  { id: "shimmer", label: "Shimmer" },
  { id: "rings", label: "Rings" },
  { id: "particles", label: "Particles" },
  { id: "blob", label: "Blob" },
  { id: "glitch", label: "Glitch" },
  { id: "cards", label: "Cards" },
];

const HERO_EFFECT_STYLES = `
@keyframes hve-shimmer-wave {
  0%, 100% { opacity: 0.15; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.1); }
}
@keyframes hve-ring-pulse {
  0% { transform: scale(0.6); opacity: 0.7; }
  100% { transform: scale(1.5); opacity: 0; }
}
@keyframes hve-particle-drift-1 {
  0%, 100% { transform: translate(0px, 0px); opacity: 0.5; }
  25% { transform: translate(8px, -12px); opacity: 0.8; }
  50% { transform: translate(-4px, -8px); opacity: 0.4; }
  75% { transform: translate(12px, 4px); opacity: 0.7; }
}
@keyframes hve-particle-drift-2 {
  0%, 100% { transform: translate(0px, 0px); opacity: 0.6; }
  25% { transform: translate(-10px, 6px); opacity: 0.4; }
  50% { transform: translate(6px, 10px); opacity: 0.8; }
  75% { transform: translate(-8px, -6px); opacity: 0.5; }
}
@keyframes hve-particle-drift-3 {
  0%, 100% { transform: translate(0px, 0px); opacity: 0.4; }
  33% { transform: translate(14px, -8px); opacity: 0.7; }
  66% { transform: translate(-6px, 12px); opacity: 0.5; }
}
@keyframes hve-blob-morph {
  0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; transform: scale(1) rotate(0deg); }
  25% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; transform: scale(1.03) rotate(2deg); }
  50% { border-radius: 50% 60% 30% 60% / 30% 40% 70% 50%; transform: scale(0.97) rotate(-1deg); }
  75% { border-radius: 40% 60% 50% 40% / 60% 50% 40% 60%; transform: scale(1.02) rotate(1deg); }
}
@keyframes hve-cursor-blink {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}
@keyframes hve-scanline {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(100%); }
}
@keyframes hve-card-shuffle {
  0%, 15% { transform: var(--card-start-transform); z-index: var(--card-start-z); }
  20%, 95% { transform: var(--card-end-transform); z-index: var(--card-end-z); }
  100% { transform: var(--card-start-transform); z-index: var(--card-start-z); }
}
`;

/* ---------- Effect 1: Shimmer Grid ---------- */
function ShimmerGrid({ hovered }: { hovered: boolean }) {
  const gridSize = 5;
  const cells = [];
  const center = Math.floor(gridSize / 2);
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const dist = Math.abs(r - center) + Math.abs(c - center);
      cells.push({ r, c, dist });
    }
  }
  return (
    <div className="relative w-48 h-48 md:w-56 md:h-56 flex items-center justify-center">
      <div
        className="absolute inset-0 grid gap-1.5"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          gridTemplateRows: `repeat(${gridSize}, 1fr)`,
          padding: "8px",
        }}
      >
        {cells.map(({ r, c, dist }) => (
          <div
            key={`${r}-${c}`}
            className="rounded-sm bg-accent/20 dark:bg-accent/15"
            style={{
              willChange: "transform, opacity",
              animationName: "hve-shimmer-wave",
              animationDuration: hovered ? "1.2s" : "2.4s",
              animationTimingFunction: "ease-in-out",
              animationIterationCount: "infinite",
              animationDelay: `${dist * (hovered ? 80 : 150)}ms`,
            }}
          />
        ))}
      </div>
      <span
        className="relative z-10 font-serif text-5xl text-accent/80 dark:text-accent/60 drop-shadow-sm"
        style={{ willChange: "opacity" }}
      >
        ff
      </span>
    </div>
  );
}

/* ---------- Effect 2: Breathing Rings ---------- */
function BreathingRings({ hovered }: { hovered: boolean }) {
  const rings = [0, 1, 2, 3];
  return (
    <div className="relative w-48 h-48 md:w-56 md:h-56 flex items-center justify-center">
      {rings.map((i) => (
        <div
          key={i}
          className="absolute rounded-2xl border-2 border-accent/40 dark:border-accent/25"
          style={{
            inset: "16px",
            willChange: "transform, opacity",
            animationName: "hve-ring-pulse",
            animationDuration: hovered ? "1.6s" : "3s",
            animationTimingFunction: "ease-out",
            animationIterationCount: "infinite",
            animationDelay: `${i * (hovered ? 400 : 750)}ms`,
            boxShadow: hovered ? "0 0 12px rgba(220,20,60,0.3)" : "none",
            transition: "box-shadow 0.3s ease",
          }}
        />
      ))}
      <span
        className="relative z-10 font-serif text-5xl text-accent/80 dark:text-accent/60"
        style={{ willChange: "opacity" }}
      >
        ff
      </span>
    </div>
  );
}

/* ---------- Effect 3: Floating Particles ---------- */
function FloatingParticles({ hovered }: { hovered: boolean }) {
  const particles = useRef(
    Array.from({ length: 14 }, (_, i) => ({
      id: i,
      x: 20 + Math.sin(i * 1.7) * 35 + 30,
      y: 20 + Math.cos(i * 2.1) * 35 + 30,
      size: 3 + (i % 4) * 2,
      isAccent: i % 3 !== 0,
      animName: `hve-particle-drift-${(i % 3) + 1}` as string,
      duration: 3 + (i % 3) * 1.5,
      delay: i * 0.3,
    }))
  ).current;

  return (
    <div className="relative w-48 h-48 md:w-56 md:h-56 flex items-center justify-center">
      {particles.map((p) => (
        <div
          key={p.id}
          className={`absolute rounded-full ${
            p.isAccent
              ? "bg-accent/40 dark:bg-accent/30"
              : "bg-stone-400/40 dark:bg-stone-500/30"
          }`}
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            willChange: "transform, opacity",
            animationName: p.animName,
            animationDuration: `${p.duration}s`,
            animationTimingFunction: "ease-in-out",
            animationIterationCount: "infinite",
            animationDelay: `${p.delay}s`,
            transform: hovered ? `translate(${(p.x - 50) * 0.3}px, ${(p.y - 50) * 0.3}px)` : undefined,
            transition: hovered ? "none" : "transform 0.5s ease",
          }}
        />
      ))}
      <span
        className="relative z-10 font-serif text-5xl text-accent/80 dark:text-accent/60"
        style={{ willChange: "opacity" }}
      >
        ff
      </span>
    </div>
  );
}

/* ---------- Effect 4: Morphing Blob ---------- */
function MorphingBlob({ hovered }: { hovered: boolean }) {
  return (
    <div className="relative w-48 h-48 md:w-56 md:h-56 flex items-center justify-center">
      <div
        className="absolute bg-accent/15 dark:bg-accent/10"
        style={{
          inset: "10px",
          willChange: "transform",
          animation: "hve-blob-morph 8s ease-in-out infinite",
          transform: hovered ? "scale(1.1)" : undefined,
          transition: "transform 0.4s ease",
        }}
      />
      <div
        className="absolute bg-accent/10 dark:bg-accent/7"
        style={{
          inset: "4px",
          willChange: "transform",
          animationName: "hve-blob-morph",
          animationDuration: "8s",
          animationTimingFunction: "ease-in-out",
          animationIterationCount: "infinite",
          animationDelay: "-3s",
          animationDirection: "reverse",
          transform: hovered ? "scale(1.15)" : undefined,
          transition: "transform 0.4s ease",
        }}
      />
      <span
        className="relative z-10 font-serif text-5xl text-accent/80 dark:text-accent/60"
        style={{ willChange: "opacity" }}
      >
        ff
      </span>
    </div>
  );
}

/* ---------- Effect 5: Typewriter Glitch ---------- */
function TypewriterGlitch({ hovered }: { hovered: boolean }) {
  const [displayText, setDisplayText] = useState("ff");
  const [isGlitching, setIsGlitching] = useState(false);
  const glitchChars = "!@#$%^&*<>{}[]|/\\~`";

  useEffect(() => {
    const glitch = () => {
      if (isGlitching) return;
      setIsGlitching(true);
      let count = 0;
      const maxFlicks = hovered ? 8 : 4;
      const flickInterval = setInterval(() => {
        if (count < maxFlicks) {
          setDisplayText(
            Array.from({ length: 2 }, () =>
              glitchChars[Math.floor(Math.random() * glitchChars.length)]
            ).join("")
          );
          count++;
        } else {
          clearInterval(flickInterval);
          setDisplayText("ff");
          setIsGlitching(false);
        }
      }, 60);
    };

    const interval = setInterval(glitch, hovered ? 1500 : 3500);
    return () => clearInterval(interval);
  }, [hovered, isGlitching]);

  return (
    <div className="relative w-48 h-48 md:w-56 md:h-56 flex items-center justify-center overflow-hidden">
      {/* Scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-20 opacity-10"
        style={{
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(220,20,60,0.08) 2px, rgba(220,20,60,0.08) 4px)",
        }}
      />
      {/* Animated scanline bar */}
      <div
        className="absolute inset-x-0 h-8 bg-accent/5 dark:bg-accent/3 pointer-events-none z-20"
        style={{
          willChange: "transform",
          animation: "hve-scanline 4s linear infinite",
        }}
      />
      {/* Background terminal */}
      <div className="absolute inset-4 rounded-lg bg-stone-900/5 dark:bg-stone-100/5 border border-accent/10 dark:border-accent/8" />
      {/* Text */}
      <div className="relative z-10 flex items-center">
        <span
          className="font-mono text-5xl font-bold text-accent/80 dark:text-accent/60"
          style={{
            willChange: "opacity",
            textShadow: isGlitching ? "2px 0 #dc143c, -2px 0 #0ff" : "none",
            transition: "text-shadow 0.05s",
          }}
        >
          {displayText}
        </span>
        <span
          className="font-mono text-5xl font-bold text-accent/60 dark:text-accent/40 ml-0.5"
          style={{
            willChange: "opacity",
            animation: "hve-cursor-blink 1s step-end infinite",
          }}
        >
          _
        </span>
      </div>
    </div>
  );
}

/* ---------- Effect 6: Stacked Cards ---------- */
function StackedCards({ hovered }: { hovered: boolean }) {
  const cardCount = 6;
  const cards = Array.from({ length: cardCount }, (_, i) => {
    const angle = (i - cardCount / 2) * 4;
    const offsetX = (i - cardCount / 2) * 3;
    const offsetY = i * -2;
    return { id: i, angle, offsetX, offsetY };
  });

  return (
    <div className="relative w-48 h-48 md:w-56 md:h-56 flex items-center justify-center">
      {cards.map((card, idx) => {
        const isTop = idx === cards.length - 1;
        const spreadAngle = hovered ? card.angle * 2.5 : card.angle;
        const spreadX = hovered ? card.offsetX * 4 : card.offsetX;
        const spreadY = hovered ? card.offsetY * 2 : card.offsetY;
        return (
          <div
            key={card.id}
            className={`absolute w-28 h-36 md:w-32 md:h-40 rounded-xl border ${
              isTop
                ? "bg-accent/15 dark:bg-accent/10 border-accent/25 dark:border-accent/15"
                : "bg-stone-200/60 dark:bg-stone-700/30 border-stone-300/50 dark:border-stone-600/30"
            }`}
            style={{
              willChange: "transform",
              transform: `rotate(${spreadAngle}deg) translate(${spreadX}px, ${spreadY}px)`,
              transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
              zIndex: idx,
              background: isTop
                ? undefined
                : `linear-gradient(135deg, rgba(220,20,60,${0.03 + idx * 0.02}), transparent)`,
            }}
          >
            {isTop && (
              <div className="flex items-center justify-center h-full">
                <span className="font-serif text-4xl text-accent/70 dark:text-accent/50">
                  ff
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Main HeroVisualEffect Component ---------- */
function HeroVisualEffect({ effect }: { effect: VisualEffect }) {
  const [hovered, setHovered] = useState(false);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: HERO_EFFECT_STYLES }} />
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="cursor-pointer"
      >
        {effect === "shimmer" && <ShimmerGrid hovered={hovered} />}
        {effect === "rings" && <BreathingRings hovered={hovered} />}
        {effect === "particles" && <FloatingParticles hovered={hovered} />}
        {effect === "blob" && <MorphingBlob hovered={hovered} />}
        {effect === "glitch" && <TypewriterGlitch hovered={hovered} />}
        {effect === "cards" && <StackedCards hovered={hovered} />}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Layout 6: Split Hero + Content
// ---------------------------------------------------------------------------

function SplitHero({ posts, projects, annotations }: Props) {
  const topPosts = posts.slice(0, 3);
  const project = projects[0];
  const annotation = annotations[0];
  const [activeEffect, setActiveEffect] = useState<VisualEffect>("shimmer");

  return (
    <div className="py-8">
      {/* Hero: two-column split */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center mb-16 pb-12 border-b border-stone-200 dark:border-stone-700">
        {/* Left: text */}
        <div>
          <h1 className="font-serif text-5xl md:text-6xl">Anhad</h1>
          <p className="text-stone-500 dark:text-stone-400 mt-2 text-lg">
            a.k.a. ffledgling
          </p>
          <p className="text-stone-700 dark:text-stone-300 mt-4 leading-relaxed">
            {BIO_TEXT}
          </p>
          <div className="flex gap-3 mt-6">
            <a
              href="/blog"
              className="inline-block bg-accent text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors"
            >
              Read Blog
            </a>
            <a
              href="/projects"
              className="inline-block border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 px-5 py-2 rounded-lg text-sm font-medium hover:border-accent hover:text-accent transition-colors"
            >
              View Projects
            </a>
          </div>
        </div>

        {/* Right: decorative accent + social links */}
        <div className="flex flex-col items-center md:items-end gap-6">
          {/* Animated decorative element */}
          <HeroVisualEffect effect={activeEffect} />
          {/* Effect selector */}
          <div className="flex flex-wrap justify-center md:justify-end gap-1.5">
            <span className="text-xs text-stone-400 dark:text-stone-500 self-center mr-1">Effect:</span>
            {EFFECT_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setActiveEffect(opt.id)}
                className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                  activeEffect === opt.id
                    ? "bg-accent/15 dark:bg-accent/10 text-accent font-medium"
                    : "text-stone-500 dark:text-stone-400 hover:text-accent hover:bg-accent/5"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {/* Social links vertical */}
          <div className="flex md:flex-col gap-4 md:gap-3 md:items-end">
            {SOCIAL_LINKS.map((link) => (
              <a
                key={link.name}
                href={link.url}
                className="inline-flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400 hover:text-accent transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <SocialIcon name={link.name} />
                <span className="hidden md:inline">{link.handle}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom: three columns */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Latest posts */}
        <div>
          <h2 className="font-serif text-xl mb-4 pb-2 border-b border-stone-200 dark:border-stone-700">
            Latest Posts
          </h2>
          <ul className="space-y-4">
            {topPosts.map((post) => (
              <li key={post.id} className="group">
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {formatDate(post.date)}
                </p>
                <h3 className="text-sm font-medium group-hover:text-accent transition-colors cursor-pointer">
                  {post.title}
                </h3>
              </li>
            ))}
          </ul>
        </div>

        {/* Projects */}
        <div>
          <h2 className="font-serif text-xl mb-4 pb-2 border-b border-stone-200 dark:border-stone-700">
            Projects
          </h2>
          {project && (
            <div>
              <h3 className="text-sm font-medium">{project.title}</h3>
              <p className="text-stone-600 dark:text-stone-400 text-xs mt-1">
                {project.description}
              </p>
              {project.repoUrl && (
                <a
                  href={project.repoUrl}
                  className="text-accent text-xs hover:underline mt-2 inline-block"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Source &rarr;
                </a>
              )}
            </div>
          )}
        </div>

        {/* Readings */}
        <div>
          <h2 className="font-serif text-xl mb-4 pb-2 border-b border-stone-200 dark:border-stone-700">
            Readings
          </h2>
          {annotation && (
            <div>
              <h3 className="text-sm font-medium">{annotation.title}</h3>
              <p className="text-stone-500 dark:text-stone-400 text-xs mt-1">
                by {annotation.author}
              </p>
              <p className="text-stone-600 dark:text-stone-400 text-xs mt-1">
                {annotation.description}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Switcher Panel
// ---------------------------------------------------------------------------

function SwitcherPanel({
  active,
  onSelect,
}: {
  active: string;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-[60]">
      {/* Expanded panel */}
      {open && (
        <div className="mb-3 bg-stone-900/90 dark:bg-stone-950/90 backdrop-blur-md rounded-xl p-4 w-72 shadow-xl border border-stone-700/50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white text-sm font-semibold">Layout Variants</h3>
            <button
              onClick={() => setOpen(false)}
              className="text-stone-400 hover:text-white transition-colors"
              aria-label="Close panel"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div className="space-y-1">
            {LAYOUTS.map((layout) => (
              <button
                key={layout.id}
                onClick={() => {
                  onSelect(layout.id);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                  active === layout.id
                    ? "bg-accent text-white"
                    : "text-stone-300 hover:bg-stone-800 hover:text-white"
                }`}
              >
                <span className="font-medium block">{layout.name}</span>
                <span
                  className={`text-xs block mt-0.5 ${
                    active === layout.id ? "text-white/70" : "text-stone-500"
                  }`}
                >
                  {layout.description}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="bg-accent hover:bg-accent-hover text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-colors"
        aria-label="Toggle layout switcher"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
          />
        </svg>
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const LAYOUT_COMPONENTS: Record<string, React.FC<Props>> = {
  minimalist: MinimalistBio,
  bento: BentoBox,
  magazine: Magazine,
  "blog-feed": BlogFeed,
  storytelling: StorytellingScroll,
  "split-hero": SplitHero,
};

export default function LayoutDemos({ posts, projects, annotations }: Props) {
  const [activeLayout, setActiveLayout] = useState("minimalist");

  const LayoutComponent = LAYOUT_COMPONENTS[activeLayout] ?? MinimalistBio;

  return (
    <div>
      <LayoutComponent posts={posts} projects={projects} annotations={annotations} />
      <SwitcherPanel active={activeLayout} onSelect={setActiveLayout} />
    </div>
  );
}
