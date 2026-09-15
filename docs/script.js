/* =========================================================
   SLIDESENSE
   Hero Section JavaScript
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       ELEMENTS
    ===================================================== */

    const navbar =
        document.querySelector(".navbar");

    const menuButton =
        document.getElementById("menuButton");

    const navigation =
        document.getElementById("navigation");

    const navLinks =
        document.querySelectorAll(
            ".navigation a"
        );


    /* =====================================================
       MOBILE MENU
    ===================================================== */

    if (menuButton && navigation) {

        menuButton.addEventListener(
            "click",
            () => {

                const isOpen =
                    navigation.classList.toggle(
                        "nav-open"
                    );

                menuButton.classList.toggle(
                    "menu-open",
                    isOpen
                );

                menuButton.setAttribute(
                    "aria-expanded",
                    isOpen
                );

            }
        );


        /* Close menu after clicking link */

        navLinks.forEach(link => {

            link.addEventListener(
                "click",
                () => {

                    navigation.classList.remove(
                        "nav-open"
                    );

                    menuButton.classList.remove(
                        "menu-open"
                    );

                    menuButton.setAttribute(
                        "aria-expanded",
                        "false"
                    );

                }
            );

        });


        /* Close menu when clicking outside */

        document.addEventListener(
            "click",
            event => {

                const clickedNavigation =
                    navigation.contains(
                        event.target
                    );

                const clickedMenu =
                    menuButton.contains(
                        event.target
                    );


                if (
                    !clickedNavigation &&
                    !clickedMenu
                ) {

                    navigation.classList.remove(
                        "nav-open"
                    );

                    menuButton.classList.remove(
                        "menu-open"
                    );

                    menuButton.setAttribute(
                        "aria-expanded",
                        "false"
                    );

                }

            }
        );


        /* Reset menu when returning to desktop */

        window.addEventListener(
            "resize",
            () => {

                if (
                    window.innerWidth > 1060
                ) {

                    navigation.classList.remove(
                        "nav-open"
                    );

                    menuButton.classList.remove(
                        "menu-open"
                    );

                    menuButton.setAttribute(
                        "aria-expanded",
                        "false"
                    );

                }

            }
        );

    }


    /* =====================================================
       NAVBAR SCROLL EFFECT
    ===================================================== */

    function updateNavbar() {

        if (!navbar) {
            return;
        }


        if (
            window.scrollY > 30
        ) {

            navbar.classList.add(
                "navbar-scrolled"
            );

        } else {

            navbar.classList.remove(
                "navbar-scrolled"
            );

        }

    }


    updateNavbar();


    window.addEventListener(
        "scroll",
        updateNavbar,
        {
            passive: true
        }
    );


    /* =====================================================
       SMOOTH SCROLL
    ===================================================== */

    const internalLinks =
        document.querySelectorAll(
            'a[href^="#"]'
        );


    internalLinks.forEach(link => {

        link.addEventListener(
            "click",
            event => {

                const targetID =
                    link.getAttribute(
                        "href"
                    );


                /*
                   Ignore empty anchors
                */

                if (
                    !targetID ||
                    targetID === "#"
                ) {

                    return;

                }


                const target =
                    document.querySelector(
                        targetID
                    );


                /*
                   The hero-only version may contain
                   navigation links for sections that
                   will be added later.

                   Therefore, do nothing when the
                   section doesn't exist.
                */

                if (!target) {
                    return;
                }


                event.preventDefault();


                const navbarHeight =
                    navbar
                        ? navbar.offsetHeight
                        : 0;


                const targetPosition =
                    target
                        .getBoundingClientRect()
                        .top
                    +
                    window.scrollY
                    -
                    navbarHeight;


                window.scrollTo({

                    top:
                        targetPosition,

                    behavior:
                        "smooth"

                });

            }
        );

    });


    /* =====================================================
       HERO ENTRANCE ANIMATION
    ===================================================== */

    const heroElements =
        document.querySelectorAll(
            ".hero-animate"
        );


    /*
       Check whether the user prefers
       reduced motion.
    */

    const reducedMotion =
        window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;


    if (reducedMotion) {

        heroElements.forEach(
            element => {

                element.classList.add(
                    "hero-visible"
                );

            }
        );

    } else {

        heroElements.forEach(
            (element, index) => {

                setTimeout(
                    () => {

                        element.classList.add(
                            "hero-visible"
                        );

                    },

                    120 +
                    index * 100

                );

            }
        );

    }


    /* =====================================================
       BUTTON FEEDBACK
    ===================================================== */

    const buttons =
        document.querySelectorAll(
            ".btn, .button"
        );


    buttons.forEach(button => {

        button.addEventListener(
            "pointerdown",
            () => {

                button.classList.add(
                    "button-pressed"
                );

            }
        );


        button.addEventListener(
            "pointerup",
            () => {

                button.classList.remove(
                    "button-pressed"
                );

            }
        );


        button.addEventListener(
            "pointerleave",
            () => {

                button.classList.remove(
                    "button-pressed"
                );

            }
        );


        button.addEventListener(
            "pointercancel",
            () => {

                button.classList.remove(
                    "button-pressed"
                );

            }
        );

    });


    /* =====================================================
       ACTIVE NAVIGATION
    ===================================================== */

    function updateActiveNavigation() {

        const sections =
            document.querySelectorAll(
                "section[id]"
            );


        if (
            sections.length === 0
        ) {

            return;

        }


        let currentSection =
            "home";


        const scrollPosition =
            window.scrollY + 160;


        sections.forEach(
            section => {

                const top =
                    section.offsetTop;

                const bottom =
                    top +
                    section.offsetHeight;


                if (
                    scrollPosition >= top &&
                    scrollPosition < bottom
                ) {

                    currentSection =
                        section.id;

                }

            }
        );


        navLinks.forEach(
            link => {

                const href =
                    link.getAttribute(
                        "href"
                    );


                link.classList.toggle(

                    "active",

                    href ===
                    "#" +
                    currentSection

                );

            }
        );

    }


    updateActiveNavigation();


    window.addEventListener(
        "scroll",
        updateActiveNavigation,
        {
            passive: true
        }
    );


    /* =====================================================
       SCROLL INDICATOR
    ===================================================== */

    const scrollIndicator =
        document.querySelector(
            ".scroll-indicator"
        );


    if (scrollIndicator) {

        scrollIndicator.addEventListener(
            "click",
            () => {

                const nextSection =
                    document.querySelector(
                        "#about"
                    );


                if (nextSection) {

                    nextSection.scrollIntoView({

                        behavior:
                            reducedMotion
                                ? "auto"
                                : "smooth"

                    });

                } else {

                    window.scrollTo({

                        top:
                            window.innerHeight,

                        behavior:
                            reducedMotion
                                ? "auto"
                                : "smooth"

                    });

                }

            }
        );

    }


    /* =====================================================
       KEYBOARD SUPPORT
    ===================================================== */

    document.addEventListener(
        "keydown",
        event => {

            /*
               Escape closes mobile menu
            */

            if (
                event.key === "Escape"
            ) {

                if (
                    navigation &&
                    menuButton
                ) {

                    navigation.classList.remove(
                        "nav-open"
                    );

                    menuButton.classList.remove(
                        "menu-open"
                    );

                    menuButton.setAttribute(
                        "aria-expanded",
                        "false"
                    );

                }

            }

        }
    );


    /* =====================================================
       INITIALIZE
    ===================================================== */

    updateNavbar();
    updateActiveNavigation();

    /* =====================================================
       IMAGE MODAL
    ===================================================== */
    const modal = document.getElementById("image-modal");
    const modalImg = document.getElementById("full-image");
    const captionText = document.getElementById("modal-caption");
    const closeModal = document.querySelector(".close-modal");
    
    if (modal && modalImg && closeModal) {
        const galleryImages = document.querySelectorAll(".gallery-item img");
        galleryImages.forEach(img => {
            img.addEventListener("click", function() {
                modal.style.display = "block";
                modalImg.src = this.src;
                
                // Try to find a caption inside the figure
                const figcaption = this.closest('figure').querySelector('figcaption strong');
                captionText.innerHTML = figcaption ? figcaption.innerHTML : this.alt;
            });
        });

        closeModal.addEventListener("click", function() {
            modal.style.display = "none";
        });

        // Close on background click
        modal.addEventListener("click", function(e) {
            if (e.target !== modalImg) {
                modal.style.display = "none";
            }
        });
        
        // Close on Escape key
        document.addEventListener("keydown", function(e) {
            if (e.key === "Escape" && modal.style.display === "block") {
                modal.style.display = "none";
            }
        });
    }

});