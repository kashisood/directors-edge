#!/usr/bin/env python3
"""
Generate pre-recorded narration MP3s for every page of Director's Edge.

It extracts the same readable text the on-page "Listen" feature reads
(headings, paragraphs, list items, figure captions, Q&A questions/answers,
callout/say/story/recap labels, and listen-only `.tts-note` descriptions;
skipping code blocks, SVG/diagrams and the table of contents), then uses
Microsoft's free neural TTS (edge-tts) to synthesise one MP3 per page into
the `audio/` folder.

It is incremental: a manifest records a hash of each page's narration text
and the voice, so only changed pages are re-synthesised.

Usage:
    python scripts/generate_audio.py            # generate / refresh MP3s
    python scripts/generate_audio.py --dry-run  # print extracted text only (no network)

Designed to run in CI (GitHub Actions) where network access to the TTS
service is available; it cannot run in the offline build sandbox.
"""

import os
import re
import sys
import glob
import json
import html
import hashlib

VOICE = "en-US-AriaNeural"
RATE = "+0%"          # speaking rate adjustment for edge-tts
AUDIO_DIR = "audio"
MANIFEST = os.path.join(AUDIO_DIR, "manifest.json")

# pages we never narrate (pure index/landing handled like the rest, but skip none by default)
SKIP_FILES = set()

EMOJI = re.compile(
    "[\U0001F000-\U0001FAFF←-⇿⌀-➿⬀-⯿️•■-◿]"
)

SELECTOR = ("h1,h2,h3,h4,p,li,figcaption,summary,.tts-note,"
            ".callout>.label,.say>.label,.story>.label,.recap>.label")


def block_text(el):
    """Text for one element, stripping Q&A level/topic badges from summaries."""
    from bs4 import BeautifulSoup
    if el.name == "summary":
        clone = BeautifulSoup(str(el), "html.parser")
        for b in clone.select(".qa-badge"):
            b.decompose()
        return clone.get_text(" ", strip=True)
    return el.get_text(" ", strip=True)


def is_codeish_ancestor(el):
    for p in el.parents:
        cls = p.get("class") or []
        if p.name in ("pre", "svg"):
            return True
        if "diagram" in cls or "toc" in cls:
            return True
    return False


def in_skip(el):
    for p in el.parents:
        if "tts-skip" in (p.get("class") or []):
            return True
    return False


def clean(text):
    text = html.unescape(text)
    text = EMOJI.sub(" ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def extract(path):
    """Return narration text for a page, in document order, mirroring the JS reader."""
    from bs4 import BeautifulSoup
    soup = BeautifulSoup(open(path, encoding="utf-8").read(), "html.parser")
    # In source HTML the body holds only page content (nav/topbar are injected at runtime),
    # so we can walk the whole document.
    blocks = []
    seen = set()
    for el in soup.select(SELECTOR):
        if id(el) in seen:
            continue
        seen.add(id(el))
        cls = el.get("class") or []
        is_note = "tts-note" in cls
        is_cap = el.name == "figcaption"
        if not is_note and not is_cap and is_codeish_ancestor(el):
            continue
        if in_skip(el):
            continue
        if el.name == "li" and el.find(["ul", "ol", "li"]):
            continue
        t = clean(block_text(el))
        if len(t) < 2:
            continue
        # add a touch of sentence finality so the TTS pauses between blocks
        if not re.search(r"[.!?:;]$", t):
            t += "."
        # a longer pause before a new major section
        prefix = "\n\n" if el.name in ("h1", "h2") else "\n"
        blocks.append(prefix + t)
    return "".join(blocks).strip()


def page_key(path):
    base = os.path.basename(path)
    return re.sub(r"\.html?$", "", base) or "index"


def load_manifest():
    try:
        return json.load(open(MANIFEST, encoding="utf-8"))
    except Exception:
        return {}


def main():
    dry = "--dry-run" in sys.argv
    only = [a for a in sys.argv[1:] if not a.startswith("--")]

    pages = sorted(glob.glob("*.html"))
    if only:
        pages = [p for p in pages if p in only or page_key(p) in only]
    pages = [p for p in pages if os.path.basename(p) not in SKIP_FILES]

    os.makedirs(AUDIO_DIR, exist_ok=True)
    manifest = load_manifest()
    changed = []

    for p in pages:
        text = extract(p)
        if not text:
            continue
        key = page_key(p)
        digest = hashlib.sha256((VOICE + "|" + RATE + "|" + text).encode("utf-8")).hexdigest()
        mp3 = os.path.join(AUDIO_DIR, key + ".mp3")
        if dry:
            words = len(text.split())
            print("=== %s -> %s.mp3  (%d words, ~%d min) ===" % (p, key, words, round(words / 150)))
            print(text[:600] + ("..." if len(text) > 600 else ""))
            print()
            continue
        if manifest.get(key) == digest and os.path.exists(mp3):
            print("skip (unchanged): %s" % key)
            continue
        synth(text, mp3)
        manifest[key] = digest
        changed.append(key)
        print("generated: %s" % mp3)

    if not dry:
        json.dump(manifest, open(MANIFEST, "w", encoding="utf-8"), indent=0, sort_keys=True)
        print("\nDone. %d page(s) regenerated: %s" % (len(changed), ", ".join(changed) or "none"))


def synth(text, out_path):
    """Synthesise `text` to an MP3 with edge-tts (requires network)."""
    import asyncio
    import edge_tts

    async def go():
        comm = edge_tts.Communicate(text, VOICE, rate=RATE)
        await comm.save(out_path)

    asyncio.run(go())


if __name__ == "__main__":
    main()
