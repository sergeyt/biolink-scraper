const { load } = require("cheerio");

export const config = {
  runtime: "edge",
};

export default async function handler(req) {
  const url = new URL(req.url);
  let link = url.searchParams.get("link");
  if (!link) {
    return Response.json({
      error: `link is not specified`,
    });
  }
  // TODO better autocomplete and validation of links
  // TODO support other link aggregators like linkfr.ee
  if (!link.startsWith("https://")) {
    link = `https://bio.link/${link}`;
  }
  const resp = await fetch(link);
  if (!resp.ok) {
    return Response.json({
      error: `failed to fetch ${link}`,
      status: resp.status,
    });
  }
  const html = await resp.text();
  const $ = load(html);
  const urls = [];
  $(".social-icon-anchor").map((i, e) => {
    urls.push($(e).attr("href"));
  });
  return Response.json({
    links: urls,
  });
}
