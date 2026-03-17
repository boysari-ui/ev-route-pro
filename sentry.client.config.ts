import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://2dff88e08293010e5c3385ff3c6a05a2@o4511047877459968.ingest.de.sentry.io/4511047885127760",
  tracesSampleRate: 1,
  ignoreErrors: [
    // iOS Safari Firebase IndexedDB 연결 끊김 — 새로고침으로 해결되는 알려진 이슈
    "UnknownError: Connection to Indexed Database server lost",
    "Connection to Indexed Database server lost",
  ],
});
