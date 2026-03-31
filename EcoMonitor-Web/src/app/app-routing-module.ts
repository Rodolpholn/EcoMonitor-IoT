import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { Login } from './pages/login/login'; // Verifique se o caminho está certo aqui

const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'dashboard', component: DashboardComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' }, // Agora o "vazio" joga para o Login
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
