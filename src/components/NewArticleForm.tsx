import { useState } from "react";

export default function NewArticleForm() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/annotations/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create article");
      }

      window.location.href = `/annotations/${data.slug}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-10 p-4 rounded-lg border-2 border-dashed border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-800/30"
    >
      <div className="text-sm font-medium text-stone-600 dark:text-stone-400 mb-2">
        + New Article
      </div>
      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/article"
          required
          className="flex-1 px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-accent/50"
        />
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="px-4 py-2 text-sm rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {loading ? "Fetching..." : "Fetch & Create"}
        </button>
      </div>
      {error && (
        <div className="mt-2 text-sm text-red-500 dark:text-red-400">
          {error}
        </div>
      )}
    </form>
  );
}
