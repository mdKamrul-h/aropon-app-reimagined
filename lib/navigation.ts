import type { Href } from 'expo-router';
import { router } from 'expo-router';

/** Avoid GO_BACK errors when there is no prior screen in the stack. */
export function goBackOr(fallback: Href) {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace(fallback);
}
