document.addEventListener("DOMContentLoaded", function () {
    // Check if dark mode is enabled
    let darkMode = localStorage.getItem("darkMode");

    // Set initial theme based on localStorage
    if (darkMode === "enabled") {
        document.body.classList.add("dark-mode");
        document.body.classList.add("dark");
        
        slideToMoon();
    }

    // Toggle dark mode when the button is clicked
    document.getElementById("switch-theme").addEventListener("click", function () {
        if (document.body.classList.contains("dark")) {
            // Disable dark mode
            document.body.classList.remove("dark");
            localStorage.setItem("darkMode", "disabled");
            slideToSun();
        } else {
            // Enable dark mode
            document.body.classList.add("dark");
            localStorage.setItem("darkMode", "enabled");
            slideToMoon();
        }
    });

    // Function to slide icons to the sun position
    function slideToSun() {
        document.querySelector(".theme-toggle i:first-child").style.transform = "translateX(0%)";
        document.querySelector(".theme-toggle i:last-child").style.transform = "translateX(130%)";

        
    }

    // Function to slide icons to the moon position
    function slideToMoon() {
        document.querySelector(".theme-toggle i:first-child").style.transform = "translateX(-120%)";
        document.querySelector(".theme-toggle i:last-child").style.transform = "translateX(0%)";
    }
});
