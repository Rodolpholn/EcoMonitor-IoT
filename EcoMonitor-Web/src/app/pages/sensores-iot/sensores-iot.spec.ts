import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SensoresIot } from './sensores-iot';

describe('SensoresIot', () => {
  let component: SensoresIot;
  let fixture: ComponentFixture<SensoresIot>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SensoresIot],
    }).compileComponents();

    fixture = TestBed.createComponent(SensoresIot);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
