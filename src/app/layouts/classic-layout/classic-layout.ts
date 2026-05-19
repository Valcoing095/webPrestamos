import { Component, HostListener } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { NgIcon } from '@ng-icons/core';

@Component({
  selector: 'app-classic-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgIcon],
  templateUrl: './classic-layout.html',
  styleUrl: './classic-layout.css',
})
export class ClassicLayout {
  sidebarOpen = true;

  toggleSidebar(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.sidebarOpen = !this.sidebarOpen;
    console.log('Botón ☰ clickeado, sidebarOpen:', this.sidebarOpen);
  }

  closeIfMobile(): void {
    if (typeof window !== 'undefined' && window.innerWidth < 992) {
      this.sidebarOpen = false;
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (typeof window === 'undefined') return;
    
    const isMobile = window.innerWidth < 992;
    if (!isMobile || !this.sidebarOpen) return;

    const sidebar = document.querySelector('.sidebar');
    const button = document.querySelector('.navbar .btn-link');
    
    const clickedInsideSidebar = sidebar?.contains(event.target as Node);
    const clickedOnButton = button?.contains(event.target as Node);
    
    if (!clickedInsideSidebar && !clickedOnButton) {
      this.sidebarOpen = false;
      console.log('Click fuera, cerrando sidebar');
    }
  }
}
