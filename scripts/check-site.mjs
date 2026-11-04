import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return [full];
  });
}
const files = walk(root);
const htmlFiles = files.filter((file) => file.endsWith(".html"));
const errors = [];
if (htmlFiles.length < 35) errors.push("Expected the complete static site; found only " + htmlFiles.length + " HTML pages.");

for (const file of htmlFiles) {
  const relative = path.relative(root, file).split(path.sep).join("/");
  const html = fs.readFileSync(file, "utf8");
  const title = html.match(/<title\b[^>]*>[\s\S]*?<\/title>/i);
  if (!title) errors.push(relative + ": missing title");
  if (/Webflow HTML website template|Powered by Webflow|This site was created in Webflow|Jhon Smith|CEO of Novalab/i.test(html)) {
    errors.push(relative + ": template branding or fictional author remains");
  }
  const withoutStylesheetUrl = html.replace(/href=["'][^"']*oxnod[^"']*["']/gi, "");
  if (/oxnod/i.test(withoutStylesheetUrl)) errors.push(relative + ": visible Oxnod reference remains");
  if (/href=["']mailto:["']|href=["']tel:/i.test(html)) errors.push(relative + ": empty or unverified contact link remains");
  if (/method=["']get["']/i.test(html)) errors.push(relative + ": GET form could expose submitted data in the URL");

  const formTags = [...html.matchAll(/<form\b[^>]*>/gi)].map((match) => match[0]);
  for (const tag of formTags) {
    if (!/data-futureminds-unconfigured=["']true["']/i.test(tag)) errors.push(relative + ": form is not explicitly marked unconfigured");
    if (!/method=["']post["']/i.test(tag)) errors.push(relative + ": unconfigured form is not POST-only");
  }
  if (formTags.length && !html.includes('id="futureminds-form-guard"')) {
    errors.push(relative + ": form safety guard is missing");
  }
  if (relative.startsWith("career/") && !/http-equiv=["']refresh["'][^>]*url=\/career\.html/i.test(html)) {
    errors.push(relative + ": retired career detail page does not redirect");
  }

  const links = [...html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi)].map((match) => match[1]);
  for (const raw of links) {
    if (!/\.html(?:[?#]|$)/i.test(raw)) continue;
    if (/^(?:https?:)?\/\//i.test(raw)) continue;
    const pathname = raw.split(/[?#]/)[0];
    let target;
    try {
      const decoded = decodeURIComponent(pathname);
      target = decoded.startsWith("/")
        ? path.resolve(root, "." + decoded)
        : path.resolve(path.dirname(file), decoded);
    } catch {
      errors.push(relative + ": invalid local link " + raw);
      continue;
    }
    if (!fs.existsSync(target)) errors.push(relative + ": broken local page link " + raw);
  }
}

if (errors.length) {
  process.stderr.write(errors.join("\n") + "\n");
  process.exit(1);
}
process.stdout.write("PASS: " + htmlFiles.length + " HTML pages; metadata, branding, forms, redirects, and local page links validated.\n");
