import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
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
  featherShield,
} from '@ng-icons/feather-icons';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptors([authInterceptor])),
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
      featherShield,
    }),
  ],
};
