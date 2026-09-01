import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
} from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      // Route params arrive as component inputs, so pages read `id()` and
      // `category()` as signals instead of subscribing to `paramMap`.
      withComponentInputBinding(),
      // Replaces the hand-rolled `window.scrollTo(0, 0)` calls that used to sit
      // in click handlers — which meant scrolling only reset when navigation
      // started from a card, and never on browser back/forward.
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled',
      }),
    ),
    provideHttpClient(withFetch()),
  ],
};
