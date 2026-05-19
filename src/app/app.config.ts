import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import { featherHome, featherUsers, featherDollarSign, featherCreditCard, featherMenu, featherUser } from '@ng-icons/feather-icons';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideIcons({
      featherHome,
      featherUsers,
      featherDollarSign,
      featherCreditCard,
      featherMenu,
      featherUser
    })
  ]
};
