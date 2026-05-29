import { Session } from 'next-auth';
import HeroContent from './hero-content';
import HeroVisual from './hero-visual';

type Props = {
  session?: Session | null;
};

export function Hero({ session }: Props) {
  return (
    <main
      id="hero"
      className="grid lg:grid-cols-2 min-h-screen lg:pt-20 max-w-[1440px] mx-auto"
    >
      <HeroContent session={session} />
      <HeroVisual />
    </main>
  );
}
