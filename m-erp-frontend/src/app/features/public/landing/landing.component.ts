import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="landing-page">
      <!-- Navbar -->
      <header class="navbar">
        <div class="nav-container">
          <div class="logo">
            <img src="/images/logo-sena.png" alt="SENA Logo" class="sena-logo-nav" />
            <div class="logo-circle">CG</div>
            <span class="logo-text">ChronoGest</span>
          </div>
          <button class="btn-ingresar" (click)="goToLogin()">Ingresar</button>
        </div>
      </header>

      <!-- Hero Section -->
      <section class="hero-section">
        <div class="hero-content">
          <h1 class="hero-title">Gestión Inteligente de Horarios</h1>
          <p class="hero-subtitle">Sistema académico oficial para la programación de la Sede Yamboro del SENA.</p>
          <button class="btn-cta" (click)="goToLogin()">
            Ingresar al Sistema
            <lucide-icon name="arrow-right" [size]="20"></lucide-icon>
          </button>
        </div>
        
        <div class="hero-image-wrapper">
           <img src="/images/campus-yamboro.png" alt="Campus Yamboro" class="hero-image" />
           <div class="hero-image-overlay"></div>
        </div>
        
        <div class="hero-decoration">
          <div class="circle-1"></div>
          <div class="circle-2"></div>
        </div>
      </section>

      <!-- Features Section -->
      <section class="features-section">
        <div class="section-header">
          <h2>Módulos Principales</h2>
          <p>Herramientas diseñadas para optimizar el ecosistema educativo.</p>
        </div>
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">
              <lucide-icon name="calendar" [size]="32"></lucide-icon>
            </div>
            <h3>Gestión de Horarios</h3>
            <p>Asignación de ambientes y programación de horas previniendo cruces e inconsistencias en tiempo real.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">
              <lucide-icon name="check-circle" [size]="32"></lucide-icon>
            </div>
            <h3>Control de Asistencia</h3>
            <p>Registro detallado de ejecución de clases, monitoreo de instructores y control de novedades de ausencias.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">
              <lucide-icon name="bar-chart-2" [size]="32"></lucide-icon>
            </div>
            <h3>Planeación Pedagógica</h3>
            <p>Seguimiento exhaustivo a las competencias académicas impartidas y resultados de aprendizaje de cada ficha.</p>
          </div>
        </div>
      </section>

      <!-- About Section -->
      <section class="about-section">
        <div class="about-container">
           <div class="about-text">
             <h2>Acerca de ChronoGest</h2>
             <div class="about-divider"></div>
             <p>
               <strong>ChronoGest</strong> es una iniciativa tecnológica desarrollada específicamente para resolver 
               los retos logísticos de la Sede Tecnoparque Yamboro del SENA.
             </p>
             <p>
               Nuestro propósito es centralizar la gestión de fichas, instructores y ambientes de aprendizaje, 
               asegurando que la distribución de la carga académica se realice de manera equitativa, transparente 
               y sin cruces de horarios.
             </p>
             <p>
               Con ChronoGest, el SENA avanza hacia la transformación digital, brindando a su comunidad educativa 
               una plataforma moderna que garantiza el aprovechamiento máximo de sus instalaciones y talento humano.
             </p>
           </div>
           <div class="about-visual">
              <div class="stats-grid">
                 <div class="stat-card">
                    <lucide-icon name="users" [size]="24"></lucide-icon>
                    <span class="stat-num">+50</span>
                    <span class="stat-label">Instructores</span>
                 </div>
                 <div class="stat-card">
                    <lucide-icon name="layers" [size]="24"></lucide-icon>
                    <span class="stat-num">+30</span>
                    <span class="stat-label">Programas</span>
                 </div>
                 <div class="stat-card">
                    <lucide-icon name="map-pin" [size]="24"></lucide-icon>
                    <span class="stat-num">+40</span>
                    <span class="stat-label">Ambientes</span>
                 </div>
              </div>
           </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="footer">
        <div class="footer-content">
           <img src="/images/logo-sena.png" alt="SENA Logo" class="sena-logo-footer" />
           <div class="footer-info">
             <p class="footer-title">SENA - Tecnoparque Yamboro</p>
             <p class="footer-copy">ChronoGest &copy; 2026. Todos los derechos reservados.</p>
           </div>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .landing-page {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      font-family: 'Inter', system-ui, sans-serif;
      background: #F8FAFC;
    }

    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes revealImage {
      from { opacity: 0; clip-path: polygon(0 0, 0 0, 0 100%, 0 100%); }
      to { opacity: 1; clip-path: polygon(10% 0, 100% 0, 100% 100%, 0 100%); }
    }

    /* Navbar */
    .navbar {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      position: fixed;
      top: 0; left: 0; width: 100%;
      z-index: 100;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      transition: all 0.3s ease;
    }
    .nav-container {
      max-width: 1300px;
      margin: 0 auto;
      padding: 16px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .sena-logo-nav {
      height: 36px;
      width: auto;
      object-fit: contain;
      border-right: 1px solid #E5E7EB;
      padding-right: 12px;
    }
    .logo-circle {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #1B5C3A, #16A34A);
      color: white;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 13px;
    }
    .logo-text {
      font-size: 20px;
      font-weight: 800;
      color: #111827;
      letter-spacing: -0.5px;
    }
    .btn-ingresar {
      background: #1B5C3A;
      color: white;
      border: none;
      padding: 10px 24px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      transition: background 0.2s, transform 0.2s;
    }
    .btn-ingresar:hover {
      background: #16A34A;
      transform: translateY(-1px);
    }

    /* Hero Section */
    .hero-section {
      margin-top: 64px;
      background: linear-gradient(135deg, #1B5C3A 0%, #064E3B 100%);
      position: relative;
      overflow: hidden;
      display: grid;
      grid-template-columns: 1fr 1fr;
      align-items: center;
      min-height: 80vh;
    }
    .hero-content {
      position: relative;
      z-index: 2;
      padding: 40px 60px 40px 100px;
      animation: fadeInUp 0.8s ease-out forwards;
    }
    .hero-title {
      font-size: 56px;
      font-weight: 800;
      color: white;
      margin: 0 0 24px 0;
      line-height: 1.1;
      letter-spacing: -1.5px;
    }
    .hero-subtitle {
      font-size: 20px;
      color: #D1FAE5;
      margin: 0 0 40px 0;
      font-weight: 400;
      line-height: 1.6;
      max-width: 90%;
    }
    .btn-cta {
      background: #FFFFFF;
      color: #1B5C3A;
      border: none;
      padding: 16px 32px;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 12px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      transition: all 0.3s ease;
    }
    .btn-cta:hover {
      transform: translateY(-3px);
      box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
      background: #F8FAFC;
    }
    .hero-image-wrapper {
      position: relative;
      height: 100%;
      width: 100%;
      clip-path: polygon(10% 0, 100% 0, 100% 100%, 0 100%);
      animation: revealImage 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      animation-delay: 0.2s;
    }
    .hero-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      opacity: 0.95;
    }
    .hero-image-overlay {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: linear-gradient(90deg, rgba(6,78,59,1) 0%, rgba(6,78,59,0.2) 20%, rgba(0,0,0,0) 60%);
    }
    .hero-decoration {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      overflow: hidden; z-index: 1; opacity: 0.05; pointer-events: none;
    }
    .circle-1 { position: absolute; top: -100px; left: -100px; width: 500px; height: 500px; border-radius: 50%; background: white; }
    .circle-2 { position: absolute; bottom: -150px; right: 20%; width: 600px; height: 600px; border-radius: 50%; background: white; }

    /* Features Section */
    .features-section {
      padding: 100px 24px;
      background: #FFFFFF;
    }
    .section-header {
      text-align: center;
      margin-bottom: 64px;
    }
    .section-header h2 {
      font-size: 36px;
      font-weight: 800;
      color: #111827;
      margin: 0 0 12px 0;
      letter-spacing: -0.5px;
    }
    .section-header p {
      font-size: 18px;
      color: #6B7280;
      margin: 0;
    }
    .features-grid {
      max-width: 1200px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 32px;
    }
    .feature-card {
      background: #F8FAFC;
      padding: 48px 32px;
      border-radius: 20px;
      border: 1px solid #F1F5F9;
      transition: all 0.3s ease;
      text-align: center;
    }
    .feature-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02);
      background: #FFFFFF;
      border-color: #E5E7EB;
    }
    .feature-icon {
      width: 72px;
      height: 72px;
      background: #DCFCE7;
      color: #16A34A;
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
      box-shadow: 0 4px 6px -1px rgba(22, 163, 74, 0.1);
    }
    .feature-card h3 {
      font-size: 22px;
      font-weight: 700;
      color: #111827;
      margin: 0 0 16px 0;
    }
    .feature-card p {
      font-size: 16px;
      color: #4B5563;
      margin: 0;
      line-height: 1.6;
    }

    /* About Section */
    .about-section {
      background: #F0FDF4;
      padding: 100px 24px;
    }
    .about-container {
      max-width: 1200px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 64px;
      align-items: center;
    }
    .about-text h2 {
      font-size: 36px;
      font-weight: 800;
      color: #1B5C3A;
      margin: 0 0 16px 0;
      letter-spacing: -0.5px;
    }
    .about-divider {
      width: 60px;
      height: 4px;
      background: #FBBF24;
      border-radius: 2px;
      margin-bottom: 32px;
    }
    .about-text p {
      font-size: 17px;
      color: #374151;
      line-height: 1.7;
      margin-bottom: 20px;
    }
    .about-text strong {
      color: #16A34A;
      font-weight: 700;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }
    .stat-card {
      background: white;
      padding: 32px 24px;
      border-radius: 16px;
      text-align: center;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
      border: 1px solid #E5E7EB;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }
    .stat-card lucide-icon { color: #16A34A; margin-bottom: 8px; }
    .stat-num { font-size: 36px; font-weight: 800; color: #111827; }
    .stat-label { font-size: 15px; color: #6B7280; font-weight: 500; }
    
    /* Footer */
    .footer {
      background: #111827;
      padding: 48px 24px;
    }
    .footer-content {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 24px;
    }
    .sena-logo-footer {
      height: 48px;
      filter: brightness(0) invert(1);
      opacity: 0.7;
    }
    .footer-title {
      font-size: 18px;
      font-weight: 700;
      color: #F9FAFB;
      margin: 0 0 8px 0;
    }
    .footer-copy {
      font-size: 14px;
      color: #9CA3AF;
      margin: 0;
    }

    /* Responsive */
    @media (max-width: 992px) {
      .hero-section {
        grid-template-columns: 1fr;
        text-align: center;
      }
      .hero-content {
        padding: 60px 24px;
      }
      .hero-subtitle { margin: 0 auto 40px auto; }
      .hero-image-wrapper {
        clip-path: none;
        height: 300px;
      }
      .hero-image-overlay {
        background: linear-gradient(0deg, rgba(6,78,59,1) 0%, rgba(6,78,59,0.2) 100%);
      }
      .about-container { grid-template-columns: 1fr; }
    }
  `]
})
export class LandingComponent {
  constructor(private router: Router) {}

  goToLogin() {
    this.router.navigate(['/auth/login']);
  }
}
