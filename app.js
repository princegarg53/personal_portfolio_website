// Professional Portfolio JavaScript with 3D Animations and Modern Features

class PortfolioApp {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.particles = [];
        this.geometryObjects = [];
        this.isLoaded = false;
        this.currentSection = 'home';
        this.resizeObserver = null; // For debounced resize

        this.init();
    }

    async init() {
        try {
            // Initialize core components
            this.initTheme();
            this.initNavigation();
            this.init3DScene();
            this.initScrollAnimations();
            this.initContactForm();
            this.initSkillAnimations();
            this.initServiceWorker();
            this.initBackToTop();
            this.initLazyLoading();
            this.initKeyboardEnhancements();
            this.initEducationFlipCards();
            this.initProjectCardClicks();

            // Wait for everything to load
            await this.waitForLoad();
            this.hideLoadingScreen();

            // Start render loop if 3D scene is initialized
            if (this.renderer) {
                this.animate();
            }
        } catch (error) {
            console.error('Portfolio initialization error:', error);
            this.hideLoadingScreen(); // Ensure loading screen hides even on error
        }
    }

    // Theme Management
    initTheme() {
        const themeToggle = document.getElementById('theme-toggle');
        if (!themeToggle) return;

        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const savedTheme = localStorage.getItem('theme');

        // Set initial theme
        const isDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
        document.documentElement.classList.toggle('dark', isDark);

        themeToggle.addEventListener('click', () => {
            const isDarkMode = document.documentElement.classList.toggle('dark');
            localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');

            // Animate theme transition
            document.body.style.transition = 'background-color 0.5s ease, color 0.5s ease';
            setTimeout(() => {
                document.body.style.transition = '';
            }, 500);

            // Update 3D particles colors if scene exists
            if (this.particles.length > 0) {
                this.updateParticleColors(isDarkMode);
            }
        });

        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                document.documentElement.classList.toggle('dark', e.matches);
            }
        });
    }

    // Navigation System
    initNavigation() {
        const navbar = document.getElementById('navbar');
        const navLinks = document.querySelectorAll('.nav-link');
        const hamburger = document.getElementById('nav-hamburger');
        const navMenu = document.getElementById('nav-menu');
        if (!navbar || !hamburger || !navMenu) return;

        // Smooth scrolling for navigation links
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                this.scrollToSection(targetId);

                // Update active link
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');

                // Close mobile menu
                navMenu.classList.remove('active');
                hamburger.setAttribute('aria-expanded', 'false');
            });
        });

        // Mobile menu toggle
        hamburger.addEventListener('click', () => {
            const isExpanded = navMenu.classList.toggle('active');
            hamburger.setAttribute('aria-expanded', isExpanded.toString());
        });

        // Close mobile menu on outside click
        document.addEventListener('click', (e) => {
            if (!navMenu.contains(e.target) && !hamburger.contains(e.target)) {
                navMenu.classList.remove('active');
                hamburger.setAttribute('aria-expanded', 'false');
            }
        });

        // Navbar scroll effect with throttle
        let lastScrollY = window.scrollY;
        const handleScroll = this.throttle(() => {
            const currentScrollY = window.scrollY;

            navbar.classList.toggle('scrolled', currentScrollY > 100);

            // Hide navbar on scroll down, show on scroll up
            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                navbar.style.transform = 'translateY(-100%)';
            } else {
                navbar.style.transform = 'translateY(0)';
            }

            lastScrollY = currentScrollY;
            this.updateActiveNavLink();
        }, 100);

        window.addEventListener('scroll', handleScroll);
    }

    // 3D Scene Initialization with WebGL check
    init3DScene() {
        const canvas = document.getElementById('hero-canvas');
        const container = canvas?.parentElement;
        if (!canvas || !container) return;

        // Check WebGL support
        if (!this.isWebGLSupported()) {
            console.warn('WebGL not supported, disabling 3D scene');
            canvas.style.display = 'none';
            return;
        }

        // Scene setup
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, container.offsetWidth / container.offsetHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });

        this.renderer.setSize(container.offsetWidth, container.offsetHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x000000, 0);

        // Camera position
        this.camera.position.z = 5;

        // Create particle system
        this.createParticleSystem();

        // Create geometric objects
        this.createGeometricObjects();

        // Add lights
        this.addLights();

        // Handle resize with debounce
        this.resizeObserver = this.debounce(() => this.handleResize(), 200);
        window.addEventListener('resize', this.resizeObserver);

        // Mouse interaction
        this.initMouseInteraction();
    }

    isWebGLSupported() {
        try {
            const canvas = document.createElement('canvas');
            return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
        } catch (e) {
            return false;
        }
    }

    createParticleSystem() {
        const particleCount = 1000;
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount * 3; i += 3) {
            // Positions
            positions[i] = (Math.random() - 0.5) * 20;
            positions[i + 1] = (Math.random() - 0.5) * 20;
            positions[i + 2] = (Math.random() - 0.5) * 20;

            // Colors (initial based on theme)
            this.setParticleColor(colors, i, document.documentElement.classList.contains('dark'));
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 2,
            vertexColors: true,
            transparent: true,
            opacity: 0.6,
            sizeAttenuation: true
        });

        const particles = new THREE.Points(geometry, material);
        this.scene.add(particles);
        this.particles.push(particles);
    }

    setParticleColor(colors, i, isDark) {
        if (isDark) {
            colors[i] = 0.0; colors[i + 1] = 0.66; colors[i + 2] = 0.59; // Teal
        } else {
            colors[i] = 0.04; colors[i + 1] = 0.15; colors[i + 2] = 0.25; // Dark blue
        }
    }

    updateParticleColors(isDark) {
        this.particles.forEach(particle => {
            const colors = particle.geometry.attributes.color.array;
            for (let i = 0; i < colors.length; i += 3) {
                this.setParticleColor(colors, i, isDark);
            }
            particle.geometry.attributes.color.needsUpdate = true;
        });
    }

    createGeometricObjects() {
        const geometries = [
            new THREE.IcosahedronGeometry(0.8, 1),
            new THREE.OctahedronGeometry(0.6),
            new THREE.TetrahedronGeometry(0.7),
            new THREE.DodecahedronGeometry(0.5)
        ];

        geometries.forEach((geometry, index) => {
            const material = new THREE.MeshPhongMaterial({
                color: index % 2 === 0 ? 0x00A896 : 0x0A2540,
                transparent: true,
                opacity: 0.8,
                wireframe: Math.random() > 0.5
            });

            const mesh = new THREE.Mesh(geometry, material);

            // Random positioning
            mesh.position.x = (Math.random() - 0.5) * 10;
            mesh.position.y = (Math.random() - 0.5) * 6;
            mesh.position.z = (Math.random() - 0.5) * 8;

            // Random rotation
            mesh.rotation.x = Math.random() * Math.PI;
            mesh.rotation.y = Math.random() * Math.PI;
            mesh.rotation.z = Math.random() * Math.PI;

            this.scene.add(mesh);
            this.geometryObjects.push({
                mesh,
                rotationSpeed: {
                    x: (Math.random() - 0.5) * 0.02,
                    y: (Math.random() - 0.5) * 0.02,
                    z: (Math.random() - 0.5) * 0.02
                },
                originalPosition: { ...mesh.position }
            });
        });
    }

    addLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 5, 5);
        this.scene.add(directionalLight);

        const pointLight = new THREE.PointLight(0x00A896, 1, 100);
        pointLight.position.set(-10, -10, -10);
        this.scene.add(pointLight);
    }

    initMouseInteraction() {
        let mouseX = 0, mouseY = 0;
        const windowHalfX = window.innerWidth / 2;
        const windowHalfY = window.innerHeight / 2;

        const handleMouseMove = (event) => {
            mouseX = (event.clientX - windowHalfX) / windowHalfX;
            mouseY = (event.clientY - windowHalfY) / windowHalfY;
        };

        document.addEventListener('mousemove', handleMouseMove);

        // Update camera position based on mouse movement
        const updateCamera = () => {
            if (this.camera) {
                this.camera.position.x += (mouseX * 0.5 - this.camera.position.x) * 0.05;
                this.camera.position.y += (-mouseY * 0.5 - this.camera.position.y) * 0.05;
                this.camera.lookAt(this.scene.position);
            }
            requestAnimationFrame(updateCamera);
        };
        updateCamera();
    }

    // GSAP Scroll Animations
    initScrollAnimations() {
        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
            console.warn('GSAP or ScrollTrigger not loaded, skipping scroll animations');
            return;
        }

        gsap.registerPlugin(ScrollTrigger);

        // Hero section animations
        const heroTimeline = gsap.timeline();
        heroTimeline
            .from('.hero-greeting', { opacity: 0, y: 50, duration: 1 })
            .from('.hero-name', { opacity: 0, y: 50, duration: 1 }, '-=0.5')
            .from('.hero-subtitle', { opacity: 0, y: 50, duration: 1 }, '-=0.5')
            .from('.hero-description', { opacity: 0, y: 30, duration: 0.8 }, '-=0.3')
            .from('.hero-actions', { opacity: 0, y: 30, duration: 0.8 }, '-=0.3');

        // Section title animations
        gsap.utils.toArray('.section-title').forEach(title => {
            gsap.fromTo(title,
                { opacity: 0, y: 50 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 1,
                    scrollTrigger: {
                        trigger: title,
                        start: 'top 80%',
                        end: 'bottom 20%',
                        toggleActions: 'play none none reverse'
                    }
                }
            );
        });

        // Cards animation
        gsap.utils.toArray('.glass-card').forEach(card => {
            gsap.fromTo(card,
                { opacity: 0, y: 50, scale: 0.9 },
                {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    duration: 0.8,
                    scrollTrigger: {
                        trigger: card,
                        start: 'top 85%',
                        toggleActions: 'play none none reverse'
                    }
                }
            );
        });

        // Timeline items animation
        gsap.utils.toArray('.timeline-item').forEach((item, index) => {
            gsap.fromTo(item,
                { opacity: 0, x: index % 2 === 0 ? -100 : 100 },
                {
                    opacity: 1,
                    x: 0,
                    duration: 1,
                    scrollTrigger: {
                        trigger: item,
                        start: 'top 80%',
                        toggleActions: 'play none none reverse'
                    }
                }
            );
        });

        // Parallax effect for hero
        gsap.to('.hero-canvas', {
            yPercent: -50,
            ease: 'none',
            scrollTrigger: {
                trigger: '.hero-section',
                start: 'top bottom',
                end: 'bottom top',
                scrub: true
            }
        });
    }

    // Contact Form with Local Excel Export
    initContactForm() {
        const form = document.getElementById('contact-form');
        const submitBtn = document.getElementById('submit-btn');
        const btnText = submitBtn?.querySelector('.btn-text');
        const btnLoader = submitBtn?.querySelector('.btn-loader');
        const formMessage = document.getElementById('form-message');
        if (!form || !submitBtn) return;

        

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!this.validateForm(form)) {
                this.showFormMessage('Please fill all fields correctly.', 'error');
                return;
            }

            const formData = new FormData(form);

            // Show loading spinner
            btnText.style.display = 'none';
            btnLoader.style.display = 'block';
            submitBtn.disabled = true;

            try {
                const response = await fetch("https://formspree.io/f/xzzakydd", {
                    method: "POST",
                    body: formData,
                    headers: { 'Accept': 'application/json' }
                });

                if (response.ok) {
                    this.showFormMessage('✅ Thank you! Your message has been sent successfully.', 'success');
                    form.reset();
                    this.createConfettiEffect();
                } else {
                    this.showFormMessage('❌ Oops! Something went wrong. Please try again.', 'error');
                }
            } catch (error) {
                console.error('Formspree submission error:', error);
                this.showFormMessage('❌ Network error. Please check your connection.', 'error');
            } finally {
                btnText.style.display = 'block';
                btnLoader.style.display = 'none';
                submitBtn.disabled = false;
            }
        });

        // Real-time validation
        const inputs = form.querySelectorAll('.form-control');
        inputs.forEach(input => {
            input.addEventListener('input', () => this.validateInput(input));
            input.addEventListener('blur', () => this.validateInput(input));
        });
    }

    
    validateForm(form) {
        const inputs = form.querySelectorAll('.form-control[required]');
        return Array.from(inputs).every(input => this.validateInput(input));
    }

    validateInput(input) {
        const value = input.value.trim();
        let isValid = true;

        switch (input.type) {
            case 'email':
                isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
                break;
            case 'text':
                isValid = value.length >= 2;
                break;
            default:
                isValid = value.length > 0;
        }

        input.style.borderColor = isValid ? 'var(--color-accent)' : '#ff4757';
        return isValid;
    }

    showFormMessage(message, type) {
        const formMessage = document.getElementById('form-message');
        if (!formMessage) return;

        formMessage.textContent = message;
        formMessage.className = `form-message ${type}`;

        // Animate message if GSAP is available
        if (typeof gsap !== 'undefined') {
            gsap.fromTo(formMessage,
                { opacity: 0, y: 10 },
                { opacity: 1, y: 0, duration: 0.5 }
            );

            // Hide after 5 seconds
            setTimeout(() => {
                gsap.to(formMessage, { opacity: 0, duration: 0.5 });
            }, 5000);
        }
    }

    createConfettiEffect() {
        const colors = ['#0A2540', '#00A896', '#F5F5F5'];
        const confettiContainer = document.createElement('div');
        confettiContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9999;
            overflow: hidden;
        `;

        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.style.cssText = `
                position: absolute;
                width: ${Math.random() * 10 + 5}px;
                height: ${Math.random() * 10 + 5}px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                left: ${Math.random() * 100}%;
                top: -10%;
                animation: confetti-fall ${2 + Math.random() * 3}s linear forwards;
                transform: rotate(${Math.random() * 360}deg);
            `;
            confettiContainer.appendChild(confetti);
        }

        document.body.appendChild(confettiContainer);

        // Remove after animation
        setTimeout(() => {
            confettiContainer.remove();
        }, 5000);

        // Add confetti CSS animation if not present
        if (!document.getElementById('confetti-styles')) {
            const style = document.createElement('style');
            style.id = 'confetti-styles';
            style.textContent = `
                @keyframes confetti-fall {
                    0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Skill Progress Animations
    initSkillAnimations() {
        const skillBars = document.querySelectorAll('.skill-progress');

        const animateSkills = this.throttle(() => {
            skillBars.forEach(bar => {
                const progress = bar.dataset.progress;
                const rect = bar.getBoundingClientRect();
                const isVisible = rect.top < window.innerHeight && rect.bottom > 0;

                if (isVisible && !bar.classList.contains('animated')) {
                    bar.classList.add('animated');

                    // Animate progress bar if GSAP is available
                    if (typeof gsap !== 'undefined') {
                        gsap.to(bar, {
                            width: `${progress}%`,
                            duration: 2,
                            ease: 'power2.out',
                            delay: Math.random() * 0.5
                        });
                    } else {
                        bar.style.width = `${progress}%`;
                    }

                    // Animate number counting
                    const percentageElement = bar.closest('.skill-item').querySelector('.skill-percentage');
                    if (percentageElement) {
                        this.animateValue(percentageElement, 0, parseInt(progress), 2000);
                    }
                }
            });
        }, 200);

        window.addEventListener('scroll', animateSkills);
        animateSkills(); // Initial call
    }

    animateValue(element, start, end, duration) {
        if (typeof gsap === 'undefined') {
            element.textContent = `${end}%`;
            return;
        }

        const obj = { value: start };
        gsap.to(obj, {
            value: end,
            duration: duration / 1000,
            ease: 'power2.out',
            onUpdate: () => {
                element.textContent = `${Math.round(obj.value)}%`;
            }
        });
    }

    // Service Worker for PWA
    async initServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                // Inline SW code for caching
                const swCode = `
                    const CACHE_NAME = 'prince-portfolio-v1';
                    const urlsToCache = [
                        '/',
                        '/index.html',
                        '/style.css',
                        '/app.js'
                    ];

                    self.addEventListener('install', (event) => {
                        event.waitUntil(
                            caches.open(CACHE_NAME)
                                .then((cache) => cache.addAll(urlsToCache))
                        );
                    });

                    self.addEventListener('fetch', (event) => {
                        event.respondWith(
                            caches.match(event.request)
                                .then((response) => response || fetch(event.request))
                        );
                    });

                    self.addEventListener('activate', (event) => {
                        event.waitUntil(
                            caches.keys().then((cacheNames) => {
                                return Promise.all(
                                    cacheNames.filter((name) => name !== CACHE_NAME)
                                        .map((name) => caches.delete(name))
                                );
                            })
                        );
                    });
                `;

                const blob = new Blob([swCode], { type: 'application/javascript' });
                const swUrl = URL.createObjectURL(blob);

                await navigator.serviceWorker.register(swUrl);
                console.log('Service Worker registered successfully');
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }
    }

    // Back to Top Button
    initBackToTop() {
        const backToTop = document.getElementById('back-to-top');
        if (!backToTop) return;

        const showBackToTop = this.throttle(() => {
            backToTop.style.display = window.scrollY > 500 ? 'block' : 'none';
        }, 200);

        window.addEventListener('scroll', showBackToTop);

        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Lazy Loading for Images
    initLazyLoading() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                        }
                        imageObserver.unobserve(img);
                    }
                });
            }, { rootMargin: '100px' });

            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        } else {
            // Fallback for no IntersectionObserver
            document.querySelectorAll('img[data-src]').forEach(img => {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
            });
        }
    }

    // Keyboard Enhancements
    initKeyboardEnhancements() {
        document.addEventListener('keydown', (e) => {
            // ESC key to close mobile menu
            if (e.key === 'Escape') {
                const navMenu = document.getElementById('nav-menu');
                const hamburger = document.getElementById('nav-hamburger');
                navMenu.classList.remove('active');
                hamburger.setAttribute('aria-expanded', 'false');
            }

            // Tab navigation enhancement
            if (e.key === 'Tab') {
                document.body.classList.add('using-keyboard');
            }
        });

        document.addEventListener('mousedown', () => {
            document.body.classList.remove('using-keyboard');
        });
    }

    // Education Flip Cards
    initEducationFlipCards() {
        const iitCard = document.getElementById('iit-card');
        const thaparCard = document.getElementById('thapar-card');

        if (iitCard) {
            iitCard.addEventListener('click', () => {
                iitCard.classList.toggle('flipped');
            });
        }

        if (thaparCard) {
            thaparCard.addEventListener('click', () => {
                thaparCard.classList.toggle('flipped');
            });
        }
    }

    // Project Card Clicks to Main GitHub
    initProjectCardClicks() {
        document.querySelectorAll('.project-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // Check if click is not on the link
                if (!e.target.closest('.project-link')) {
                    window.open('https://github.com/princegarg53', '_blank');
                }
            });
        });
    }

    // Resume Download Functionality with jsPDF
    initResumeDownload() {
        const resumeBtn = document.getElementById('resume-download');
        if (!resumeBtn || typeof window.jspdf === 'undefined') {
            console.warn('jsPDF not loaded, resume download fallback to text');
            return;
        }

        resumeBtn.addEventListener('click', (e) => {
            e.preventDefault();

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            doc.setFont("helvetica");
            doc.setFontSize(12);

            const resumeText = `
PRINCE GARG
Punjab | +91 9059031726 | princegarg5331@gmail.com | LinkedIn | GitHub | Kaggle

EDUCATION
Bachelor of Engineering (BE) in Computer Engineering
Expected July 2025
Thapar Institute of Engineering and Technology
Patiala, India
CGPA: 6.6

Minor in Artificial Intelligence
Expected October 2025
Indian Institute of Technology (IIT) Ropar
Rupnagar, India

Senior Secondary (Class XII), CBSE
April 2019 - April 2021
Ryan International School
Rupnagar, India

Secondary (Class X), CBSE
April 2018 - April 2019
Ryan International School
Rupnagar, India

EXPERIENCE
AI/ML Trainee
February 2024 - June 2024
Reagvis Pvt Ltd
Remote
- Created a 116,524-sample audio dataset from diverse industry-standard datasets and custom recordings, reducing overfitting by 15%
- Developed a deepfake detection system using YOLOv5, achieving 92.2% accuracy
- Implemented advanced computer vision algorithms for real-time detection
- Collaborated on production ML pipeline optimization

Data Science Intern
June 2023 - July 2023
Exposys Data Labs
Remote
- Built diabetes prediction model using Random Forest, achieving 97% accuracy
- Performed comprehensive data analysis and feature engineering
- Designed interactive dashboards for medical insights
            `;

            // Split text into lines and add to PDF
            const lines = doc.splitTextToSize(resumeText, 180);
            doc.text(lines, 10, 10);

            doc.save('Prince_Garg_Resume.pdf');

            this.showFormMessage('Resume downloaded successfully!', 'success');
        });
    }

    // Utility Functions
    scrollToSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (!section) return;

        const headerOffset = 80;
        const elementPosition = section.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }

    updateActiveNavLink() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link');

        let currentSection = '';
        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            if (rect.top <= 100 && rect.bottom >= 100) {
                currentSection = section.id;
            }
        });

        navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${currentSection}`);
        });
    }

    handleResize() {
        if (!this.camera || !this.renderer) return;

        const container = this.renderer.domElement.parentElement;
        const width = container.offsetWidth;
        const height = container.offsetHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);

        // Refresh GSAP ScrollTrigger to prevent jank after resize
        if (typeof ScrollTrigger !== 'undefined') {
            ScrollTrigger.refresh();
        }
    }

    async waitForLoad() {
        return new Promise(resolve => {
            if (document.readyState === 'complete') {
                resolve();
            } else {
                window.addEventListener('load', resolve);
            }
        });
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (!loadingScreen) return;

        if (typeof gsap !== 'undefined') {
            gsap.to(loadingScreen, {
                opacity: 0,
                duration: 0.5,
                onComplete: () => {
                    loadingScreen.style.display = 'none';
                }
            });
        } else {
            loadingScreen.style.display = 'none';
        }
    }

    // 3D Animation Loop
    animate() {
        requestAnimationFrame(() => this.animate());

        const time = Date.now() * 0.001;

        // Animate particles
        this.particles.forEach(particle => {
            particle.rotation.x += 0.001;
            particle.rotation.y += 0.002;
        });

        // Animate geometric objects
        this.geometryObjects.forEach((obj, index) => {
            obj.mesh.rotation.x += obj.rotationSpeed.x;
            obj.mesh.rotation.y += obj.rotationSpeed.y;
            obj.mesh.rotation.z += obj.rotationSpeed.z;

            // Floating animation
            obj.mesh.position.y = obj.originalPosition.y + Math.sin(time + index) * 0.3;
            obj.mesh.position.x = obj.originalPosition.x + Math.cos(time + index * 0.5) * 0.2;
        });

        this.renderer.render(this.scene, this.camera);
    }

    // Helper Utilities
    debounce(func, delay) {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func(...args), delay);
        };
    }

    throttle(func, limit) {
        let lastFunc;
        let lastRan;
        return function(...args) {
            if (!lastRan) {
                func(...args);
                lastRan = Date.now();
            } else {
                clearTimeout(lastFunc);
                lastFunc = setTimeout(() => {
                    if ((Date.now() - lastRan) >= limit) {
                        func(...args);
                        lastRan = Date.now();
                    }
                }, limit - (Date.now() - lastRan));
            }
        };
    }

    cleanup() {
        // Cleanup event listeners and resources on unload
        window.removeEventListener('resize', this.resizeObserver);
        if (this.renderer) {
            this.renderer.dispose();
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new PortfolioApp();
    window.portfolioApp = app; // Make it globally accessible for debugging
    app.initResumeDownload(); // Initialize resume download

    // Cleanup on unload
    window.addEventListener('beforeunload', () => app.cleanup());
});

// Global error handling
window.addEventListener('error', (e) => {
    console.error('Application error:', e.error);

    // Fallback for 3D scene errors
    if (e.error.message.includes('WebGL') && window.portfolioApp) {
        const canvas = document.getElementById('hero-canvas');
        if (canvas) {
            canvas.style.display = 'none';
            console.warn('WebGL not supported, hiding 3D canvas');
        }
    }
});

// Social media click tracking with animation
document.querySelectorAll('.contact-link, .project-link').forEach(link => {
    link.addEventListener('click', (e) => {
        const platform = link.textContent.trim() || 'external';
        console.log(`Link clicked: ${platform}`);

        // Add click animation
        link.style.transform = 'scale(0.95)';
        setTimeout(() => {
            link.style.transform = '';
        }, 150);
    });
});

console.log('🚀 Prince Garg Portfolio loaded successfully!');