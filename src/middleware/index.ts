import { defineMiddleware } from "astro/middleware";

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);
  const pathname = url.pathname;

  if (pathname.startsWith("/es/")) {
    return next();
  }

  const acceptLang = context.request.headers.get("accept-language") || "";
  const userLang = acceptLang.split(",")[0].toLowerCase();

  if (pathname === "/" && userLang.startsWith("es")) {
    // Use X-Forwarded-Host/Proto from reverse proxy, fallback to request URL
    const host = context.request.headers.get("x-forwarded-host") || context.request.headers.get("host") || url.host;
    const proto = context.request.headers.get("x-forwarded-proto") || url.protocol.replace(":", "");
    const redirectUrl = `${proto}://${host}/es/`;
    return Response.redirect(redirectUrl, 302);
  }

  return next();
});