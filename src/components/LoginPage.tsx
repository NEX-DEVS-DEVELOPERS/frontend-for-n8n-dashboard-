
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { N8nLogo, UserIcon, KeyIcon, WorkflowIcon, CpuChipIcon, CodeJsonIcon, ServerIcon, ChartPieIcon, QuestionMarkCircleIcon, MailIcon, LinkedInIcon, GitHubIcon, HamburgerIcon, XIcon, WrenchScrewdriverIcon, ChatBubbleIcon, ArrowsPointingOutIcon, ShieldCheckIcon, BookOpenIcon } from './icons';
import { Button, Input, Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui';
import gsap from 'gsap';
import ConfigurationInfoModal from './ConfigurationInfoModal';
import ContactFormModal from './ContactFormModal';
import TermsModal from './TermsModal';
import SecurityModal from './SecurityModal';
import ThemeToggle from './ThemeToggle';
import ParticleBackground from './ParticleBackground';
import { authApi } from '../services/api';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

const FloatingElement: React.FC<{
  children: React.ReactNode;
  className: string;
  borderColor: string;
  style: React.CSSProperties;
}> = ({ children, className, borderColor, style }) => {
  return (
    <div
      style={style}
      className={`floating-element absolute bg-card/70 backdrop-blur-md border-2 rounded-3xl flex items-center justify-center shadow-2xl ${className} ${borderColor}`}
    >
      {children}
    </div>
  );
};

const floatingElementsConfig = [
  { id: 1, icon: N8nLogo, size: 'w-16 h-16 md:w-24 md:h-24', iconSize: 'h-8 w-8 md:h-12 md:h-12', borderColor: 'border-primary/40' },
  { id: 2, icon: WorkflowIcon, size: 'w-14 h-14 md:w-20 md:h-20', iconSize: 'h-7 w-7 md:h-10 md:h-10', borderColor: 'border-purple-500/40' },
  { id: 3, icon: CpuChipIcon, size: 'w-12 h-12 md:w-16 md:h-16', iconSize: 'h-6 w-6 md:h-8 md:h-8', borderColor: 'border-blue-500/40' },
  { id: 4, icon: CodeJsonIcon, size: 'w-20 h-20 md:w-28 md:h-28', iconSize: 'h-10 w-10 md:h-14 md:h-14', borderColor: 'border-green-500/40' },
  { id: 5, icon: ServerIcon, size: 'w-10 h-10 md:w-12 md:h-12', iconSize: 'h-5 w-5 md:h-6 md:h-6', borderColor: 'border-yellow-500/40' },
  { id: 6, icon: ChartPieIcon, size: 'w-12 h-12 md:w-16 md:h-16', iconSize: 'h-6 w-6 md:h-8 md:h-8', borderColor: 'border-red-500/40' },
  { id: 7, icon: N8nLogo, size: 'w-14 h-14 md:w-20 md:h-20', iconSize: 'h-7 w-7 md:h-10 md:h-10', borderColor: 'border-pink-500/40' },
  { id: 8, icon: WrenchScrewdriverIcon, size: 'w-12 h-12 md:w-16 md:h-16', iconSize: 'h-6 w-6 md:h-8 md:h-8', borderColor: 'border-orange-500/40' },
  { id: 9, icon: ChatBubbleIcon, size: 'w-16 h-16 md:w-24 md:h-24', iconSize: 'h-8 w-8 md:h-12 md:h-12', borderColor: 'border-teal-400/40' },
  { id: 10, icon: ArrowsPointingOutIcon, size: 'w-10 h-10 md:w-14 md:h-14', iconSize: 'h-5 w-5 md:h-7 md:h-7', borderColor: 'border-indigo-500/40' }
];

interface MobileNavMenuProps {
  onClose: () => void;
  onShowConfigModal: () => void;
  onShowContactModal: () => void;
}

const MobileNavMenu: React.FC<MobileNavMenuProps> = ({ onClose, onShowConfigModal, onShowContactModal }) => {
  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    if (!panelRef.current || !backdropRef.current) return;
    const tl = gsap.timeline({ onComplete: onClose });
    tl.to(panelRef.current, { autoAlpha: 0, scale: 0.95, duration: 0.3, ease: 'expo.in' })
      .to(backdropRef.current, { autoAlpha: 0, duration: 0.3 }, "<");
  }, [onClose]);

  useEffect(() => {
    if (!panelRef.current || !backdropRef.current) return;
    gsap.to(backdropRef.current, { autoAlpha: 1, duration: 0.4 });
    gsap.fromTo(
      panelRef.current,
      { autoAlpha: 0, scale: 0.95 },
      { autoAlpha: 1, scale: 1, duration: 0.4, ease: 'expo.out', transformOrigin: 'top right' }
    );
  }, []);

  const handleConfigClick = () => { handleClose(); setTimeout(onShowConfigModal, 300); };
  const handleContactClick = () => { handleClose(); setTimeout(onShowContactModal, 300); };

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div ref={backdropRef} className="absolute inset-0 bg-black/60" onClick={handleClose}></div>
      <div
        ref={panelRef}
        className="absolute top-20 right-4 w-full max-w-[250px] bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl p-4 flex flex-col gap-2"
        style={{ transformOrigin: 'top right' }}
      >
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-muted transition-colors"
          aria-label="Close menu"
        >
          <XIcon className="h-5 w-5 text-muted-foreground" />
        </button>

        <nav className="flex flex-col items-start w-full">
          <button onClick={handleConfigClick} className="w-full text-left p-3 text-base font-medium text-foreground hover:bg-muted/10 rounded-lg transition-colors">
            Info
          </button>
          <button onClick={handleContactClick} className="w-full text-left p-3 text-base font-medium text-foreground hover:bg-muted/10 rounded-lg transition-colors">
            Contact
          </button>
        </nav>

        <div className="border-b border-border/80 my-2"></div>

        <div className="flex items-center justify-center gap-4 px-2 pt-1">
          <ThemeToggle />
          <a href="https://github.com/nex-devs" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full hover:bg-muted/10 transition-colors group" title="GitHub">
            <GitHubIcon className="h-6 w-6 text-muted-foreground group-hover:text-foreground transition-colors" />
          </a>
          <a href="https://www.linkedin.com/company/nex-devs" target="_blank" rel="noopener noreferrer" className="p-2 rounded-full hover:bg-muted/10 transition-colors group" title="LinkedIn">
            <LinkedInIcon className="h-6 w-6 text-muted-foreground group-hover:text-foreground transition-colors" />
          </a>
        </div>
      </div>
    </div>
  );
};


const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Modal States
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [randomizedElements, setRandomizedElements] = useState<any[]>([]);
  const loginCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const generateSafePositions = () => {
      const positions: React.CSSProperties[] = [];
      const numIcons = floatingElementsConfig.length;
      const iconsOnLeft = Math.ceil(numIcons / 2);
      const iconsOnRight = numIcons - iconsOnLeft;

      const verticalStepLeft = 100 / (iconsOnLeft + 1);
      const verticalStepRight = 100 / (iconsOnRight + 1);

      for (let i = 0; i < iconsOnLeft; i++) {
        positions.push({
          top: `${verticalStepLeft * (i + 1) + gsap.utils.random(-5, 5)}vh`,
          left: `${gsap.utils.random(5, 25)}vw`,
          transform: 'translate(-50%, -50%)'
        });
      }

      for (let i = 0; i < iconsOnRight; i++) {
        positions.push({
          top: `${verticalStepRight * (i + 1) + gsap.utils.random(-5, 5)}vh`,
          left: `${gsap.utils.random(75, 95)}vw`,
          transform: 'translate(-50%, -50%)'
        });
      }

      return gsap.utils.shuffle(positions);
    };

    const assignedPositions = generateSafePositions();
    const newElements = floatingElementsConfig.map((el, index) => ({
      ...el,
      style: assignedPositions[index],
    }));
    setRandomizedElements(newElements);
  }, []);

  useEffect(() => {
    if (randomizedElements.length === 0) return;

    const loginCard = loginCardRef.current;
    const headerNavElements = gsap.utils.toArray('.header-nav-animation');
    const sidebarElements = gsap.utils.toArray('.sidebar-animation'); // New L-shape sidebar
    const floatingElements = gsap.utils.toArray('.floating-element');

    gsap.set(loginCard, { autoAlpha: 0, y: 30, scale: 0.95 });
    gsap.set(headerNavElements, { autoAlpha: 0, y: -20 });
    gsap.set(sidebarElements, { autoAlpha: 0, x: -20 }); // Slide in from left

    // Changed starting scale to 0 for "pop" effect
    gsap.set(floatingElements, { autoAlpha: 0, scale: 0 });

    const tl = gsap.timeline({ defaults: { ease: 'expo.out', force3D: true } });

    // Modified animation to use elastic ease for "bubble pop"
    // Delayed start, slower duration, softer elasticity
    tl.to(floatingElements, {
      autoAlpha: 1,
      scale: 1,
      duration: 2.2, // Much slower and smoother
      stagger: {
        amount: 1.2, // Spread the animation out more
        from: "random"
      },
      delay: 0.2, // Slight delay before starting
      ease: "elastic.out(1, 0.8)" // Softer pop effect
    }, 0)
      .to(headerNavElements, { autoAlpha: 1, y: 0, duration: 0.8 }, 0.3)
      .to(sidebarElements, { autoAlpha: 1, x: 0, duration: 0.8, stagger: 0.1 }, 0.4)
      .to(loginCard, { autoAlpha: 1, y: 0, scale: 1, duration: 1 }, 0.5);

    floatingElements.forEach((el: any) => {
      gsap.to(el, { x: gsap.utils.random(-20, 20, 5), rotation: gsap.utils.random(-15, 15, 5), duration: gsap.utils.random(20, 30), ease: 'sine.inOut', repeat: -1, yoyo: true });
      gsap.to(el, { y: gsap.utils.random(-30, 30, 8), duration: gsap.utils.random(3, 6), ease: 'sine.inOut', repeat: -1, yoyo: true });
    });

  }, [randomizedElements]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await authApi.login({ username, password });

      if (response.success && response.data) {
        // Token is automatically stored by authApi.login()
        // Store user data in localStorage for session management
        localStorage.setItem('user_data', JSON.stringify(response.data.user));
        localStorage.setItem('token_expires_at', response.data.expiresAt);

        onLoginSuccess();
      } else {
        setError(response.error || 'Invalid username or password.');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Unable to connect to server. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-transparent p-4 relative overflow-hidden">
      {/* Enhanced Particle Background Layer */}
      <ParticleBackground />

      {showConfigModal && <ConfigurationInfoModal onClose={() => setShowConfigModal(false)} />}
      {showContactModal && <ContactFormModal onClose={() => setShowContactModal(false)} />}
      {showTermsModal && <TermsModal onClose={() => setShowTermsModal(false)} />}
      {showSecurityModal && <SecurityModal onClose={() => setShowSecurityModal(false)} />}

      {isMobileMenuOpen && <MobileNavMenu
        onClose={() => setIsMobileMenuOpen(false)}
        onShowConfigModal={() => setShowConfigModal(true)}
        onShowContactModal={() => setShowContactModal(true)}
      />}

      {/* Mobile Hamburger */}
      <div className="header-nav-animation fixed top-4 right-4 z-20 md:hidden">
        <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)} className="h-12 w-12 rounded-full bg-card/50 backdrop-blur-md border border-border/20">
          <HamburgerIcon className="h-6 w-6 text-foreground" />
        </Button>
      </div>

      {/* Top Right Navigation */}
      <div className="header-nav-animation fixed top-4 right-4 z-20 hidden md:flex flex-col gap-2 p-1.5 bg-card/80 backdrop-blur-md border-2 border-border/40 rounded-full shadow-xl">
        <div className="flex justify-center">
          <ThemeToggle />
        </div>
        <button onClick={() => setShowConfigModal(true)} className="h-10 w-10 flex items-center justify-center hover:bg-primary/10 rounded-full transition-colors group" title="Configuration Info">
          <QuestionMarkCircleIcon className="h-5 w-5 text-foreground/80 group-hover:text-primary transition-colors" />
        </button>
        <a href="https://www.linkedin.com/company/nex-devs" target="_blank" rel="noopener noreferrer" className="h-10 w-10 flex items-center justify-center hover:bg-blue-500/10 rounded-full transition-colors group" title="LinkedIn">
          <LinkedInIcon className="h-5 w-5 text-foreground/80 group-hover:text-blue-500 transition-colors" />
        </a>
        <a href="https://github.com/nex-devs" target="_blank" rel="noopener noreferrer" className="h-10 w-10 flex items-center justify-center hover:bg-foreground/10 rounded-full transition-colors group" title="GitHub">
          <GitHubIcon className="h-5 w-5 text-foreground/80 group-hover:text-foreground transition-colors" />
        </a>
        <button onClick={() => setShowContactModal(true)} className="h-10 w-10 flex items-center justify-center hover:bg-green-500/10 rounded-full transition-colors group" title="Contact Us">
          <MailIcon className="h-5 w-5 text-foreground/80 group-hover:text-green-500 transition-colors" />
        </button>
      </div>

      {/* Unified Bottom Left Sidebar Capsule */}
      <div className="fixed bottom-6 left-6 z-30 hidden md:flex flex-col gap-1 p-1.5 bg-card/80 backdrop-blur-md border-2 border-border/40 rounded-[1.5rem] shadow-2xl sidebar-animation hover:border-border/60 transition-colors">
        {/* Terms */}
        <button onClick={() => setShowTermsModal(true)} className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-primary/5 transition-all group w-full text-left">
          <BookOpenIcon className="h-4 w-4 text-foreground/80 group-hover:text-primary transition-colors" />
          <span className="text-xs font-medium text-foreground/80 group-hover:text-foreground">Terms & Policy</span>
        </button>

        {/* Security */}
        <button onClick={() => setShowSecurityModal(true)} className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-green-500/5 transition-all group w-full text-left">
          <ShieldCheckIcon className="h-4 w-4 text-foreground/80 group-hover:text-green-500 transition-colors" />
          <span className="text-xs font-medium text-foreground/80 group-hover:text-foreground">Security Protocol</span>
        </button>

        {/* Divider */}
        <div className="w-full h-px bg-border/30 my-0.5"></div>

        {/* Status */}
        <div className="flex items-center justify-between gap-4 px-3 py-1.5">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
            </span>
            <span className="text-[10px] font-bold text-foreground/90 tracking-wider uppercase">System Operational</span>
          </div>
          <span className="text-[9px] text-foreground/50 font-mono">v2.4.1</span>
        </div>
      </div>

      {/* Floating Elements */}
      {randomizedElements.map(el => (
        <FloatingElement key={el.id} className={el.size} borderColor={el.borderColor} style={el.style}>
          <el.icon className={`${el.iconSize} text-foreground/70`} />
        </FloatingElement>
      ))}

      <Card ref={loginCardRef} className="w-full max-w-sm z-10 bg-card/95 backdrop-blur-xl border border-primary/40 shadow-[0_0_30px_-5px_rgba(72,168,163,0.4)]">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto bg-primary/10 border border-primary/30 h-14 w-14 rounded-xl flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(72,168,163,0.2)]">
            <N8nLogo className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl tracking-wide text-foreground">Dashboard Login</CardTitle>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-5">
            <div className="relative group">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors z-10" />
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                required
                // Uses bg-muted/30 for light mode (clean light grey) and dark:bg-black/30 for dark mode (darker contrast).
                className="pl-10 h-10 text-sm bg-muted/30 dark:bg-black/30 border-border/60 hover:bg-muted/50 dark:hover:bg-black/50 focus:bg-muted/50 dark:focus:bg-black/50 transition-all"
                aria-label="Username"
              />
            </div>
            <div className="relative group">
              <KeyIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors z-10" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                // Uses bg-muted/30 for light mode and dark:bg-black/30 for dark mode.
                className="pl-10 h-10 text-sm bg-muted/30 dark:bg-black/30 border-border/60 hover:bg-muted/50 dark:hover:bg-black/50 focus:bg-muted/50 dark:focus:bg-black/50 transition-all"
                aria-label="Password"
              />
            </div>
            {error && <p className="text-sm font-medium text-red-500 text-center bg-red-500/10 py-1.5 rounded-lg border border-red-500/20">{error}</p>}
          </CardContent>
          <CardFooter className="flex-col pt-1 pb-6">
            <Button type="submit" size="lg" className="w-full h-10 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Access Dashboard'}
            </Button>
            <p className="text-xs text-muted-foreground text-center w-full pt-4">
              Built by <a href="https://nex-devs.com" target="_blank" rel="noopener noreferrer" className="font-bold text-foreground hover:text-primary transition-colors">NEX-DEVS</a>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default LoginPage;
