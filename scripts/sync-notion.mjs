#!/usr/bin/env node
/**
 * Sync Notion database to Markdown files in src/content/activites/
 * Uses NOTION_PAGE_ID: either the database id (if you opened the database as a page)
 * or any page id inside the database (we then use parent.database_id).
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Client } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CONTENT_DIR = join(ROOT, 'src', 'content', 'activites');
const OUTILS_DIR = join(ROOT, 'src', 'content', 'outils');
const PUBLIC_ACTIVITES = join(ROOT, 'public', 'activites');
const PUBLIC_ACTIVITES_EXEMPLES = join(ROOT, 'public', 'activites', 'exemples');
const PUBLIC_OUTILS = join(ROOT, 'public', 'outils');

function isNotionS3Url(url) {
  if (!url || typeof url !== 'string') return false;
  return url.includes('prod-files-secure.s3') || (url.includes('amazonaws') && url.includes('X-Amz-'));
}

function extFromUrl(url) {
  try {
    const pathname = new URL(url).pathname;
    const match = pathname.match(/\.(jpe?g|png|gif|webp|svg)(\?|$)/i);
    return match ? match[1].toLowerCase() : 'jpg';
  } catch (_) {
    return 'jpg';
  }
}

function sanitizeFilenameSegment(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Parcourt le markdown pour trouver les images Notion (`![](...)`) dont l'URL est une URL S3 Notion
 * puis les télécharge dans un dossier public dédié et remplace les URLs dans le markdown par des chemins locaux.
 */
async function localizeInlineImagesInMarkdown(markdown, { slug, publicDir, publicBasePath }) {
  if (!markdown || typeof markdown !== 'string') return markdown;
  if (!markdown.includes('![')) return markdown;

  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let match;
  let result = markdown;
  const replacements = [];

  let index = 0;
  while ((match = imageRegex.exec(markdown)) !== null) {
    const fullMatch = match[0];
    const alt = match[1] || '';
    const url = match[2] || '';
    if (!isNotionS3Url(url)) continue;

    const safeSlug = sanitizeFilenameSegment(slug);
    const safeAlt = sanitizeFilenameSegment(alt) || 'image';
    const ext = extFromUrl(url);
    const localName = `${safeSlug}-${safeAlt}-${index}.${ext}`;
    const localPath = join(publicDir, localName);
    const publicUrl = `${publicBasePath}/${localName}`;

    // On tente de télécharger; si échec, on garde l'URL d'origine
    // pour ne pas casser encore plus le contenu.
    // eslint-disable-next-line no-await-in-loop
    const ok = await downloadToLocal(url, localPath);
    if (ok) {
      replacements.push({ from: fullMatch, to: `![${alt}](${publicUrl})` });
      index += 1;
    }
  }

  for (const { from, to } of replacements) {
    result = result.split(from).join(to);
  }

  return result;
}

async function downloadToLocal(url, filepath) {
  try {
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    mkdirSync(dirname(filepath), { recursive: true });
    writeFileSync(filepath, buf);
    return true;
  } catch (e) {
    console.warn('Download failed', url.slice(0, 60) + '…', e.message);
    return null;
  }
}

// Load .env manually (no dotenv dependency required for minimal; we use it if present)
function loadEnv() {
  try {
    const envPath = join(ROOT, '.env');
    const content = readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eq = trimmed.indexOf('=');
        if (eq > 0) {
          const key = trimmed.slice(0, eq).trim();
          const value = trimmed.slice(eq + 1).trim();
          if (!process.env[key]) process.env[key] = value;
        }
      }
    }
  } catch (_) {
    // .env optional if vars set in environment
  }
}

loadEnv();

const NOTION_API_KEY = process.env.NOTION_API_KEY || process.env.notion_api_key;
const NOTION_PAGE_ID = (process.env.NOTION_PAGE_ID || '').replace(/-/g, '');
const ACTIVITES_DB = (process.env.ACTIVITES_DB || '').replace(/-/g, '');
const TOOLS_DB = (process.env.TOOLS_DB || '').replace(/-/g, '');

if (!NOTION_API_KEY) {
  console.error('Missing NOTION_API_KEY or notion_api_key in .env');
  process.exit(1);
}
if (!ACTIVITES_DB) {
  console.error('Missing ACTIVITES_DB in .env (ID de la base Notion « activités »)');
  process.exit(1);
}
if (!TOOLS_DB) {
  console.error('Missing TOOLS_DB in .env (ID de la base Notion « outils »)');
  process.exit(1);
}

function slugify(text) {
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'page';
}

function extractTitle(properties) {
  for (const [, value] of Object.entries(properties)) {
    if (value && value.title && Array.isArray(value.title)) {
      return value.title.map((t) => t.plain_text).join('');
    }
  }
  return 'Sans titre';
}

async function resolveDatabaseId(notion) {
  try {
    await notion.databases.retrieve({ database_id: NOTION_PAGE_ID });
    return NOTION_PAGE_ID;
  } catch (_) {
    // Not a database; try as page
  }
  try {
    const page = await notion.pages.retrieve({ page_id: NOTION_PAGE_ID });
    const parent = page.parent;
    if (parent && parent.database_id) {
      return parent.database_id.replace(/-/g, '');
    }
    // Page contient peut-être une base intégrée (vue "database" dans la page)
    let blockCursor = undefined;
    do {
      const { results: blocks, next_cursor } = await notion.blocks.children.list({
        block_id: NOTION_PAGE_ID,
        start_cursor: blockCursor,
      });
      for (const block of blocks) {
        if (block.type === 'child_database' && block.id) {
          return block.id.replace(/-/g, '');
        }
      }
      blockCursor = next_cursor ?? undefined;
    } while (blockCursor);
  } catch (e) {
    console.error('Could not resolve database id:', e.message);
  }
  return null;
}

function getCoverUrl(page) {
  const cover = page.cover;
  if (!cover) return null;
  if (cover.type === 'external' && cover.external?.url) return cover.external.url;
  if (cover.type === 'file' && cover.file?.url) return cover.file.url;
  return null;
}

function getIcon(page) {
  const icon = page.icon;
  if (!icon) return null;
  if (icon.type === 'emoji' && icon.emoji) return icon.emoji;
  if (icon.type === 'external' && icon.external?.url) return icon.external.url;
  if (icon.type === 'file' && icon.file?.url) return icon.file.url;
  return null;
}

function getRelationIds(properties) {
  const prop = properties['Outils'] || properties['outils'];
  if (prop && prop.type === 'relation' && Array.isArray(prop.relation)) {
    return prop.relation.map((r) => r.id).filter(Boolean);
  }
  for (const [, value] of Object.entries(properties)) {
    if (value && value.type === 'relation' && Array.isArray(value.relation)) {
      return value.relation.map((r) => r.id).filter(Boolean);
    }
  }
  return [];
}

/** Récupère la liste complète des IDs de la relation Outils via l’API paginée (pas de limite 25). */
async function getOutilsRelationIdsFull(notion, page) {
  const prop = page.properties['Outils'] || page.properties['outils'];
  if (!prop || prop.type !== 'relation') return [];
  const propertyId = prop.id;
  const ids = [];
  let cursor = undefined;
  do {
    const resp = await notion.pages.properties.retrieve({
      page_id: page.id,
      property_id: propertyId,
      start_cursor: cursor,
      page_size: 100,
    });
    const results = resp.results || [];
    const list = Array.isArray(results) ? results : [];
    for (const item of list) {
      const id = item.relation?.id ?? item.id;
      if (id) ids.push(id);
    }
    cursor = resp.next_cursor ?? undefined;
  } while (cursor);
  return ids;
}

function extractUrl(properties) {
  for (const [, value] of Object.entries(properties)) {
    if (value && value.type === 'url' && value.url != null) return value.url;
  }
  return null;
}

function extractRichText(prop) {
  if (!prop || !prop.rich_text || !Array.isArray(prop.rich_text)) return '';
  return prop.rich_text.map((t) => t.plain_text).join('').trim();
}

function extractBaseline(properties) {
  const prop = properties['Baseline'] || properties['baseline'];
  return extractRichText(prop || {});
}

function extractObjectifs(properties) {
  const prop = properties['Objectif'] || properties['objectif'];
  if (!prop) return [];
  if (prop.type === 'multi_select' && Array.isArray(prop.multi_select)) {
    return prop.multi_select.map((o) => o.name).filter(Boolean);
  }
  if (prop.type === 'select' && prop.select?.name) {
    return [prop.select.name];
  }
  return [];
}

function extractExamples(properties) {
  const prop = properties['Examples'] || properties['Exemples'] || properties['examples'] || properties['exemples'];
  if (!prop || prop.type !== 'files' || !Array.isArray(prop.files)) return [];
  const urls = [];
  for (const f of prop.files) {
    const url = f.file?.url ?? f.external?.url;
    if (url) urls.push(url);
  }
  return urls;
}

function extractTemplates(properties) {
  const prop = properties['Template(s)'] || properties['Templates'] || properties['Template'] || properties['templates'];
  if (!prop || prop.type !== 'files' || !Array.isArray(prop.files)) return [];
  const list = [];
  for (const f of prop.files) {
    const url = f.file?.url ?? f.external?.url;
    if (!url) continue;
    let name = f.name;
    if (!name) {
      try {
        name = new URL(url).pathname.split('/').pop() || 'Fichier';
      } catch (_) {
        name = 'Fichier';
      }
    }
    list.push({ name, url });
  }
  return list;
}

async function main() {
  const notion = new Client({ auth: NOTION_API_KEY });
  const n2m = new NotionToMarkdown({ notionClient: notion });
  const databaseId = ACTIVITES_DB;

  const results = [];
  let cursor = undefined;
  do {
    const resp = await notion.databases.query({
      database_id: databaseId,
      filter: { property: 'Status', select: { equals: 'Prêt' } },
      start_cursor: cursor,
    });
    results.push(...resp.results);
    cursor = resp.next_cursor ?? undefined;
  } while (cursor);

  const toolsList = [];
  let toolsCursor = undefined;
  do {
    const toolsResp = await notion.databases.query({
      database_id: TOOLS_DB,
      start_cursor: toolsCursor,
    });
    for (const toolPage of toolsResp.results) {
      if (toolPage.object !== 'page') continue;
      toolsList.push(toolPage);
    }
    toolsCursor = toolsResp.next_cursor ?? undefined;
  } while (toolsCursor);

  mkdirSync(CONTENT_DIR, { recursive: true });
  mkdirSync(OUTILS_DIR, { recursive: true });
  mkdirSync(PUBLIC_ACTIVITES, { recursive: true });
  mkdirSync(PUBLIC_ACTIVITES_EXEMPLES, { recursive: true });
  mkdirSync(PUBLIC_OUTILS, { recursive: true });

  const toolIdToSlug = new Map();
  const allowedToolSlugs = new Set();
  for (const toolPage of toolsList) {
    const id = toolPage.id.replace(/-/g, '');
    const title = extractTitle(toolPage.properties);
    const slug = slugify(title);
    const url = extractUrl(toolPage.properties);
    let icon = getIcon(toolPage);
    if (icon && typeof icon === 'string' && (icon.startsWith('http://') || icon.startsWith('https://')) && isNotionS3Url(icon)) {
      const ext = extFromUrl(icon);
      const localName = `${slug}-icon.${ext}`;
      const localPath = join(PUBLIC_OUTILS, localName);
      if (await downloadToLocal(icon, localPath)) {
        icon = '/outils/' + localName;
      }
    }
    toolIdToSlug.set(id, slug);
    allowedToolSlugs.add(slug);
    const frontmatterLines = [`title: ${JSON.stringify(title)}`];
    if (url) frontmatterLines.push(`url: ${JSON.stringify(url)}`);
    if (icon) frontmatterLines.push(`icon: ${JSON.stringify(icon)}`);
    const toolPath = join(OUTILS_DIR, `${slug}.md`);
    writeFileSync(toolPath, `---\n${frontmatterLines.join('\n')}\n---\n\n`, 'utf-8');
  }
  for (const f of readdirSync(OUTILS_DIR).filter((f) => f.endsWith('.md'))) {
    const base = f.slice(0, -3);
    if (!allowedToolSlugs.has(base)) {
      unlinkSync(join(OUTILS_DIR, f));
      console.log('Removed tool', f);
    }
  }
  console.log('Tools synced:', toolsList.length);

  // Map Notion page_id → { slug, title } pour résoudre les "link to page" vers nos URLs /activite/{slug}
  const pageIdToLink = new Map();
  for (const page of results) {
    if (page.object !== 'page') continue;
    const id = page.id.replace(/-/g, '');
    const title = extractTitle(page.properties);
    pageIdToLink.set(id, { slug: slugify(title), title });
  }

  n2m.setCustomTransformer('link_to_page', (block) => {
    if (block.link_to_page?.type !== 'page_id') return '[Lien](https://www.notion.so)';
    const pageId = block.link_to_page.page_id?.replace(/-/g, '');
    const info = pageIdToLink.get(pageId);
    if (info) {
      const text = info.title.replace(/\]/g, '\\]');
      return `[${text}](/activite/${info.slug})`;
    }
    return `[Lien](https://www.notion.so/${block.link_to_page.page_id})`;
  });

  const allowedSlugs = new Set();
  for (const page of results) {
    if (page.object !== 'page') continue;
    allowedSlugs.add(slugify(extractTitle(page.properties)));
  }
  for (const f of readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.md'))) {
    const base = f.slice(0, -3);
    if (!allowedSlugs.has(base)) {
      unlinkSync(join(CONTENT_DIR, f));
      console.log('Removed', f);
    }
  }

  for (const page of results) {
    if (page.object !== 'page') continue;
    const title = extractTitle(page.properties);
    const slug = slugify(title);

    let coverUrl = getCoverUrl(page);
    let iconValue = getIcon(page);

    if (coverUrl && isNotionS3Url(coverUrl)) {
      const ext = extFromUrl(coverUrl);
      const localName = `${slug}-cover.${ext}`;
      const localPath = join(PUBLIC_ACTIVITES, localName);
      if (await downloadToLocal(coverUrl, localPath)) {
        coverUrl = '/activites/' + localName;
      }
    }
    if (iconValue && typeof iconValue === 'string' && (iconValue.startsWith('http://') || iconValue.startsWith('https://')) && isNotionS3Url(iconValue)) {
      const ext = extFromUrl(iconValue);
      const localName = `${slug}-icon.${ext}`;
      const localPath = join(PUBLIC_ACTIVITES, localName);
      if (await downloadToLocal(iconValue, localPath)) {
        iconValue = '/activites/' + localName;
      }
    }

    const outilsSlugs = [];
    let relationIds = [];
    try {
      relationIds = await getOutilsRelationIdsFull(notion, page);
    } catch (e) {
      relationIds = getRelationIds(page.properties);
    }
    for (const toolPageId of relationIds) {
      const id = String(toolPageId).replace(/-/g, '');
      const slug = toolIdToSlug.get(id);
      if (slug) outilsSlugs.push(slug);
    }

    let body = '';
    try {
      const mdblocks = await n2m.pageToMarkdown(page.id);
      const mdString = n2m.toMarkdownString(mdblocks);
      body = (mdString.parent || '').trim();
    } catch (e) {
      console.warn('Could not fetch content for', title, ':', e.message);
    }
    if (!body) body = '';

    // Localiser les images Notion inline dans le contenu markdown (corps de la page)
    body = await localizeInlineImagesInMarkdown(body, {
      slug,
      publicDir: join(PUBLIC_ACTIVITES, 'contenu'),
      publicBasePath: '/activites/contenu',
    });

    const objectifs = extractObjectifs(page.properties);
    let exemples = extractExamples(page.properties);
    if (exemples.length > 0) {
      const resolved = [];
      for (let i = 0; i < exemples.length; i++) {
        const url = exemples[i];
        if (isNotionS3Url(url)) {
          const ext = extFromUrl(url);
          const localName = `${slug}-${i}.${ext}`;
          const localPath = join(PUBLIC_ACTIVITES_EXEMPLES, localName);
          if (await downloadToLocal(url, localPath)) {
            resolved.push('/activites/exemples/' + localName);
          } else {
            resolved.push(url);
          }
        } else {
          resolved.push(url);
        }
      }
      exemples = resolved;
    }
    const templatesList = extractTemplates(page.properties);
    const baseline = extractBaseline(page.properties);

    const frontmatterLines = [`title: ${JSON.stringify(title)}`];
    if (coverUrl) frontmatterLines.push(`image: ${JSON.stringify(coverUrl)}`);
    if (iconValue) frontmatterLines.push(`icon: ${JSON.stringify(iconValue)}`);
    if (baseline) frontmatterLines.push(`baseline: ${JSON.stringify(baseline)}`);
    if (objectifs.length > 0) {
      frontmatterLines.push('objectifs: ' + JSON.stringify(objectifs));
    }
    if (templatesList.length > 0) {
      frontmatterLines.push('templates: ' + JSON.stringify(templatesList));
    }
    if (outilsSlugs.length > 0) {
      frontmatterLines.push('outils: ' + JSON.stringify(outilsSlugs));
    }
    if (exemples.length > 0) {
      frontmatterLines.push('exemples: ' + JSON.stringify(exemples));
    }
    const frontmatter = `---
${frontmatterLines.join('\n')}
---

`;
    const path = join(CONTENT_DIR, `${slug}.md`);
    writeFileSync(path, frontmatter + body, 'utf-8');
    console.log('Wrote', slug + '.md');
  }

  console.log('Sync done:', results.length, 'activités.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
