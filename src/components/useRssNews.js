import { useState, useEffect, useCallback } from 'react';

// ─────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────

/**
 * FIX: Semua proxy dijalankan PARALEL via Promise.any().
 * Proxy tercepat yang berhasil langsung dipakai — tidak perlu tunggu semua.
 * Timeout per-proxy diperkecil dari 8s → 4s supaya total tunggu lebih pendek.
 */
const CORS_PROXIES = [
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
  (url) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
];

const RSS_FEEDS = [
  {
    lang: 'ID',
    flag: '🇮🇩',
    name: 'Kompas Health',
    url: 'https://health.kompas.com/rss/',
    category: 'Kesehatan',
  },
  {
    lang: 'ID',
    flag: '🇮🇩',
    name: 'Detik Health',
    url: 'https://feed.detik.com/detikhealth',
    category: 'Kesehatan',
  },
  {
    lang: 'EN',
    flag: '🇬🇧',
    name: "Runner's World",
    url: 'https://www.runnersworld.com/rss/all.xml/',
    category: 'Fitness',
  },
  {
    lang: 'EN',
    flag: '🇬🇧',
    name: 'Healthline',
    url: 'https://www.healthline.com/rss/health-news',
    category: 'Health',
  },
];

const FALLBACK_ARTICLES = [
  { id:'f1', title:'HIIT for Beginners: Foundational Moves',   desc:'Start your HIIT journey with essential movements for fat burn and endurance.', timestamp:'2025-05-15', url:null, thumbnail:null, source:'Health Tips', lang:'EN', flag:'🇬🇧', category:'HIIT' },
  { id:'f2', title:'Yoga Recovery: Pulih Lebih Cepat',         desc:'Bagaimana yoga membantu tubuh pulih lebih cepat setelah sesi latihan intens.',  timestamp:'2025-05-14', url:null, thumbnail:null, source:'Wellness ID', lang:'ID', flag:'🇮🇩', category:'Yoga' },
  { id:'f3', title:'Cardio vs Strength Training',              desc:'Which training style serves your fitness goals better? We break it down.',       timestamp:'2025-05-13', url:null, thumbnail:null, source:'Fitness Guide', lang:'EN', flag:'🇬🇧', category:'Cardio' },
  { id:'f4', title:'Nutrisi Sebelum dan Sesudah Gym',          desc:'Apa yang harus dimakan sebelum dan setelah latihan untuk hasil maksimal.',        timestamp:'2025-05-12', url:null, thumbnail:null, source:'NutriGym', lang:'ID', flag:'🇮🇩', category:'Nutrisi' },
  { id:'f5', title:'Advanced HIIT Fat Burn Protocol',          desc:'Maximize fat burning with this science-backed HIIT training protocol.',           timestamp:'2025-05-11', url:null, thumbnail:null, source:'Fitness Guide', lang:'EN', flag:'🇬🇧', category:'HIIT' },
  { id:'f6', title:'Tidur Cukup untuk Pemulihan Otot',         desc:'Targetkan 7–9 jam tidur agar otot pulih sempurna dan performa meningkat.',        timestamp:'2025-05-10', url:null, thumbnail:null, source:'Wellness ID', lang:'ID', flag:'🇮🇩', category:'Recovery' },
];

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

const extractTag = (xml, tag) => {
  const re = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, 'i');
  const m  = xml.match(re);
  if (!m) return '';
  return m[1]
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .trim();
};

const extractImage = (itemXml) => {
  const patterns = [
    /media:content[^>]+url="([^"]+)"/i,
    /media:thumbnail[^>]+url="([^"]+)"/i,
    /enclosure[^>]+url="([^"]+)"[^>]+type="image/i,
    /<img[^>]+src="([^"]+)"/i,
  ];
  for (const re of patterns) {
    const m = itemXml.match(re);
    if (m?.[1]?.startsWith('http')) return m[1];
  }
  return null;
};

const parseRss = (xmlText, feed) => {
  const itemTag = xmlText.includes('<item>') ? 'item' : 'entry';
  return xmlText.split(`<${itemTag}`).slice(1).slice(0, 5).map((chunk, i) => {
    const end     = chunk.indexOf(`</${itemTag}>`);
    const itemXml = end > -1 ? chunk.slice(0, end) : chunk;
    const title   = extractTag(itemXml, 'title') || 'No title';
    const link    = extractTag(itemXml, 'link') || extractTag(itemXml, 'id') || null;
    const desc    = (extractTag(itemXml, 'description') || extractTag(itemXml, 'summary') || extractTag(itemXml, 'content')).slice(0, 140);
    const pubDate = extractTag(itemXml, 'pubDate') || extractTag(itemXml, 'published') || '';
    let timestamp = '';
    if (pubDate) { const d = new Date(pubDate); if (!isNaN(d)) timestamp = d.toISOString().split('T')[0]; }
    return {
      id: `${feed.name}-${i}`,
      title, desc: desc || feed.category, timestamp,
      url: link, thumbnail: extractImage(itemXml),
      source: feed.name, lang: feed.lang, flag: feed.flag, category: feed.category,
    };
  });
};

/**
 * FIX: Gunakan Promise.any() agar semua proxy diadu PARALEL.
 * Proxy pertama yang mengembalikan artikel valid langsung dipakai.
 * Setiap proxy punya AbortController sendiri dengan timeout 4 detik.
 */
const fetchWithProxyRace = async (feed, outerSignal) => {
  const proxyPromises = CORS_PROXIES.map(async (makeUrl) => {
    if (outerSignal.aborted) throw new Error('Aborted');

    // Timeout 4 detik per proxy (bukan 8 detik seperti sebelumnya)
    const ctrl    = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 4_000);

    // Batalkan juga kalau outer signal mati
    const onAbort = () => ctrl.abort();
    outerSignal.addEventListener('abort', onAbort, { once: true });

    try {
      const proxyUrl = makeUrl(feed.url);
      const res      = await fetch(proxyUrl, { signal: ctrl.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const text = res.headers.get('content-type')?.includes('json')
        ? (await res.json())?.contents
        : await res.text();

      if (!text || typeof text !== 'string' || text.length < 100)
        throw new Error('Empty/invalid response');

      const articles = parseRss(text, feed);
      if (articles.length === 0) throw new Error('Parsed 0 articles');

      console.info(`[useRssNews] ${feed.name} OK via ${proxyUrl.slice(0, 40)}…`);
      return articles;
    } finally {
      clearTimeout(timeout);
      outerSignal.removeEventListener('abort', onAbort);
    }
  });

  try {
    // Ambil proxy tercepat yang berhasil
    return await Promise.any(proxyPromises);
  } catch {
    // AggregateError: semua proxy gagal
    console.warn(`[useRssNews] ${feed.name}: semua proxy gagal`);
    return [];
  }
};

// ─────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────

const useRssNews = () => {
  const [articles,   setArticles]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [isFallback, setIsFallback] = useState(false);
  const [fetchKey,   setFetchKey]   = useState(0);
  const [langFilter, setLangFilter] = useState('ALL');

  const refresh = useCallback(() => setFetchKey(k => k + 1), []);

  useEffect(() => {
    const ctrl  = new AbortController();
    let   alive = true;

    /**
     * FIX: Total timeout dikurangi dari 30s → 12s.
     * Karena proxy sekarang diadu paralel (bukan berurutan),
     * waktu tunggu per feed ≈ 4 detik (timeout tercepat yang berhasil).
     */
    const timer = setTimeout(() => ctrl.abort(), 12_000);

    const run = async () => {
      setLoading(true);
      setError(null);

      try {
        const results = await Promise.all(
          RSS_FEEDS.map(feed => fetchWithProxyRace(feed, ctrl.signal)),
        );

        if (!alive) return;

        const all = results.flat();
        if (all.length > 0) {
          setArticles(all.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || '')));
          setIsFallback(false);
          setError(null);
        } else {
          setArticles(FALLBACK_ARTICLES);
          setIsFallback(true);
          setError('Tidak dapat memuat berita. Menampilkan artikel offline.');
        }
      } catch (err) {
        if (!alive) return;
        setArticles(FALLBACK_ARTICLES);
        setIsFallback(true);
        setError('Gagal terhubung. Menampilkan artikel offline.');
      } finally {
        if (alive) setLoading(false);
      }
    };

    run();
    return () => { alive = false; ctrl.abort(); clearTimeout(timer); };
  }, [fetchKey]);

  const filtered = langFilter === 'ALL'
    ? articles
    : articles.filter(a => a.lang === langFilter);

  return { articles, loading, error, isFallback, refresh, langFilter, setLangFilter, filtered };
};

export { useRssNews, FALLBACK_ARTICLES, RSS_FEEDS };
export default useRssNews;