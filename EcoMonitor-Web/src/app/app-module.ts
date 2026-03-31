import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { Sidebar } from './components/sidebar/sidebar';
import { Navbar } from './components/navbar/navbar';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { Login } from './pages/login/login';

@NgModule({
  declarations: [App, Sidebar, Navbar, DashboardComponent, Login],
  imports: [BrowserModule, AppRoutingModule],
  providers: [provideBrowserGlobalErrorListeners(), provideHttpClient()],
  bootstrap: [App],
})
export class AppModule {}
