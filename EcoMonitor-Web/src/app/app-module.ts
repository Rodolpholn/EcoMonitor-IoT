import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { Sidebar } from './components/sidebar/sidebar';
import { Navbar } from './components/navbar/navbar';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { Login } from './pages/login/login';
import { SensoresIot } from './pages/sensores-iot/sensores-iot';

@NgModule({
  declarations: [App, Sidebar, Navbar, DashboardComponent, Login, SensoresIot],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule, // 2. ADICIONE O FORMSMODULE AQUI
  ],
  providers: [provideBrowserGlobalErrorListeners(), provideHttpClient()],
  bootstrap: [App],
})
export class AppModule {}
