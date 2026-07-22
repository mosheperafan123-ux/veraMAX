import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react'

/* ================================================================== */
/* IMAGE URLS                                                          */
/* ================================================================== */

const HERO_IMAGE =
  'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260624_113640_ccf3cf97-d447-425b-a134-d7b09fc743fc.png&w=1280&q=85'

const SECTION2_IMAGE =
  'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260624_114219_414dfe80-f15c-4e25-bf52-b13721f4bd88.png&w=1280&q=85'

const SECTION3_IMG1 =
  'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260624_115253_c19ab167-8dd5-48b4-967d-b9f0d9d6e8fb.png&w=1280&q=85'

const SECTION3_IMG2 =
  'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260624_115237_fc519057-6e87-4abf-999a-9610b8b085b4.png&w=1280&q=85'

const SECTION3_BG =
  'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260624_114355_752ba9e6-0942-4abb-9047-5d9bb16632e9.png&w=1280&q=85'

/* ================================================================== */
/* DATA CONSTANTS                                                      */
/* ================================================================== */

const featureBars = ['Advanced Dentistry', 'High Quality Equipment', 'Friendly Staff']

const services = [
  { name: 'Dental\nVeneers', num: '01', active: true },
  { name: 'Dental\nCrowns', num: '02', active: false },
  { name: 'Teeth\nWhitening', num: '03', active: false },
  { name: 'Dental\nImplants', num: null, active: false },
]

const navLinks: { label: string; href: string }[] = [
  { label: 'Home', href: '#home' },
  { label: 'Services', href: '#services' },
  { label: 'About', href: '#about' },
  { label: 'Gallery', href: '#gallery' },
  { label: 'Team', href: '#team' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Contact', href: '#contact' },
]

const stats = [
  { value: 22, suffix: '+', label: 'Years of Experience' },
  { value: 18500, suffix: '+', label: 'Happy Patients' },
  { value: 14, suffix: '', label: 'Expert Specialists' },
  { value: 4.9, suffix: '', label: 'Average Rating', decimals: 1 },
]

const detailedServices = [
  {
    icon: 'veneer',
    name: 'Porcelain Veneers',
    desc: 'Ultra-thin, custom-crafted shells that transform the shape, color and alignment of your teeth in as few as two visits.',
    price: 'from $850 / tooth',
    points: ['Stain-resistant porcelain', 'Natural translucency', 'Minimal enamel removal'],
  },
  {
    icon: 'crown',
    name: 'Dental Crowns',
    desc: 'Durable, tooth-colored crowns that restore strength and beauty to damaged or weakened teeth.',
    price: 'from $1,100',
    points: ['Same-day CEREC option', 'Zirconia & E-max', '10-year guarantee'],
  },
  {
    icon: 'whitening',
    name: 'Teeth Whitening',
    desc: 'Professional in-office and take-home whitening that brightens your smile up to 8 shades safely.',
    price: 'from $399',
    points: ['Zoom! technology', 'Low sensitivity formula', 'Results in one hour'],
  },
  {
    icon: 'implant',
    name: 'Dental Implants',
    desc: 'Permanent titanium implants that look, feel and function like natural teeth — built to last a lifetime.',
    price: 'from $2,400',
    points: ['Guided 3D placement', 'All-on-4 full arch', 'Bone-grafting available'],
  },
  {
    icon: 'aligner',
    name: 'Invisalign & Braces',
    desc: 'Discreet clear aligners and modern orthodontics that straighten teeth without disrupting your life.',
    price: 'from $3,500',
    points: ['Invisible aligners', 'Digital treatment preview', 'Flexible payment plans'],
  },
  {
    icon: 'root',
    name: 'Root Canal Therapy',
    desc: 'Gentle, virtually painless endodontic treatment that saves infected teeth and relieves pain fast.',
    price: 'from $700',
    points: ['Rotary instrumentation', 'Single-visit option', 'Microscope precision'],
  },
  {
    icon: 'child',
    name: 'Pediatric Dentistry',
    desc: 'A warm, playful environment that helps children build healthy habits and a lifelong love of the dentist.',
    price: 'from $90',
    points: ['Kid-friendly team', 'Sealants & fluoride', 'Gentle first visits'],
  },
  {
    icon: 'emergency',
    name: 'Emergency Care',
    desc: 'Same-day urgent appointments for broken teeth, severe pain, swelling and dental trauma — 7 days a week.',
    price: '24 / 7 available',
    points: ['Same-day relief', 'Walk-ins welcome', 'After-hours hotline'],
  },
]

const whyChooseUs = [
  {
    icon: 'tech',
    title: 'Advanced Technology',
    desc: '3D cone-beam CT, intraoral scanners and digital X-rays for precise, radiation-light diagnostics.',
  },
  {
    icon: 'painless',
    title: 'Painless Treatments',
    desc: 'Sedation options, numbing technology and a gentle touch keep every visit calm and comfortable.',
  },
  {
    icon: 'calendar',
    title: 'Same-Day Appointments',
    desc: 'Flexible scheduling with same-day and weekend slots so care fits around your busy life.',
  },
  {
    icon: 'price',
    title: 'Transparent Pricing',
    desc: 'Clear estimates up front, no surprise bills, and interest-free financing on major treatments.',
  },
  {
    icon: 'shield',
    title: 'Insurance Accepted',
    desc: 'We work with all major PPO insurers and handle the paperwork so you don’t have to.',
  },
  {
    icon: 'award',
    title: 'Award-Winning Team',
    desc: 'Board-certified specialists recognized across New Jersey for excellence in patient care.',
  },
]

const process = [
  {
    num: '01',
    title: 'Book a Consultation',
    desc: 'Schedule online in 60 seconds or call us. We’ll find a time that works — often the same day.',
  },
  {
    num: '02',
    title: 'Personalized Plan',
    desc: 'A full exam, digital scans and a clear, written treatment plan with transparent pricing.',
  },
  {
    num: '03',
    title: 'Comfortable Treatment',
    desc: 'Relax in our spa-like suites while our specialists deliver gentle, precise care.',
  },
  {
    num: '04',
    title: 'Ongoing Care',
    desc: 'Easy follow-ups, reminders and a lifetime hygiene program to keep your smile bright.',
  },
]

const team = [
  {
    initials: 'EC',
    name: 'Dr. Emily Carter',
    role: 'Cosmetic Dentistry, DDS',
    years: '15 yrs',
    bio: 'Smile-design specialist trained at NYU, known for natural, life-changing veneer makeovers.',
  },
  {
    initials: 'JR',
    name: 'Dr. James Rodriguez',
    role: 'Implantology, DMD',
    years: '18 yrs',
    bio: 'Places over 400 implants a year using fully guided 3D surgical workflows.',
  },
  {
    initials: 'SC',
    name: 'Dr. Sarah Chen',
    role: 'Orthodontics, MS',
    years: '12 yrs',
    bio: 'Diamond-level Invisalign provider crafting confident smiles for teens and adults.',
  },
  {
    initials: 'MB',
    name: 'Dr. Michael Brooks',
    role: 'Endodontics, DDS',
    years: '20 yrs',
    bio: 'Microscope-assisted root canal expert dedicated to saving natural teeth painlessly.',
  },
  {
    initials: 'OM',
    name: 'Dr. Olivia Martinez',
    role: 'Pediatric Dentistry, DMD',
    years: '10 yrs',
    bio: 'Turns first visits into fun adventures and builds lifelong healthy habits in kids.',
  },
  {
    initials: 'DK',
    name: 'Dr. David Kim',
    role: 'Oral Surgery, DDS',
    years: '16 yrs',
    bio: 'Board-certified surgeon specializing in extractions, grafting and full-arch reconstruction.',
  },
]

const technologies = [
  { title: '3D Cone-Beam CT', desc: 'Ultra-precise 3D imaging with up to 90% less radiation.' },
  { title: 'Intraoral Scanners', desc: 'Goodbye goopy molds — fast, comfortable digital impressions.' },
  { title: 'CEREC Same-Day Crowns', desc: 'Designed, milled and fitted in a single appointment.' },
  { title: 'Soft-Tissue Lasers', desc: 'Faster healing and less bleeding for gum treatments.' },
  { title: 'Guided Implant Surgery', desc: 'Computer-planned placement for predictable results.' },
  { title: 'Digital Smile Design', desc: 'Preview your new smile before treatment even begins.' },
]

const testimonials = [
  {
    name: 'Jessica M.',
    location: 'West New York, NJ',
    rating: 5,
    text: 'I was terrified of dentists my whole life. The team here completely changed that. My veneers look incredible and the whole process was painless.',
  },
  {
    name: 'Robert T.',
    location: 'Union City, NJ',
    rating: 5,
    text: 'Got my implants done with Dr. Rodriguez and could not be happier. Professional, transparent pricing, and zero pain. Highly recommend.',
  },
  {
    name: 'Amanda K.',
    location: 'Hoboken, NJ',
    rating: 5,
    text: 'Took my two kids here and the pediatric team was so patient and kind. My daughter actually asks when she can go back to the dentist!',
  },
  {
    name: 'Daniel P.',
    location: 'Weehawken, NJ',
    rating: 5,
    text: 'Same-day crown in one visit — I was in and out on my lunch break. The technology here is genuinely next level.',
  },
  {
    name: 'Sophia L.',
    location: 'Jersey City, NJ',
    rating: 5,
    text: 'Finished my Invisalign in 9 months and my smile has never looked better. The staff felt like family the entire way.',
  },
  {
    name: 'Marcus W.',
    location: 'West New York, NJ',
    rating: 5,
    text: 'Cracked a tooth on a Sunday and they saw me within the hour. Lifesavers. This is what dental care should feel like.',
  },
]

const pricingPlans = [
  {
    name: 'Essential',
    price: '29',
    period: '/ month',
    desc: 'Perfect for individuals who want to stay on top of routine care.',
    featured: false,
    features: [
      '2 cleanings per year',
      '2 routine exams',
      'Annual digital X-rays',
      '15% off all treatments',
      'No insurance needed',
    ],
  },
  {
    name: 'Family',
    price: '79',
    period: '/ month',
    desc: 'Comprehensive coverage for the whole household, up to 4 members.',
    featured: true,
    features: [
      'Everything in Essential',
      'Up to 4 family members',
      'Free emergency visits',
      '20% off all treatments',
      'Priority same-day booking',
      'Free fluoride for kids',
    ],
  },
  {
    name: 'Premium',
    price: '129',
    period: '/ month',
    desc: 'Total care with cosmetic perks and the deepest savings we offer.',
    featured: false,
    features: [
      'Everything in Family',
      '1 free whitening per year',
      '25% off cosmetic work',
      'Dedicated care coordinator',
      'Interest-free financing',
    ],
  },
]

const insurers = [
  'Delta Dental',
  'Cigna',
  'Aetna',
  'MetLife',
  'Guardian',
  'United Healthcare',
  'Humana',
  'Blue Cross',
]

const faqs = [
  {
    q: 'Do you accept my dental insurance?',
    a: 'We work with all major PPO insurance providers including Delta Dental, Cigna, Aetna, MetLife and more. Our team verifies your benefits before treatment and files claims on your behalf, so you always know your out-of-pocket cost up front.',
  },
  {
    q: 'How much does a dental implant cost?',
    a: 'A single dental implant starts at $2,400, which includes the implant post, abutment and crown. Full-arch solutions like All-on-4 are quoted after a complimentary 3D consultation. We offer interest-free financing to spread the cost over time.',
  },
  {
    q: 'Are your treatments painful?',
    a: 'Patient comfort is our top priority. We use the latest numbing technology, offer nitrous oxide and oral sedation, and our gentle techniques mean most patients report little to no discomfort, even during procedures like root canals and extractions.',
  },
  {
    q: 'Can I get a same-day appointment?',
    a: 'Yes. We reserve slots every day for same-day and emergency visits. Book online or call us and we will do our best to see you the same day, including evenings and weekends.',
  },
  {
    q: 'How long do veneers and crowns last?',
    a: 'With good oral hygiene, porcelain veneers typically last 10–15 years and crowns 10–20 years. We back our crowns with a 10-year guarantee and provide a personalized maintenance plan to maximize their lifespan.',
  },
  {
    q: 'Do you offer financing or payment plans?',
    a: 'Absolutely. We offer interest-free in-house financing, CareCredit, and flexible monthly membership plans starting at $29/month so you can get the care you need without financial stress.',
  },
  {
    q: 'What should I do in a dental emergency?',
    a: 'Call our 24/7 emergency hotline immediately. For a knocked-out tooth, keep it moist (in milk or saliva) and come in within the hour for the best chance of saving it. We handle severe pain, swelling, broken teeth and trauma every day.',
  },
  {
    q: 'How often should I visit the dentist?',
    a: 'We recommend a professional cleaning and exam every six months for most patients. Those with gum disease, implants or orthodontic work may benefit from more frequent visits, which we will tailor to your needs.',
  },
]

const clinicHours = [
  { day: 'Monday – Thursday', time: '8:00 AM – 7:00 PM' },
  { day: 'Friday', time: '8:00 AM – 5:00 PM' },
  { day: 'Saturday', time: '9:00 AM – 3:00 PM' },
  { day: 'Sunday', time: 'Emergencies only' },
]

const serviceOptions = [
  'General Check-up',
  'Teeth Whitening',
  'Porcelain Veneers',
  'Dental Implants',
  'Invisalign / Braces',
  'Root Canal',
  'Emergency Care',
  'Other',
]

/* ================================================================== */
/* ICONS                                                              */
/* ================================================================== */

function Icon({ name, className = 'w-7 h-7' }: { name: string; className?: string }) {
  const common = {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
  switch (name) {
    case 'veneer':
      return (
        <svg {...common}>
          <path d="M12 3C8 3 6 6 6 10c0 5 2 11 4 11 1.2 0 1.5-2 2-2s.8 2 2 2c2 0 4-6 4-11 0-4-2-7-6-7Z" />
        </svg>
      )
    case 'crown':
      return (
        <svg {...common}>
          <path d="M3 8l4 4 5-7 5 7 4-4-2 11H5L3 8Z" />
        </svg>
      )
    case 'whitening':
      return (
        <svg {...common}>
          <path d="M12 3v3M5 6l2 2M19 6l-2 2M4 12h2M18 12h2" />
          <path d="M12 9c-3 0-5 2-5 5 0 3 1.5 6 3 6 .8 0 1-1.5 2-1.5s1.2 1.5 2 1.5c1.5 0 3-3 3-6 0-3-2-5-5-5Z" />
        </svg>
      )
    case 'implant':
      return (
        <svg {...common}>
          <path d="M12 2c-2.5 0-4 2-4 4 0 1.5.5 2.5 1 3.5L8 22M16 22l-1-12.5c.5-1 1-2 1-3.5 0-2-1.5-4-4-4Z" />
          <path d="M9 14h6" />
        </svg>
      )
    case 'aligner':
      return (
        <svg {...common}>
          <path d="M4 9c0-2 2-3 8-3s8 1 8 3-1 4-2 6c-.8 1.6-2 3-4 3-1.2 0-1.5-1-2-1s-.8 1-2 1c-2 0-3.2-1.4-4-3-1-2-2-4-2-6Z" />
        </svg>
      )
    case 'root':
      return (
        <svg {...common}>
          <path d="M9 3h6M12 3v4M9 7c-2 0-3 2-3 5 0 4 1.5 9 3 9 .8 0 1-1.5 1-3M15 7c2 0 3 2 3 5 0 4-1.5 9-3 9-.8 0-1-1.5-1-3" />
        </svg>
      )
    case 'child':
      return (
        <svg {...common}>
          <circle cx="12" cy="7" r="4" />
          <path d="M9 7h.01M15 7h.01M10 9c.5.7 1.2 1 2 1s1.5-.3 2-1M5 21c0-4 3-6 7-6s7 2 7 6" />
        </svg>
      )
    case 'emergency':
      return (
        <svg {...common}>
          <path d="M12 21s-7-4.5-7-10a7 7 0 0 1 14 0c0 5.5-7 10-7 10Z" />
          <path d="M12 7v5M9.5 9.5h5" />
        </svg>
      )
    case 'tech':
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="13" rx="2" />
          <path d="M8 21h8M12 17v4M7 9l2 2 2-3 2 4 2-2" />
        </svg>
      )
    case 'painless':
      return (
        <svg {...common}>
          <path d="M12 21s-7-4.5-7-10a7 7 0 0 1 14 0c0 5.5-7 10-7 10Z" />
          <path d="M9 11l2 2 4-4" />
        </svg>
      )
    case 'calendar':
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 9h18M8 3v4M16 3v4M9 14l2 2 4-4" />
        </svg>
      )
    case 'price':
      return (
        <svg {...common}>
          <path d="M12 2v20M17 6c0-2-2-3-5-3s-5 1-5 3.5S9 10 12 10.5s5 1 5 3.5-2 3.5-5 3.5-5-1-5-3" />
        </svg>
      )
    case 'shield':
      return (
        <svg {...common}>
          <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3Z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      )
    case 'award':
      return (
        <svg {...common}>
          <circle cx="12" cy="9" r="6" />
          <path d="M9 14l-2 7 5-3 5 3-2-7" />
        </svg>
      )
    case 'phone':
      return (
        <svg {...common}>
          <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
        </svg>
      )
    case 'mail':
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 7l9 6 9-6" />
        </svg>
      )
    case 'pin':
      return (
        <svg {...common}>
          <path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11Z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
      )
    case 'clock':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      )
    case 'check':
      return (
        <svg {...common}>
          <path d="M5 12l4 4L19 6" />
        </svg>
      )
    case 'chevron':
      return (
        <svg {...common}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      )
    case 'arrow':
      return (
        <svg {...common}>
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      )
    case 'quote':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 7h4v4c0 3-1.5 5-4 6V14H5V9a2 2 0 0 1 2-2Zm10 0h4v4c0 3-1.5 5-4 6v-3h-2V9a2 2 0 0 1 2-2Z" />
        </svg>
      )
    default:
      return null
  }
}

function Star({ filled = true, className = 'w-4 h-4' }: { filled?: boolean; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.6l1-5.8L3.5 9.7l5.9-.9L12 3Z" />
    </svg>
  )
}

/* ================================================================== */
/* HOOKS                                                              */
/* ================================================================== */

type MaskPosition = { x: number; y: number; sw: number; sh: number }

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches,
  )
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)')
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mql.addEventListener('change', handler)
    setIsMobile(mql.matches)
    return () => mql.removeEventListener('change', handler)
  }, [])
  return isMobile
}

function useMaskPositions(
  sectionRef: RefObject<HTMLElement | null>,
  cardsRef: RefObject<Array<HTMLElement | null>>,
) {
  const [positions, setPositions] = useState<MaskPosition[]>([])
  useLayoutEffect(() => {
    const section = sectionRef.current
    if (!section) return
    const compute = () => {
      const sectionRect = section.getBoundingClientRect()
      const sw = sectionRect.width
      const sh = sectionRect.height
      const cards = cardsRef.current ?? []
      const next: MaskPosition[] = cards.map((card) => {
        if (!card) return { x: 0, y: 0, sw, sh }
        const r = card.getBoundingClientRect()
        return { x: r.left - sectionRect.left, y: r.top - sectionRect.top, sw, sh }
      })
      setPositions(next)
    }
    compute()
    const ro = new ResizeObserver(compute)
    ro.observe(section)
    return () => ro.disconnect()
  }, [sectionRef, cardsRef])
  return positions
}

function useImageNatural(src: string) {
  const [natural, setNatural] = useState<{ nw: number; nh: number } | null>(null)
  useEffect(() => {
    const img = new Image()
    img.onload = () => setNatural({ nw: img.naturalWidth, nh: img.naturalHeight })
    img.src = src
  }, [src])
  return natural
}

function useStaggeredReveal(_count: number, threshold = 0.15) {
  const containerRef = useRef<HTMLElement | null>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true)
            observer.disconnect()
          }
        })
      },
      { threshold },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])
  const getAnimStyle = (index: number): CSSProperties => ({
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(24px)',
    transition: `opacity 0.6s cubic-bezier(0.16,1,0.3,1) ${index * 120}ms, transform 0.6s cubic-bezier(0.16,1,0.3,1) ${index * 120}ms`,
  })
  return { containerRef, getAnimStyle }
}

/** Animate a number from 0 to target the first time the element enters the viewport. */
function useCountUp(target: number, decimals = 0, duration = 1600) {
  const ref = useRef<HTMLElement | null>(null)
  const [value, setValue] = useState(0)
  const started = useRef(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !started.current) {
            started.current = true
            const steps = 60
            let frame = 0
            const interval = setInterval(() => {
              frame += 1
              const progress = frame / steps
              const eased = 1 - Math.pow(1 - progress, 3)
              setValue(target * eased)
              if (frame >= steps) {
                setValue(target)
                clearInterval(interval)
              }
            }, duration / steps)
          }
        })
      },
      { threshold: 0.4 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [target, duration])
  const display =
    decimals > 0
      ? value.toFixed(decimals)
      : Math.round(value).toLocaleString('en-US')
  return { ref, display }
}

/** Generic one-shot reveal for a single element / section. */
function useReveal(threshold = 0.2) {
  const ref = useRef<HTMLElement | null>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true)
            observer.disconnect()
          }
        })
      },
      { threshold },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])
  return { ref, visible }
}

/* ================================================================== */
/* MASKED CARD                                                        */
/* ================================================================== */

type MaskedCardProps = {
  bgImage: string
  position?: MaskPosition
  natural: { nw: number; nh: number } | null
  focalX: number
  focalY?: number
  className?: string
  children?: ReactNode
  cardRef?: (el: HTMLElement | null) => void
  style?: CSSProperties
}

function MaskedCard({
  bgImage,
  position,
  natural,
  focalX,
  focalY = 0.5,
  className,
  children,
  cardRef,
  style,
}: MaskedCardProps) {
  let bgStyle: CSSProperties = {}
  if (position && natural && natural.nw > 0 && natural.nh > 0) {
    const { x, y, sw, sh } = position
    // Cover scaling: scale the shared image so it always fills the whole
    // section on both axes, no matter the viewport aspect ratio. On normal
    // (<=1.77:1) screens height binds — identical to the original behaviour —
    // while ultra-wide screens scale up by width so no empty gaps appear.
    const scale = Math.max(sw / natural.nw, sh / natural.nh)
    const renderW = natural.nw * scale
    const renderH = natural.nh * scale
    const overflowX = Math.max(0, renderW - sw)
    const overflowY = Math.max(0, renderH - sh)
    const offsetX = overflowX * focalX
    const offsetY = overflowY * focalY
    bgStyle = {
      backgroundImage: `url(${bgImage})`,
      backgroundSize: `${renderW}px ${renderH}px`,
      backgroundPosition: `-${x + offsetX}px -${y + offsetY}px`,
      backgroundRepeat: 'no-repeat',
    }
  }
  return (
    <div ref={(el) => cardRef?.(el)} className={className} style={{ ...bgStyle, ...style }}>
      {children}
    </div>
  )
}

/* ================================================================== */
/* SPLASH SCREEN                                                      */
/* ================================================================== */

function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [count, setCount] = useState(0)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const cleanupTimers: ReturnType<typeof setTimeout>[] = []
    let step = 0
    const interval = setInterval(() => {
      step += 1
      setCount(step)
      if (step >= 100) {
        clearInterval(interval)
        cleanupTimers.push(setTimeout(() => setExiting(true), 200))
        cleanupTimers.push(setTimeout(() => onComplete(), 900))
      }
    }, 20)
    return () => {
      clearInterval(interval)
      cleanupTimers.forEach(clearTimeout)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      className={`fixed inset-0 z-[100] bg-white flex items-end justify-start transition-opacity duration-700 ${
        exiting ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="absolute top-6 right-6 md:top-10 md:right-10 text-right">
        <p className="text-xs md:text-sm font-semibold uppercase tracking-[0.3em] text-black">
          Dental Health
        </p>
        <p className="text-[10px] md:text-xs font-medium text-neutral-400">Quality Healthcare</p>
      </div>
      <span className="text-7xl md:text-9xl font-bold tabular-nums p-6 md:p-10 leading-none text-black">
        {count}
      </span>
    </div>
  )
}

/* ================================================================== */
/* TOP BAR + NAVBAR                                                   */
/* ================================================================== */

function TopBar() {
  return (
    <div className="hidden md:flex fixed top-0 left-0 right-0 z-50 items-center justify-between bg-black text-white text-xs font-medium px-6 py-1.5">
      <div className="flex items-center gap-6">
        <span className="flex items-center gap-1.5">
          <Icon name="pin" className="w-3.5 h-3.5" />
          5400 Bergenline Ave, West New York, NJ 07093
        </span>
        <span className="flex items-center gap-1.5">
          <Icon name="clock" className="w-3.5 h-3.5" />
          Mon–Thu 8AM–7PM
        </span>
      </div>
      <div className="flex items-center gap-6">
        <a href="tel:+12015550148" className="flex items-center gap-1.5 hover:text-neutral-300">
          <Icon name="phone" className="w-3.5 h-3.5" />
          (201) 555-0148
        </a>
        <a href="mailto:hello@dentalhealth.com" className="flex items-center gap-1.5 hover:text-neutral-300">
          <Icon name="mail" className="w-3.5 h-3.5" />
          hello@dentalhealth.com
        </a>
      </div>
    </div>
  )
}

function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const go = (href: string) => {
    setOpen(false)
    const el = document.querySelector(href)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <nav
        className={`fixed left-0 right-0 z-50 flex items-center justify-between px-4 md:px-6 py-2 md:py-3 bg-white/80 backdrop-blur-md transition-all duration-300 ${
          scrolled ? 'md:top-0 shadow-sm' : 'md:top-7'
        } top-0`}
      >
        {/* Logo */}
        <a
          href="#home"
          onClick={(e) => {
            e.preventDefault()
            go('#home')
          }}
          className="flex flex-col"
        >
          <span className="text-xl md:text-2xl font-extrabold uppercase tracking-tight leading-none">
            Dental
          </span>
          <span className="text-xl md:text-2xl font-extrabold uppercase tracking-tight leading-none -mt-1.5 md:-mt-2">
            Health
          </span>
          <span className="text-[8px] md:text-[9px] font-medium leading-none mt-1.5 md:mt-2">
            quality healthcare
          </span>
        </a>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => go(link.href)}
              className="px-3.5 py-2 text-sm font-semibold text-black rounded-full hover:bg-black hover:text-white transition-colors duration-200"
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-4">
          <span className="text-sm font-semibold text-black">Dental Emergency</span>
          <button
            onClick={() => go('#contact')}
            className="px-6 py-3 bg-black rounded-full border border-black text-white text-sm font-semibold hover:bg-white hover:text-black transition-colors duration-200"
          >
            Book Now
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
          className="md:hidden w-10 h-10 flex items-center justify-center relative"
        >
          <span
            className={`absolute h-0.5 w-6 bg-black rounded-full transition-all duration-300 ease-[cubic-bezier(0.76,0,0.24,1)] ${
              open ? 'rotate-45 translate-y-0' : '-translate-y-2'
            }`}
          />
          <span
            className={`absolute h-0.5 w-6 bg-black rounded-full transition-all duration-300 ease-[cubic-bezier(0.76,0,0.24,1)] ${
              open ? 'opacity-0 scale-x-0' : 'opacity-100 scale-x-100'
            }`}
          />
          <span
            className={`absolute h-0.5 w-6 bg-black rounded-full transition-all duration-300 ease-[cubic-bezier(0.76,0,0.24,1)] ${
              open ? '-rotate-45 translate-y-0' : 'translate-y-2'
            }`}
          />
        </button>
      </nav>

      {/* Mobile menu overlay */}
      <div className={`md:hidden fixed inset-0 z-40 ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <div
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-500 ${
            open ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <div
          className={`absolute top-0 right-0 h-full w-[85%] max-w-sm bg-white shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] ${
            open ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex flex-col justify-center h-full px-8 gap-1">
            {navLinks.map((link, i) => (
              <button
                key={link.href}
                onClick={() => go(link.href)}
                className="text-left text-4xl font-bold text-black hover:text-neutral-500 transition-all duration-500 ease-[cubic-bezier(0.76,0,0.24,1)]"
                style={{
                  opacity: open ? 1 : 0,
                  transform: open ? 'translateX(0)' : 'translateX(2rem)',
                  transitionDelay: open ? `${100 + i * 60}ms` : '0ms',
                }}
              >
                {link.label}
              </button>
            ))}
            <div
              className="mt-8 pt-8 border-t border-neutral-200 transition-all duration-500 ease-[cubic-bezier(0.76,0,0.24,1)]"
              style={{
                opacity: open ? 1 : 0,
                transform: open ? 'translateX(0)' : 'translateX(2rem)',
                transitionDelay: open ? '450ms' : '0ms',
              }}
            >
              <p className="text-sm font-semibold text-black mb-4">Dental Emergency</p>
              <button
                onClick={() => go('#contact')}
                className="w-full px-6 py-4 bg-black rounded-full text-white text-sm font-semibold hover:bg-neutral-800 transition-colors duration-200"
              >
                Book Appointment
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

/* ================================================================== */
/* SECTION 1 - HERO                                                   */
/* ================================================================== */

function Section1() {
  const isMobile = useIsMobile()
  const section1Ref = useRef<HTMLElement | null>(null)
  const cardsRef = useRef<Array<HTMLElement | null>>([])
  const s1Reveal = useStaggeredReveal(4)
  const positions = useMaskPositions(section1Ref, cardsRef)
  const natural = useImageNatural(HERO_IMAGE)
  const focalX = isMobile ? 0.7 : 0.8

  const setCardRef = (i: number) => (el: HTMLElement | null) => {
    cardsRef.current[i] = el
  }
  const setSectionRef = (el: HTMLElement | null) => {
    section1Ref.current = el
    s1Reveal.containerRef.current = el
  }

  return (
    <section
      id="home"
      ref={setSectionRef}
      className="h-screen w-full overflow-hidden flex flex-col pt-24 md:pt-24 px-3 md:px-5 pb-1.5 md:pb-2 gap-1.5 md:gap-2"
    >
      {featureBars.map((label, i) => (
        <MaskedCard
          key={label}
          bgImage={HERO_IMAGE}
          position={positions[i]}
          natural={natural}
          focalX={focalX}
          cardRef={setCardRef(i)}
          className="w-full h-14 md:h-20 shrink-0 rounded-xl md:rounded-2xl overflow-hidden relative"
          style={s1Reveal.getAnimStyle(i)}
        >
          <div className="flex items-center justify-center h-full">
            <span className="text-black text-lg md:text-3xl font-bold text-center relative z-10">
              {label}
            </span>
          </div>
        </MaskedCard>
      ))}

      <MaskedCard
        bgImage={HERO_IMAGE}
        position={positions[3]}
        natural={natural}
        focalX={focalX}
        cardRef={setCardRef(3)}
        className="w-full flex-1 min-h-0 rounded-xl md:rounded-2xl overflow-hidden relative"
        style={s1Reveal.getAnimStyle(3)}
      >
        <div className="absolute top-4 left-4 md:top-7 md:left-7 text-black text-xs md:text-sm font-semibold leading-4 md:leading-5 max-w-[200px] md:max-w-[300px] z-10">
          We wish to provide professional dental services
          <br />
          that match the current technologies
        </div>
        <div className="absolute bottom-5 left-3 md:bottom-8 md:left-4 z-10">
          <span className="block text-black text-xs md:text-sm font-semibold mb-1 md:mb-2">
            Trusted Dentist in West New York
          </span>
          <h1 className="text-black text-[clamp(3rem,min(11vw,18vh),11rem)] font-bold leading-[0.79] tracking-tight">
            Dental
            <br />
            Care
          </h1>
        </div>
        <div className="absolute bottom-6 right-4 md:bottom-10 md:right-8 text-white text-xs md:text-sm font-semibold z-10">
          Free Consultation
        </div>
      </MaskedCard>
    </section>
  )
}

/* ================================================================== */
/* STATS BAR                                                          */
/* ================================================================== */

function StatItem({
  value,
  suffix,
  label,
  decimals,
}: {
  value: number
  suffix: string
  label: string
  decimals?: number
}) {
  const { ref, display } = useCountUp(value, decimals ?? 0)
  return (
    <div
      ref={ref as RefObject<HTMLDivElement>}
      className="flex flex-col items-center justify-center text-center px-4 py-8 md:py-12"
    >
      <span className="text-4xl md:text-6xl font-bold tabular-nums leading-none">
        {display}
        {suffix}
      </span>
      <span className="mt-2 md:mt-3 text-xs md:text-sm font-semibold text-neutral-500 uppercase tracking-wide">
        {label}
      </span>
    </div>
  )
}

function StatsBar() {
  return (
    <section className="w-full px-3 md:px-5 pb-1.5 md:pb-2">
      <div className="rounded-xl md:rounded-2xl bg-stone-50 grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-neutral-200">
        {stats.map((s) => (
          <StatItem key={s.label} {...s} />
        ))}
      </div>
    </section>
  )
}

/* ================================================================== */
/* SECTION 2 - SMILE GALLERY                                          */
/* ================================================================== */

function Section2() {
  const isMobile = useIsMobile()
  const section2Ref = useRef<HTMLElement | null>(null)
  const cardsRef = useRef<Array<HTMLElement | null>>([])
  const s2Reveal = useStaggeredReveal(4)
  const positions = useMaskPositions(section2Ref, cardsRef)
  const natural = useImageNatural(SECTION2_IMAGE)
  const focalX = isMobile ? 0.65 : 0.8

  const setCardRef = (i: number) => (el: HTMLElement | null) => {
    cardsRef.current[i] = el
  }
  const setSectionRef = (el: HTMLElement | null) => {
    section2Ref.current = el
    s2Reveal.containerRef.current = el
  }

  return (
    <section
      id="gallery"
      ref={setSectionRef}
      className="min-h-screen md:h-screen w-full overflow-hidden flex flex-col pt-1.5 md:pt-2 px-3 md:px-5 pb-1.5 md:pb-2 gap-1.5 md:gap-2"
    >
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 grid-rows-[auto_auto_auto_auto] md:grid-rows-[1fr_1fr_0.8fr] gap-1.5 md:gap-2">
        <MaskedCard
          bgImage={SECTION2_IMAGE}
          position={positions[0]}
          natural={natural}
          focalX={focalX}
          cardRef={setCardRef(0)}
          className="rounded-xl md:rounded-2xl overflow-hidden relative min-h-[160px] md:min-h-0"
          style={s2Reveal.getAnimStyle(0)}
        >
          <h2 className="absolute top-4 left-5 md:top-6 md:left-7 text-white md:text-black text-2xl md:text-3xl font-bold z-10 drop-shadow-sm">
            Smile Gallery
          </h2>
          <p className="absolute bottom-4 left-5 md:bottom-6 md:left-7 text-white md:text-black text-xs md:text-sm font-semibold z-10 drop-shadow-sm">
            Our cosmetic dental work
          </p>
        </MaskedCard>

        <MaskedCard
          bgImage={SECTION2_IMAGE}
          position={positions[1]}
          natural={natural}
          focalX={focalX}
          cardRef={setCardRef(1)}
          className="md:row-span-2 rounded-xl md:rounded-2xl overflow-hidden relative min-h-[200px] md:min-h-0"
          style={s2Reveal.getAnimStyle(1)}
        >
          <p className="absolute bottom-16 left-5 md:bottom-20 md:left-7 text-white text-xs md:text-sm font-semibold leading-4 md:leading-5 z-10 drop-shadow">
            If you want a gorgeous smile,
            <br />
            call us to ask about a smile makeover.
          </p>
          <button className="absolute bottom-4 right-4 md:bottom-6 md:right-6 px-5 py-3 md:px-8 md:py-5 bg-white rounded-full text-black text-base md:text-xl font-bold z-10 hover:scale-105 transition-transform">
            Call Us
          </button>
        </MaskedCard>

        <MaskedCard
          bgImage={SECTION2_IMAGE}
          position={positions[2]}
          natural={natural}
          focalX={focalX}
          cardRef={setCardRef(2)}
          className="rounded-xl md:rounded-2xl overflow-hidden relative min-h-[160px] md:min-h-0"
          style={s2Reveal.getAnimStyle(2)}
        >
          <h2 className="absolute top-4 left-5 md:top-6 md:left-7 text-white md:text-black text-[clamp(3rem,7vw,6rem)] font-bold leading-[0.9] z-10 drop-shadow-sm">
            Smile
            <br />
            makeover
          </h2>
        </MaskedCard>

        <MaskedCard
          bgImage={SECTION2_IMAGE}
          position={positions[3]}
          natural={natural}
          focalX={focalX}
          cardRef={setCardRef(3)}
          className="col-span-1 md:col-span-2 rounded-xl md:rounded-2xl overflow-hidden relative min-h-[200px] md:min-h-0"
          style={s2Reveal.getAnimStyle(3)}
        >
          <div className="absolute inset-0 z-10 flex flex-wrap md:flex-nowrap gap-1.5 md:gap-2 p-2 md:p-3">
            {services.map((svc) => (
              <div
                key={svc.name}
                className={`flex-1 min-w-[calc(50%-4px)] md:min-w-0 rounded-xl md:rounded-2xl p-3 md:p-5 flex flex-col justify-between ${
                  svc.active ? 'bg-white/90 backdrop-blur-md' : 'bg-white/20 backdrop-blur-xl'
                }`}
              >
                <h3
                  className={`text-xl md:text-4xl font-bold leading-[1.05] whitespace-pre-line ${
                    svc.active ? 'text-black' : 'text-white'
                  }`}
                >
                  {svc.name}
                </h3>
                {svc.num && (
                  <div
                    className={`self-end w-8 h-8 md:w-12 md:h-12 rounded-full border flex items-center justify-center text-xs md:text-sm font-semibold ${
                      svc.active ? 'border-black text-black' : 'border-white text-white'
                    }`}
                  >
                    {svc.num}
                  </div>
                )}
              </div>
            ))}
          </div>
        </MaskedCard>
      </div>
    </section>
  )
}

/* ================================================================== */
/* SECTION HEADER (shared)                                            */
/* ================================================================== */

function SectionHeader({
  eyebrow,
  title,
  subtitle,
  light = false,
  align = 'left',
}: {
  eyebrow: string
  title: ReactNode
  subtitle?: string
  light?: boolean
  align?: 'left' | 'center'
}) {
  const { ref, visible } = useReveal()
  return (
    <div
      ref={ref as RefObject<HTMLDivElement>}
      className={`max-w-3xl ${align === 'center' ? 'mx-auto text-center' : ''}`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: 'opacity 0.6s cubic-bezier(0.16,1,0.3,1), transform 0.6s cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      <div
        className={`flex items-center gap-2 ${align === 'center' ? 'justify-center' : ''} ${
          light ? 'text-neutral-400' : 'text-neutral-500'
        }`}
      >
        <span className="w-6 h-px bg-current" />
        <span className="text-xs md:text-sm font-semibold uppercase tracking-[0.2em]">{eyebrow}</span>
      </div>
      <h2
        className={`mt-3 text-[clamp(2.25rem,5vw,4rem)] font-bold leading-[0.95] tracking-tight ${
          light ? 'text-white' : 'text-black'
        }`}
      >
        {title}
      </h2>
      {subtitle && (
        <p className={`mt-4 text-sm md:text-base font-medium ${light ? 'text-neutral-300' : 'text-neutral-600'}`}>
          {subtitle}
        </p>
      )}
    </div>
  )
}

/* ================================================================== */
/* SERVICES (detailed)                                               */
/* ================================================================== */

function ServiceCard({ svc, index }: { svc: (typeof detailedServices)[number]; index: number }) {
  const { ref, visible } = useReveal(0.1)
  return (
    <div
      ref={ref as RefObject<HTMLDivElement>}
      className="group rounded-xl md:rounded-2xl bg-stone-50 hover:bg-black p-6 md:p-7 flex flex-col transition-colors duration-300"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(28px)',
        transition: `opacity 0.5s ease ${(index % 4) * 90}ms, transform 0.5s ease ${(index % 4) * 90}ms, background-color 0.3s ease`,
      }}
    >
      <div className="flex items-start justify-between">
        <div className="w-12 h-12 md:w-14 md:h-14 rounded-full border border-black group-hover:border-white flex items-center justify-center text-black group-hover:text-white transition-colors duration-300">
          <Icon name={svc.icon} className="w-6 h-6 md:w-7 md:h-7" />
        </div>
        <span className="text-xs font-semibold text-neutral-400 group-hover:text-neutral-500 transition-colors">
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>
      <h3 className="mt-5 text-xl md:text-2xl font-bold text-black group-hover:text-white transition-colors duration-300">
        {svc.name}
      </h3>
      <p className="mt-2 text-sm font-medium text-neutral-600 group-hover:text-neutral-300 leading-relaxed transition-colors duration-300 flex-1">
        {svc.desc}
      </p>
      <ul className="mt-4 space-y-1.5">
        {svc.points.map((p) => (
          <li
            key={p}
            className="flex items-center gap-2 text-xs font-semibold text-neutral-700 group-hover:text-neutral-200 transition-colors duration-300"
          >
            <Icon name="check" className="w-4 h-4 shrink-0" />
            {p}
          </li>
        ))}
      </ul>
      <div className="mt-5 pt-5 border-t border-neutral-200 group-hover:border-neutral-700 flex items-center justify-between transition-colors duration-300">
        <span className="text-sm font-bold text-black group-hover:text-white transition-colors duration-300">
          {svc.price}
        </span>
        <span className="w-9 h-9 rounded-full bg-black group-hover:bg-white text-white group-hover:text-black flex items-center justify-center transition-colors duration-300">
          <Icon name="arrow" className="w-4 h-4" />
        </span>
      </div>
    </div>
  )
}

function ServicesSection() {
  return (
    <section id="services" className="w-full px-3 md:px-5 py-12 md:py-20">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <SectionHeader
          eyebrow="Our Services"
          title={
            <>
              Complete care for
              <br />
              every smile
            </>
          }
          subtitle="From routine cleanings to full smile makeovers, our specialists deliver world-class dentistry under one roof."
        />
        <a
          href="#contact"
          onClick={(e) => {
            e.preventDefault()
            document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' })
          }}
          className="shrink-0 inline-flex items-center gap-2 px-6 py-3.5 bg-black rounded-full text-white text-sm font-semibold hover:scale-105 transition-transform"
        >
          Book an appointment
          <Icon name="arrow" className="w-4 h-4" />
        </a>
      </div>

      <div className="mt-8 md:mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1.5 md:gap-2">
        {detailedServices.map((svc, i) => (
          <ServiceCard key={svc.name} svc={svc} index={i} />
        ))}
      </div>
    </section>
  )
}

/* ================================================================== */
/* WHY CHOOSE US                                                      */
/* ================================================================== */

function WhyChooseUs() {
  return (
    <section id="about" className="w-full px-3 md:px-5 py-12 md:py-20">
      <div className="rounded-2xl md:rounded-[2rem] bg-black text-white p-6 md:p-14">
        <SectionHeader
          eyebrow="Why Choose Us"
          light
          title={
            <>
              A dental experience
              <br />
              built around you
            </>
          }
          subtitle="We combine cutting-edge technology with genuine, human care — so every visit feels effortless."
        />
        <div className="mt-10 md:mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 md:gap-2">
          {whyChooseUs.map((f, i) => {
            return <WhyCard key={f.title} feature={f} index={i} />
          })}
        </div>
      </div>
    </section>
  )
}

function WhyCard({ feature, index }: { feature: (typeof whyChooseUs)[number]; index: number }) {
  const { ref, visible } = useReveal(0.1)
  return (
    <div
      ref={ref as RefObject<HTMLDivElement>}
      className="rounded-xl md:rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 p-6 md:p-7 transition-colors duration-300"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.5s ease ${(index % 3) * 100}ms, transform 0.5s ease ${(index % 3) * 100}ms, background-color 0.3s ease`,
      }}
    >
      <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white text-black flex items-center justify-center">
        <Icon name={feature.icon} className="w-6 h-6 md:w-7 md:h-7" />
      </div>
      <h3 className="mt-5 text-lg md:text-xl font-bold">{feature.title}</h3>
      <p className="mt-2 text-sm font-medium text-neutral-400 leading-relaxed">{feature.desc}</p>
    </div>
  )
}

/* ================================================================== */
/* PROCESS                                                            */
/* ================================================================== */

function ProcessSection() {
  return (
    <section className="w-full px-3 md:px-5 py-12 md:py-20">
      <SectionHeader
        eyebrow="How It Works"
        align="center"
        title="Your journey to a brighter smile"
        subtitle="Four simple steps from your first hello to a healthy, confident smile."
      />
      <div className="mt-10 md:mt-14 grid grid-cols-1 md:grid-cols-4 gap-1.5 md:gap-2">
        {process.map((step, i) => (
          <ProcessCard key={step.num} step={step} index={i} last={i === process.length - 1} />
        ))}
      </div>
    </section>
  )
}

function ProcessCard({
  step,
  index,
  last,
}: {
  step: (typeof process)[number]
  index: number
  last: boolean
}) {
  const { ref, visible } = useReveal(0.15)
  return (
    <div
      ref={ref as RefObject<HTMLDivElement>}
      className="relative rounded-xl md:rounded-2xl bg-stone-50 p-6 md:p-7"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.5s ease ${index * 110}ms, transform 0.5s ease ${index * 110}ms`,
      }}
    >
      <span className="text-5xl md:text-6xl font-bold text-neutral-200 leading-none">{step.num}</span>
      <h3 className="mt-4 text-lg md:text-xl font-bold text-black">{step.title}</h3>
      <p className="mt-2 text-sm font-medium text-neutral-600 leading-relaxed">{step.desc}</p>
      {!last && (
        <span className="hidden md:flex absolute top-1/2 -right-[13px] -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-black text-white items-center justify-center">
          <Icon name="arrow" className="w-3.5 h-3.5" />
        </span>
      )}
    </div>
  )
}

/* ================================================================== */
/* SECTION 3 - IMPLANT DENTISTRY                                      */
/* ================================================================== */

function ArrowIcon({ white }: { white?: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={`rotate-[-45deg]${white ? ' text-white' : ''}`}>
      <path
        d="M1 7h12m0 0L8 2m5 5L8 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Section3() {
  const s3Reveal = useStaggeredReveal(4)
  return (
    <section
      id="implants"
      ref={s3Reveal.containerRef as RefObject<HTMLElement>}
      className="min-h-screen md:h-screen w-full overflow-hidden flex flex-col pt-1.5 md:pt-2 px-3 md:px-5 pb-1.5 md:pb-2 gap-1.5 md:gap-2"
    >
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-1.5 md:gap-2">
        <div className="flex flex-col gap-1.5 md:gap-2">
          <div
            className="rounded-xl md:rounded-2xl bg-stone-50 p-5 md:p-7 flex flex-col justify-between flex-[1.2] min-h-[180px] md:min-h-0"
            style={s3Reveal.getAnimStyle(0)}
          >
            <h2 className="text-[clamp(3rem,7vw,6.5rem)] font-bold leading-[0.95] text-black">
              Implant
              <br />
              Dentistry
            </h2>
            <p className="text-xs md:text-sm font-semibold text-black">Restore Missing Teeth</p>
          </div>

          <div className="flex gap-1.5 md:gap-2 flex-1 min-h-[140px] md:min-h-0" style={s3Reveal.getAnimStyle(1)}>
            <div className="flex-1 rounded-xl md:rounded-2xl overflow-hidden">
              <img src={SECTION3_IMG1} alt="Dental implant procedure" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 rounded-xl md:rounded-2xl overflow-hidden">
              <img src={SECTION3_IMG2} alt="Dental restoration" className="w-full h-full object-cover" />
            </div>
          </div>

          <div
            className="rounded-xl md:rounded-2xl bg-zinc-200 p-5 md:p-7 flex items-end justify-between flex-[0.8] min-h-[160px] md:min-h-0"
            style={s3Reveal.getAnimStyle(2)}
          >
            <div>
              <p className="text-xs md:text-sm font-semibold text-black mb-2 md:mb-3">Consultation</p>
              <h3 className="text-xl md:text-3xl font-bold text-black leading-6 md:leading-8">
                Dental
                <br />
                Restoration
                <br />
                Services
              </h3>
            </div>
            <button className="px-5 py-3 md:px-8 md:py-5 bg-white rounded-full text-black text-base md:text-xl font-bold hover:scale-105 transition-transform">
              Book Online
            </button>
          </div>
        </div>

        <div
          className="rounded-xl md:rounded-2xl overflow-hidden relative min-h-[350px] md:min-h-0"
          style={s3Reveal.getAnimStyle(3)}
        >
          <img src={SECTION3_BG} alt="Smiling patient" className="w-full h-full object-cover" />
          <div className="absolute bottom-3 left-3 right-3 md:bottom-5 md:left-5 md:right-5 flex gap-1.5 md:gap-2">
            <div className="flex-1 bg-white rounded-xl md:rounded-2xl p-3 md:p-5 flex flex-col justify-between h-36 md:h-52">
              <h4 className="text-lg md:text-2xl font-bold text-black leading-5 md:leading-7">
                The Process
                <br />
                of Installing
                <br />
                Implants
              </h4>
              <div className="self-end w-9 h-9 md:w-12 md:h-12 rounded-full border border-black flex items-center justify-center">
                <ArrowIcon />
              </div>
            </div>
            <div className="flex-1 bg-white/20 backdrop-blur-xl rounded-xl md:rounded-2xl p-3 md:p-5 flex flex-col justify-between h-36 md:h-52">
              <h4 className="text-lg md:text-2xl font-bold text-white leading-5 md:leading-7">
                Caring
                <br />
                for Dental
                <br />
                Implants
              </h4>
              <div className="self-end w-9 h-9 md:w-12 md:h-12 rounded-full border border-white flex items-center justify-center text-white">
                <ArrowIcon white />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ================================================================== */
/* TEAM                                                               */
/* ================================================================== */

function TeamSection() {
  return (
    <section id="team" className="w-full px-3 md:px-5 py-12 md:py-20">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <SectionHeader
          eyebrow="Meet The Team"
          title={
            <>
              The specialists
              <br />
              behind your smile
            </>
          }
          subtitle="A multidisciplinary team of board-certified dentists, each a leader in their field."
        />
      </div>
      <div className="mt-8 md:mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 md:gap-2">
        {team.map((member, i) => (
          <TeamCard key={member.name} member={member} index={i} />
        ))}
      </div>
    </section>
  )
}

function TeamCard({ member, index }: { member: (typeof team)[number]; index: number }) {
  const { ref, visible } = useReveal(0.1)
  return (
    <div
      ref={ref as RefObject<HTMLDivElement>}
      className="group rounded-xl md:rounded-2xl bg-stone-50 p-6 md:p-7 flex flex-col"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.5s ease ${(index % 3) * 100}ms, transform 0.5s ease ${(index % 3) * 100}ms`,
      }}
    >
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-black text-white flex items-center justify-center text-xl md:text-2xl font-bold tracking-tight shrink-0">
          {member.initials}
        </div>
        <div>
          <h3 className="text-lg md:text-xl font-bold text-black leading-tight">{member.name}</h3>
          <p className="text-xs md:text-sm font-semibold text-neutral-500">{member.role}</p>
          <span className="inline-block mt-1 text-[11px] font-bold uppercase tracking-wide bg-black text-white px-2 py-0.5 rounded-full">
            {member.years} experience
          </span>
        </div>
      </div>
      <p className="mt-4 text-sm font-medium text-neutral-600 leading-relaxed">{member.bio}</p>
    </div>
  )
}

/* ================================================================== */
/* TECHNOLOGY                                                         */
/* ================================================================== */

function TechnologySection() {
  return (
    <section className="w-full px-3 md:px-5 py-12 md:py-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-1.5 md:gap-2">
        <div className="rounded-2xl md:rounded-[2rem] bg-stone-50 p-6 md:p-12 flex flex-col justify-center">
          <SectionHeader
            eyebrow="Technology"
            title={
              <>
                Precision dentistry,
                <br />
                powered by science
              </>
            }
            subtitle="We invest in the most advanced equipment available so your care is faster, safer and more comfortable than ever."
          />
          <a
            href="#contact"
            onClick={(e) => {
              e.preventDefault()
              document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' })
            }}
            className="mt-6 self-start inline-flex items-center gap-2 px-6 py-3.5 bg-black rounded-full text-white text-sm font-semibold hover:scale-105 transition-transform"
          >
            Tour our clinic
            <Icon name="arrow" className="w-4 h-4" />
          </a>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 md:gap-2">
          {technologies.map((t, i) => (
            <TechCard key={t.title} tech={t} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

function TechCard({ tech, index }: { tech: (typeof technologies)[number]; index: number }) {
  const { ref, visible } = useReveal(0.1)
  return (
    <div
      ref={ref as RefObject<HTMLDivElement>}
      className="rounded-xl md:rounded-2xl border border-neutral-200 p-5 md:p-6 hover:border-black transition-colors duration-300"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 0.5s ease ${(index % 2) * 90}ms, transform 0.5s ease ${(index % 2) * 90}ms, border-color 0.3s ease`,
      }}
    >
      <Icon name="check" className="w-6 h-6 text-black" />
      <h3 className="mt-3 text-base md:text-lg font-bold text-black leading-tight">{tech.title}</h3>
      <p className="mt-1.5 text-xs md:text-sm font-medium text-neutral-600 leading-relaxed">{tech.desc}</p>
    </div>
  )
}

/* ================================================================== */
/* TESTIMONIALS                                                       */
/* ================================================================== */

function TestimonialsSection() {
  return (
    <section className="w-full py-12 md:py-20">
      <div className="px-3 md:px-5">
        <SectionHeader
          eyebrow="Patient Stories"
          align="center"
          title="Loved by 18,000+ smiles"
          subtitle="Real reviews from real patients across the Hudson County area."
        />
      </div>

      {/* Rating summary */}
      <div className="mt-8 flex items-center justify-center gap-3">
        <div className="flex text-black">
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} className="w-5 h-5" />
          ))}
        </div>
        <span className="text-sm font-bold text-black">4.9 / 5</span>
        <span className="text-sm font-medium text-neutral-500">from 2,400+ reviews</span>
      </div>

      {/* Marquee row */}
      <div className="mt-10 marquee-pause overflow-hidden">
        <div className="flex gap-1.5 md:gap-2 w-max animate-marquee">
          {[...testimonials, ...testimonials].map((t, i) => (
            <TestimonialCard key={i} t={t} />
          ))}
        </div>
      </div>
    </section>
  )
}

function TestimonialCard({ t }: { t: (typeof testimonials)[number] }) {
  return (
    <figure className="w-[300px] md:w-[380px] shrink-0 rounded-xl md:rounded-2xl bg-stone-50 p-6 md:p-7 flex flex-col">
      <Icon name="quote" className="w-8 h-8 text-neutral-300" />
      <div className="mt-3 flex text-black">
        {[0, 1, 2, 3, 4].map((i) => (
          <Star key={i} filled={i < t.rating} className="w-4 h-4" />
        ))}
      </div>
      <blockquote className="mt-3 text-sm md:text-base font-medium text-neutral-700 leading-relaxed flex-1">
        “{t.text}”
      </blockquote>
      <figcaption className="mt-5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center text-sm font-bold">
          {t.name.charAt(0)}
        </div>
        <div>
          <p className="text-sm font-bold text-black leading-tight">{t.name}</p>
          <p className="text-xs font-medium text-neutral-500">{t.location}</p>
        </div>
      </figcaption>
    </figure>
  )
}

/* ================================================================== */
/* PRICING + INSURANCE                                                */
/* ================================================================== */

function PricingSection() {
  return (
    <section id="pricing" className="w-full px-3 md:px-5 py-12 md:py-20">
      <SectionHeader
        eyebrow="Membership Plans"
        align="center"
        title="Affordable care, no insurance required"
        subtitle="Skip the insurance hassle with a simple monthly membership — or use your PPO, we accept them all."
      />

      <div className="mt-10 md:mt-14 grid grid-cols-1 md:grid-cols-3 gap-1.5 md:gap-2 items-stretch">
        {pricingPlans.map((plan, i) => (
          <PricingCard key={plan.name} plan={plan} index={i} />
        ))}
      </div>

      {/* Insurance strip */}
      <div className="mt-8 md:mt-10 rounded-xl md:rounded-2xl bg-stone-50 p-6 md:p-8">
        <p className="text-center text-xs md:text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500">
          We accept all major insurance providers
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {insurers.map((name) => (
            <span key={name} className="text-base md:text-lg font-bold text-neutral-400">
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

function PricingCard({ plan, index }: { plan: (typeof pricingPlans)[number]; index: number }) {
  const { ref, visible } = useReveal(0.1)
  const featured = plan.featured
  return (
    <div
      ref={ref as RefObject<HTMLDivElement>}
      className={`rounded-2xl md:rounded-[1.75rem] p-7 md:p-8 flex flex-col ${
        featured ? 'bg-black text-white md:-mt-4 md:mb-[-1rem] shadow-2xl' : 'bg-stone-50 text-black'
      }`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(28px)',
        transition: `opacity 0.5s ease ${index * 110}ms, transform 0.5s ease ${index * 110}ms`,
      }}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg md:text-xl font-bold">{plan.name}</h3>
        {featured && (
          <span className="text-[11px] font-bold uppercase tracking-wide bg-white text-black px-2.5 py-1 rounded-full">
            Most Popular
          </span>
        )}
      </div>
      <p className={`mt-2 text-sm font-medium ${featured ? 'text-neutral-400' : 'text-neutral-600'}`}>
        {plan.desc}
      </p>
      <div className="mt-6 flex items-end gap-1">
        <span className="text-5xl md:text-6xl font-bold tracking-tight leading-none">${plan.price}</span>
        <span className={`mb-1 text-sm font-semibold ${featured ? 'text-neutral-400' : 'text-neutral-500'}`}>
          {plan.period}
        </span>
      </div>
      <ul className="mt-6 space-y-3 flex-1">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm font-medium">
            <span
              className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                featured ? 'bg-white text-black' : 'bg-black text-white'
              }`}
            >
              <Icon name="check" className="w-3.5 h-3.5" />
            </span>
            {f}
          </li>
        ))}
      </ul>
      <a
        href="#contact"
        onClick={(e) => {
          e.preventDefault()
          document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' })
        }}
        className={`mt-7 w-full text-center px-6 py-3.5 rounded-full text-sm font-semibold transition-colors duration-200 ${
          featured
            ? 'bg-white text-black hover:bg-neutral-200'
            : 'bg-black text-white hover:bg-neutral-800'
        }`}
      >
        Get started
      </a>
    </div>
  )
}

/* ================================================================== */
/* FAQ                                                                */
/* ================================================================== */

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  return (
    <section id="faq" className="w-full px-3 md:px-5 py-12 md:py-20">
      <div className="grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-8 md:gap-12">
        <div>
          <SectionHeader
            eyebrow="FAQ"
            title={
              <>
                Questions,
                <br />
                answered
              </>
            }
            subtitle="Everything you need to know before your visit. Still curious? Our team is one call away."
          />
          <a
            href="tel:+12015550148"
            className="mt-6 inline-flex items-center gap-2 px-6 py-3.5 bg-black rounded-full text-white text-sm font-semibold hover:scale-105 transition-transform"
          >
            <Icon name="phone" className="w-4 h-4" />
            (201) 555-0148
          </a>
        </div>

        <div className="flex flex-col gap-1.5 md:gap-2">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i
            return (
              <div
                key={faq.q}
                className="rounded-xl md:rounded-2xl bg-stone-50 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 text-left p-5 md:p-6"
                  aria-expanded={isOpen}
                >
                  <span className="text-base md:text-lg font-bold text-black">{faq.q}</span>
                  <span
                    className={`shrink-0 w-8 h-8 rounded-full bg-black text-white flex items-center justify-center transition-transform duration-300 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  >
                    <Icon name="chevron" className="w-4 h-4" />
                  </span>
                </button>
                <div
                  className="grid transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 md:px-6 pb-5 md:pb-6 text-sm font-medium text-neutral-600 leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ================================================================== */
/* CTA BANNER                                                         */
/* ================================================================== */

function CTABanner() {
  return (
    <section className="w-full px-3 md:px-5 py-6 md:py-10">
      <div className="rounded-2xl md:rounded-[2rem] bg-black text-white p-8 md:p-16 text-center relative overflow-hidden">
        <p className="text-xs md:text-sm font-semibold uppercase tracking-[0.2em] text-neutral-400">
          Ready when you are
        </p>
        <h2 className="mt-4 text-[clamp(2.5rem,7vw,5.5rem)] font-bold leading-[0.92] tracking-tight">
          Your best smile
          <br />
          starts today
        </h2>
        <p className="mt-5 max-w-xl mx-auto text-sm md:text-base font-medium text-neutral-300">
          Book your free consultation in under a minute. Same-day appointments available.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href="#contact"
            onClick={(e) => {
              e.preventDefault()
              document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' })
            }}
            className="w-full sm:w-auto px-8 py-4 bg-white text-black rounded-full text-sm font-semibold hover:bg-neutral-200 transition-colors"
          >
            Book free consultation
          </a>
          <a
            href="tel:+12015550148"
            className="w-full sm:w-auto px-8 py-4 border border-white/30 text-white rounded-full text-sm font-semibold hover:bg-white/10 transition-colors"
          >
            Call (201) 555-0148
          </a>
        </div>
      </div>
    </section>
  )
}

/* ================================================================== */
/* CONTACT                                                            */
/* ================================================================== */

function ContactSection() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', service: '', message: '' })
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<Record<string, boolean>>({})

  const update = (key: string, value: string) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: false }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, boolean> = {}
    if (!form.name.trim()) newErrors.name = true
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) newErrors.email = true
    if (!form.phone.trim()) newErrors.phone = true
    setErrors(newErrors)
    if (Object.keys(newErrors).length === 0) {
      setSubmitted(true)
    }
  }

  const inputBase =
    'w-full rounded-xl border bg-white px-4 py-3.5 text-sm font-medium text-black placeholder:text-neutral-400 focus:outline-none focus:border-black transition-colors'

  return (
    <section id="contact" className="w-full px-3 md:px-5 py-12 md:py-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-1.5 md:gap-2">
        {/* Info side */}
        <div className="rounded-2xl md:rounded-[2rem] bg-black text-white p-7 md:p-12 flex flex-col">
          <SectionHeader
            eyebrow="Get In Touch"
            light
            title={
              <>
                Let’s talk about
                <br />
                your smile
              </>
            }
            subtitle="Fill out the form and our team will reach out within one business hour. Or contact us directly below."
          />

          <div className="mt-8 space-y-5">
            <a href="tel:+12015550148" className="flex items-start gap-4 group">
              <span className="w-11 h-11 rounded-full bg-white/10 group-hover:bg-white group-hover:text-black flex items-center justify-center transition-colors">
                <Icon name="phone" className="w-5 h-5" />
              </span>
              <span>
                <span className="block text-xs font-semibold uppercase tracking-wide text-neutral-400">Call us</span>
                <span className="block text-base md:text-lg font-bold">(201) 555-0148</span>
              </span>
            </a>
            <a href="mailto:hello@dentalhealth.com" className="flex items-start gap-4 group">
              <span className="w-11 h-11 rounded-full bg-white/10 group-hover:bg-white group-hover:text-black flex items-center justify-center transition-colors">
                <Icon name="mail" className="w-5 h-5" />
              </span>
              <span>
                <span className="block text-xs font-semibold uppercase tracking-wide text-neutral-400">Email us</span>
                <span className="block text-base md:text-lg font-bold">hello@dentalhealth.com</span>
              </span>
            </a>
            <div className="flex items-start gap-4">
              <span className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center">
                <Icon name="pin" className="w-5 h-5" />
              </span>
              <span>
                <span className="block text-xs font-semibold uppercase tracking-wide text-neutral-400">Visit us</span>
                <span className="block text-base md:text-lg font-bold">5400 Bergenline Ave</span>
                <span className="block text-sm font-medium text-neutral-300">West New York, NJ 07093</span>
              </span>
            </div>
          </div>

          {/* Hours */}
          <div className="mt-8 pt-8 border-t border-white/10">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
              <Icon name="clock" className="w-4 h-4" /> Opening hours
            </p>
            <ul className="mt-4 space-y-2">
              {clinicHours.map((h) => (
                <li key={h.day} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-neutral-300">{h.day}</span>
                  <span className="font-bold text-white">{h.time}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Form side */}
        <div className="rounded-2xl md:rounded-[2rem] bg-stone-50 p-7 md:p-12 flex flex-col justify-center">
          {submitted ? (
            <div className="text-center py-10">
              <div className="mx-auto w-16 h-16 rounded-full bg-black text-white flex items-center justify-center">
                <Icon name="check" className="w-8 h-8" />
              </div>
              <h3 className="mt-6 text-2xl md:text-3xl font-bold text-black">Thank you, {form.name.split(' ')[0]}!</h3>
              <p className="mt-3 text-sm md:text-base font-medium text-neutral-600 max-w-sm mx-auto">
                Your request has been received. One of our care coordinators will call you within the next business
                hour to confirm your appointment.
              </p>
              <button
                onClick={() => {
                  setSubmitted(false)
                  setForm({ name: '', email: '', phone: '', service: '', message: '' })
                }}
                className="mt-6 px-6 py-3 bg-black text-white rounded-full text-sm font-semibold hover:bg-neutral-800 transition-colors"
              >
                Send another request
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-black mb-1.5">Full name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => update('name', e.target.value)}
                    placeholder="Jane Doe"
                    className={`${inputBase} ${errors.name ? 'border-red-500' : 'border-neutral-200'}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-black mb-1.5">Phone *</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => update('phone', e.target.value)}
                    placeholder="(201) 555-0123"
                    className={`${inputBase} ${errors.phone ? 'border-red-500' : 'border-neutral-200'}`}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-black mb-1.5">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  placeholder="jane@example.com"
                  className={`${inputBase} ${errors.email ? 'border-red-500' : 'border-neutral-200'}`}
                />
                {errors.email && (
                  <p className="mt-1 text-xs font-medium text-red-500">Please enter a valid email address.</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-black mb-1.5">Service of interest</label>
                <select
                  value={form.service}
                  onChange={(e) => update('service', e.target.value)}
                  className={`${inputBase} border-neutral-200 appearance-none`}
                >
                  <option value="">Select a service…</option>
                  {serviceOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-black mb-1.5">Message</label>
                <textarea
                  value={form.message}
                  onChange={(e) => update('message', e.target.value)}
                  rows={4}
                  placeholder="Tell us how we can help…"
                  className={`${inputBase} border-neutral-200 resize-none`}
                />
              </div>
              <button
                type="submit"
                className="w-full px-6 py-4 bg-black text-white rounded-full text-sm font-semibold hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
              >
                Request appointment
                <Icon name="arrow" className="w-4 h-4" />
              </button>
              <p className="text-center text-xs font-medium text-neutral-400">
                By submitting you agree to our privacy policy. We never share your data.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}

/* ================================================================== */
/* FOOTER                                                             */
/* ================================================================== */

function SocialIcon({ name }: { name: string }) {
  const common = { className: 'w-4 h-4', viewBox: '0 0 24 24', fill: 'currentColor' }
  switch (name) {
    case 'facebook':
      return (
        <svg {...common}>
          <path d="M13 22v-8h2.5l.5-3H13V9c0-.9.3-1.5 1.6-1.5H16V5c-.3 0-1.3-.1-2.3-.1-2.3 0-3.7 1.3-3.7 3.8V11H8v3h2v8h3Z" />
        </svg>
      )
    case 'instagram':
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth={2}>
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
        </svg>
      )
    case 'x':
      return (
        <svg {...common}>
          <path d="M4 4h4l4 6 4-6h4l-6 8 6 8h-4l-4-6-4 6H4l6-8L4 4Z" />
        </svg>
      )
    case 'youtube':
      return (
        <svg {...common}>
          <path d="M22 12c0-2-.2-3.2-.4-3.8-.2-.7-.7-1.2-1.4-1.4C18.8 6.4 12 6.4 12 6.4s-6.8 0-8.2.4c-.7.2-1.2.7-1.4 1.4C2.2 8.8 2 10 2 12s.2 3.2.4 3.8c.2.7.7 1.2 1.4 1.4 1.4.4 8.2.4 8.2.4s6.8 0 8.2-.4c.7-.2 1.2-.7 1.4-1.4.2-.6.4-1.8.4-3.8ZM10 15V9l5 3-5 3Z" />
        </svg>
      )
    default:
      return null
  }
}

function Footer() {
  return (
    <footer className="w-full px-3 md:px-5 pb-3 md:pb-5">
      <div className="rounded-2xl md:rounded-[2rem] bg-black text-white p-8 md:p-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Brand */}
          <div className="md:col-span-4">
            <div className="flex flex-col">
              <span className="text-2xl font-extrabold uppercase tracking-tight leading-none">Dental</span>
              <span className="text-2xl font-extrabold uppercase tracking-tight leading-none -mt-1.5">Health</span>
              <span className="text-[9px] font-medium leading-none mt-2 text-neutral-400">quality healthcare</span>
            </div>
            <p className="mt-5 max-w-xs text-sm font-medium text-neutral-400 leading-relaxed">
              Trusted dental care in West New York since 2003. Combining advanced technology with a gentle, human
              touch for the whole family.
            </p>
            <div className="mt-6 flex items-center gap-3">
              {['facebook', 'instagram', 'x', 'youtube'].map((s) => (
                <a
                  key={s}
                  href="#"
                  aria-label={s}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white hover:text-black flex items-center justify-center transition-colors"
                >
                  <SocialIcon name={s} />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          <div className="md:col-span-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Services</h4>
            <ul className="mt-4 space-y-2.5 text-sm font-medium">
              {['Veneers', 'Implants', 'Whitening', 'Invisalign', 'Crowns', 'Emergency'].map((l) => (
                <li key={l}>
                  <a href="#services" className="text-neutral-300 hover:text-white transition-colors">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="md:col-span-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Company</h4>
            <ul className="mt-4 space-y-2.5 text-sm font-medium">
              {['About', 'Our Team', 'Pricing', 'Reviews', 'Careers', 'Blog'].map((l) => (
                <li key={l}>
                  <a href="#about" className="text-neutral-300 hover:text-white transition-colors">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="md:col-span-4">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Newsletter</h4>
            <p className="mt-4 text-sm font-medium text-neutral-300">
              Dental tips and exclusive offers, straight to your inbox.
            </p>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="mt-4 flex items-center gap-2 bg-white/10 rounded-full p-1.5 pl-5"
            >
              <input
                type="email"
                placeholder="Your email address"
                className="flex-1 bg-transparent text-sm font-medium text-white placeholder:text-neutral-500 focus:outline-none"
              />
              <button
                type="submit"
                className="w-10 h-10 shrink-0 rounded-full bg-white text-black flex items-center justify-center hover:bg-neutral-200 transition-colors"
              >
                <Icon name="arrow" className="w-4 h-4" />
              </button>
            </form>
            <div className="mt-6 flex items-center gap-2 text-sm font-semibold">
              <Icon name="emergency" className="w-5 h-5" />
              24/7 Emergency: (201) 555-0199
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs font-medium text-neutral-500">
            © 2026 Dental Health Clinic. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-xs font-medium text-neutral-400">
            <a href="#" className="hover:text-white transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Terms of Service
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Accessibility
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

/* ================================================================== */
/* BACK TO TOP                                                        */
/* ================================================================== */

function BackToTop() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <button
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className={`fixed bottom-5 right-5 z-40 w-12 h-12 rounded-full bg-black text-white shadow-lg flex items-center justify-center transition-all duration-300 ${
        show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      <Icon name="chevron" className="w-5 h-5 rotate-180" />
    </button>
  )
}

/* ================================================================== */
/* APP                                                                */
/* ================================================================== */

export default function App() {
  const [showSplash, setShowSplash] = useState(true)
  return (
    <div className="bg-white">
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      <TopBar />
      <Navbar />
      <Section1 />
      <StatsBar />
      <Section2 />
      <ServicesSection />
      <WhyChooseUs />
      <ProcessSection />
      <Section3 />
      <TeamSection />
      <TechnologySection />
      <TestimonialsSection />
      <PricingSection />
      <FAQSection />
      <CTABanner />
      <ContactSection />
      <Footer />
      <BackToTop />
    </div>
  )
}
