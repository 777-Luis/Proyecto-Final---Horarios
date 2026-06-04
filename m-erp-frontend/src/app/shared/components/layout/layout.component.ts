import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, NavbarComponent],
  template: `
    <div class="app-layout">
      <app-sidebar></app-sidebar>
      <div class="main-wrapper">
        <app-navbar></app-navbar>
        <main class="content-container">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .app-layout {
      min-height: 100vh;
      display: flex;
      background-color: var(--color-bg);
    }

    .main-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      /* Compensable padding matching Collapsed Sidebar strictly */
      padding-left: var(--sidebar-collapsed);
    }

    .content-container {
      flex: 1;
      padding: 24px;
      overflow-y: auto;
    }
  `]
})
export class LayoutComponent {}
