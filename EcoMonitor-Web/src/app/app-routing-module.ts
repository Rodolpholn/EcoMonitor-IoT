import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { Login } from './pages/login/login'; // Verifique se o caminho está certo aqui
import { SensoresIot } from './pages/sensores-iot/sensores-iot';

const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'sensores-iot', component: SensoresIot },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
