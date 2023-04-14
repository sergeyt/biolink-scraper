const { load } = require("cheerio");

export const config = {
  runtime: "edge",
};

const TYPE = {
  BIOLINK: "biolink",
  LINKFREE: "linkfree",
};

export default async function handler(req) {
  const reqUrl = new URL(req.url);
  const linkParam = reqUrl.searchParams.get("link");
  if (!linkParam) {
    return Response.json({
      error: `link is not specified`,
    });
  }
  const { type, url } = validateLink(linkParam);
  if (!type) {
    return Response.json({
      error: `invalid link param`,
    });
  }
  const resp = await fetch(url);
  if (!resp.ok) {
    return Response.json({
      error: `failed to fetch ${linkParam}`,
      status: resp.status,
    });
  }
  const html = await resp.text();
  const $ = load(html);
  let selector;
  switch (type) {
    case TYPE.BIOLINK:
      selector = "a[href].social-icon-anchor";
      break;
    case TYPE.LINKFREE:
      selector = `div[id^="biolink_block"] a[href]`;
      break;
  }
  const urls = [];
  $(selector).map((i, e) => {
    urls.push($(e).attr("href"));
  });
  return Response.json({
    links: urls,
  });
}

function validateLink(link) {
  try {
    const url = new URL(link);
    const host = url.host.startsWith("www.") ? url.host.slice(4) : url.host;
    switch (host) {
      case "bio.link":
        return { type: TYPE.BIOLINK, url: link };
      case "linkfr.ee":
        return { type: TYPE.LINKFREE, url: link };
    }
    return {};
  } catch (err) {
    // assume it is bio.link for now
    return { type: TYPE.BIOLINK, url: `https://bio.link/${link}` };
  }
}
