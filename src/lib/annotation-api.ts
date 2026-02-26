import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import type { Annotation } from "./annotations";
import type { IncomingMessage, ServerResponse } from "node:http";

const ANNOTATIONS_DIR = path.join(process.cwd(), "src/content/annotations");

function parseBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk: Buffer) => (body += chunk.toString()));
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function jsonResponse(res: ServerResponse, status: number, data: unknown) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

/**
 * POST /api/annotations/create
 * Body: { url: string }
 * Creates source.md + annotations.yaml from a URL.
 */
async function handleCreate(req: IncomingMessage, res: ServerResponse) {
  const body = JSON.parse(await parseBody(req));
  const { url } = body;

  if (!url || typeof url !== "string") {
    return jsonResponse(res, 400, { error: "url is required" });
  }

  try {
    // Dynamic import to avoid Vite processing Playwright through its module runner
    const { fetchArticle } = await import("./article-fetcher");
    const article = await fetchArticle(url);

    const dir = path.join(ANNOTATIONS_DIR, article.slug);
    fs.mkdirSync(dir, { recursive: true });

    // Write source.md
    const today = new Date().toISOString().split("T")[0];
    const frontmatter = [
      "---",
      `title: "${article.title.replace(/"/g, '\\"')}"`,
      `author: "${article.author.replace(/"/g, '\\"')}"`,
      `sourceUrl: "${url}"`,
      `snapshotDate: ${today}`,
      `description: "My annotated reading of ${article.title.replace(/"/g, '\\"')}."`,
      `tags: []`,
      "---",
    ].join("\n");

    fs.writeFileSync(
      path.join(dir, "source.md"),
      `${frontmatter}\n\n${article.content}\n`,
    );

    // Write empty annotations.yaml
    fs.writeFileSync(path.join(dir, "annotations.yaml"), "annotations: []\n");

    jsonResponse(res, 200, { slug: article.slug, title: article.title });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    jsonResponse(res, 500, { error: message });
  }
}

/**
 * POST /api/annotations/save
 * Body: { slug: string, annotations: Annotation[] }
 * Overwrites annotations.yaml with the provided array.
 */
async function handleSave(req: IncomingMessage, res: ServerResponse) {
  const body = JSON.parse(await parseBody(req));
  const { slug, annotations } = body;

  if (!slug || !Array.isArray(annotations)) {
    return jsonResponse(res, 400, {
      error: "slug and annotations[] are required",
    });
  }

  const yamlPath = path.join(ANNOTATIONS_DIR, slug, "annotations.yaml");
  if (!fs.existsSync(path.dirname(yamlPath))) {
    return jsonResponse(res, 404, { error: "Annotation directory not found" });
  }

  const yamlContent = yaml.dump(
    { annotations },
    { lineWidth: -1, quotingType: '"' },
  );
  fs.writeFileSync(yamlPath, yamlContent);

  jsonResponse(res, 200, { ok: true });
}

/**
 * POST /api/annotations/delete
 * Body: { slug: string, id: string }
 * Removes a single annotation by id from annotations.yaml.
 */
async function handleDelete(req: IncomingMessage, res: ServerResponse) {
  const body = JSON.parse(await parseBody(req));
  const { slug, id } = body;

  if (!slug || !id) {
    return jsonResponse(res, 400, { error: "slug and id are required" });
  }

  const yamlPath = path.join(ANNOTATIONS_DIR, slug, "annotations.yaml");
  if (!fs.existsSync(yamlPath)) {
    return jsonResponse(res, 404, { error: "annotations.yaml not found" });
  }

  const yamlContent = fs.readFileSync(yamlPath, "utf-8");
  const parsed = yaml.load(yamlContent) as {
    annotations?: Annotation[];
  } | null;
  const current = parsed?.annotations ?? [];
  const filtered = current.filter((a) => a.id !== id);

  const newYaml = yaml.dump(
    { annotations: filtered },
    { lineWidth: -1, quotingType: '"' },
  );
  fs.writeFileSync(yamlPath, newYaml);

  jsonResponse(res, 200, { ok: true });
}

/**
 * Vite plugin that adds annotation API middleware during dev.
 * Does nothing during production builds.
 */
export function annotationApiPlugin() {
  return {
    name: "annotation-api",
    configureServer(server: { middlewares: { use: Function } }) {
      server.middlewares.use(
        async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
          const url = req.url || "";

          if (url === "/api/annotations/create" && req.method === "POST") {
            return handleCreate(req, res);
          }
          if (url === "/api/annotations/save" && req.method === "POST") {
            return handleSave(req, res);
          }
          if (url === "/api/annotations/delete" && req.method === "POST") {
            return handleDelete(req, res);
          }

          next();
        },
      );
    },
  };
}
