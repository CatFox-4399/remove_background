/**
 * ClearCut - User Manual Interactive Logic
 * Vanilla JavaScript (ES6+)
 */

document.addEventListener('DOMContentLoaded', () => {
    // Language Selector Interactions
    const langBtn = document.getElementById('langSelectorBtn');
    const langMenu = document.getElementById('langDropdownMenu');

    if (langBtn && langMenu) {
        langBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = langMenu.classList.contains('show');
            if (isOpen) {
                langMenu.classList.remove('show');
                langBtn.setAttribute('aria-expanded', 'false');
            } else {
                langMenu.classList.add('show');
                langBtn.setAttribute('aria-expanded', 'true');
            }
        });

        document.addEventListener('click', (e) => {
            if (!langMenu.contains(e.target) && e.target !== langBtn) {
                langMenu.classList.remove('show');
                langBtn.setAttribute('aria-expanded', 'false');
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && langMenu.classList.contains('show')) {
                langMenu.classList.remove('show');
                langBtn.setAttribute('aria-expanded', 'false');
                langBtn.focus();
            }
        });
    }

    // FAQ Accordion Interaction
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach((item) => {
        const questionBtn = item.querySelector('.faq-question');

        if (questionBtn) {
            questionBtn.addEventListener('click', () => {
                const isActive = item.classList.contains('active');

                // Close all other FAQ items for a clean accordion experience
                faqItems.forEach((otherItem) => {
                    if (otherItem !== item) {
                        otherItem.classList.remove('active');
                        const otherBtn = otherItem.querySelector('.faq-question');
                        if (otherBtn) {
                            otherBtn.setAttribute('aria-expanded', 'false');
                        }
                    }
                });

                // Toggle current item
                if (isActive) {
                    item.classList.remove('active');
                    questionBtn.setAttribute('aria-expanded', 'false');
                } else {
                    item.classList.add('active');
                    questionBtn.setAttribute('aria-expanded', 'true');
                }
            });
        }
    });
});
