import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DataSyncService } from './core/services/data-sync.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet></router-outlet>'
})
export class AppComponent {
  // Instanciar aquí arranca la carga/limpieza de datos según la sesión
  private dataSync = inject(DataSyncService);
}
