const { load } = require("cheerio");

export const config = {
  runtime: "edge",
};

const TYPE = {
  BIOLINK: "biolink",
  LINKFREE: "linkfree",
};

const SELECTORS = {
  [TYPE.BIOLINK]: "a[href].social-icon-anchor",
  [TYPE.LINKFREE]: `div[id^="biolink_block"] a[href]`,
};

export default async function handler(req) {
  const link = new URL(req.url).searchParams.get("link");
  if (!link) {
    return Response.json({
      error: `link is not specified`,
    });
  }
  const { type, url } = validateLink(link);
  if (!type) {
    return Response.json({
      error: `invalid link param: ${link}`,
    });
  }
  const resp = await fetch(url);
  if (!resp.ok) {
    // TODO include more details
    return Response.json({
      error: `failed to fetch "${link}"`,
      status: resp.status,
    });
  }
  const html = await resp.text();
  const $ = load(html);
  const links = [];
  $(SELECTORS[type]).map((i, e) => {
    links.push($(e).attr("href"));
  });
  return Response.json({ links });
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
