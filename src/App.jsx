import Nav from './components/Nav.jsx';
import Hero from './components/Hero.jsx';
import About from './components/About.jsx';
import Work from './components/Work.jsx';
import Kiv from './components/Kiv.jsx';
import Dither from './components/Dither.jsx';
import Contact from './components/Contact.jsx';

export default function App() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <About />
        <Work />
        <Kiv />
        <Dither />
        <Contact />
      </main>
    </>
  );
}
