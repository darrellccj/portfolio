import { useCallback, useEffect, useRef, useState } from 'react';
import { apiVersion, dataset, projectId } from '@/sanity/env';

// Studio Mode for people who are not signed in as an administrator: they
// can see what is editable and type over it, and the page changes in front
// of them — but only in their own browser. Nothing here touches the write
// routes, the write token or Draft Mode, and a reload puts it all back.
//
// The admin overlay finds fields through stega markers, which only exist in
// Draft Mode (it also exposes unpublished drafts, so visitors can't have it).
// Instead this reads the *published* documents from Sanity's public CDN and
// matches their strings against the text already on the page. Doing it in
// the browser also keeps every page statically generated.

const TYPES = ['profile', 'project', 'entry', 'ditherStudy'];
const QUERY = `*[_type in ${JSON.stringify(TYPES)}]`;

// Keys that hold machinery rather than copy.
const SKIP_KEYS = new Set(['href', 'slug', 'url', 'asset', 'crop', 'hotspot']);

const norm = (s) => s.replace(/\s+/g, ' ').trim();

function flatten(doc, node, path, out) {
  if (typeof node === 'string') {
    if (path && norm(node).length >= 2) {
      out.push({
        id: doc._id,
        type: doc._type,
        path,
        original: node,
        current: node,
        nodes: new Set(),
      });
    }
    return;
  }

  if (Array.isArray(node)) {
    node.forEach((item, i) => {
      const seg = item && typeof item === 'object' && item._key ? `[_key=="${item._key}"]` : `[${i}]`;
      flatten(doc, item, `${path}${seg}`, out);
    });
    return;
  }

  if (node && typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) {
      if (key.startsWith('_') || SKIP_KEYS.has(key)) continue;
      flatten(doc, value, path ? `${path}.${key}` : key, out);
    }
  }
}

export default function useStudioDemo(active) {
  const [status, setStatus] = useState('idle'); // idle | loading | ready | error
  const entries = useRef([]);
  const [, bump] = useState(0);

  useEffect(() => {
    if (!active || status !== 'idle') return;
    setStatus('loading');

    const url =
      `https://${projectId}.apicdn.sanity.io/v${apiVersion}/data/query/${dataset}` +
      `?query=${encodeURIComponent(QUERY)}&perspective=published`;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json();
      })
      .then(({ result }) => {
        const out = [];
        for (const doc of result ?? []) flatten(doc, doc, '', out);
        entries.current = out;
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [active, status]);

  // Every field whose text is currently on the page. Matches either the
  // published value or whatever the visitor has typed over it, so a field
  // stays selectable after being edited. Reads from a ref, so the function
  // identity is stable and the overlay does not rescan on every keystroke.
  const scan = useCallback(() => {
    const index = new Map();
    for (const entry of entries.current) {
      index.set(norm(entry.original), entry);
      index.set(norm(entry.current), entry);
    }

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const seen = new Map();

    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const element = node.parentElement;
      if (!element || element.closest('script, style, textarea, input, .studio-panel, .studio-overlay')) {
        continue;
      }
      const text = norm(node.nodeValue);
      if (!text) continue;
      const entry = index.get(text);
      if (!entry) continue;

      // A page the visitor navigated to after editing still shows the
      // published copy; carry their edit across so it stays consistent.
      if (entry.current !== entry.original && text === norm(entry.original)) {
        node.nodeValue = entry.current;
      }
      entry.nodes.add(node);

      if (!seen.has(element)) {
        seen.set(element, {
          id: entry.id,
          type: entry.type,
          path: entry.path,
          key: `${entry.id}:${entry.path}:${seen.size}`,
          element,
        });
      }
    }
    return Array.from(seen.values());
  }, []);

  const find = useCallback(
    (id, path) => entries.current.find((e) => e.id === id && e.path === path) ?? null,
    []
  );

  // Rewrite every place the field is on the page, locally.
  const setValue = useCallback((id, path, value) => {
    const entry = entries.current.find((e) => e.id === id && e.path === path);
    if (!entry) return;
    entry.current = value;
    for (const node of entry.nodes) {
      if (node.isConnected) node.nodeValue = value;
    }
    bump((n) => n + 1);
  }, []);

  return { status, scan, find, setValue };
}
