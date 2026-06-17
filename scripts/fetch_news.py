#!/usr/bin/env python3
"""Fetch cybersecurity + AI RSS feeds and write data/news.json.
Pure standard library (no pip installs needed). Run by GitHub Actions weekly.
Each item: {title, link, summary (1-2 lines), source, date}."""
import json, re, html, urllib.request, xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime

FEEDS = {
    "cyber": [
        ("The Hacker News",   "https://feeds.feedburner.com/TheHackersNews"),
        ("BleepingComputer",  "https://www.bleepingcomputer.com/feed/"),
        ("Krebs on Security", "https://krebsonsecurity.com/feed/"),
        ("Dark Reading",      "https://www.darkreading.com/rss.xml"),
    ],
    "ai": [
        ("VentureBeat AI", "https://venturebeat.com/category/ai/feed/"),
        ("The Verge AI",   "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml"),
        ("TechCrunch AI",  "https://techcrunch.com/category/artificial-intelligence/feed/"),
        ("MIT Tech Review AI", "https://www.technologyreview.com/topic/artificial-intelligence/feed"),
    ],
}
PER_CATEGORY = 12
TAG_RE = re.compile(r"<[^>]+>")
WS_RE = re.compile(r"\s+")

def clean(text, limit=220):
    if not text:
        return ""
    text = html.unescape(TAG_RE.sub(" ", text))
    text = WS_RE.sub(" ", text).strip()
    if len(text) > limit:
        text = text[:limit].rsplit(" ", 1)[0].rstrip(".,;:") + "…"
    return text

def parse_date(s):
    if not s:
        return None
    try:
        return parsedate_to_datetime(s)
    except Exception:
        pass
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00"))
    except Exception:
        return None

def localname(tag):
    return tag.rsplit("}", 1)[-1]

def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "DirectorsEdge-newsbot/1.0"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.read()

def items_from(xml_bytes, source):
    out = []
    root = ET.fromstring(xml_bytes)
    # RSS 2.0: channel/item ; Atom: feed/entry
    nodes = [e for e in root.iter() if localname(e.tag) in ("item", "entry")]
    for n in nodes:
        title = link = summary = date = None
        for c in list(n):
            ln = localname(c.tag)
            if ln == "title":
                title = (c.text or "").strip()
            elif ln == "link":
                href = c.get("href")
                link = href if href else (c.text or "").strip()
            elif ln in ("description", "summary", "content", "encoded") and not summary:
                summary = c.text or ""
            elif ln in ("pubDate", "published", "updated", "date") and not date:
                date = c.text
        if title and link:
            dt = parse_date(date)
            out.append({
                "title": clean(title, 160),
                "link": link,
                "summary": clean(summary, 220),
                "source": source,
                "date": dt.astimezone(timezone.utc).strftime("%b %d, %Y") if dt else "",
                "_ts": dt.timestamp() if dt else 0,
            })
    return out

def build(feeds):
    seen, items = set(), []
    for source, url in feeds:
        try:
            for it in items_from(fetch(url), source):
                key = it["title"].lower()
                if key in seen:
                    continue
                seen.add(key)
                items.append(it)
        except Exception as e:
            print("WARN feed failed:", url, e)
    items.sort(key=lambda x: x["_ts"], reverse=True)
    for it in items:
        it.pop("_ts", None)
    return items[:PER_CATEGORY]

def main():
    data = {"updated": datetime.now(timezone.utc).isoformat()}
    for cat, feeds in FEEDS.items():
        data[cat] = build(feeds)
        print(cat, "->", len(data[cat]), "items")
    with open("data/news.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print("wrote data/news.json")

if __name__ == "__main__":
    main()
