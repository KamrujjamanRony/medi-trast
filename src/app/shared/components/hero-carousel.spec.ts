import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Carousel } from 'app/features/models';
import { HeroCarousel } from './hero-carousel';

@Component({
  imports: [HeroCarousel],
  template: '<app-hero-carousel [slides]="slides()" />',
})
class HostComponent {
  readonly slides = signal<Carousel[]>([]);
}

function slide(id: string): Carousel {
  return { id, companyID: 1, title: `Slide ${id}`, description: null, imageUrl: `${id}.jpg` };
}

describe('HeroCarousel', () => {
  async function setup(slides: Carousel[]) {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.slides.set(slides);
    await fixture.whenStable();
    return fixture;
  }

  function track(fixture: { nativeElement: HTMLElement }): HTMLElement {
    return fixture.nativeElement.querySelector('.track') as HTMLElement;
  }

  it('renders one slide per record', async () => {
    const fixture = await setup([slide('a'), slide('b'), slide('c')]);
    expect(fixture.nativeElement.querySelectorAll('.slide').length).toBe(3);
  });

  it('advances and wraps around with the next control', async () => {
    const fixture = await setup([slide('a'), slide('b')]);
    const next = fixture.nativeElement.querySelector('.nav-next') as HTMLButtonElement;

    expect(track(fixture).style.transform).toBe('translateX(-0%)');

    next.click();
    await fixture.whenStable();
    expect(track(fixture).style.transform).toBe('translateX(-100%)');

    next.click();
    await fixture.whenStable();
    expect(track(fixture).style.transform).toBe('translateX(-0%)');
  });

  it('wraps backwards from the first slide', async () => {
    const fixture = await setup([slide('a'), slide('b'), slide('c')]);
    const previous = fixture.nativeElement.querySelector('.nav-prev') as HTMLButtonElement;

    previous.click();
    await fixture.whenStable();

    expect(track(fixture).style.transform).toBe('translateX(-200%)');
  });

  it('omits the controls when there is only one slide', async () => {
    const fixture = await setup([slide('a')]);
    expect(fixture.nativeElement.querySelector('.nav-next')).toBeNull();
    expect(fixture.nativeElement.querySelector('.dots')).toBeNull();
  });

  /**
   * Deleting the slide that is currently showing must not leave the index past
   * the end of the list, which would scroll the track to an empty frame.
   */
  it('clamps the index when slides are removed', async () => {
    const fixture = await setup([slide('a'), slide('b'), slide('c')]);
    const next = fixture.nativeElement.querySelector('.nav-next') as HTMLButtonElement;

    next.click();
    next.click();
    await fixture.whenStable();
    expect(track(fixture).style.transform).toBe('translateX(-200%)');

    fixture.componentInstance.slides.set([slide('a')]);
    await fixture.whenStable();

    expect(track(fixture).style.transform).toBe('translateX(-0%)');
  });

  it('marks non-active slides inert so they stay out of the tab order', async () => {
    const fixture = await setup([slide('a'), slide('b')]);
    const slides = fixture.nativeElement.querySelectorAll('.slide');

    expect(slides[0].hasAttribute('inert')).toBe(false);
    expect(slides[1].hasAttribute('inert')).toBe(true);
  });
});
