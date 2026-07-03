import KoiPond from './components/KoiPondGL.jsx';
import Nav from './components/Nav.jsx';
import Hero from './components/Hero.jsx';
import About from './components/About.jsx';
import Work from './components/Work.jsx';
import Kiv from './components/Kiv.jsx';
import Contact from './components/Contact.jsx';

export default function App() {
  return (
    <>
      {/* The pond is a fixed backdrop that stays behind every section. */}
      <KoiPond />
      <Nav />
      <main>
        <Hero />
        <About />
        <Work />
        <Kiv />
        <Contact />
      </main>
    </>
  );
}
