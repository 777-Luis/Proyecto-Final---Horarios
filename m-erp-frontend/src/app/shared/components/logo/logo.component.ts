import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-logo',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="logo-container" [style.width.px]="size" [style.height.px]="size" [class.animate]="animate">
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
        <!-- Base Background -->
        <rect x="0" y="0" width="100" height="100" [attr.rx]="rounded ? 24 : 0" fill="url(#bgGrad)" class="logo-bg"/>
        
        <g transform="translate(0, 1)"> <!-- Slight optical vertical centering -->
          <!-- The continuous stroke forming the 'C', 'G', and the minute hand -->
          <path d="M 68 31 A 26 26 0 1 0 68 69 L 68 50 L 50 50" 
                stroke="#FFFFFF" 
                stroke-width="9" 
                stroke-linecap="round" 
                stroke-linejoin="round"
                class="logo-path-main" />
          
          <!-- The hour hand of the clock -->
          <path d="M 50 50 L 38 36" 
                stroke="#86EFAC" 
                stroke-width="7" 
                stroke-linecap="round"
                class="logo-path-hand" />
          
          <!-- Center pin of the clock -->
          <circle cx="50" cy="50" r="4.5" fill="#86EFAC" class="logo-pin"/>
        </g>

        <defs>
          <linearGradient id="bgGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#16A34A"/>
            <stop offset="100%" stop-color="#064E3B"/>
          </linearGradient>
        </defs>
      </svg>
    </div>
  `,
  styles: [`
    .logo-container {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      user-select: none;
    }
    
    /* Animation effects for hover or initialization */
    .logo-container.animate .logo-path-main {
      stroke-dasharray: 200;
      stroke-dashoffset: 200;
      animation: drawMain 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    
    .logo-container.animate .logo-path-hand {
      stroke-dasharray: 50;
      stroke-dashoffset: 50;
      animation: drawHand 1s cubic-bezier(0.16, 1, 0.3, 1) 0.5s forwards;
    }
    
    .logo-container.animate .logo-pin {
      opacity: 0;
      transform: scale(0);
      transform-origin: center;
      animation: popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 1s forwards;
    }

    .logo-container:hover .logo-bg {
      filter: brightness(1.1);
      transition: filter 0.3s ease;
    }

    @keyframes drawMain {
      to { stroke-dashoffset: 0; }
    }
    @keyframes drawHand {
      to { stroke-dashoffset: 0; }
    }
    @keyframes popIn {
      to { opacity: 1; transform: scale(1); }
    }
  `]
})
export class LogoComponent {
  @Input() size: number = 40;
  @Input() rounded: boolean = true;
  @Input() animate: boolean = false;
}
