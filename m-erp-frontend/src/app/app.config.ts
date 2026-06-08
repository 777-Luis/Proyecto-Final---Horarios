import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
import { importProvidersFrom } from '@angular/core';
import { LucideAngularModule, Clock, Save, ChevronDown, ArrowLeft, CheckCircle, Lock, Mail, User, LogIn, Eye, EyeOff, LayoutDashboard, Database, KeyRound, CalendarDays, AlignLeft, Send, Users, LogOut, ArrowRight, FileDown, BookOpen, Building2, ClipboardList, ClipboardCheck, Settings, CalendarCheck, UserCircle, UserPlus, UploadCloud, DownloadCloud, X, Calendar, Building, MapPin, Sun, Moon, Plus, FastForward, XCircle, Paperclip, ChevronsUpDown, Pencil, Trash2, ChevronLeft, ChevronRight, Bell, UserCheck, GraduationCap, Search, Download, AlertCircle, Check, GanttChartSquare, CalendarOff, BarChart2, Layers, Loader2, PlayCircle, List, LayoutGrid, Copy, CreditCard, Briefcase, Map } from 'lucide-angular';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([jwtInterceptor])),
    provideCharts(withDefaultRegisterables()),
    importProvidersFrom(LucideAngularModule.pick({ Clock, Save, ChevronDown, ArrowLeft, CheckCircle, Lock, Mail, User, LogIn, Eye, EyeOff, LayoutDashboard, Database, KeyRound, CalendarDays, AlignLeft, Send, Users, LogOut, ArrowRight, FileDown, BookOpen, Building2, ClipboardList, ClipboardCheck, Settings, CalendarCheck, UserCircle, UserPlus, UploadCloud, DownloadCloud, X, Calendar, Building, MapPin, Sun, Moon, Plus, FastForward, XCircle, Paperclip, ChevronsUpDown, Pencil, Trash2, ChevronLeft, ChevronRight, Bell, UserCheck, GraduationCap, Search, Download, AlertCircle, Check, GanttChartSquare, CalendarOff, BarChart2, Layers, Loader2, PlayCircle, List, LayoutGrid, Copy, CreditCard, Briefcase, Map }))
  ]
};
