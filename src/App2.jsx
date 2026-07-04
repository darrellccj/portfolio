import SkyGL from './components/SkyGL.jsx';
import Nav from './components/Nav.jsx';
import Hero from './components/Hero.jsx';
import About from './components/About.jsx';
import Work from './components/Work.jsx';
import Kiv from './components/Kiv.jsx';
import Contact from './components/Contact.jsx';

// Sky variant of the landing page (index2.html). Identical content;
// the fixed koi-pond backdrop is swapped for a photoreal moving sky.
export default function App2() {
  return (
    <>
      <SkyGL />
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