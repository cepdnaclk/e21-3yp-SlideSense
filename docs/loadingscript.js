/* =========================================
   SLIDESENSE LOADING SYSTEM
========================================= */

document.addEventListener("DOMContentLoaded", () => {


    /* =========================================
       ELEMENTS
    ========================================== */

    const progressBar =
        document.getElementById("progressBar");

    const progressNumber =
        document.getElementById("progressNumber");

    const loadingText =
        document.getElementById("loadingText");

    const steps =
        document.querySelectorAll(".system-step");

    const particles =
        document.getElementById("particles");


    /* =========================================
       CREATE PARTICLES
    ========================================== */

    for (let i = 0; i < 50; i++) {

        const particle =
            document.createElement("span");

        particle.classList.add("particle");

        particle.style.left =
            Math.random() * 100 + "%";

        particle.style.top =
            Math.random() * 100 + "%";

        particle.style.animationDelay =
            Math.random() * 5 + "s";

        particle.style.animationDuration =
            3 + Math.random() * 5 + "s";

        particles.appendChild(particle);

    }


    /* =========================================
       LOADING STEPS
    ========================================== */

    const stepMessages = [

        "CONNECTING TO AWS IOT CORE...",

        "ESTABLISHING SECURE CHANNEL...",

        "LOADING SENSOR DATA...",

        "INITIALIZING AI RISK ENGINE...",

        "PREPARING DASHBOARD..."

    ];


    /* =========================================
       UPDATE SYSTEM STEP
    ========================================== */

    function updateSteps(progress) {

        let currentStep = 0;


        if (progress >= 20) {

            currentStep = 1;

        }

        if (progress >= 40) {

            currentStep = 2;

        }

        if (progress >= 60) {

            currentStep = 3;

        }

        if (progress >= 85) {

            currentStep = 4;

        }


        steps.forEach((step, index) => {

            const icon =
                step.querySelector(".step-icon");

            const status =
                step.querySelector(".step-status");


            if (index < currentStep) {

                icon.textContent = "✓";

                status.textContent = "✓";

                status.classList.remove("loading");

            }


            else if (index === currentStep) {

                icon.textContent = "◌";

                status.textContent = "";

                status.classList.add("loading");

            }


            else {

                icon.textContent = "○";

                status.textContent = "";

                status.classList.remove("loading");

            }

        });


        if (currentStep < stepMessages.length) {

            loadingText.textContent =
                stepMessages[currentStep];

        }

    }


    /* =========================================
       LOADING ANIMATION
    ========================================== */

    let progress = 0;


    const loadingInterval =
        setInterval(() => {

            progress += 0.35;


            if (progress >= 100) {

                progress = 100;

                clearInterval(loadingInterval);

                finishLoading();

            }


            progressBar.style.width =
                progress + "%";


            progressNumber.textContent =
                Math.floor(progress) + "%";


            updateSteps(progress);


        }, 25);


    /* =========================================
       FINISH
    ========================================== */

    function finishLoading() {

        loadingText.textContent =
            "SYSTEM READY";

        progressNumber.textContent =
            "100%";


        steps.forEach((step) => {

            const icon =
                step.querySelector(".step-icon");

            const status =
                step.querySelector(".step-status");


            icon.textContent = "✓";

            status.textContent = "✓";

            status.classList.remove("loading");

        });


        setTimeout(() => {

            console.log(
                "SlideSense Dashboard Ready"
            );


                        sessionStorage.setItem("slidesense-loading-complete", "true");
                        window.location.replace("main.html");

        }, 1000);

    }

});