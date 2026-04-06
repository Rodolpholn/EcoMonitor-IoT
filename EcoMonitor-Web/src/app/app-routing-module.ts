import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { Login } from './pages/login/login'; 
import { SensoresIot } from './pages/sensores-iot/sensores-iot';
import { AdminPanel } from './pages/admin-panel/admin-panel';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';

const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'sensores-iot', component: SensoresIot, canActivate: [AuthGuard] },
  { path: 'admin-panel', component: AdminPanel, canActivate: [AuthGuard, AdminGuard] },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
