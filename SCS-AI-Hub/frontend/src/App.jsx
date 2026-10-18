import {
  ArrowRight,
  BookOpen,
  Bot,
  CalendarDays,
  ChartNoAxesCombined,
  ClipboardCheck,
  FileCheck,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Mail,
  Megaphone,
  Menu,
  MessageCircle,
  MessageSquare,
  Pencil,
  Phone,
  Plus,
  Save,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  TrendingUp,
  UserRound,
  Users,
  X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { BrowserRouter, Link, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import {
  createLead,
  deleteLead as deleteLeadApi,
  getLeads,
  sendChatMessage,
  updateLead,
} from './services/api';
const services = [
  { icon: ShieldCheck, title: 'ISO Certification', text: 'Guidance to understand ISO standards and certification requirements.' },
  { icon: ClipboardCheck, title: 'Quality Management', text: 'Build and improve quality management systems for your business.' },
  { icon: GraduationCap, title: 'Training & Support', text: 'Help your team understand processes, standards and best practices.' },
  { icon: FileCheck, title: 'Audit & Compliance', text: 'Prepare documentation and get ready for compliance reviews.' },
];

const dashboardLinks = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Sales Agent', path: '/dashboard/sales', icon: TrendingUp },
  { label: 'Marketing Agent', path: '/dashboard/marketing', icon: Megaphone },
  { label: 'Lead Management', path: '/dashboard/leads', icon: Users },
  { label: 'CRM', path: '/dashboard/crm', icon: ClipboardCheck },
  { label: 'Analytics', path: '/dashboard/analytics', icon: ChartNoAxesCombined },
  { label: 'Knowledge Base', path: '/dashboard/knowledge', icon: BookOpen },
];

function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');

  const [leadStep, setLeadStep] = useState('name');

const [leadData, setLeadData] = useState({
  name: '',
  email: '',
  phone: '',
  service: 'ISO Certification',
});
  const [messages, setMessages] = useState([
  {
    from: 'bot',
    text: 'Hello! Welcome to SCS. May I know your full name to help you with your inquiry?',
  },
]);
  

async function sendMessage(event) {
  event.preventDefault();

  const value = message.trim();
  if (!value) return;

  setMessages((old) => [
    ...old,
    { from: 'user', text: value },
  ]);
  setMessage('');

  // Collect lead information first
  if (leadStep === 'name') {
    setLeadData((old) => ({ ...old, name: value }));
    setLeadStep('email');
    setMessages((old) => [
      ...old,
      { from: 'bot', text: 'Thank you! What is your email address?' },
    ]);
    return;
  }

  if (leadStep === 'email') {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setMessages((old) => [
        ...old,
        { from: 'bot', text: 'Please enter a valid email address.' },
      ]);
      return;
    }

    setLeadData((old) => ({ ...old, email: value }));
    setLeadStep('phone');
    setMessages((old) => [
      ...old,
      { from: 'bot', text: 'What is your phone number?' },
    ]);
    return;
  }

  if (leadStep === 'phone') {
    setLeadData((old) => ({ ...old, phone: value }));
    setLeadStep('service');
    setMessages((old) => [
      ...old,
      {
        from: 'bot',
        text: 'Which service are you interested in? For example, ISO Certification, Quality Management, Training & Support, or Audit & Compliance.',
      },
    ]);
    return;
  }

  if (leadStep === 'service') {
    const finalLead = { ...leadData, service: value };

    setLeadData(finalLead);
    setMessages((old) => [
      ...old,
      { from: 'bot', text: 'Thank you! Saving your inquiry...' },
    ]);

    try {
      await createLead({
        name: finalLead.name,
        email: finalLead.email,
        phone: finalLead.phone,
        company: null,
        status: 'New',
        source: finalLead.service,
      });

      setMessages((old) => [
        ...old,
        {
          from: 'bot',
          text: 'Your inquiry has been submitted successfully. You can now ask me questions about our services.',
        },
      ]);

      setLeadStep('complete');
    } catch (error) {
      console.error('Chatbot lead save error:', error);
      setMessages((old) => [
        ...old,
        {
          from: 'bot',
          text: 'Sorry, we could not save your inquiry. Please try again later.',
        },
      ]);
    }
    return;
  }

  // After lead collection, answer questions using Gemini
  try {
    setMessages((old) => [
      ...old,
      { from: 'bot', text: 'SCS AI is thinking... Please wait a few seconds.' }
    ]);

    const data = await sendChatMessage(value);

    setMessages((old) => [
      ...old.filter(
        (item, index) =>
          !(index === old.length - 1 &&
            item.from === 'bot' &&
            item.text === 'Thinking...')
      ),
      { from: 'bot', text: data.reply },
    ]);
  } catch (error) {
    console.error('AI chat error:', error);

    setMessages((old) => [
      ...old.filter(
        (item, index) =>
          !(index === old.length - 1 &&
            item.from === 'bot' &&
            item.text === 'Thinking...')
      ),
      {
        from: 'bot',
        text: 'Sorry, the AI assistant is temporarily unavailable. Please try again.',
      },
    ]);
  }
}



  return (
    <>
      {open && (
        <section className="chat-window" aria-label="SCS AI Assistant">
          <header className="chat-header">
            <div className="chat-avatar"><Bot size={23} /></div>
            <div><strong>SCS AI Assistant</strong><small>Demo interface</small></div>
            <button className="chat-close" onClick={() => setOpen(false)} aria-label="Close chat"><X size={20} /></button>
          </header>
          <div className="chat-messages">
            {messages.map((item, index) => (
              <div className={`chat-message ${item.from}`} key={index}>{item.text}</div>
            ))}
          </div>
          <form className="chat-form" onSubmit={sendMessage}>
            <input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Type your message..." aria-label="Type your message" />
            <button type="submit" aria-label="Send message"><Send size={18} /></button>
          </form>
        </section>
      )}
      <button className="chat-launcher" onClick={() => setOpen(!open)} aria-label="Open AI assistant">
        {open ? <X size={24} /> : <MessageCircle size={24} />}
        {!open && <span>Chat with AI</span>}
      </button>
    </>
  );
}


function PublicInquiryForm() {
  const [form, setForm] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    service: 'ISO Certification',
  });

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await createLead({
        ...form,
        status: 'New',
        source: form.service,
      });

      setMessage('Thank you! Your inquiry was submitted successfully.');
      setForm({
        name: '',
        company: '',
        email: '',
        phone: '',
        service: 'ISO Certification',
      });
    } catch (error) {
      console.error('Inquiry submission failed:', error);
      setMessage('Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="inquiry" className="services">
      <div className="section-heading">
        <p className="eyebrow">GET IN TOUCH</p>
        <h2>Tell us about your <span>business needs.</span></h2>
        <p>Submit an inquiry and our team can follow up with you.</p>
      </div>

      <form className="lead-form-card" onSubmit={handleSubmit}>
        <div className="lead-form-grid">
          <label>
            Contact Name *
            <input
              required
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
              placeholder="Enter your full name"
            />
          </label>

          <label>
            Company Name
            <input
              value={form.company}
              onChange={(e) =>
                setForm({ ...form, company: e.target.value })
              }
              placeholder="Enter company name"
            />
          </label>

          <label>
            Email Address *
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
              placeholder="you@company.com"
            />
          </label>

          <label>
            Phone Number
            <input
              type="tel"
              value={form.phone}
              onChange={(e) =>
                setForm({ ...form, phone: e.target.value })
              }
              placeholder="Enter phone number"
            />
          </label>

          <label>
            Interested Service
            <select
              value={form.service}
              onChange={(e) =>
                setForm({ ...form, service: e.target.value })
              }
            >
              <option>ISO Certification</option>
              <option>Quality Management</option>
              <option>Training &amp; Support</option>
              <option>Audit &amp; Compliance</option>
              <option>Other</option>
            </select>
          </label>
        </div>

        <div className="lead-form-actions">
          <button className="button" type="submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Inquiry'}
          </button>
        </div>

        {message && <p role="status">{message}</p>}
      </form>
    </section>
  );
}



function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <main className="page">
      <nav className="navbar">
        <a className="brand" href="/" aria-label="SCS home">
          <span className="brand-mark">SCS</span>
          <span className="brand-caption">SAMARTH CONSULTANCY SERVICES</span>
        </a>
        <button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation"><Menu size={23} /></button>
        <div className={`navlinks ${menuOpen ? 'navlinks-open' : ''}`}>
          <a href="#home" onClick={() => setMenuOpen(false)}>Home</a>
          <a href="#about" onClick={() => setMenuOpen(false)}>About Us</a>
          <a href="#services" onClick={() => setMenuOpen(false)}>Services</a>
          <a href="#contact" onClick={() => setMenuOpen(false)}>Contact</a>
          <Link className="login-link" to="/owner-login">Owner Login <ArrowRight size={16} /></Link>
        </div>
      </nav>

      <section className="hero" id="home">
        <div className="hero-content">
          <div className="hero-badge"><Sparkles size={15} /> CONSULTING MEETS INTELLIGENCE</div>
          <p className="eyebrow">WELCOME TO SAMARTH CONSULTANCY SERVICES</p>
          <h1>Quality, Compliance &amp; <span>AI-Powered Solutions.</span></h1>
          <p className="hero-description">Your partner for ISO standards, quality management and smarter business processes — supported by a new generation of AI assistants.</p>
          <div className="actions">
            <a className="button" href="#services">Explore Our Services <ArrowRight size={18} /></a>
            <a className="button secondary" href="#about">Discover SCS</a>
          </div>
          <div className="hero-trust"><ShieldCheck size={20} /><span>Professional consultancy · Quality-focused solutions</span></div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="visual-glow" />
          <div className="visual-card visual-card-main">
            <div className="visual-icon"><Bot size={30} /></div>
            <span className="visual-label">SCS AI HUB</span>
            <h3>Smarter workflows.<br />Better decisions.</h3>
            <div className="visual-line" />
            <div className="visual-status"><span /> AI assistants ready to help</div>
          </div>
          <div className="visual-card visual-card-small"><ShieldCheck size={22} /><div><strong>Quality first</strong><small>Standards &amp; compliance</small></div></div>
          <div className="visual-orbit orbit-one" /><div className="visual-orbit orbit-two" />
        </div>
      </section>

      <section className="stats-strip">
        <div><strong>ISO</strong><span>Standards Guidance</span></div>
        <div><strong>QMS</strong><span>Quality Management</span></div>
        <div><strong>AI</strong><span>Intelligent Assistance</span></div>
        <div><strong>SCS</strong><span>Your Consulting Partner</span></div>
      </section>

      <section className="services" id="services">
        <div className="section-heading">
          <p className="eyebrow">WHAT WE DO</p>
          <h2>Solutions built around <span>your business.</span></h2>
          <p>Practical consultancy and intelligent digital assistance to help you move forward.</p>
        </div>
        <div className="service-grid">
          {services.map(({ icon: Icon, title, text }) => (
            <article className="service-card" key={title}>
              <div className="service-icon"><Icon size={25} /></div>
              <h3>{title}</h3><p>{text}</p>
              <a href="#contact" className="service-link">Learn more <ArrowRight size={16} /></a>
            </article>
          ))}
        </div>
      </section>
      <PublicInquiryForm />

      <section className="about-section" id="about">
        <div className="about-icon"><Bot size={38} /></div>
        <div><p className="eyebrow">INTRODUCING SCS AI HUB</p><h2>Bring your business support into one place.</h2>
          <p>Our project brings a company website together with AI assistant and agent interfaces designed to support sales, marketing and lead management.</p>
        </div>
        <Link to="/owner-login" className="button">Owner Portal <ArrowRight size={18} /></Link>
      </section>

      <footer id="contact">
        <div className="footer-main">
          <div className="footer-brand"><div className="brand-mark">SCS</div><strong>Samarth Consultancy Services</strong><p>Quality-focused consultancy with a vision for intelligent business solutions.</p></div>
          <div className="footer-contact"><strong>Explore SCS</strong><a href="#about">About Us</a><a href="#services">Our Services</a><a href="mailto:info@example.com">Contact</a></div>
        </div>
        <div className="footer-bottom">© {new Date().getFullYear()} Samarth Consultancy Services. All rights reserved.</div>
      </footer>
      <ChatWidget />
    </main>
  );
}

function OwnerLogin() {
  const navigate = useNavigate();
  function handleLogin(event) {
    event.preventDefault();
    navigate('/dashboard');
  }
  return (
    <main className="login-page">
      <form className="login-card" onSubmit={handleLogin}>
        <Link to="/" className="brand large"><span className="brand-mark">SCS</span><small>AI HUB</small></Link>
        <h1>Welcome Back</h1><p>Sign in to your owner account</p>
        <label>Email address<input type="email" placeholder="owner@company.com" required /></label>
        <label>Password<input type="password" placeholder="Enter your password" required /></label>
        <button className="button full" type="submit">Login <ArrowRight size={18} /></button>
        <p className="login-notice">Demo only: authentication is not connected yet.</p>
        <Link to="/">← Back to website</Link>
      </form>
    </main>
  );
}

function Dashboard() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [totalLeads, setTotalLeads] = useState(0);
  const [newLeads, setNewLeads] = useState(0);
const [contactedLeads, setContactedLeads] = useState(0);

  useEffect(() => {
  let isActive = true;

  async function loadDashboardStats() {
    try {
      const leads = await getLeads();

      if (isActive) {
        setTotalLeads(leads.length);
        setNewLeads(
          leads.filter((lead) => lead.status === 'New').length
        );
        setContactedLeads(
          leads.filter((lead) => lead.status === 'Contacted').length
        );
      }
    } catch (error) {
      console.error('Dashboard stats error:', error);
    }
  }

  loadDashboardStats();

  const refreshInterval = setInterval(loadDashboardStats, 10000);

  return () => {
    isActive = false;
    clearInterval(refreshInterval);
  };
}, []);

  const stats = [
    {
  title: 'Total Leads',
  value: String(totalLeads),
  note: 'Live database data',
  icon: Users,
},
{
  title: 'New Leads',
  value: String(newLeads),
  note: 'Live database data',
  icon: Users,
},
{
  title: 'Contacted Leads',
  value: String(contactedLeads),
  note: 'Live database data',
  icon: Users,
},
  ];

  return (
    <div className="dashboard-layout">
      <aside className={`dashboard-sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <Link to="/" className="dashboard-brand"><span className="brand-mark">SCS</span><span><strong>SCS AI HUB</strong><small>OWNER PORTAL</small></span></Link>
        <p className="sidebar-heading">WORKSPACE</p>
        <nav className="dashboard-nav">
          {dashboardLinks.map(({ label, path, icon: Icon }) => (
            <Link key={path} to={path} className={path === '/dashboard' ? 'dashboard-nav-link active' : 'dashboard-nav-link'} onClick={() => setMenuOpen(false)}>
              <Icon size={19} /><span>{label}</span>{label === 'Dashboard' && <span className="nav-dot" />}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <Link to="/dashboard/settings" className="dashboard-nav-link"><Settings size={19} /><span>Settings</span></Link>
          <Link to="/" className="dashboard-nav-link"><LogOut size={19} /><span>Back to Website</span></Link>
          <div className="owner-profile"><div className="owner-avatar">O</div><div><strong>Owner Account</strong><small>Demo session</small></div></div>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <button className="dashboard-menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle sidebar"><Menu size={22} /></button>
          <div><span className="topbar-label">SCS AI HUB / OVERVIEW</span><strong>Owner Dashboard</strong></div>
          <Link to="/" className="topbar-home">View Website <ArrowRight size={16} /></Link>
        </header>
        <section className="dashboard-content">
          <div className="dashboard-welcome">
            <div><p className="eyebrow">YOUR BUSINESS AT A GLANCE</p><h1>Welcome to SCS AI Hub 👋</h1><p>Monitor your workspace and access your business AI tools.</p></div>
            <div className="dashboard-date">ADMIN WORKSPACE</div>
          </div>
          <div className="demo-notice"><Bot size={19} /><span><strong>Demo dashboard</strong> — figures shown here are sample values, not live company data.</span></div>
          <div className="dashboard-stats">
            {stats.map(({ title, value, note, icon: Icon }) => (
              <article className="dashboard-stat-card" key={title}>
                <div className="stat-card-top"><span>{title}</span><span className="stat-card-icon"><Icon size={20} /></span></div>
                <strong className="stat-value">{value}</strong><small>{note}</small>
              </article>
            ))}
          </div>
          <div className="dashboard-section-title"><div><h2>Your AI Workspace</h2><p>Choose a module to explore.</p></div></div>
          <div className="dashboard-module-grid">
            {dashboardLinks.slice(1).map(({ label, path, icon: Icon }, index) => (
              <Link className="dashboard-module-card" to={path} key={path}>
                <span className="module-icon"><Icon size={23} /></span><h3>{label}</h3>
                <p>{[
                  'Support sales activities and follow-ups.',
                  'Plan campaigns and marketing workflows.',
                  'Organise leads and track potential customers.',
                  'Manage customer information and relationships.',
                  'Review business performance and trends.',
                  'Organise documents and AI reference material.',
                ][index]}</p>
                <span className="module-open">Open module <ArrowRight size={15} /></span>
              </Link>
            ))}
          </div>
          <section className="dashboard-bottom-card"><span className="module-icon"><Sparkles size={24} /></span><div><h3>AI Assistant</h3><p>The chat interface is ready for future backend and AI model integration.</p></div><Link className="button" to="/">Go to Website <ArrowRight size={16} /></Link></section>
        </section>
      </main>
    </div>
  );
}


function LeadManagement() {
  const [leads, setLeads] = useState([]);
  
useEffect(() => {
  let isActive = true;

  async function loadLeads() {
    try {
      const data = await getLeads();

      if (isActive) {
        setLeads(
          data.map((lead) => ({
            ...lead,
            service: lead.source || 'ISO Certification',
          }))
        );
      }
    } catch (error) {
      console.error('Leads load error:', error);
    }
  }

  loadLeads();

  const refreshInterval = setInterval(loadLeads, 10000);

  return () => {
    isActive = false;
    clearInterval(refreshInterval);
  };
}, []);

  const emptyForm = { name: '', company: '', email: '', phone: '', service: 'ISO Certification', status: 'New' };
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [formOpen, setFormOpen] = useState(false);
  const [notice, setNotice] = useState('');

  function persist(nextLeads) {
    setLeads(nextLeads);
    try { localStorage.setItem('scs-ai-hub-leads', JSON.stringify(nextLeads)); } catch {}
  }

  function startAdd() {
    setForm(emptyForm);
    setEditingId(null);
    setFormOpen(true);
    setNotice('');
  }

  function startEdit(lead) {
    setForm({ name: lead.name, company: lead.company, email: lead.email, phone: lead.phone, service: lead.service, status: lead.status });
    setEditingId(lead.id);
    setFormOpen(true);
    setNotice('');
  }

 async function saveLead(event) {
  event.preventDefault();

  const clean = Object.fromEntries(
    Object.entries(form).map(([key, value]) => [
      key,
      value.trim(),
    ])
  );

  if (!clean.name || !clean.email) {
    setNotice('Please enter the lead name and email address.');
    return;
  }

 if (editingId !== null) {
  try {
    const updatedLead = await updateLead(editingId, {
      name: clean.name,
      email: clean.email,
      phone: clean.phone || null,
      company: clean.company || null,
      status: clean.status,
      source: clean.service || null,
    });

    const formattedLead = {
      ...updatedLead,
      service: updatedLead.source || 'ISO Certification',
    };

    setLeads((currentLeads) =>
      currentLeads.map((lead) =>
        lead.id === editingId ? formattedLead : lead
      )
    );

    setNotice('Lead updated successfully.');
    setForm(emptyForm);
    setEditingId(null);
    setFormOpen(false);
  } catch (error) {
    console.error('Lead update error:', error);
    setNotice('Lead database madhye update zali nahi.');
  }

  return;
}

  try {
    const savedLead = await createLead({
      name: clean.name,
      email: clean.email,
      phone: clean.phone || null,
      company: clean.company || null,
      status: clean.status,
      source: clean.service || null,
    });

    const formattedLead = {
      ...savedLead,
      service: savedLead.source || 'ISO Certification',
    };

    setLeads((currentLeads) => [
      formattedLead,
      ...currentLeads,
    ]);

    setNotice('Lead saved to database successfully.');
    setForm(emptyForm);
    setEditingId(null);
    setFormOpen(false);
  } catch (error) {
    console.error('Lead save error:', error);
    setNotice('Lead database madhye save zali nahi. Please try again.');
  }
}

 async function deleteLead(id) {
  if (!window.confirm('Are you sure you want to delete this lead?')) {
    return;
  }

  try {
    await deleteLeadApi(id);

    setLeads((currentLeads) =>
      currentLeads.filter((lead) => lead.id !== id)
    );

    setNotice('Lead deleted successfully.');
  } catch (error) {
    console.error('Lead delete error:', error);
    setNotice('Lead database madhun delete zali nahi.');
  }
}

  const filteredLeads = leads.filter((lead) => {
    const query = searchTerm.toLowerCase();
    const matchesSearch = [lead.name, lead.company, lead.email, lead.phone, lead.service].some((value) => value.toLowerCase().includes(query));
    return matchesSearch && (statusFilter === 'All' || lead.status === statusFilter);
  });

  return (
    <DashboardShell title="Lead Management">
      <div className="leads-page">
        <div className="leads-heading">
          <div><p className="eyebrow">CUSTOMER PIPELINE</p><h1>Lead Management</h1><p>Capture potential customers and track their progress.</p></div>
          <button className="button" onClick={startAdd}><Plus size={18} /> Add New Lead</button>
        </div>
        <div className="leads-summary">
          <article className="leads-summary-card"><span>Total Leads</span><strong>{leads.length}</strong></article>
          <article className="leads-summary-card"><span>New</span><strong>{leads.filter((lead) => lead.status === 'New').length}</strong></article>
          <article className="leads-summary-card"><span>Contacted</span><strong>{leads.filter((lead) => lead.status === 'Contacted').length}</strong></article>
          <article className="leads-summary-card"><span>Qualified</span><strong>{leads.filter((lead) => lead.status === 'Qualified').length}</strong></article>
        </div>

        {notice && <p className="leads-notice" role="status">{notice}</p>}

        {formOpen && (
          <form className="lead-form-card" onSubmit={saveLead}>
            <div className="lead-form-heading"><div><h2>{editingId !== null ? 'Edit Lead' : 'Add New Lead'}</h2><p>Fields marked with * are required.</p></div><button type="button" className="lead-icon-button" onClick={() => setFormOpen(false)} aria-label="Close form"><X size={19} /></button></div>
            <div className="lead-form-grid">
              <label>Contact Name *<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Enter full name" required /></label>
              <label>Company Name<input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Enter company" /></label>
              <label>Email Address *<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@company.com" required /></label>
              <label>Phone Number<input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Enter phone number" /></label>
              <label>Interested Service<select value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })}><option>ISO Certification</option><option>Quality Management</option><option>Training & Support</option><option>Audit & Compliance</option><option>Other</option></select></label>
              <label>Lead Status<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option>New</option><option>Contacted</option><option>Qualified</option><option>Converted</option><option>Lost</option></select></label>
            </div>
            <div className="lead-form-actions"><button type="button" className="button secondary" onClick={() => { setFormOpen(false); setEditingId(null); }}>Cancel</button><button type="submit" className="button"><Save size={17} /> {editingId !== null ? 'Save Changes' : 'Save Lead'}</button></div>
          </form>
        )}

        <section className="leads-table-card">
          <div className="leads-toolbar">
            <div><h2>All Leads</h2><p>{filteredLeads.length} records found</p></div>
            <div className="leads-filters">
              <label className="lead-search"><Search size={17} /><input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search leads..." aria-label="Search leads" /></label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status"><option>All</option><option>New</option><option>Contacted</option><option>Qualified</option><option>Converted</option><option>Lost</option></select>
            </div>
          </div>
          <div className="leads-table-wrap">
            <table className="leads-table">
              <thead><tr><th>Contact</th><th>Company</th><th>Interested Service</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <tr key={lead.id}>
                    <td><div className="lead-person"><span className="lead-avatar">{lead.name.charAt(0).toUpperCase()}</span><div><strong>{lead.name}</strong><small><Mail size={13} /> {lead.email}</small>{lead.phone && <small>{lead.phone}</small>}</div></div></td>
                    <td>{lead.company || '—'}</td><td>{lead.service}</td>
                    <td><span className={`lead-status status-${lead.status.toLowerCase()}`}>{lead.status}</span></td>
                    <td><div className="lead-row-actions"><button className="lead-icon-button" onClick={() => startEdit(lead)} aria-label={`Edit ${lead.name}`} title="Edit lead"><Pencil size={16} /></button><button className="lead-icon-button danger" onClick={() => deleteLead(lead.id)} aria-label={`Delete ${lead.name}`} title="Delete lead"><Trash2 size={16} /></button></div></td>
                  </tr>
                ))}
                {filteredLeads.length === 0 && <tr><td colSpan="5" className="leads-empty">No leads found. Try another search or add a new lead.</td></tr>}
              </tbody>
            </table>
          </div>
          <p className="leads-footnote">Demo version: lead records are saved in this browser only. A shared database and secure authentication will be connected later.</p>
        </section>
      </div>
    </DashboardShell>
  );
}


function CRM() {
  const defaultCustomers = [
    { id: 101, name: 'Aarav Sharma', company: 'Aarav Industries', email: 'aarav@example.com', phone: '9876543210', status: 'Active', lastContact: '2026-10-12', notes: 'Interested in ISO certification support.' },
    { id: 102, name: 'Priya Patel', company: 'PP Solutions', email: 'priya@example.com', phone: '9876501234', status: 'Follow-up', lastContact: '2026-10-14', notes: 'Send quality management proposal.' },
    { id: 103, name: 'Rahul Deshmukh', company: 'RD Manufacturing', email: 'rahul@example.com', phone: '9890123456', status: 'Active', lastContact: '2026-10-10', notes: 'Discussed audit and compliance requirements.' },
  ];
  const [customers, setCustomers] = useState(() => {
    try {
      const saved = localStorage.getItem('scs-ai-hub-crm-customers');
      return saved ? JSON.parse(saved) : defaultCustomers;
    } catch { return defaultCustomers; }
  });
  const emptyForm = { name: '', company: '', email: '', phone: '', status: 'Active', lastContact: new Date().toISOString().slice(0, 10), notes: '' };
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [notice, setNotice] = useState('');

  function persist(next) {
    setCustomers(next);
    try { localStorage.setItem('scs-ai-hub-crm-customers', JSON.stringify(next)); } catch {}
  }
  function startAdd() { setForm({ ...emptyForm, lastContact: new Date().toISOString().slice(0, 10) }); setEditingId(null); setFormOpen(true); setNotice(''); }
  function startEdit(customer) { setForm({ name: customer.name, company: customer.company, email: customer.email, phone: customer.phone, status: customer.status, lastContact: customer.lastContact, notes: customer.notes }); setEditingId(customer.id); setFormOpen(true); setNotice(''); }
  function saveCustomer(event) {
    event.preventDefault();
    const clean = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value.trim()]));
    if (!clean.name || !clean.email) { setNotice('Please enter a customer name and email address.'); return; }
    if (editingId !== null) {
      persist(customers.map((customer) => customer.id === editingId ? { ...customer, ...clean } : customer));
      setNotice('Customer profile updated successfully.');
    } else {
      persist([{ id: Date.now(), ...clean }, ...customers]);
      setNotice('Customer added to CRM successfully.');
    }
    setForm(emptyForm); setEditingId(null); setFormOpen(false);
  }
  function deleteCustomer(id) {
    if (!window.confirm('Delete this customer profile from CRM?')) return;
    persist(customers.filter((customer) => customer.id !== id));
    setNotice('Customer profile deleted.');
  }
  const filtered = customers.filter((customer) => {
    const query = searchTerm.toLowerCase();
    const matches = [customer.name, customer.company, customer.email, customer.phone, customer.notes].some((value) => (value || '').toLowerCase().includes(query));
    return matches && (statusFilter === 'All' || customer.status === statusFilter);
  });
  return (
    <DashboardShell title="CRM">
      <div className="crm-page">
        <div className="crm-heading">
          <div><p className="eyebrow">CUSTOMER RELATIONSHIP MANAGEMENT</p><h1>Customer Relationship Management</h1><p>Keep customer details, recent contact dates and follow-up notes in one place.</p></div>
          <button className="button" onClick={startAdd}><Plus size={18} /> Add Customer</button>
        </div>
        <div className="crm-summary">
          <article className="crm-summary-card"><span>Total Customers</span><strong>{customers.length}</strong><small>Profiles in this browser</small></article>
          <article className="crm-summary-card"><span>Active</span><strong>{customers.filter((c) => c.status === 'Active').length}</strong><small>Current relationships</small></article>
          <article className="crm-summary-card"><span>Follow-ups</span><strong>{customers.filter((c) => c.status === 'Follow-up').length}</strong><small>Need a next touchpoint</small></article>
          <article className="crm-summary-card"><span>Inactive</span><strong>{customers.filter((c) => c.status === 'Inactive').length}</strong><small>Not currently active</small></article>
        </div>
        {notice && <p className="leads-notice" role="status">{notice}</p>}
        {formOpen && <form className="lead-form-card" onSubmit={saveCustomer}>
          <div className="lead-form-heading"><div><h2>{editingId !== null ? 'Edit Customer Profile' : 'Add Customer Profile'}</h2><p>Keep contact details and relationship notes up to date.</p></div><button type="button" className="lead-icon-button" onClick={() => setFormOpen(false)} aria-label="Close form"><X size={19} /></button></div>
          <div className="lead-form-grid">
            <label>Customer Name *<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Enter full name" required /></label>
            <label>Company<input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Company name" /></label>
            <label>Email Address *<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@company.com" required /></label>
            <label>Phone Number<input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone number" /></label>
            <label>Relationship Status<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option>Active</option><option>Follow-up</option><option>Inactive</option></select></label>
            <label>Last Contact Date<input type="date" value={form.lastContact} onChange={(e) => setForm({ ...form, lastContact: e.target.value })} /></label>
            <label className="crm-notes-field">Interaction / Follow-up Notes<textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Add meeting notes, customer needs or next follow-up..." rows={3} /></label>
          </div>
          <div className="lead-form-actions"><button type="button" className="button secondary" onClick={() => { setFormOpen(false); setEditingId(null); }}>Cancel</button><button type="submit" className="button"><Save size={17} /> {editingId !== null ? 'Save Changes' : 'Save Customer'}</button></div>
        </form>}
        <section className="leads-table-card">
          <div className="leads-toolbar"><div><h2>Customer Directory</h2><p>{filtered.length} profiles found</p></div><div className="leads-filters"><label className="lead-search"><Search size={17} /><input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search customers..." aria-label="Search customers" /></label><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter customers by status"><option>All</option><option>Active</option><option>Follow-up</option><option>Inactive</option></select></div></div>
          <div className="crm-customer-list">
            {filtered.map((customer) => <article className="crm-customer-card" key={customer.id}>
              <div className="crm-customer-main"><span className="crm-avatar"><UserRound size={21} /></span><div className="crm-customer-name"><h3>{customer.name}</h3><p>{customer.company || 'Company not provided'}</p><div className="crm-contact-lines"><span><Mail size={14} />{customer.email}</span>{customer.phone && <span><Phone size={14} />{customer.phone}</span>}<span><CalendarDays size={14} />Last contact: {customer.lastContact || 'Not recorded'}</span></div></div></div>
              <span className={`lead-status crm-status status-${customer.status.toLowerCase().replace(/[^a-z]+/g, '-')}`}>{customer.status}</span>
              <div className="crm-customer-notes"><strong><MessageSquare size={14} /> Interaction notes</strong><p>{customer.notes || 'No interaction notes added yet.'}</p></div>
              <div className="crm-customer-actions"><button className="lead-icon-button" onClick={() => startEdit(customer)} title="Edit customer" aria-label={`Edit ${customer.name}`}><Pencil size={16} /> Edit</button><button className="lead-icon-button danger" onClick={() => deleteCustomer(customer.id)} title="Delete customer" aria-label={`Delete ${customer.name}`}><Trash2 size={16} /> Delete</button></div>
            </article>)}
            {filtered.length === 0 && <div className="leads-empty">No customers found. Change the filters or add a customer profile.</div>}
          </div>
          <p className="leads-footnote">Demo version: CRM profiles are stored in this browser only. Shared database, user permissions and secure authentication are not connected yet.</p>
        </section>
      </div>
    </DashboardShell>
  );
}

function DashboardShell({ title, children }) {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="dashboard-layout">
      <aside className={`dashboard-sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <Link to="/" className="dashboard-brand"><span className="brand-mark">SCS</span><span><strong>SCS AI HUB</strong><small>OWNER PORTAL</small></span></Link>
        <p className="sidebar-heading">WORKSPACE</p>
        <nav className="dashboard-nav">
          {dashboardLinks.map(({ label, path, icon: Icon }) => (
            <Link key={path} to={path} onClick={() => setMenuOpen(false)} className={`dashboard-nav-link ${location.pathname === path ? 'active' : ''}`}><Icon size={19} /><span>{label}</span></Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <Link to="/dashboard/settings" className={`dashboard-nav-link ${location.pathname === '/dashboard/settings' ? 'active' : ''}`}><Settings size={19} /><span>Settings</span></Link>
          <Link to="/" className="dashboard-nav-link"><LogOut size={19} /><span>Back to Website</span></Link>
        </div>
      </aside>
      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <button className="dashboard-menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle sidebar"><Menu size={22} /></button>
          <div><span className="topbar-label">SCS AI HUB / {title.toUpperCase()}</span><strong>{title}</strong></div>
          <Link to="/dashboard" className="topbar-home">Dashboard <ArrowRight size={16} /></Link>
        </header>
        <section className="dashboard-content">{children}</section>
      </main>
    </div>
  );
}

function DashboardModule({ title }) {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="dashboard-layout">
      <aside className={`dashboard-sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <Link to="/" className="dashboard-brand"><span className="brand-mark">SCS</span><span><strong>SCS AI HUB</strong><small>OWNER PORTAL</small></span></Link>
        <p className="sidebar-heading">WORKSPACE</p>
        <nav className="dashboard-nav">
          {dashboardLinks.map(({ label, path, icon: Icon }) => (
            <Link key={path} to={path} onClick={() => setMenuOpen(false)} className={`dashboard-nav-link ${location.pathname === path ? 'active' : ''}`}><Icon size={19} /><span>{label}</span></Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <Link to="/dashboard/settings" className={`dashboard-nav-link ${location.pathname === '/dashboard/settings' ? 'active' : ''}`}><Settings size={19} /><span>Settings</span></Link>
          <Link to="/" className="dashboard-nav-link"><LogOut size={19} /><span>Back to Website</span></Link>
        </div>
      </aside>
      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <button className="dashboard-menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle sidebar"><Menu size={22} /></button>
          <div><span className="topbar-label">SCS AI HUB / {title.toUpperCase()}</span><strong>{title}</strong></div>
          <Link to="/dashboard" className="topbar-home">Dashboard <ArrowRight size={16} /></Link>
        </header>
        <section className="dashboard-content">
          <p className="eyebrow">WORKSPACE MODULE</p><h1>{title}</h1>
          <div className="demo-notice"><Bot size={20} /><span>This module page is a starter UI. Module-specific features, backend integration and live data will be added in the next steps.</span></div>
          <Link to="/dashboard" className="button">← Back to Dashboard</Link>
        </section>
      </main>
    </div>
  );
}

function NotFound() {
  return <main className="page not-found"><h1>Page not found</h1><Link className="button" to="/">Return home</Link></main>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/owner-login" element={<OwnerLogin />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/sales" element={<DashboardModule title="Sales Agent" />} />
        <Route path="/dashboard/marketing" element={<DashboardModule title="Marketing Agent" />} />
        <Route path="/dashboard/leads" element={<LeadManagement />} />
        <Route path="/dashboard/crm" element={<CRM />} />
        <Route path="/dashboard/analytics" element={<DashboardModule title="Analytics" />} />
        <Route path="/dashboard/knowledge" element={<DashboardModule title="Knowledge Base" />} />
        <Route path="/dashboard/settings" element={<DashboardModule title="Settings" />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
