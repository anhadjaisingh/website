import { GITHUB_USERNAME } from "./social-links";

export interface GitHubRepo {
  name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  language: string | null;
  fork: boolean;
  pushed_at: string;
}

export async function fetchTopRepos(limit = 6): Promise<GitHubRepo[]> {
  const res = await fetch(
    `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=stars&direction=desc&per_page=100&type=owner`,
    { headers: { Accept: "application/vnd.github.v3+json" } },
  );

  if (!res.ok) {
    console.error(`GitHub API error: ${res.status}`);
    return [];
  }

  const repos: GitHubRepo[] = await res.json();

  return repos
    .filter((r) => !r.fork)
    .sort((a, b) => {
      // Primary: stars descending, secondary: recent push
      if (b.stargazers_count !== a.stargazers_count)
        return b.stargazers_count - a.stargazers_count;
      return new Date(b.pushed_at).valueOf() - new Date(a.pushed_at).valueOf();
    })
    .slice(0, limit);
}
