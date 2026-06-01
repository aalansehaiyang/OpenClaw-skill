// 知识星球群组成文章提取脚本
// 在浏览器 CDP 中通过 /eval 执行
// 功能：滚动懒加载 → 提取文章链接 → 去重 → 返回 JSON

(async () => {
  const MAX_SCROLLS = 20;
  const SCROLL_PAUSE_MS = 3000;
  const STABLE_THRESHOLD = 2;

  const seen = new Set();
  let stableCount = 0;

  for (let i = 0; i < MAX_SCROLLS; i++) {
    // 滚动到底部
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise(r => setTimeout(r, SCROLL_PAUSE_MS));

    // 提取当前可见的文章链接
    const links = Array.from(document.querySelectorAll('a'));
    let newCount = 0;
    for (const a of links) {
      const href = a.href || '';
      if (!href.includes('articles.zsxq.com/id_')) continue;
      const title = (a.textContent || '').trim();
      if (!title || title.startsWith('http') || title.length < 5) continue;
      if (!seen.has(href)) {
        seen.add(href);
        newCount++;
      }
    }

    if (newCount === 0) {
      stableCount++;
      if (stableCount >= STABLE_THRESHOLD) break;
    } else {
      stableCount = 0;
    }
  }

  // 最终提取（带标题）
  const articles = [];
  const seenUrls = new Set();
  const allLinks = Array.from(document.querySelectorAll('a'));
  for (const a of allLinks) {
    const href = a.href || '';
    if (!href.includes('articles.zsxq.com/id_')) continue;
    if (seenUrls.has(href)) continue;
    const title = (a.textContent || '').trim();
    if (!title || title.startsWith('http') || title.length < 5) continue;
    seenUrls.add(href);
    articles.push({ title, url: href });
  }

  // 补充之前 seen 但 DOM 中可能已消失的 URL
  for (const url of seen) {
    if (!seenUrls.has(url)) {
      articles.push({ title: 'Unknown', url });
    }
  }

  return JSON.stringify({ articles, count: articles.length });
})();
