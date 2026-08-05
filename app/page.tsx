import Hero from './components/Hero';
import Trace from './components/Trace';
import Pain from './components/Pain';
import Features from './components/Features';
import Demo from './components/Demo';
import Quickstart from './components/Quickstart';
import Scope from './components/Scope';
import Footer from './components/Footer';

// 섹션 순서는 지시서 §2 확정 순서 그대로.
export default function Home() {
  return (
    <main>
      <Hero />
      <Trace />
      <Pain />
      <Features />
      <Demo />
      <Quickstart />
      <Scope />
      <Footer />
    </main>
  );
}
