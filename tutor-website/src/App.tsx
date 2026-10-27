import { useState, type FormEvent } from "react";
import { motion } from "motion/react";
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, BookOpen, BookOpenCheck, Brain,
  CalendarDays, Check, ChevronDown, Clock3, FlaskConical, Mail, MapPin, Menu,
  NotebookPen, Phone, Sparkles, Target, Video, X
} from "lucide-react";

const navItems = [
  { label: "Subjects", href: "#subjects" },
  { label: "About", href: "#about" },
  { label: "My approach", href: "#approach" },
  { label: "Resources", href: "#resources" }
];

const subjects = [
  { number: "01", title: "Mathematics", icon: Target, description: "Make tricky topics click with clear explanations, patient practice, and problem-solving that builds from the basics up.", detail: "Algebra, number, geometry, statistics and exam technique." },
  { number: "02", title: "English", icon: BookOpen, description: "Find your voice on the page and grow more confident with reading comprehension, writing, grammar, and literature.", detail: "Comprehension, essays, creative writing and close analysis." },
  { number: "03", title: "Science", icon: FlaskConical, description: "Turn big ideas into understandable steps, connect theory to real examples, and practise answering with precision.", detail: "Biology, chemistry, physics and scientific reasoning." },
  { number: "04", title: "Exam preparation", icon: NotebookPen, description: "Replace last-minute stress with a realistic revision plan, focused practice, and strategies for approaching exam day.", detail: "GCSE, A-level and other curriculum-based assessments." },
  { number: "05", title: "Study skills", icon: Brain, description: "Learn how to learn: organise your time, revise effectively, and build habits that support independent progress.", detail: "Planning, recall practice, focus and time management." },
  { number: "06", title: "Personalised support", icon: Sparkles, description: "A flexible, one-to-one learning plan shaped around the topics, goals, and pace that work best for you.", detail: "Targeted support based on individual learning goals." }
];

const steps = [
  { n: "01", title: "Start with a conversation", text: "We talk through what's going well, what feels difficult, and what you would like to achieve." },
  { n: "02", title: "Find the next step", text: "Together we identify strengths, learning gaps, and a handful of clear priorities." },
  { n: "03", title: "Learn your way", text: "Lessons combine clear explanations, guided practice, and time to ask every question." },
  { n: "04", title: "Notice your progress", text: "We revisit goals, celebrate progress, and adapt the plan as your confidence grows." }
];

const testimonials = [
  { quote: "The lessons feel calm and encouraging. Things I used to avoid now make sense, and I know how to work through a difficult question.", person: "A student", context: "MATHEMATICS" },
  { quote: "I really appreciated having a clear plan. The support helped us focus on what mattered most instead of feeling overwhelmed by everything.", person: "A parent", context: "EXAM PREPARATION" },
  { quote: "I have better ways to revise now. I understand why an answer works, not just what to write, and that has changed how I study.", person: "A student", context: "STUDY SKILLS" }
];

const articles = [
  { category: "STUDY NOTES", title: "A revision routine you can actually stick to", text: "A gentler, more practical way to plan revision around real life and make progress one session at a time.", read: "5 min read", icon: CalendarDays },
  { category: "EXAM READY", title: "What to do when a question looks unfamiliar", text: "Simple ways to pause, find the information you know, and make a sensible first step under exam pressure.", read: "4 min read", icon: BookOpenCheck },
  { category: "LEARNING WELL", title: "Why explaining it in your own words works", text: "A quick technique for spotting gaps in your understanding and making new ideas easier to remember.", read: "3 min read", icon: Brain }
];

const fadeUp = { hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" as const } } };

function SectionIntro({ eyebrow, title, description, light = false }: { eyebrow: string; title: string; description?: string; light?: boolean }) {
  return (
    <div className={"section-intro" + (light ? " section-intro-light" : "")}>
      <motion.span className="gold-rule" initial={{ scaleX: 0, transformOrigin: "left center" }} whileInView={{ scaleX: 1 }} viewport={{ once: true, amount: 0.6 }} transition={{ duration: 0.55, ease: "easeOut" }} />
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {description && <p className="section-description">{description}</p>}
    </div>
  );
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [formNotice, setFormNotice] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormNotice(true);
  }

  return (
    <div className="site-shell">
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="site-header">
        <div className="brand-area">
          <a className="wordmark" href="#top" onClick={closeMenu} aria-label="Muhil Prabakar, home">Muhil Prabakar<span className="brand-period">.</span></a>
          <span className="brand-subline">PRIVATE TUTORING · PERSONAL ACADEMIC SUPPORT</span>
        </div>
        <button type="button" className="mobile-menu-button" aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen((value) => !value)}>
          {menuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
        <nav className={"main-nav" + (menuOpen ? " main-nav-open" : "")} aria-label="Main navigation">
          {navItems.map((item) => <a key={item.href} href={item.href} onClick={closeMenu}>{item.label}</a>)}
          <a className="nav-contact-mobile" href="#contact" onClick={closeMenu}>Book a lesson <ArrowUpRight size={14} /></a>
        </nav>
        <a className="button button-navy nav-cta" href="#contact">Book a lesson <ArrowUpRight size={15} strokeWidth={1.8} /></a>
      </header>

      <main id="main">
        <section className="hero-section" id="top">
          <div className="hero-copy">
            <motion.div className="hero-kicker" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
              <span className="kicker-dot" /> A MORE PERSONAL WAY TO LEARN
            </motion.div>
            <motion.span className="gold-rule hero-rule" initial={{ scaleX: 0, transformOrigin: "left center" }} animate={{ scaleX: 1 }} transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }} />
            <motion.h1 initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.12, ease: "easeOut" }}>
              Make room<br />for <em>your</em> potential.
            </motion.h1>
            <motion.p className="hero-description" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.24 }}>
              Thoughtful, one-to-one tutoring in maths, English, science, and exam preparation — helping learning feel clearer and confidence grow naturally.
            </motion.p>
            <motion.div className="hero-actions" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.34 }}>
              <a className="button button-navy button-large" href="#contact">Let’s talk about learning <ArrowUpRight size={17} /></a>
              <a className="text-link hero-secondary" href="#subjects">Explore subjects <ArrowDownRight size={17} /></a>
            </motion.div>
            <motion.div className="hero-footnote" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.55 }}>
              <div className="avatar-stack" aria-hidden="true"><span>O</span><span>+</span><span>✓</span></div>
              <p><strong>Curious questions welcome.</strong><br />Every learner starts somewhere.</p>
            </motion.div>
          </div>

          <motion.div className="hero-visual" initial={{ opacity: 0, x: 22 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.18, ease: "easeOut" }}>
            <div className="hero-image-frame">
              <img src="https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=1100&q=85" alt="Tutor portrait in soft natural light" fetchPriority="high" />
              <div className="image-index">MUHIL PRABAKAR <span>·</span> PRIVATE TUTOR</div>
            </div>
            <div className="image-orbit orbit-one" aria-hidden="true" /><div className="image-orbit orbit-two" aria-hidden="true" />
            <div className="availability-card">
              <span className="availability-icon"><CalendarDays size={18} /></span>
              <div><p className="availability-title"><span className="status-dot" /> Enquiries are open</p><p className="availability-subtitle">Online · One-to-one support</p></div>
              <ArrowUpRight className="availability-arrow" size={18} />
            </div>
            <div className="floating-note"><Sparkles size={16} /><span>Progress, at your pace.</span></div>
          </motion.div>
          <a className="hero-scroll" href="#subjects"><span>SCROLL TO EXPLORE</span><ChevronDown size={14} /></a>
        </section>

        <section className="intro-strip" aria-label="Tutoring principles">
          <p>GOOD LEARNING STARTS WITH</p>
          <div><span>01</span> Feeling understood</div><div><span>02</span> Asking questions</div><div><span>03</span> Building confidence</div>
        </section>

        <section className="section subjects-section" id="subjects">
          <div className="section-header-row">
            <SectionIntro eyebrow="SUBJECTS & SUPPORT" title="The right help, for the things that matter." description="Clear explanations, useful practice, and a learning plan shaped around you — not the other way around." />
            <a className="text-link desktop-link" href="#contact">Find your starting point <ArrowRight size={16} /></a>
          </div>
          <motion.div className="subjects-grid" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.12 }}>
            {subjects.map((subject) => {
              const Icon = subject.icon;
              return (
                <motion.article className="subject-card" key={subject.number} variants={fadeUp}>
                  <div className="subject-card-top"><span className="subject-number">{subject.number}</span><span className="subject-icon"><Icon size={20} strokeWidth={1.6} /></span></div>
                  <h3>{subject.title}</h3><p>{subject.description}</p><div className="subject-detail">{subject.detail}</div>
                  <a href="#contact" className="subject-link" aria-label={"Ask about " + subject.title}>Explore support <ArrowUpRight size={15} /></a>
                </motion.article>
              );
            })}
          </motion.div>
        </section>

        <section className="section about-section" id="about">
          <div className="about-visual">
            <div className="about-photo"><img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1000&q=85" alt="Educator in a calm, light-filled setting" loading="lazy" /></div>
            <div className="about-caption"><span className="caption-mark">“</span><p>There is always another way to understand it.</p><span className="caption-signature">A BELIEF THAT GUIDES EVERY LESSON</span></div>
            <div className="about-index">A LITTLE PATIENCE<br />CAN CHANGE A LOT.</div>
          </div>
          <div className="about-copy">
            <SectionIntro eyebrow="A NOTE FROM MUHIL" title="Every learner deserves to feel capable." />
            <p className="about-lead">Learning isn't about getting everything right on the first try. It's about having the space, support, and tools to work things out.</p>
            <p className="body-copy">My approach to tutoring is personal, practical, and built around the student in front of me. We take time to understand what feels difficult, find explanations that make sense, and practise until a new idea starts to feel familiar.</p>
            <p className="body-copy">Lessons are a place to ask questions, make mistakes, and build real understanding — without the pressure to pretend you've got it all figured out.</p>
            <div className="approach-points">
              <div><span className="point-check"><Check size={14} /></span><span><strong>Patient, clear explanations</strong><small>We break concepts down into manageable steps.</small></span></div>
              <div><span className="point-check"><Check size={14} /></span><span><strong>A plan shaped around you</strong><small>Learning goals are individual, never one-size-fits-all.</small></span></div>
              <div><span className="point-check"><Check size={14} /></span><span><strong>Progress you can recognise</strong><small>We notice what is improving and what needs more time.</small></span></div>
            </div>
            <a className="text-link" href="#approach">See how lessons work <ArrowRight size={16} /></a>
          </div>
        </section>

        <section className="approach-section" id="approach">
          <div className="section approach-inner">
            <SectionIntro eyebrow="THE LEARNING PROCESS" title="A plan that meets you where you are." description="No pressure to know it all before you start. Just a thoughtful next step, then another." />
            <motion.div className="steps-grid" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.11 } } }} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}>
              {steps.map((step) => <motion.article className="step-card" key={step.n} variants={fadeUp}><span className="step-number">{step.n}</span><span className="step-line" /><h3>{step.title}</h3><p>{step.text}</p></motion.article>)}
            </motion.div>
            <div className="approach-note"><div className="approach-note-icon"><Video size={20} /></div><p><strong>Learn from wherever you feel comfortable.</strong><br />Online lesson options make it easier to fit tutoring into your routine.</p><a href="#contact" aria-label="Ask about online lessons"><ArrowUpRight size={18} /></a></div>
          </div>
        </section>

        <section className="section testimonials-section" id="experiences">
          <div className="section-header-row testimonial-heading">
            <SectionIntro eyebrow="STUDENT EXPERIENCES" title="Small breakthroughs. Real confidence." description="Everyone's learning journey is different. The most important progress is the kind that helps a student feel more able to move forward." />
            <div className="quote-decoration" aria-hidden="true">“</div>
          </div>
          <motion.div className="testimonials-grid" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }}>
            {testimonials.map((testimonial, index) => (
              <motion.figure className="testimonial-card" key={testimonial.context} variants={fadeUp}>
                <div className="testimonial-stars" aria-label="Illustrative rating"><span>✳</span><span>✳</span><span>✳</span><span>✳</span><span>✳</span></div>
                <blockquote>“{testimonial.quote}”</blockquote>
                <figcaption><span className="testimonial-avatar">{index === 1 ? "P" : "S"}</span><span><strong>{testimonial.person}</strong><small>{testimonial.context}</small></span></figcaption>
              </motion.figure>
            ))}
          </motion.div>
          <p className="testimonial-note">Illustrative examples shown for layout purposes. Replace with genuine, permission-approved feedback before publishing.</p>
        </section>

        <section className="section resources-section" id="resources">
          <div className="section-header-row">
            <SectionIntro eyebrow="THE LEARNING JOURNAL" title="A few ideas to take with you." description="Practical notes on revision, understanding tricky topics, and making study time work a little harder." />
            <a className="text-link desktop-link" href="#contact">Ask a learning question <ArrowRight size={16} /></a>
          </div>
          <motion.div className="resources-grid" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.09 } } }} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.18 }}>
            {articles.map((article, index) => {
              const Icon = article.icon;
              return (
                <motion.article className={"resource-card resource-card-" + (index + 1)} key={article.title} variants={fadeUp}>
                  <div className={"resource-art resource-art-" + (index + 1)}><span className="resource-category">{article.category}</span><Icon size={46} strokeWidth={1.1} /><span className="resource-index">0{index + 1}</span></div>
                  <div className="resource-body"><span className="resource-readtime"><Clock3 size={12} /> {article.read}</span><h3>{article.title}</h3><p>{article.text}</p><a className="resource-link" href="#contact">Talk about this <ArrowUpRight size={15} /></a></div>
                </motion.article>
              );
            })}
          </motion.div>
          <p className="resources-note">Learning journal articles are concept previews. Link each card to a published article when your resource library is ready.</p>
        </section>

        <section className="contact-section" id="contact">
          <div className="contact-pattern" aria-hidden="true" />
          <div className="section contact-inner">
            <div className="contact-copy">
              <span className="contact-eyebrow"><span /> A GOOD PLACE TO BEGIN</span>
              <h2>Let's make learning<br /><em>feel possible.</em></h2>
              <p>Tell me a little about what you'd like help with. We'll start with a conversation about your goals and the support that might suit you.</p>
              <div className="contact-details">
                <a href="mailto:hello@example.com"><span><Mail size={16} /></span><div><small>EMAIL</small><strong>hello@example.com</strong></div></a>
                <a href="tel:+441234567890"><span><Phone size={16} /></span><div><small>PHONE</small><strong>+44 123 456 7890</strong></div></a>
                <div><span><MapPin size={16} /></span><div><small>LESSON FORMAT</small><strong>Online · In-person details on enquiry</strong></div></div>
              </div>
              <p className="contact-placeholder-note">Contact details above are placeholders and should be updated before launch.</p>
            </div>
            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="form-heading"><span>YOUR FIRST STEP</span><h3>Tell me what you need.</h3><p>Share a few details, and we can take it from there.</p></div>
              <div className="form-row">
                <label>YOUR NAME<input name="name" type="text" autoComplete="name" placeholder="Name" required /></label>
                <label>EMAIL ADDRESS<input name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></label>
              </div>
              <div className="form-row">
                <label>SUBJECT<select name="subject" defaultValue="" required><option value="" disabled>Select a subject</option><option>Mathematics</option><option>English</option><option>Science</option><option>Exam preparation</option><option>Study skills</option><option>Not sure yet</option></select></label>
                <label>YEAR GROUP / LEVEL<input name="level" type="text" placeholder="e.g. Year 10, GCSE, A-level" /></label>
              </div>
              <label>HOW CAN I HELP?<textarea name="message" rows={3} placeholder="A little about your goals or what feels challenging..." required /></label>
              <button className="button button-gold form-submit" type="submit">Prepare my enquiry <ArrowUpRight size={16} /></button>
              {formNotice && <p className="form-notice" role="status"><Check size={16} /> Thanks for sharing. This demo form isn't connected to an inbox yet — please email hello@example.com to send your enquiry.</p>}
              <p className="form-privacy">Connect a secure form service and publish a privacy notice before accepting real enquiries.</p>
            </form>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-main">
          <div className="footer-brand"><a className="wordmark footer-wordmark" href="#top">Muhil Prabakar<span className="brand-period">.</span></a><p>Private tutoring with patience, purpose, and room to grow.</p><a className="footer-email" href="mailto:hello@example.com">hello@example.com <ArrowUpRight size={14} /></a></div>
          <div className="footer-column"><span>EXPLORE</span><a href="#subjects">Subjects</a><a href="#about">About Muhil</a><a href="#approach">Learning process</a><a href="#resources">Resources</a></div>
          <div className="footer-column"><span>GET IN TOUCH</span><a href="#contact">Book a consultation</a><a href="mailto:hello@example.com">Send an email</a><a href="#contact">Lesson formats</a></div>
          <div className="footer-note"><span className="footer-star">✳</span><p>Every question is a good question.</p><a href="#top" className="back-to-top">BACK TO TOP <ArrowUpRight size={13} /></a></div>
        </div>
        <div className="footer-bottom"><span>© {new Date().getFullYear()} Muhil Prabakar Tutoring</span><span>PERSONALISED SUPPORT · ONE STEP AT A TIME</span><a href="#contact">Privacy notice to be added</a></div>
      </footer>
    </div>
  );
}

export default App;