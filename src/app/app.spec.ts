import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  it('se crea y muestra la ruta activa en un router-outlet', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    expect(fixture.componentInstance).toBeTruthy();
    expect((fixture.nativeElement as HTMLElement).querySelector('router-outlet')).not.toBeNull();
  });
});
