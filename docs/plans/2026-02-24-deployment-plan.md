# Deployment Plan: ffledgling.dev on Cloudflare Pages

**Date:** 2026-02-24
**Project:** ffledgling-dev (Astro v5 static site)
**Repo:** github.com/anhadjaisingh/website
**Primary domain:** ffledgling.dev
**Redirect domain:** anhadjaisingh.com -> ffledgling.dev

---

## Current State

- Astro v5 static site, output mode: static (no SSR, no `@astrojs/cloudflare` adapter needed)
- `astro.config.mjs` already has `site: "https://ffledgling.dev"`
- `wrangler.toml` already has `name = "ffledgling-dev"` and `assets.directory = "./dist"`
- Build command: `npm run build` (produces `./dist`)
- CI already runs lint, type check, unit tests, build, and e2e tests on push/PR via GitHub Actions
- Node 22 used in CI

---

## 1. Create Cloudflare Pages Project (Connect GitHub Repo)

### Option A: Dashboard (recommended for initial setup)

1. Log into [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Go to **Workers & Pages** in the left sidebar
3. Click **Create** -> select the **Pages** tab
4. Select **Connect to Git**
5. Authenticate with GitHub if not already connected
6. Select the `anhadjaisingh/website` repository
7. Configure the build settings (see Section 2)
8. Click **Save and Deploy**

This creates the project at `ffledgling-dev.pages.dev` and triggers the first build.

### Option B: Wrangler CLI (if you prefer CLI)

```bash
# From the project root
npx wrangler pages project create ffledgling-dev --production-branch main
```

Note: If using CLI-only, you still need to connect GitHub via the dashboard for auto-deploy on push. The CLI approach is better suited for direct uploads (Section 8).

---

## 2. Build Configuration

Set these in the Cloudflare Pages dashboard under your project -> **Settings** -> **Builds & deployments**:

| Setting                    | Value           |
| -------------------------- | --------------- |
| **Framework preset**       | Astro           |
| **Build command**          | `npm run build` |
| **Build output directory** | `dist`          |
| **Root directory**         | `/` (default)   |
| **Production branch**      | `main`          |

### Environment Variables

Set these under **Settings** -> **Environment variables**:

| Variable       | Value | Scope                |
| -------------- | ----- | -------------------- |
| `NODE_VERSION` | `22`  | Production + Preview |

Cloudflare Pages defaults to an older Node version. Setting `NODE_VERSION=22` matches the CI configuration and ensures compatibility with Astro v5 and Tailwind v4.

No other environment variables are needed for a static site build.

---

## 3. Custom Domain Setup: ffledgling.dev

### 3a. Add ffledgling.dev as a Cloudflare Zone

Since `ffledgling.dev` is an apex domain (not a subdomain), it **must** be added as a zone in Cloudflare:

1. In Cloudflare Dashboard, click **Add a site** (top right or from the home page)
2. Enter `ffledgling.dev`
3. Select the **Free** plan
4. Cloudflare will scan existing DNS records -- review and confirm
5. Cloudflare assigns two nameservers, e.g.:
   - `ada.ns.cloudflare.com`
   - `luke.ns.cloudflare.com`
     (actual values will be shown in dashboard)

### 3b. Update Nameservers at Your Registrar

Go to wherever `ffledgling.dev` is registered (Namecheap, Google Domains, Cloudflare Registrar, etc.) and replace the existing nameservers with the two Cloudflare-assigned nameservers.

- Nameserver propagation can take up to 24 hours but usually completes within an hour
- Cloudflare will email you when the zone is active

### 3c. Attach Domain to Pages Project

1. Go to **Workers & Pages** -> select `ffledgling-dev` project
2. Click **Custom domains** tab
3. Click **Set up a custom domain**
4. Enter `ffledgling.dev`
5. Cloudflare will automatically create the required CNAME record:
   - **Type:** CNAME (flattened at apex)
   - **Name:** `@` (or `ffledgling.dev`)
   - **Target:** `ffledgling-dev.pages.dev`
   - **Proxy:** On (orange cloud)
6. Click **Activate domain**

Also add the `www` subdomain:

1. Click **Set up a custom domain** again
2. Enter `www.ffledgling.dev`
3. Cloudflare auto-creates:
   - **Type:** CNAME
   - **Name:** `www`
   - **Target:** `ffledgling-dev.pages.dev`

**Important:** Do NOT manually add CNAME records before attaching the domain in Pages. The Pages dashboard must create them, otherwise you get 522 errors.

---

## 4. HTTPS

HTTPS is automatic with Cloudflare Pages. No action required.

- Cloudflare issues a Universal SSL certificate covering `ffledgling.dev` and `*.ffledgling.dev`
- Certificate is auto-renewed
- Edge certificates are free on all plans
- If you have restrictive CAA DNS records, add these to allow Cloudflare to issue certs:
  ```
  ffledgling.dev.  IN  CAA  0 issue "comodoca.com"
  ffledgling.dev.  IN  CAA  0 issue "digicert.com"
  ffledgling.dev.  IN  CAA  0 issue "letsencrypt.org"
  ffledgling.dev.  IN  CAA  0 issuewild "comodoca.com"
  ffledgling.dev.  IN  CAA  0 issuewild "digicert.com"
  ffledgling.dev.  IN  CAA  0 issuewild "letsencrypt.org"
  ```
  (Only needed if you've explicitly set CAA records. If you haven't, skip this.)

### SSL/TLS Mode

Go to **SSL/TLS** for the `ffledgling.dev` zone and set encryption mode to **Full (strict)**.

---

## 5. Redirect anhadjaisingh.com to ffledgling.dev

This requires two things: (a) anhadjaisingh.com must be proxied through Cloudflare, and (b) a redirect rule must be configured.

### 5a. Add anhadjaisingh.com as a Cloudflare Zone

1. Click **Add a site** -> enter `anhadjaisingh.com`
2. Select the **Free** plan
3. Update nameservers at the registrar to the Cloudflare-assigned ones (same process as Section 3b)
4. Once active, add a DNS record so the domain resolves (required for redirects to work):
   - **Type:** A
   - **Name:** `@`
   - **Content:** `192.0.2.1` (dummy address -- traffic will be redirected before hitting this)
   - **Proxy:** On (orange cloud) -- **this is critical**
5. Also add for www:
   - **Type:** CNAME
   - **Name:** `www`
   - **Content:** `anhadjaisingh.com`
   - **Proxy:** On (orange cloud)

### 5b. Create Redirect Rules

**Option 1: Single Redirect Rules (simpler for this use case)**

1. In Cloudflare Dashboard, select the `anhadjaisingh.com` zone
2. Go to **Rules** -> **Redirect Rules**
3. Click **Create rule**
4. Configure:
   - **Rule name:** `Redirect to ffledgling.dev`
   - **When incoming requests match:** Hostname equals `anhadjaisingh.com` OR Hostname equals `www.anhadjaisingh.com`
   - **Then:**
     - **Type:** Dynamic
     - **Expression:** `concat("https://ffledgling.dev", http.request.uri.path)`
     - **Status code:** `301` (permanent redirect)
     - **Preserve query string:** Yes
5. Click **Deploy**

This redirects `anhadjaisingh.com/any/path?query=1` to `ffledgling.dev/any/path?query=1`.

**Option 2: Bulk Redirects (if you want account-level control)**

1. Go to account-level **Manage Account** -> **Bulk Redirects**
2. Create a Bulk Redirect List:
   - Source URL: `anhadjaisingh.com`
   - Target URL: `https://ffledgling.dev`
   - Status: 301
   - Check "Include subdomains" and "Subpath matching" and "Preserve path suffix"
3. Create a Bulk Redirect Rule referencing that list
4. Save and deploy

Recommendation: Use Option 1 (Single Redirect Rules). It is simpler and sufficient for a single domain redirect.

---

## 6. Git Push Auto-Deploy

No additional configuration needed. Once the GitHub repo is connected to Cloudflare Pages (Section 1):

- **Push to `main`** -> triggers a production deployment to `ffledgling.dev`
- **Push to any other branch** -> triggers a preview deployment at `<branch-name>.ffledgling-dev.pages.dev`
- **Open a PR** -> triggers a preview deployment; Cloudflare adds a deployment status check to the PR

This is fully automatic. Builds appear under **Workers & Pages** -> `ffledgling-dev` -> **Deployments**.

### Build Logs

View build logs in the dashboard under your project's **Deployments** tab. Each deployment shows build output, duration, and status.

---

## 7. Preview Deployments for PRs

Preview deployments work automatically when Cloudflare Pages is connected to the GitHub repo:

- Every PR gets a unique URL: `<commit-hash>.ffledgling-dev.pages.dev`
- Branch alias URLs also work: `<branch-name>.ffledgling-dev.pages.dev`
- Cloudflare posts a deployment status to the PR with the preview URL
- Preview deployments are free and unlimited on all plans

### Access Control (Optional)

To restrict preview deployments (e.g., to team members only):

1. Go to **Workers & Pages** -> `ffledgling-dev` -> **Settings** -> **General**
2. Under **Preview deployments**, you can configure access policies using Cloudflare Access

---

## 8. Optional: GitHub Actions Deploy with Wrangler (Direct Upload)

If you want CI to control deploys (instead of Cloudflare's built-in Git integration), use `wrangler-action` for direct upload. This gives you more control: deploy only after tests pass, custom build steps, etc.

**Important:** If you use this approach, do NOT also connect the repo via the Cloudflare dashboard Git integration. Choose one or the other to avoid double deploys.

### 8a. Create Cloudflare API Token

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) -> **My Profile** (top right) -> **API Tokens**
2. Click **Create Token**
3. Select **Create Custom Token**
4. Configure:
   - **Token name:** `GitHub Actions - ffledgling-dev`
   - **Permissions:**
     - Account | Cloudflare Pages | Edit
   - **Account Resources:** Include -> your account
5. Click **Continue to summary** -> **Create Token**
6. Copy the token (you won't see it again)

### 8b. Add Secrets to GitHub Repo

1. Go to `github.com/anhadjaisingh/website` -> **Settings** -> **Secrets and variables** -> **Actions**
2. Add two repository secrets:
   - `CLOUDFLARE_API_TOKEN` -> paste the token from 8a
   - `CLOUDFLARE_ACCOUNT_ID` -> find this in Cloudflare Dashboard sidebar or under **Workers & Pages** -> **Overview** (right side)

### 8c. Add Deploy Job to CI Workflow

Add a deploy job to `.github/workflows/ci.yml` that runs after the existing `ci` job:

```yaml
deploy:
  needs: ci
  if: github.event_name == 'push'
  runs-on: ubuntu-latest
  permissions:
    contents: read
    deployments: write
  steps:
    - uses: actions/checkout@v4

    - uses: actions/setup-node@v4
      with:
        node-version: 22
        cache: "npm"

    - name: Install dependencies
      run: npm ci

    - name: Build
      run: npm run build

    - name: Deploy to Cloudflare Pages
      id: deploy
      uses: cloudflare/wrangler-action@v3
      with:
        apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
        accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
        command: pages deploy dist --project-name=ffledgling-dev --branch=${{ github.ref_name }}

    - name: Print deployment URL
      run: echo "Deployed to ${{ steps.deploy.outputs.deployment-url }}"
```

For PR preview deployments with the GitHub Actions approach, add a separate workflow:

```yaml
deploy-preview:
  needs: ci
  if: github.event_name == 'pull_request'
  runs-on: ubuntu-latest
  permissions:
    contents: read
    deployments: write
    pull-requests: write
  steps:
    - uses: actions/checkout@v4

    - uses: actions/setup-node@v4
      with:
        node-version: 22
        cache: "npm"

    - name: Install dependencies
      run: npm ci

    - name: Build
      run: npm run build

    - name: Deploy preview to Cloudflare Pages
      id: deploy
      uses: cloudflare/wrangler-action@v3
      with:
        apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
        accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
        command: pages deploy dist --project-name=ffledgling-dev --branch=${{ github.head_ref }}

    - name: Comment preview URL on PR
      uses: actions/github-script@v7
      with:
        script: |
          github.rest.issues.createComment({
            issue_number: context.issue.number,
            owner: context.repo.owner,
            repo: context.repo.repo,
            body: `Preview deployment: ${{ steps.deploy.outputs.deployment-url }}\nBranch alias: ${{ steps.deploy.outputs.pages-deployment-alias-url }}`
          })
```

### Key difference: Git integration vs. Direct Upload

| Feature            | Git Integration (Section 1) | Direct Upload (Section 8)   |
| ------------------ | --------------------------- | --------------------------- |
| Setup effort       | Lower                       | Higher                      |
| Deploy trigger     | Any push to connected repo  | Only when CI workflow runs  |
| Deploy after tests | No (builds independently)   | Yes (runs after `ci` job)   |
| Preview URLs       | Automatic on PRs            | Manual (via workflow)       |
| Build environment  | Cloudflare's build system   | GitHub Actions runner       |
| Build minutes      | 500/month free (Pages)      | Uses GitHub Actions minutes |

**Recommendation:** Start with Git integration (Section 1). It is simpler and the preview deployment UX is better. Switch to direct upload only if you need deploys gated on CI passing.

---

## Verification Checklist

After completing all steps, verify:

- [ ] `ffledgling-dev.pages.dev` loads the site
- [ ] `ffledgling.dev` loads the site with HTTPS
- [ ] `www.ffledgling.dev` loads the site (or redirects to apex)
- [ ] `anhadjaisingh.com` 301-redirects to `https://ffledgling.dev`
- [ ] `www.anhadjaisingh.com` 301-redirects to `https://ffledgling.dev`
- [ ] Push to `main` triggers a production deploy
- [ ] Opening a PR creates a preview deployment with a unique URL
- [ ] SSL certificate is valid and auto-renewing (check in **SSL/TLS** -> **Edge Certificates**)

### DNS Propagation Check

```bash
# Verify ffledgling.dev resolves
dig ffledgling.dev +short

# Verify redirect works
curl -I https://anhadjaisingh.com

# Expected: HTTP/2 301, Location: https://ffledgling.dev/
```

---

## Estimated Timeline

| Step                                     | Time                    |
| ---------------------------------------- | ----------------------- |
| Cloudflare Pages setup + first deploy    | 10 minutes              |
| Add ffledgling.dev zone + nameservers    | 15 minutes              |
| Nameserver propagation                   | 5 min - 24 hours        |
| Attach custom domain to Pages            | 5 minutes               |
| SSL certificate issuance                 | Automatic, < 15 minutes |
| anhadjaisingh.com zone + redirect        | 20 minutes              |
| anhadjaisingh.com nameserver propagation | 5 min - 24 hours        |
| Optional: GitHub Actions deploy setup    | 30 minutes              |

Total hands-on time: ~1 hour. Wall-clock time depends on DNS propagation.
