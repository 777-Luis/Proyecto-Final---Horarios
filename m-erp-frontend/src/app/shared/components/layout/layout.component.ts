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
      <!-- WhatsApp Floating Button (Global authenticated view) -->
      <a href="https://wa.me/573000000000" target="_blank" class="whatsapp-float" aria-label="Chat en WhatsApp">
        <svg viewBox="0 0 32 32" width="36" height="36" fill="white">
           <path d="M16.082 2.115c-7.66 0-13.885 6.225-13.885 13.885 0 2.45.64 4.84 1.848 6.945L2.115 29.885l7.106-1.865c2.043 1.12 4.34 1.714 6.861 1.714 7.66 0 13.885-6.225 13.885-13.885S23.742 2.115 16.082 2.115zm0 25.433c-2.072 0-4.103-.556-5.877-1.608l-.42-.248-4.364 1.145 1.166-4.25-.272-.435C5.166 20.25 4.542 18.17 4.542 16c0-6.324 5.148-11.472 11.54-11.472 6.39 0 11.54 5.148 11.54 11.472S22.472 27.548 16.082 27.548zm6.33-8.625c-.346-.174-2.05-1.013-2.368-1.128-.316-.115-.55-.174-.792.174-.242.348-.897 1.128-1.103 1.36-.205.23-.41.26-.757.086-1.922-.96-3.328-2.158-4.63-4.354-.206-.347.166-.312.507-.996.086-.174.043-.328-.043-.502-.086-.174-.792-1.91-1.084-2.615-.285-.69-.57-.597-.792-.608-.205-.01-.44-.01-.676-.01s-.618.086-.942.435c-.324.347-1.24 1.213-1.24 2.955s1.27 3.42 1.444 3.65c.174.23 2.492 3.805 6.037 5.334 2.378 1.026 3.238 1.084 4.19 1.013.952-.072 2.05-.838 2.338-1.647.29-.81.29-1.503.205-1.647-.086-.145-.316-.23-.662-.405z"/>
        </svg>
      </a>
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

    /* WhatsApp Float Button */
    .whatsapp-float {
      position: fixed;
      bottom: 40px;
      right: 40px;
      width: 60px;
      height: 60px;
      background-color: #25d366;
      border-radius: 50%;
      box-shadow: 0px 4px 10px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .whatsapp-float:hover {
      transform: scale(1.1);
      box-shadow: 0px 6px 14px rgba(0,0,0,0.4);
    }
    
    @media (max-width: 768px) {
      .whatsapp-float {
        bottom: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
      }
      .whatsapp-float svg {
        width: 28px;
        height: 28px;
      }
    }
  `]
})
export class LayoutComponent {}
