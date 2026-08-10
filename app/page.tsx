import Hero from './components/Hero';
import Trace from './components/Trace';
import Pain from './components/Pain';
import Features from './components/Features';
import Demo from './components/Demo';
import Quickstart from './components/Quickstart';
import Scope from './components/Scope';
import Footer from './components/Footer';
import ReadingProgress from './components/ReadingProgress';
import ThemeToggle from './components/ThemeToggle';

export default function Home() {
  return (
    <>
      {/* Landing only, for the same reason ReadingProgress is: /demo is night
          whatever the switch says, so offering the switch there would be a
          control that does nothing. */}
      <ThemeToggle />
      <main>
        <Hero />
        <Demo />
        <Pain />
        <Features />
        <Quickstart />
        <Trace />
        <Scope />
      </main>
      <Footer />
      {/* Belongs to the landing, not to every route: /demo is a single screen
          with nothing to scroll, and 기획 §9 keeps the landing's flourishes off
          it. Mounting it here rather than in the root layout is what stops it
          from following. */}
      <ReadingProgress />
    </>
  );
}
