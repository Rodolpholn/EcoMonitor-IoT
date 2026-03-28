import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.scss',
})
export class App {
  // Função que move a classe 'active' entre os itens do menu mobile
  setActive(event: MouseEvent) {
    // 1. Encontra todos os itens da lista mobile
    const listItems = document.querySelectorAll('.navigation ul li');

    // 2. Remove a classe active de todos
    listItems.forEach((item) => {
      item.classList.remove('active');
    });

    // 3. Adiciona a classe active no item que foi clicado
    const clickedElement = event.currentTarget as HTMLElement;
    clickedElement.classList.add('active');
  }
}
