const crypto = require("crypto");

const { env } = require("../config/env");

const NEWS_TOPICS = [
  "stock market",
  "personal finance",
  "cryptocurrency",
  "economy",
  "banking",
  "investment trends"
];

const FALLBACK_NEWS = [
  {
    title: "Review your monthly budget before adding new investments",
    description: "Keep emergency savings and monthly essentials funded before taking market risk.",
    url: "https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins",
    source: "Investor.gov"
  },
  {
    title: "Personal finance tip: track flexible spending weekly",
    description: "Food, shopping, travel, and entertainment are easier to manage with weekly checkpoints.",
    url: "https://www.consumerfinance.gov/consumer-tools/",
    source: "CFPB"
  }
];

function buildNewsId(url, title) {
  return `news-${crypto.createHash("sha1").update(url || title || String(Date.now())).digest("hex").slice(0, 16)}`;
}

function stripHtml(value = "") {
  return String(value).replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function decodeXml(value = "") {
  return String(value)
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function getTagValue(item, tag) {
  const match = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? decodeXml(match[1].replace(/^<!\[CDATA\[|\]\]>$/g, "")) : "";
}

function normalizeArticle(article) {
  const title = stripHtml(article.title);
  const url = article.url || article.link || "";
  const publishedAt = article.publishedAt || article.pubDate || new Date().toISOString();

  if (!title || !url) {
    return null;
  }

  return {
    id: buildNewsId(url, title),
    type: "info",
    title,
    message: stripHtml(article.description || article.content || "Tap to read the full finance update.").slice(0, 220),
    createdAt: new Date(),
    publishedAt: new Date(publishedAt),
    read: false,
    url,
    source: stripHtml(article.source?.name || article.source || "Finance News")
  };
}

async function fetchNewsApiArticles() {
  if (!env.financeNewsApiKey) {
    return [];
  }

  const params = new URLSearchParams({
    q: NEWS_TOPICS.join(" OR "),
    language: "en",
    sortBy: "publishedAt",
    pageSize: "10",
    apiKey: env.financeNewsApiKey
  });
  const response = await fetch(`${env.financeNewsApiUrl}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Finance news API failed with status ${response.status}.`);
  }

  const data = await response.json();
  return Array.isArray(data.articles) ? data.articles : [];
}

async function fetchGoogleFinanceRssArticles() {
  const params = new URLSearchParams({
    q: NEWS_TOPICS.join(" OR "),
    hl: "en-IN",
    gl: "IN",
    ceid: "IN:en"
  });
  const response = await fetch(`https://news.google.com/rss/search?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Finance news RSS failed with status ${response.status}.`);
  }

  const xml = await response.text();
  return xml
    .split(/<item>/i)
    .slice(1)
    .map((item) => ({
      title: getTagValue(item, "title"),
      description: getTagValue(item, "description"),
      link: getTagValue(item, "link"),
      pubDate: getTagValue(item, "pubDate"),
      source: getTagValue(item, "source")
    }));
}

async function fetchFinanceNews() {
  let articles = [];

  try {
    articles = await fetchNewsApiArticles();
  } catch (error) {
    console.warn(error.message);
  }

  if (!articles.length) {
    try {
      articles = await fetchGoogleFinanceRssArticles();
    } catch (error) {
      console.warn(error.message);
    }
  }

  if (!articles.length) {
    articles = FALLBACK_NEWS.map((article) => ({
      ...article,
      publishedAt: new Date().toISOString()
    }));
  }

  const seen = new Set();

  return articles
    .map(normalizeArticle)
    .filter(Boolean)
    .filter((article) => {
      if (seen.has(article.id)) {
        return false;
      }

      seen.add(article.id);
      return true;
    })
    .slice(0, 10);
}

async function syncFinanceNewsNotifications(user) {
  const notifications = Array.isArray(user.notifications) ? user.notifications : [];
  const latestNewsRefresh = notifications
    .filter((notification) => String(notification.id || "").startsWith("news-"))
    .map((notification) => new Date(notification.createdAt).getTime())
    .filter(Number.isFinite)
    .sort((left, right) => right - left)[0];
  const refreshWindowMs = Math.max(env.financeNewsRefreshMinutes, 15) * 60 * 1000;

  if (latestNewsRefresh && Date.now() - latestNewsRefresh < refreshWindowMs) {
    return user.notifications;
  }

  const articles = await fetchFinanceNews();
  const existingIds = new Set(notifications.map((notification) => notification.id));
  const nextNewsNotifications = articles.filter((article) => !existingIds.has(article.id));

  if (!nextNewsNotifications.length) {
    return user.notifications;
  }

  user.notifications = [...nextNewsNotifications, ...notifications].slice(0, 50);
  await user.save();
  return user.notifications;
}

module.exports = {
  fetchFinanceNews,
  syncFinanceNewsNotifications
};
