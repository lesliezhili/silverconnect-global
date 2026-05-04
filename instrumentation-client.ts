import { initSentry } from "./sentry.config";
initSentry("client");
export { captureRouterTransitionStart as onRouterTransitionStart } from "@sentry/nextjs";
