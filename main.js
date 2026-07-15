/**
 * main.js - Core UI interactions, magnetic cursors, 3D card tilts, and viewport reveal routines.
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Dynamic Footer Year
    const yearSpan = document.getElementById('year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // 2. Intersection Observer for Scroll Reveal Animations
    const revealElements = document.querySelectorAll('.reveal');
    const skillFills = document.querySelectorAll('.skill-fill');

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                
                // If it is the about text block containing skills, load the skill bar fills
                if (entry.target.classList.contains('about-text')) {
                    animateSkillBars();
                }
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px' // Trigger slightly before element enters view
    });

    revealElements.forEach(el => revealObserver.observe(el));

    // Special observer for sections that aren't marked reveal but contain skill bars
    const aboutSection = document.getElementById('about');
    if (aboutSection) {
        const aboutObserver = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                animateSkillBars();
                aboutObserver.disconnect(); // Only run once
            }
        }, { threshold: 0.2 });
        aboutObserver.observe(aboutSection);
    }

    function animateSkillBars() {
        skillFills.forEach(fill => {
            const percent = fill.getAttribute('data-percent');
            if (percent) {
                fill.style.width = percent;
            }
        });
    }

    // 3. Magnetic Hover Effect for Buttons (.btn)
    const magneticBtns = document.querySelectorAll('.btn');
    
    magneticBtns.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            // Calculate cursor offset from center of button
            const x = e.clientX - rect.left - (rect.width / 2);
            const y = e.clientY - rect.top - (rect.height / 2);
            
            // Snap offset factor (divide to scale down displacement)
            const strength = 0.35;
            
            // Translate the button slightly
            btn.style.transform = `translate3d(${x * strength}px, ${y * strength}px, 0)`;
            
            // Draw magnetic effect on components inside button
            const arrow = btn.querySelector('.btn-arrow');
            if (arrow) {
                arrow.style.transform = `translateX(${5 + x * 0.1}px) translateY(${y * 0.1}px)`;
            }
        });

        btn.addEventListener('mouseleave', () => {
            // Easing recovery back to origin
            btn.style.transform = 'translate3d(0, 0, 0)';
            
            const arrow = btn.querySelector('.btn-arrow');
            if (arrow) {
                arrow.style.transform = 'translateX(0) translateY(0)';
            }
        });
    });

    // 4. 3D Card Hover Tilt Effects (.project-card)
    const projectCards = document.querySelectorAll('.project-card');

    projectCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            // Coordinates relative to card bounds
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Normalized offset from card center (-1 to 1)
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const normX = (x - centerX) / centerX;
            const normY = (centerY - y) / centerY;
            
            // Define tilt angle thresholds (rotation degrees max)
            const maxTilt = 8;
            const tiltX = (normY * maxTilt).toFixed(2);
            const tiltY = (normX * maxTilt).toFixed(2);

            // Apply 3D matrix rotations
            card.style.transform = `perspective(1000px) translateY(-8px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
            
            // Dynamically alter glass overlay ambient shines
            const glowR = 255;
            const glowG = 28;
            const glowB = 28;
            card.style.borderColor = `rgba(${glowR}, ${glowG}, ${glowB}, ${0.15 + Math.abs(normX) * 0.2})`;
            card.style.boxShadow = `0px 20px 45px rgba(${glowR}, ${glowG}, ${glowB}, ${0.03 + Math.abs(normX) * 0.03})`;
        });

        card.addEventListener('mouseleave', () => {
            // Reset transforms smoothly
            card.style.transform = 'perspective(1000px) translateY(0) rotateX(0deg) rotateY(0deg)';
            card.style.borderColor = 'var(--border-color)';
            card.style.boxShadow = 'none';
        });
    });

    // 5. Custom Navigation Header Backdrop opacity on scroll
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.style.padding = '18px 50px';
            header.style.backgroundColor = 'rgba(3, 3, 3, 0.85)';
            header.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.5)';
        } else {
            header.style.padding = '30px 50px';
            header.style.backgroundColor = 'rgba(3, 3, 3, 0.6)';
            header.style.boxShadow = 'none';
        }
    });

    // Smooth Scrolling anchors
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetEl = document.querySelector(targetId);
            if (targetEl) {
                targetEl.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});
