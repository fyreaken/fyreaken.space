document.addEventListener("DOMContentLoaded", () => {
  const icons = [
    { name: "Browser", icon: "icons/1.png", text: "", pageContent: "" },
    { name: "System Configuration", icon: "icons/2.png", text: "", pageContent: "" },
    { name: "Memory Card", icon: "icons/3.png", text: "", pageContent: "" },
    { name: "CD/DVD", icon: "icons/4.png", text: "", pageContent: "" },
    { name: "Network Settings", icon: "icons/5.png", text: "", pageContent: "" }
  ];

  const hoverSound = new Audio("sounds/hover.mp3");
  const bootSound = new Audio("sounds/ps2_boot.mp3");
  const music = new Audio("sounds/menu_music.mp3");
  music.loop = true;

  const startOverlay = document.createElement("div");
  startOverlay.className = "fixed inset-0  text-white flex flex-col items-center justify-center";
  const title = document.createElement("div");
  title.innerText = "fyreaken.space";
  title.style.fontSize = "2rem";
  title.style.fontWeight = "bold";
  const clickToStart = document.createElement("div");
  clickToStart.innerText = "[click to start]";
  clickToStart.style.marginTop = "1rem";
  clickToStart.style.fontSize = "1.2rem";
  clickToStart.style.cursor = "pointer";
  startOverlay.appendChild(title);
  startOverlay.appendChild(clickToStart);
  clickToStart.classList.add("flicker");
  document.body.appendChild(startOverlay);

  const startHandler = () => {
    bootSound.play();
    setTimeout(() => music.play(), 3000);
    
    startOverlay.style.transition = "opacity 2s ease";
    startOverlay.style.opacity = "0";
    
    setTimeout(() => {
      startOverlay.remove();
      showMenu();
    }, 2000);
  };
  clickToStart.addEventListener("click", startHandler);
  clickToStart.addEventListener("touchstart", startHandler);

  function showMenu() {
    const app = document.createElement("div");
    app.style.display = "flex";
    app.style.flexDirection = "column";
    app.style.alignItems = "center";
    app.style.justifyContent = "center";
    app.style.height = "100vh";
    app.style.backgroundColor = ('');
    app.style.color = "#2F4881";
    app.style.gap = "2rem";
    app.style.padding = "1rem";

    const iconRow = document.createElement("div");
    iconRow.style.display = "flex";
    iconRow.id = "iconRow";
    iconRow.style.flexWrap = "wrap";
    iconRow.style.gap = "2rem";

    icons.forEach(icon => {
      const img = document.createElement("img");
      img.src = icon.icon;
      img.alt = icon.name;
      img.title = icon.name;
      img.removeAttribute('alt');
      img.removeAttribute('title');
      img.style.width = "96px";
      img.style.height = "96px";
      img.style.cursor = "pointer";
      img.style.transition = "transform 0.3s, border 0.3s";
      img.onmouseenter = () => {
        hoverSound.play();
        img.style.border = "2px solid #2F4881";
      };
      img.onmouseleave = () => {
        img.style.border = "none";
      };
      img.onclick = () => {
        openOverlay(icon);
      };
      img.ontouchstart = () => {
        hoverSound.play();
      };
      iconRow.appendChild(img);
    });

    app.appendChild(iconRow);
    
    app.style.opacity = "0";
    app.style.transition = "opacity 1.5s ease";
    document.body.appendChild(app);
    setTimeout(() => {
      app.style.opacity = "1";
    }, 100);
    
  }

function openOverlay(icon) {

    // Remove any existing overlays
    document.querySelectorAll(".overlay-modal").forEach(el => el.remove());

    const overlay = document.createElement("div");
    overlay.className = "overlay-modal";

    const dialogBox = document.createElement("div");
    dialogBox.className = "overlay-content";

    const pageId =
        icon.name
            .replace(/\//g, "-")
            .replace(/\s+/g, "-")
            .toLowerCase() + "-content";

    const pageContent = document.getElementById(pageId);

    if (!pageContent) {
        console.warn(`No page content found for: ${pageId}`);
        return;
    }

    // Clone the original content
    const fresh = pageContent.cloneNode(true);
    fresh.classList.remove("hidden");

    // Add content to the overlay
    dialogBox.appendChild(fresh);

    // Create close button
    const closeBtn = document.createElement("button");

    closeBtn.textContent = "Close";
    closeBtn.className = "close-btn";

    closeBtn.style.cssText = `
        background-color: #333;
        color: white;
        padding: 0.4rem 1.2rem;
        border: none;
        border-radius: 2px;
        cursor: pointer;
        font-size: 1rem;
        font-family: sans-serif;
        box-shadow: none;
        text-align: center;
        display: block;
    `;

    closeBtn.onclick = () => {
        overlay.remove();
    };

    // Button comes AFTER the content
    dialogBox.appendChild(closeBtn);

    // Add dialog to overlay
    overlay.appendChild(dialogBox);

    // Add overlay to page
    document.body.appendChild(overlay);
}})
