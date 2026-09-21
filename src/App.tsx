import Navbar from './components/Navbar'
import Hero from './components/Hero'
import WhyUs from './components/WhyUs'
import OurProcess from './components/OurProcess'
import OurServices from './components/OurServices'
import EndlessPossibilities from './components/EndlessPossibilities'
import PeacePriority from './components/PeacePriority'
import Faq from './components/Faq'
import MeetTheBrains from './components/MeetTheBrains'
import Footer from './components/Footer'
import './styles/layout.css'

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
        <EndlessPossibilities />
        <PeacePriority />
        <MeetTheBrains />
        <Faq />
      </main>
      <Footer />
    </>
  )
}
