import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { Sidebar } from './components/sidebar/sidebar';
import { Navbar } from './components/navbar/navbar';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { Login } from './pages/login/login';
import { SensoresIot } from './pages/sensores-iot/sensores-iot';
import { AdminPanel } from './pages/admin-panel/admin-panel';

// Importe o interceptor que você criou (verifique o caminho do arquivo)
import { AuthInterceptor } from './guards/auth.interceptor';

@NgModule({
  declarations: [App, Sidebar, Navbar, DashboardComponent, Login, SensoresIot, AdminPanel],
  imports: [BrowserModule, AppRoutingModule, FormsModule],
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Configuramos o HttpClient para aceitar interceptores baseados em Classe (DI)
    provideHttpClient(withInterceptorsFromDi()),
    // Registramos o seu interceptor aqui
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
  ],
  bootstrap: [App],
})
export class AppModule {}
