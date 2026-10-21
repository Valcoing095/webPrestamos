import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withInMemoryScrolling, withViewTransitions } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import {
  featherHome,
  featherUsers,
  featherDollarSign,
  featherCreditCard,
  featherMenu,
  featherUser,
  featherMap,
  featherTrendingUp,
  featherLogOut,
  featherFileText,
  featherPlus,
  featherActivity,
  featherCheckCircle,
  featherClock,
  featherPieChart,
  featherBell,
  featherAlertTriangle,
} from '@ng-icons/feather-icons';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Transiciones nativas entre rutas (View Transitions API): fluidas y sin librerías
    provideRouter(
      routes,
      withViewTransitions(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
    ),
    provideIcons({
      featherHome,
      featherUsers,
      featherDollarSign,
      featherCreditCard,
      featherMenu,
      featherUser,
      featherMap,
      featherTrendingUp,
      featherLogOut,
      featherFileText,
      featherPlus,
      featherActivity,
      featherCheckCircle,
      featherClock,
      featherPieChart,
      featherBell,
      featherAlertTriangle,
    }),
  ],
};
