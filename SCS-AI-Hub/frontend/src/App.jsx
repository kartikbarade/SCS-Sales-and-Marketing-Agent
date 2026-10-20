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
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';

import {
  convertLeadToCustomer,
  createCustomer,
  createLead,
  createPublicInquiry,
  deleteCustomer,
  deleteLead as deleteLeadApi,
  getCustomers,
  getLeads,
  sendChatMessage,
  updateCustomer,
  updateLead
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
  { label: 'Lead Generation Agent', path: '/dashboard/lead-agent', icon: Search },
  { label: 'CRM', path: '/dashboard/crm', icon: ClipboardCheck },
  { label: 'Analytics', path: '/dashboard/analytics', icon: ChartNoAxesCombined },
  { label: 'Knowledge Base', path: '/dashboard/knowledge', icon: BookOpen },
];




function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  const [messages, setMessages] = useState([
    {
      from: 'bot',
      text: 'Hello! Welcome to SCS AI Hub. How can I help you today? You can chat with me directly, or share your contact details if you would like our team to get in touch.',
    },
  ]);

  const [showContactForm, setShowContactForm] = useState(false);
  const [contactStatus, setContactStatus] = useState('');
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);

  const [contactData, setContactData] = useState({
    name: '',
    email: '',
    phone: '',
    service: 'ISO Certification',
  });

  async function sendMessage(event) {
    event.preventDefault();

    const value = message.trim();

    if (!value || isSendingMessage) {
      return;
    }

    setIsSendingMessage(true);
    setMessage('');

    const loadingText =
      'SCS AI is thinking... Please wait a few seconds.';

    setMessages((old) => [
      ...old,
      { from: 'user', text: value },
      { from: 'bot', text: loadingText },
    ]);

    try {
      const data = await sendChatMessage(value);

      const reply =
        typeof data?.reply === 'string' && data.reply.trim()
          ? data.reply
          : 'Sorry, I could not generate a response. Please try again.';

      setMessages((old) => [
        ...old.filter(
          (item) =>
            !(item.from === 'bot' && item.text === loadingText)
        ),
        { from: 'bot', text: reply },
      ]);
    } catch (error) {
      console.error('AI chat error:', error);

      setMessages((old) => [
        ...old.filter(
          (item) =>
            !(item.from === 'bot' && item.text === loadingText)
        ),
        {
          from: 'bot',
          text: 'Sorry, the AI assistant is temporarily unavailable. Please try again.',
        },
      ]);
    } finally {
      setIsSendingMessage(false);
    }
  }

  async function handleContactSubmit(event) {
    event.preventDefault();

    if (isSubmittingContact) {
      return;
    }

    setContactStatus('');

    const finalContact = {
      name: contactData.name.trim(),
      email: contactData.email.trim(),
      phone: contactData.phone.trim(),
      service: contactData.service,
    };

    if (
      !finalContact.name ||
      !finalContact.email ||
      !finalContact.phone
    ) {
      setContactStatus('Please fill in all contact details.');
      return;
    }

    setIsSubmittingContact(true);

    try {
      // Public API: visitors do not need to log in.
      await createPublicInquiry({
        name: finalContact.name,
        email: finalContact.email,
        phone: finalContact.phone,
        company: null,
        status: 'New',
        source: finalContact.service || 'Website Chatbot',
        notes: null,
      });

      setContactStatus(
        'Your inquiry has been submitted successfully!'
      );

      setMessages((old) => [
        ...old,
        {
          from: 'bot',
          text: 'Thank you for sharing your contact details! Your inquiry has been submitted successfully. Our team can get in touch with you.',
        },
      ]);

      setContactData({
        name: '',
        email: '',
        phone: '',
        service: 'ISO Certification',
      });

      setShowContactForm(false);
    } catch (error) {
      console.error('Chatbot contact form error:', error);

      setContactStatus(
        error?.message ||
          'Sorry, we could not submit your inquiry. Please try again.'
      );
    } finally {
      setIsSubmittingContact(false);
    }
  }

  return (
    <>
      {open && (
        <section
          className="chat-window"
          aria-label="SCS AI Assistant"
        >
          <header className="chat-header">
            <div className="chat-avatar">
              <Bot size={23} />
            </div>

            <div>
              <strong>SCS AI Assistant</strong>
              <small>AI-Powered Assistant</small>
            </div>

            <button
              type="button"
              className="chat-close"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
            >
              <X size={20} />
            </button>
          </header>

          <div className="chat-messages" aria-live="polite">
            {messages.map((item, index) => (
              <div
                className={`chat-message ${item.from}`}
                key={index}
              >
                {item.text}
              </div>
            ))}
          </div>

          <div className="chat-contact-option">
            <button
              type="button"
              onClick={() => {
                setShowContactForm((old) => !old);
                setContactStatus('');
              }}
            >
              {showContactForm
                ? 'Cancel'
                : 'Share Contact Details (Optional)'}
            </button>
          </div>

          {contactStatus && (
            <p
              className="chat-contact-status"
              role="status"
            >
              {contactStatus}
            </p>
          )}

          {showContactForm && (
            <form
              className="chat-contact-form"
              onSubmit={handleContactSubmit}
            >
              <input
                type="text"
                placeholder="Full name"
                aria-label="Full name"
                autoComplete="name"
                required
                value={contactData.name}
                onChange={(event) =>
                  setContactData((old) => ({
                    ...old,
                    name: event.target.value,
                  }))
                }
              />

              <input
                type="email"
                placeholder="Email address"
                aria-label="Email address"
                autoComplete="email"
                required
                value={contactData.email}
                onChange={(event) =>
                  setContactData((old) => ({
                    ...old,
                    email: event.target.value,
                  }))
                }
              />

              <input
                type="tel"
                placeholder="Phone number"
                aria-label="Phone number"
                autoComplete="tel"
                required
                value={contactData.phone}
                onChange={(event) =>
                  setContactData((old) => ({
                    ...old,
                    phone: event.target.value,
                  }))
                }
              />

              <select
                aria-label="Interested service"
                value={contactData.service}
                onChange={(event) =>
                  setContactData((old) => ({
                    ...old,
                    service: event.target.value,
                  }))
                }
              >
                <option value="ISO Certification">
                  ISO Certification
                </option>
                <option value="Quality Management">
                  Quality Management
                </option>
                <option value="Training & Support">
                  Training &amp; Support
                </option>
                <option value="Audit & Compliance">
                  Audit &amp; Compliance
                </option>
                <option value="Other">Other</option>
              </select>

              <button
                type="submit"
                disabled={isSubmittingContact}
              >
                {isSubmittingContact
                  ? 'Submitting...'
                  : 'Submit Inquiry'}
              </button>
            </form>
          )}

          <form
            className="chat-form"
            onSubmit={sendMessage}
          >
            <input
              value={message}
              onChange={(event) =>
                setMessage(event.target.value)
              }
              placeholder="Type your message..."
              aria-label="Type your message"
              disabled={isSendingMessage}
            />

            <button
              type="submit"
              aria-label="Send message"
              disabled={isSendingMessage || !message.trim()}
            >
              {isSendingMessage ? (
                <span>...</span>
              ) : (
                <Send size={18} />
              )}
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        className="chat-launcher"
        onClick={() => setOpen((old) => !old)}
        aria-label={open ? 'Close AI assistant' : 'Open AI assistant'}
      >
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

    if (loading) return;

    setLoading(true);
    setMessage('');

    try {
      await createPublicInquiry({
        name: form.name.trim(),
        company: form.company.trim() || null,
        email: form.email.trim(),
        phone: form.phone.trim(),
        status: 'New',
        source: form.service,
      });

      setMessage(
        'Thank you! Your inquiry was submitted successfully.'
      );

      setForm({
        name: '',
        company: '',
        email: '',
        phone: '',
        service: 'ISO Certification',
      });
    } catch (error) {
      console.error('Inquiry submission failed:', error);

      setMessage(
        error?.message ||
          'Submission failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="inquiry" className="services">
      <div className="section-heading">
        <p className="eyebrow">GET IN TOUCH</p>

        <h2>
          Tell us about your <span>business needs.</span>
        </h2>

        <p>
          Submit an inquiry and our team can follow up with you.
        </p>
      </div>

      <form
        className="lead-form-card"
        onSubmit={handleSubmit}
      >
        <div className="lead-form-grid">
          <label>
            Contact Name *
            <input
              type="text"
              required
              autoComplete="name"
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name: e.target.value,
                })
              }
              placeholder="Enter your full name"
            />
          </label>

          <label>
            Company Name
            <input
              type="text"
              autoComplete="organization"
              value={form.company}
              onChange={(e) =>
                setForm({
                  ...form,
                  company: e.target.value,
                })
              }
              placeholder="Enter company name"
            />
          </label>

          <label>
            Email Address *
            <input
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={(e) =>
                setForm({
                  ...form,
                  email: e.target.value,
                })
              }
              placeholder="you@company.com"
            />
          </label>

          <label>
            Phone Number
            <input
              type="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={(e) =>
                setForm({
                  ...form,
                  phone: e.target.value,
                })
              }
              placeholder="Enter phone number"
            />
          </label>

          <label>
            Interested Service
            <select
              value={form.service}
              onChange={(e) =>
                setForm({
                  ...form,
                  service: e.target.value,
                })
              }
            >
              <option value="ISO Certification">
                ISO Certification
              </option>

              <option value="Quality Management">
                Quality Management
              </option>

              <option value="Training & Support">
                Training &amp; Support
              </option>

              <option value="Audit & Compliance">
                Audit &amp; Compliance
              </option>

              <option value="Other">Other</option>
            </select>
          </label>
        </div>

        <div className="lead-form-actions">
          <button
            className="button"
            type="submit"
            disabled={loading}
          >
            {loading
              ? 'Submitting...'
              : 'Submit Inquiry'}
          </button>
        </div>

        {message && (
          <p role="status" aria-live="polite">
            {message}
          </p>
        )}
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


function ProtectedRoute({ children }) {
  const token = sessionStorage.getItem("scs_owner_token");
  const role = sessionStorage.getItem("scs_owner_role");

  if (!token || role !== "owner") {
    return <Navigate to="/owner-login" replace />;
  }

  return children;
}


function OwnerLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          response.status === 401
            ? "Invalid owner email or password."
            : data.detail || "Login failed. Please try again."
        );
        return;
      }

      if (data.role !== "owner" || !data.access_token) {
        setError("Owner authentication failed.");
        return;
      }

      sessionStorage.setItem("scs_owner_token", data.access_token);
      sessionStorage.setItem("scs_owner_role", data.role);

      navigate("/dashboard");
    } catch {
      setError("Cannot connect to the server. Please check that the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={handleLogin}>
        <Link to="/" className="brand large">
          <span className="brand-mark">SCS</span>
          <small>AI HUB</small>
        </Link>

        <h1>Welcome Back</h1>
        <p>Sign in to your owner account</p>

        <label>
          Email address
          <input
            type="email"
            placeholder="owner@company.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="username"
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        {error && (
          <p className="login-notice" role="alert">
            {error}
          </p>
        )}

        <button className="button full" type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Login"}
          {!loading && <ArrowRight size={18} />}
        </button>

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
                  'Search for potential companies and save leads to MySQL.',
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

  const emptyForm = {
    name: '',
    company: '',
    email: '',
    phone: '',
    service: 'ISO Certification',
    status: 'New',
  };

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [formOpen, setFormOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [convertingId, setConvertingId] = useState(null);

  // Load leads from the database
  async function loadLeads() {
    try {
      const data = await getLeads();

      setLeads(
        data.map((lead) => ({
          ...lead,
          service: lead.source || 'ISO Certification',
        }))
      );
    } catch (error) {
      console.error('Leads load error:', error);
      setNotice('Leads database madhun load zale nahi.');
    }
  }

  useEffect(() => {
    let isActive = true;

    async function initialLoad() {
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

        if (isActive) {
          setNotice('Leads database madhun load zale nahi.');
        }
      }
    }

    initialLoad();

    const refreshInterval = setInterval(async () => {
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
        console.error('Automatic lead refresh error:', error);
      }
    }, 10000);

    return () => {
      isActive = false;
      clearInterval(refreshInterval);
    };
  }, []);

  function startAdd() {
    setForm({ ...emptyForm });
    setEditingId(null);
    setFormOpen(true);
    setNotice('');
  }

  function startEdit(lead) {
    setForm({
      name: lead.name || '',
      company: lead.company || '',
      email: lead.email || '',
      phone: lead.phone || '',
      service: lead.service || 'ISO Certification',
      status: lead.status || 'New',
    });

    setEditingId(lead.id);
    setFormOpen(true);
    setNotice('');
  }

  // Create or update a lead
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

    const payload = {
      name: clean.name,
      email: clean.email,
      phone: clean.phone || null,
      company: clean.company || null,
      status: clean.status,
      source: clean.service || null,
    };

    if (editingId !== null) {
      try {
        const updatedLead = await updateLead(editingId, payload);

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
        setForm({ ...emptyForm });
        setEditingId(null);
        setFormOpen(false);
      } catch (error) {
        console.error('Lead update error:', error);
        setNotice('Lead database madhye update zali nahi.');
      }

      return;
    }

    try {
      const savedLead = await createLead(payload);

      const formattedLead = {
        ...savedLead,
        service: savedLead.source || 'ISO Certification',
      };

      setLeads((currentLeads) => [
        formattedLead,
        ...currentLeads,
      ]);

      setNotice('Lead saved to database successfully.');
      setForm({ ...emptyForm });
      setEditingId(null);
      setFormOpen(false);
    } catch (error) {
      console.error('Lead save error:', error);
      setNotice('Lead database madhye save zali nahi. Please try again.');
    }
  }

  // Delete a lead
  async function handleDeleteLead(id) {
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

  // Convert a lead into a CRM customer
  async function handleConvertToCustomer(lead) {
    if (lead.status === 'Converted') {
      setNotice('This lead has already been converted.');
      return;
    }

    if (!lead.email || !lead.email.trim()) {
      setNotice(
        'Please add an email address before converting this lead.'
      );
      return;
    }

    const confirmed = window.confirm(
      `Convert "${lead.name}" into a CRM customer?`
    );

    if (!confirmed) {
      return;
    }

    setConvertingId(lead.id);
    setNotice('');

    try {
      const result = await convertLeadToCustomer(lead.id);

      // Refresh the list from the database
      await loadLeads();

      setNotice(
        result.message || 'Lead converted to customer successfully.'
      );
    } catch (error) {
      console.error('Lead conversion error:', error);

      setNotice(
        error.message ||
          'Unable to convert lead to customer. Please try again.'
      );
    } finally {
      setConvertingId(null);
    }
  }

  // Search and status filter
  const filteredLeads = leads.filter((lead) => {
    const query = searchTerm.toLowerCase();

    const matchesSearch = [
      lead.name,
      lead.company,
      lead.email,
      lead.phone,
      lead.service,
    ].some((value) =>
      String(value || '').toLowerCase().includes(query)
    );

    return (
      matchesSearch &&
      (statusFilter === 'All' || lead.status === statusFilter)
    );
  });

  return (
    <DashboardShell title="Lead Management">
      <div className="leads-page">
        <div className="leads-heading">
          <div>
            <p className="eyebrow">CUSTOMER PIPELINE</p>
            <h1>Lead Management</h1>
            <p>Capture potential customers and track their progress.</p>
          </div>

          <button className="button" onClick={startAdd}>
            <Plus size={18} /> Add New Lead
          </button>
        </div>

        <div className="leads-summary">
          <article className="leads-summary-card">
            <span>Total Leads</span>
            <strong>{leads.length}</strong>
          </article>

          <article className="leads-summary-card">
            <span>New</span>
            <strong>
              {leads.filter((lead) => lead.status === 'New').length}
            </strong>
          </article>

          <article className="leads-summary-card">
            <span>Contacted</span>
            <strong>
              {leads.filter((lead) => lead.status === 'Contacted').length}
            </strong>
          </article>

          <article className="leads-summary-card">
            <span>Qualified</span>
            <strong>
              {leads.filter((lead) => lead.status === 'Qualified').length}
            </strong>
          </article>
        </div>

        {notice && (
          <p className="leads-notice" role="status">
            {notice}
          </p>
        )}

        {formOpen && (
          <form className="lead-form-card" onSubmit={saveLead}>
            <div className="lead-form-heading">
              <div>
                <h2>
                  {editingId !== null ? 'Edit Lead' : 'Add New Lead'}
                </h2>
                <p>Fields marked with * are required.</p>
              </div>

              <button
                type="button"
                className="lead-icon-button"
                onClick={() => setFormOpen(false)}
                aria-label="Close form"
              >
                <X size={19} />
              </button>
            </div>

            <div className="lead-form-grid">
              <label>
                Contact Name *
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  placeholder="Enter full name"
                  required
                />
              </label>

              <label>
                Company Name
                <input
                  value={form.company}
                  onChange={(e) =>
                    setForm({ ...form, company: e.target.value })
                  }
                  placeholder="Enter company"
                />
              </label>

              <label>
                Email Address *
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                  placeholder="name@company.com"
                  required
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

              <label>
                Lead Status
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value })
                  }
                >
                  <option>New</option>
                  <option>Contacted</option>
                  <option>Qualified</option>
                  <option>Converted</option>
                  <option>Lost</option>
                </select>
              </label>
            </div>

            <div className="lead-form-actions">
              <button
                type="button"
                className="button secondary"
                onClick={() => {
                  setFormOpen(false);
                  setEditingId(null);
                }}
              >
                Cancel
              </button>

              <button type="submit" className="button">
                <Save size={17} />
                {editingId !== null ? 'Save Changes' : 'Save Lead'}
              </button>
            </div>
          </form>
        )}

        <section className="leads-table-card">
          <div className="leads-toolbar">
            <div>
              <h2>All Leads</h2>
              <p>{filteredLeads.length} records found</p>
            </div>

            <div className="leads-filters">
              <label className="lead-search">
                <Search size={17} />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search leads..."
                  aria-label="Search leads"
                />
              </label>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by status"
              >
                <option>All</option>
                <option>New</option>
                <option>Contacted</option>
                <option>Qualified</option>
                <option>Converted</option>
                <option>Lost</option>
              </select>
            </div>
          </div>

          <div className="leads-table-wrap">
            <table className="leads-table">
              <thead>
                <tr>
                  <th>Contact</th>
                  <th>Company</th>
                  <th>Interested Service</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredLeads.map((lead) => (
                  <tr key={lead.id}>
                    <td>
                      <div className="lead-person">
                        <span className="lead-avatar">
                          {lead.name.charAt(0).toUpperCase()}
                        </span>

                        <div>
                          <strong>{lead.name}</strong>
                          <small>
                            <Mail size={13} /> {lead.email}
                          </small>
                          {lead.phone && <small>{lead.phone}</small>}
                        </div>
                      </div>
                    </td>

                    <td>{lead.company || '—'}</td>
                    <td>{lead.service}</td>

                    <td>
                      <span
                        className={`lead-status status-${String(
                          lead.status
                        ).toLowerCase()}`}
                      >
                        {lead.status}
                      </span>
                    </td>

                    <td>
                      <div className="lead-row-actions">
                        <button
                          type="button"
                          className="lead-icon-button"
                          onClick={() => startEdit(lead)}
                          aria-label={`Edit ${lead.name}`}
                          title="Edit lead"
                        >
                          <Pencil size={16} />
                        </button>

                        {lead.status !== 'Converted' && (
                          <button
                            type="button"
                            className="button secondary"
                            onClick={() =>
                              handleConvertToCustomer(lead)
                            }
                            disabled={convertingId === lead.id}
                            title="Convert lead into a CRM customer"
                          >
                            {convertingId === lead.id
                              ? 'Converting...'
                              : 'Convert to Customer'}
                          </button>
                        )}

                        <button
                          type="button"
                          className="lead-icon-button danger"
                          onClick={() => handleDeleteLead(lead.id)}
                          aria-label={`Delete ${lead.name}`}
                          title="Delete lead"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredLeads.length === 0 && (
                  <tr>
                    <td colSpan="5" className="leads-empty">
                      No leads found. Try another search or add a new lead.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <p className="leads-footnote">
            Lead records are saved in the shared database. Converted leads
            are added to the CRM customer list.
          </p>
        </section>
      </div>
    </DashboardShell>
  );
}



function CRM() {
  const getToday = () => new Date().toISOString().slice(0, 10);

  const emptyForm = {
    name: '',
    company: '',
    email: '',
    phone: '',
    status: 'Active',
    lastContact: getToday(),
    notes: '',
  };

  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  function formatCustomer(customer) {
    return {
      ...customer,
      lastContact: customer.last_contact || '',
      company: customer.company || '',
      phone: customer.phone || '',
      notes: customer.notes || '',
      status: customer.status || 'Active',
    };
  }

  function prepareCustomerData(data) {
    return {
      name: data.name.trim(),
      company: data.company.trim() || null,
      email: data.email.trim(),
      phone: data.phone.trim() || null,
      status: data.status,
      last_contact: data.lastContact || null,
      notes: data.notes.trim() || null,
    };
  }

  async function loadCustomers() {
    setError('');
    setLoading(true);

    try {
      const data = await getCustomers();
      setCustomers(data.map(formatCustomer));
    } catch (err) {
      console.error('Customer loading error:', err);
      setError(
        'Unable to load customers. Please check the backend server and database connection.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  function startAdd() {
    setForm({ ...emptyForm, lastContact: getToday() });
    setEditingId(null);
    setFormOpen(true);
    setNotice('');
    setError('');
  }

  function startEdit(customer) {
    setForm({
      name: customer.name || '',
      company: customer.company || '',
      email: customer.email || '',
      phone: customer.phone || '',
      status: customer.status || 'Active',
      lastContact: customer.lastContact || '',
      notes: customer.notes || '',
    });

    setEditingId(customer.id);
    setFormOpen(true);
    setNotice('');
    setError('');
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
    setForm({ ...emptyForm, lastContact: getToday() });
  }

  async function saveCustomer(event) {
    event.preventDefault();

    if (saving) return;

    if (!form.name.trim() || !form.email.trim()) {
      setError('Please enter a customer name and email address.');
      return;
    }

    setSaving(true);
    setError('');
    setNotice('');

    try {
      const customerData = prepareCustomerData(form);

      if (editingId !== null) {
        await updateCustomer(editingId, customerData);
        setNotice('Customer profile updated successfully.');
      } else {
        await createCustomer(customerData);
        setNotice('Customer added to CRM successfully.');
      }

      closeForm();
      await loadCustomers();
    } catch (err) {
      console.error('Customer save error:', err);
      setError(
        'Unable to save the customer. Please check the email address and try again.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteCustomer(id) {
    if (
      !window.confirm(
        'Are you sure you want to delete this customer from the database?'
      )
    ) {
      return;
    }

    setError('');
    setNotice('');

    try {
      await deleteCustomer(id);

      setCustomers((current) =>
        current.filter((customer) => customer.id !== id)
      );

      setNotice('Customer profile deleted successfully.');
    } catch (err) {
      console.error('Customer delete error:', err);
      setError('Unable to delete the customer. Please try again.');
    }
  }

  const filtered = customers.filter((customer) => {
    const query = searchTerm.toLowerCase();

    const matchesSearch = [
      customer.name,
      customer.company,
      customer.email,
      customer.phone,
      customer.notes,
    ].some((value) =>
      String(value || '').toLowerCase().includes(query)
    );

    const matchesStatus =
      statusFilter === 'All' || customer.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardShell title="CRM">
      <div className="crm-page">
        <div className="crm-heading">
          <div>
            <p className="eyebrow">
              CUSTOMER RELATIONSHIP MANAGEMENT
            </p>
            <h1>Customer Relationship Management</h1>
            <p>
              Keep customer details, recent contact dates and follow-up
              notes in one place.
            </p>
          </div>

          <button className="button" onClick={startAdd}>
            <Plus size={18} /> Add Customer
          </button>
        </div>

        <div className="crm-summary">
          <article className="crm-summary-card">
            <span>Total Customers</span>
            <strong>{customers.length}</strong>
            <small>Profiles in the database</small>
          </article>

          <article className="crm-summary-card">
            <span>Active</span>
            <strong>
              {customers.filter((c) => c.status === 'Active').length}
            </strong>
            <small>Current relationships</small>
          </article>

          <article className="crm-summary-card">
            <span>Follow-ups</span>
            <strong>
              {customers.filter((c) => c.status === 'Follow-up').length}
            </strong>
            <small>Need a next touchpoint</small>
          </article>

          <article className="crm-summary-card">
            <span>Inactive</span>
            <strong>
              {customers.filter((c) => c.status === 'Inactive').length}
            </strong>
            <small>Not currently active</small>
          </article>
        </div>

        {notice && (
          <p className="leads-notice" role="status">
            {notice}
          </p>
        )}

        {error && (
          <p className="leads-notice" role="alert">
            {error}
          </p>
        )}

        {formOpen && (
          <form className="lead-form-card" onSubmit={saveCustomer}>
            <div className="lead-form-heading">
              <div>
                <h2>
                  {editingId !== null
                    ? 'Edit Customer Profile'
                    : 'Add Customer Profile'}
                </h2>
                <p>
                  Keep contact details and relationship notes up to date.
                </p>
              </div>

              <button
                type="button"
                className="lead-icon-button"
                onClick={closeForm}
                disabled={saving}
                aria-label="Close form"
              >
                <X size={19} />
              </button>
            </div>

            <div className="lead-form-grid">
              <label>
                Customer Name *
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  placeholder="Enter full name"
                  required
                />
              </label>

              <label>
                Company
                <input
                  value={form.company}
                  onChange={(e) =>
                    setForm({ ...form, company: e.target.value })
                  }
                  placeholder="Company name"
                />
              </label>

              <label>
                Email Address *
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                  placeholder="name@company.com"
                  required
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
                  placeholder="Phone number"
                />
              </label>

              <label>
                Relationship Status
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value })
                  }
                >
                  <option>Active</option>
                  <option>Follow-up</option>
                  <option>Inactive</option>
                </select>
              </label>

              <label>
                Last Contact Date
                <input
                  type="date"
                  value={form.lastContact}
                  onChange={(e) =>
                    setForm({ ...form, lastContact: e.target.value })
                  }
                />
              </label>

              <label className="crm-notes-field">
                Interaction / Follow-up Notes
                <textarea
                  value={form.notes}
                  onChange={(e) =>
                    setForm({ ...form, notes: e.target.value })
                  }
                  placeholder="Add meeting notes, customer needs or next follow-up..."
                  rows={3}
                />
              </label>
            </div>

            <div className="lead-form-actions">
              <button
                type="button"
                className="button secondary"
                onClick={closeForm}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="button"
                disabled={saving}
              >
                <Save size={17} />
                {saving
                  ? 'Saving...'
                  : editingId !== null
                    ? 'Save Changes'
                    : 'Save Customer'}
              </button>
            </div>
          </form>
        )}

        <section className="leads-table-card">
          <div className="leads-toolbar">
            <div>
              <h2>Customer Directory</h2>
              <p>{filtered.length} profiles found</p>
            </div>

            <div className="leads-filters">
              <label className="lead-search">
                <Search size={17} />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search customers..."
                  aria-label="Search customers"
                />
              </label>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter customers by status"
              >
                <option>All</option>
                <option>Active</option>
                <option>Follow-up</option>
                <option>Inactive</option>
              </select>
            </div>
          </div>

          <div className="crm-customer-list">
            {loading ? (
              <div className="leads-empty">
                Loading customers from the database...
              </div>
            ) : (
              filtered.map((customer) => (
                <article
                  className="crm-customer-card"
                  key={customer.id}
                >
                  <div className="crm-customer-main">
                    <span className="crm-avatar">
                      <UserRound size={21} />
                    </span>

                    <div className="crm-customer-name">
                      <h3>{customer.name}</h3>
                      <p>
                        {customer.company || 'Company not provided'}
                      </p>

                      <div className="crm-contact-lines">
                        <span>
                          <Mail size={14} /> {customer.email}
                        </span>

                        {customer.phone && (
                          <span>
                            <Phone size={14} /> {customer.phone}
                          </span>
                        )}

                        <span>
                          <CalendarDays size={14} />
                          Last contact: {customer.lastContact || 'Not recorded'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`lead-status crm-status status-${customer.status
                      .toLowerCase()
                      .replace(/[^a-z]+/g, '-')}`}
                  >
                    {customer.status}
                  </span>

                  <div className="crm-customer-notes">
                    <strong>
                      <MessageSquare size={14} /> Interaction notes
                    </strong>
                    <p>
                      {customer.notes || 'No interaction notes added yet.'}
                    </p>
                  </div>

                  <div className="crm-customer-actions">
                    <button
                      className="lead-icon-button"
                      onClick={() => startEdit(customer)}
                      title="Edit customer"
                      aria-label={`Edit ${customer.name}`}
                    >
                      <Pencil size={16} /> Edit
                    </button>

                    <button
                      className="lead-icon-button danger"
                      onClick={() => handleDeleteCustomer(customer.id)}
                      title="Delete customer"
                      aria-label={`Delete ${customer.name}`}
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                </article>
              ))
            )}

            {!loading && filtered.length === 0 && (
              <div className="leads-empty">
                No customers found. Change the filters or add a customer profile.
              </div>
            )}
          </div>

          <p className="leads-footnote">
            Customer profiles are loaded from the shared MySQL database
            through the FastAPI backend.
          </p>
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

function LeadGenerationAgent() {
  const [industry, setIndustry] = useState('all');
  const [targetCount, setTargetCount] = useState('3');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  async function handleRunAgent(event) {
    event.preventDefault();
    setError('');
    setResult(null);

    const token = sessionStorage.getItem('scs_owner_token');
    const role = sessionStorage.getItem('scs_owner_role');

    if (!token || role !== 'owner') {
      setError('Owner login required. Please log in again.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        'http://127.0.0.1:8000/api/v1/lead-agent/run',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            industry: industry.trim() || 'all',
            target_count: Number(targetCount),
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 401) {
          sessionStorage.removeItem('scs_owner_token');
          sessionStorage.removeItem('scs_owner_role');
          throw new Error('Your session expired. Please log in again.');
        }
        throw new Error(data.detail || 'Lead generation failed. Please try again.');
      }

      setResult(data);
    } catch (requestError) {
      setError(
        requestError?.message ||
          'Could not connect to the backend. Check that FastAPI is running.'
      );
    } finally {
      setLoading(false);
    }
  }

  const fieldStyle = {
    width: '100%',
    padding: '12px 14px',
    border: '1px solid #d7deea',
    borderRadius: '10px',
    background: '#fff',
    color: '#182230',
    font: 'inherit',
    marginTop: '7px',
    boxSizing: 'border-box',
  };

  const statStyle = {
    border: '1px solid #e2e8f0',
    borderRadius: '14px',
    padding: '18px',
    background: '#fff',
  };

  return (
    <div className="dashboard-layout">
      <style>{`@keyframes agent-spin { to { transform: rotate(360deg); } } .agent-spinner { width: 15px; height: 15px; border: 2px solid currentColor; border-right-color: transparent; border-radius: 50%; display: inline-block; animation: agent-spin .7s linear infinite; }`}</style>
      <aside className="dashboard-sidebar">
        <Link to="/" className="dashboard-brand">
          <span className="brand-mark">SCS</span>
          <span><strong>SCS AI HUB</strong><small>OWNER PORTAL</small></span>
        </Link>
        <p className="sidebar-heading">WORKSPACE</p>
        <nav className="dashboard-nav">
          {dashboardLinks.map(({ label, path, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={path === '/dashboard/lead-agent' ? 'dashboard-nav-link active' : 'dashboard-nav-link'}
            >
              <Icon size={19} /><span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <Link to="/dashboard/settings" className="dashboard-nav-link"><Settings size={19} /><span>Settings</span></Link>
          <Link to="/" className="dashboard-nav-link"><LogOut size={19} /><span>Back to Website</span></Link>
          <div className="owner-profile"><div className="owner-avatar">O</div><div><strong>Owner Account</strong><small>Authenticated session</small></div></div>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <div><span className="topbar-label">SCS AI HUB / AGENTS</span><strong>Autonomous Lead Generation</strong></div>
          <Link to="/dashboard" className="topbar-home">Dashboard <ArrowRight size={16} /></Link>
        </header>

        <section className="dashboard-content">
          <div className="dashboard-welcome">
            <div>
              <p className="eyebrow">DISCOVER NEW BUSINESS OPPORTUNITIES</p>
              <h1>Lead Generation Agent</h1>
              <p>Find manufacturing, food, healthcare, CA and education businesses that may be interested in ISO certification, and save leads to MySQL.</p>
            </div>
            <div className="dashboard-date">OWNER WORKSPACE</div>
          </div>

          <div className="demo-notice">
            <Bot size={19} />
            <span><strong>Review before outreach.</strong> Search results and public contact details may be incomplete or inaccurate. Verify each lead before contacting.</span>
          </div>

          <section style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', marginBottom: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
              <div style={{ background: '#edf4ff', color: '#2459a9', padding: '12px', borderRadius: '12px' }}><Search size={24} /></div>
              <div><h2 style={{ margin: 0 }}>Configure your search</h2><p style={{ margin: '5px 0 0', color: '#667085' }}>Choose a target business category and how many new leads to search for.</p></div>
            </div>

            <form onSubmit={handleRunAgent}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
                <label style={{ display: 'block', fontWeight: 600 }}>
                  Industry
                  <select value={industry} onChange={(event) => setIndustry(event.target.value)} style={fieldStyle} disabled={loading}>
                    <option value="all">All Target Categories</option>
                    <option value="manufacturing">Manufacturing Industries</option>
                    <option value="food">Food Processing &amp; Food Businesses</option>
                    <option value="healthcare">Doctors, Clinics &amp; Hospitals</option>
                    <option value="ca">CA &amp; Accounting Firms</option>
                    <option value="education">Schools, Teachers &amp; Coaching Classes</option>
                  </select>
                </label>

                <label style={{ display: 'block', fontWeight: 600 }}>
                  Target number of leads
                  <select value={targetCount} onChange={(event) => setTargetCount(event.target.value)} style={fieldStyle} disabled={loading}>
                    {[3, 5, 10, 15, 20, 30, 50, 100].map((count) => (
                      <option key={count} value={String(count)}>{count} leads</option>
                    ))}
                  </select>
                </label>
              </div>

              <button className="button" type="submit" disabled={loading} style={{ marginTop: '20px', display: 'inline-flex', alignItems: 'center', gap: '9px', opacity: loading ? 0.7 : 1 }}>
                {loading ? <><span className="agent-spinner" aria-hidden="true" /> Searching and saving...</> : <><Sparkles size={18} /> Run Lead Generation</>}
              </button>
            </form>
          </section>

          {error && (
            <div role="alert" style={{ padding: '14px 16px', borderRadius: '12px', border: '1px solid #fecaca', background: '#fef2f2', color: '#991b1b', marginBottom: '20px' }}>
              <strong>Could not complete the search</strong><p style={{ margin: '5px 0 0' }}>{error}</p>
            </div>
          )}

          {result && (
            <section aria-live="polite" style={{ marginBottom: '22px' }}>
              <div style={{ padding: '16px 18px', borderRadius: '12px', border: '1px solid #bbf7d0', background: '#f0fdf4', color: '#166534', marginBottom: '16px' }}>
                <strong><ClipboardCheck size={18} style={{ verticalAlign: 'middle', marginRight: '8px' }} />Lead search completed</strong>
                <p style={{ margin: '6px 0 0' }}>{result.message}</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px' }}>
                <div style={statStyle}><span style={{ color: '#667085', fontSize: '14px' }}>Search results</span><h2 style={{ margin: '8px 0 0', fontSize: '30px' }}>{result.found ?? 0}</h2></div>
                <div style={statStyle}><span style={{ color: '#667085', fontSize: '14px' }}>New leads saved</span><h2 style={{ margin: '8px 0 0', fontSize: '30px', color: '#15803d' }}>{result.saved ?? 0}</h2></div>
                <div style={statStyle}><span style={{ color: '#667085', fontSize: '14px' }}>Skipped / duplicates</span><h2 style={{ margin: '8px 0 0', fontSize: '30px' }}>{result.skipped ?? 0}</h2></div>
                <div style={statStyle}><span style={{ color: '#667085', fontSize: '14px' }}>Requested target</span><h2 style={{ margin: '8px 0 0', fontSize: '30px' }}>{result.target_count ?? targetCount}</h2></div>
              </div>

              <div style={{ marginTop: '18px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Link className="button" to="/dashboard/leads">Review Leads <ArrowRight size={16} /></Link>
                <Link className="button secondary" to="/dashboard/crm">Open CRM <Users size={16} /></Link>
              </div>
            </section>
          )}

          <section style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px' }}>
            <h3 style={{ marginTop: 0 }}>How this agent works</h3>
            <ol style={{ marginBottom: 0, paddingLeft: '22px', color: '#475467', lineHeight: 1.8 }}>
              <li>Searches Google for manufacturing, food, healthcare, CA and education businesses using the configured SerpAPI integration.</li>
              <li>Checks publicly accessible company websites for contact details.</li>
              <li>Skips matching lead names and email addresses already in your database.</li>
              <li>Saves new records to MySQL with search notes. ISO requirements and contact details must be verified before outreach.</li>
            </ol>
          </section>
        </section>
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

  <Route
    path="/dashboard"
    element={
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    }
  />

  <Route
    path="/dashboard/sales"
    element={
      <ProtectedRoute>
        <DashboardModule title="Sales Agent" />
      </ProtectedRoute>
    }
  />

  <Route
    path="/dashboard/marketing"
    element={
      <ProtectedRoute>
        <DashboardModule title="Marketing Agent" />
      </ProtectedRoute>
    }
  />

  <Route
    path="/dashboard/leads"
    element={
      <ProtectedRoute>
        <LeadManagement />
      </ProtectedRoute>
    }
  />

  <Route
    path="/dashboard/lead-agent"
    element={
      <ProtectedRoute>
        <LeadGenerationAgent />
      </ProtectedRoute>
    }
  />

  <Route
    path="/dashboard/crm"
    element={
      <ProtectedRoute>
        <CRM />
      </ProtectedRoute>
    }
  />

  <Route
    path="/dashboard/analytics"
    element={
      <ProtectedRoute>
        <DashboardModule title="Analytics" />
      </ProtectedRoute>
    }
  />

  <Route
    path="/dashboard/knowledge"
    element={
      <ProtectedRoute>
        <DashboardModule title="Knowledge Base" />
      </ProtectedRoute>
    }
  />

  <Route
    path="/dashboard/settings"
    element={
      <ProtectedRoute>
        <DashboardModule title="Settings" />
      </ProtectedRoute>
    }
  />

  <Route path="*" element={<NotFound />} />
</Routes>

    </BrowserRouter>
  );
}
