import { UserDataComponent } from "../../Utilities/CustomComponent.js";
import { getHTMLTemplate, useCSSStyle } from "../../Utilities/template.js";

useCSSStyle("api-doc-page");
export class ApiDocPage extends UserDataComponent {
    constructor() {
        super("api-doc-page");
        this.template = getHTMLTemplate("api-doc-page");
        this.setupScrollSpy();
        this.setupCopyButtons();
    }

    setupCopyButtons() {
        const buttons = this.querySelectorAll('.copy-btn');
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                const codeBlock = button.closest('.code-block');
                if (codeBlock) {
                    const code = codeBlock.querySelector('code, pre');
                    if (code) {
                        const text = code.innerText;
                        this.copy(text, button);
                    }
                }
            });
        });
    }

    async copy(text, btn) {
        if (!text || !btn) return;

        let success = false;
        try {
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(text);
                success = true;
            } else {
                throw new Error("Clipboard API unavailable");
            }
        } catch (err) {
            console.warn("Clipboard API failed, trying fallback...", err);
        }

        const originalText = "Copy";
        if (success) {
            btn.innerText = "Copied!";
            // Use --color-success if available, otherwise fallback to a standard nice green
            btn.style.backgroundColor = "var(--color-success, #28a745)";
            setTimeout(() => {
                btn.innerText = originalText;
                btn.style.backgroundColor = "";
            }, 2000);
        } else {
            console.error("All copy methods failed");
            btn.innerText = "Error";
            btn.style.backgroundColor = "red";
            setTimeout(() => {
                btn.innerText = originalText;
                btn.style.backgroundColor = "";
            }, 2000);
        }
    }


    setupScrollSpy() {
        const sections = this.querySelectorAll('section[id]');
        const navLinks = this.querySelectorAll('.doc-sidebar li a');
        
        // 1. Click Handling (Smooth Scroll)
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('data-target');
                const targetSection = this.querySelector(`#${targetId}`);
                
                // Optimistic update for immediate feedback
                this.updateNavState(targetId, navLinks);

                if (targetSection) {
                    targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });

        // 2. Scroll Handling (Throttled)
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    this.determineActiveSection(sections, navLinks);
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });

        // Initial check
        this.determineActiveSection(sections, navLinks);
    }

    determineActiveSection(sections, navLinks) {
        // 1. Check if at bottom (force last item)
        const isAtBottom = (window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 50;
        if (isAtBottom) {
            const lastSection = sections[sections.length - 1];
            if (lastSection) this.updateNavState(lastSection.id, navLinks);
            return;
        }

        // 2. Find the active section based on scroll position
        let activeId = null;
        
        // We look for the first section that "covers" the reading line.
        // The reading line is implicitly defined by the scroll-margin-top of the sections.
        // A section is active if its top is above the "trigger line" relative to viewport.
        
        for (const section of sections) {
            const rect = section.getBoundingClientRect();
            
            // Get the CSS scroll-margin-top (this is the key fix)
            // On mobile this is large (~220px), on desktop smaller (~100px)
            const style = window.getComputedStyle(section);
            const scrollMarginTop = parseInt(style.scrollMarginTop || '0', 10);
            
            // We consider a section active if its top is "near" the top of the viewport.
            // Specifically, if top <= scrollMarginTop + buffer.
            // Since we iterate in order, we want the LAST one that satisfies this,
            // OR the first one that is visible if none are fully "above" yet?
            
            // Standard Sticky Header Logic:
            // The active section is the one occupying the top area of the view.
            
            // Let's use a "trigger point" slightly below the sticky header.
            // If the section top is above this trigger point, it's a candidate.
            // The trigger point should match the scroll-margin-top.
            
            // If rect.top <= scrollMarginTop + 10, it effectively means the section header
            // has passed the "sticky line" and is now the current context.
            if (rect.top <= (scrollMarginTop + 2)) {
                activeId = section.id;
            } else {
                // Since sections are in order, if we find one that is NOT above the line,
                // the subsequent ones won't be either. We stop.
                // UNLESS activeId is still null (top of page), then first one might be it?
                // Actually, if we are at top, the first one naturally satisfies activeId.
                break;
            }
        }

        // 3. Update State
        if (activeId) {
            this.updateNavState(activeId, navLinks);
        } else if (sections.length > 0) {
            // Fallback for very top of page before first section hits the line
            this.updateNavState(sections[0].id, navLinks);
        }
    }

    updateNavState(activeId, navLinks) {
        navLinks.forEach(link => {
            const target = link.getAttribute('data-target');
            const isActive = target === activeId;
            
            // Only touch DOM if state changes
            if (isActive && !link.classList.contains('active')) {
                link.classList.add('active');
                this.centerActiveLink(link);
            } else if (!isActive && link.classList.contains('active')) {
                link.classList.remove('active');
            }
        });
    }

    centerActiveLink(link) {
        const container = this.querySelector('.doc-sidebar ul');
        if (!container || window.innerWidth > 900) return;

        const linkRect = link.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        const scrollLeftVal = container.scrollLeft + (linkRect.left - containerRect.left) - (containerRect.width / 2) + (linkRect.width / 2);

        container.scrollTo({
            left: scrollLeftVal,
            behavior: 'smooth'
        });
    }
}


