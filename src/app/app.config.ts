import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
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
  featherSettings
} from '@ng-icons/feather-icons';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideCharts(withDefaultRegisterables()),
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
      featherSettings
    })
  ]
};
