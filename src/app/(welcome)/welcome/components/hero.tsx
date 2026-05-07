import HeroContent from './hero-content';
import HeroVisual from './hero-visual';

export function Hero() {
  return (
    <main
      id="hero"
      className="grid lg:grid-cols-2 min-h-screen lg:pt-20 max-w-[1440px] mx-auto"
    >
      <HeroContent />
      <HeroVisual />
    </main>
  );
}
