import Hero from './components/Hero';
import Trace from './components/Trace';
import Pain from './components/Pain';
import Features from './components/Features';
import Demo from './components/Demo';
import Quickstart from './components/Quickstart';
import Scope from './components/Scope';
import Footer from './components/Footer';

export default function Home() {
  return (
    <>
      <main>
        <Hero />
        <Trace />
        <Pain />
        <Features />
        <Demo />
        <Quickstart />
        <Scope />
      </main>
      <Footer />
    </>
  );
}
