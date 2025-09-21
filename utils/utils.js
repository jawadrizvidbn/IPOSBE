import moment from "moment";
import axios from "axios";
import { UAParser } from "ua-parser-js";
import geoip from "geoip-lite";
import crypto from "crypto";

export function getYearAndMonthRange(startDate, endDate) {
  const start = moment(startDate, "YYYY-MM-DD");
  const end = moment(endDate, "YYYY-MM-DD");

  if (!start.isValid() || !end.isValid()) {
    console.log("Please provide valid dates in YYYY-MM-DD format.");
    return { year: null, months: [] };
  }

  const months = [];
  const year = start.year();

  let current = start.clone().startOf("month");
  while (current.isSameOrBefore(end, "month")) {
    months.push(current.format("MM")); // just the two-digit month
    current.add(1, "month");
  }

  return { year, months };
}

export function sum(numbers) {
  return numbers.reduce((acc, num) => acc + num, 0);
}

export function getClientIP(req) {
  let ip =
    req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
  if (Array.isArray(ip)) ip = ip[0];
  ip = String(ip).replace("::ffff:", "");
  if (ip === "::1") ip = "127.0.0.1";
  return ip;
}

export function getLocationFromIP(ip) {
  if (ip.startsWith("10.") || ip.startsWith("192.168.") || ip === "127.0.0.1") {
    return {
      city: "Localhost",
      region: "",
      country: "Local",
      lat: null,
      lon: null,
    };
  }
  const g = geoip.lookup(ip);
  return g
    ? {
        city: g.city || "",
        region: g.region || "",
        country: g.country || "",
        lat: g.ll?.[0] ?? null,
        lon: g.ll?.[1] ?? null,
      }
    : { city: "Unknown", region: "", country: "Unknown", lat: null, lon: null };
}

export function getDeviceId(req) {
  // Prefer a client-provided UUID (cookie or header). Fallback ensures you never get undefined.
  const fromHeader = req.get("X-Device-Id");
  if (fromHeader) return String(fromHeader).slice(0, 255);

  const cookieHeader = req.headers.cookie || "";
  const m = cookieHeader.match(/(?:^|;\s*)x-device-id=([^;]+)/);
  if (m) return decodeURIComponent(m[1]).slice(0, 255);

  // Last-resort: derive a weak, non-stable id (use only if client didn’t provide one)
  const ua = req.get("User-Agent") || "unknown";
  const ip = getClientIP(req);

  return crypto.createHash("sha256").update(`${ua}::${ip}`).digest("hex");
}

export function parseUserAgent(req) {
  let ua = req.get("User-Agent") || "";
  if (ua.toLowerCase().includes("node")) ua = "server-side"; // normalize SSR calls
  const p = new UAParser(ua);
  return {
    device: p.getDevice(), // { model, type, vendor }
    os: p.getOS(), // { name, version }
    browser: p.getBrowser(), // { name, version }
  };
}
