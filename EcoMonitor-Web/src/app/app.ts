import { Component } from '@angular/core';
import { Router } from '@angular/router'; // Adicionado para controlar o layout

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.scss',
})
export class App {
  // Injetamos o router aqui para usar no HTML
  constructor(public router: Router) {}

  setActive(event: MouseEvent) {
    const listItems = document.querySelectorAll('.navigation ul li');
    listItems.forEach((item) => {
      item.classList.remove('active');
    });
    const clickedElement = event.currentTarget as HTMLElement;
    clickedElement.classList.add('active');
  }
}
