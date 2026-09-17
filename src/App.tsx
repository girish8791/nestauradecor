import Navbar from './components/Navbar'
import Hero from './components/Hero'
import WhyUs from './components/WhyUs'
import OurProcess from './components/OurProcess'
import OurServices from './components/OurServices'

export default function App() {
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <Navbar />
      <main id="main">
        <Hero />
        <WhyUs />
        <OurProcess />
        <OurServices />
      </main>
    </>
  )
}
