// Content script for YouTube Playlist Focus Mode
class YouTubePlaylistFocusMode {
  constructor() {
    this.isActive = false;
    this.currentPlaylist = null;
    this.playlistVideos = [];
    this.currentVideoIndex = 0;
    this.notes = {};
    this.init();
  }

  init() {
    this.loadSettings();
    this.observeURLChanges();
    this.createToggleButton();

    // Check if we're on a playlist page
    if (this.isPlaylistPage()) {
      this.setupPlaylistMode();
    }
  }

  loadSettings() {
    chrome.storage.sync.get(["focusModeActive", "playlistNotes"], (result) => {
      this.isActive = result.focusModeActive || false;
      this.notes = result.playlistNotes || {};
    });
  }

  saveSettings() {
    chrome.storage.sync.set({
      focusModeActive: this.isActive,
      playlistNotes: this.notes,
    });
  }

  isPlaylistPage() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.has("list") && urlParams.get("list") !== "WL";
  }

  observeURLChanges() {
    let currentURL = window.location.href;

    const observer = new MutationObserver(() => {
      if (currentURL !== window.location.href) {
        currentURL = window.location.href;
        this.handleURLChange();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  handleURLChange() {
    if (this.isPlaylistPage() && this.isActive) {
      setTimeout(() => this.setupPlaylistMode(), 1000);
    } else if (this.isActive) {
      this.deactivateFocusMode();
    }
  }

  createToggleButton() {
    const button = document.createElement("button");
    button.id = "focus-mode-toggle";
    button.textContent = "Focus Mode";
    button.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        background: #ff0000;
        color: white;
        border: none;
        padding: 10px 15px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 14px;
        font-weight: bold;
      `;

    button.addEventListener("click", () => this.toggleFocusMode());
    document.body.appendChild(button);

    this.updateToggleButton();
  }

  updateToggleButton() {
    const button = document.getElementById("focus-mode-toggle");
    if (button) {
      button.textContent = this.isActive ? "Exit Focus" : "Focus Mode";
      button.style.background = this.isActive ? "#00aa00" : "#ff0000";
    }
  }

  toggleFocusMode() {
    if (!this.isPlaylistPage()) {
      alert("Focus Mode only works on YouTube playlist pages!");
      return;
    }

    this.isActive = !this.isActive;
    this.saveSettings();
    this.updateToggleButton();

    if (this.isActive) {
      this.setupPlaylistMode();
    } else {
      this.deactivateFocusMode();
    }
  }

  async setupPlaylistMode() {
    if (!this.isActive) return;

    // Wait for page to load
    await this.waitForElement("#secondary");

    this.extractPlaylistData();
    this.hideDistractions();
    this.createFocusInterface();
  }

  waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      const observer = new MutationObserver((mutations, obs) => {
        const element = document.querySelector(selector);
        if (element) {
          obs.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Element ${selector} not found within ${timeout}ms`));
      }, timeout);
    });
  }

  extractPlaylistData() {
    const urlParams = new URLSearchParams(window.location.search);
    this.currentPlaylist = urlParams.get("list");

    // Get playlist videos
    const playlistItems = document.querySelectorAll(
      "ytd-playlist-panel-video-renderer"
    );
    this.playlistVideos = Array.from(playlistItems).map((item, index) => {
      const titleElement = item.querySelector("#video-title");
      const durationElement = item.querySelector(
        "#text.ytd-thumbnail-overlay-time-status-renderer"
      );
      const thumbnailElement = item.querySelector("img");

      return {
        index: index,
        title: titleElement?.textContent?.trim() || "Unknown Title",
        duration: durationElement?.textContent?.trim() || "0:00",
        thumbnail: thumbnailElement?.src || "",
        element: item,
        videoId: this.extractVideoId(item),
      };
    });

    // Find current video index
    const currentVideoId = urlParams.get("v");
    this.currentVideoIndex = this.playlistVideos.findIndex(
      (video) => video.videoId === currentVideoId
    );

    if (this.currentVideoIndex === -1) this.currentVideoIndex = 0;
  }

  extractVideoId(element) {
    const link = element.querySelector("a");
    if (link) {
      const href = link.getAttribute("href");
      const match = href?.match(/[?&]v=([^&]+)/);
      return match ? match[1] : null;
    }
    return null;
  }

  hideDistractions() {
    // Hide elements that cause distraction
    const selectorsToHide = [
      "#related",
      "#comments",
      "ytd-watch-next-secondary-results-renderer",
      "#secondary-inner",
      "ytd-compact-video-renderer",
      '[data-target-id="watch-suggestions"]',
    ];

    selectorsToHide.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((el) => {
        el.style.display = "none";
      });
    });

    // Hide sidebar completely
    const secondary = document.querySelector("#secondary");
    if (secondary) {
      secondary.style.display = "none";
    }

    // Expand primary content
    const primary = document.querySelector("#primary");
    if (primary) {
      primary.style.maxWidth = "100%";
      primary.style.width = "100%";
    }
  }

  createFocusInterface() {
    // Remove existing focus interface if present
    const existingInterface = document.querySelector("#focus-interface");
    if (existingInterface) {
      existingInterface.remove();
    }

    const focusInterface = document.createElement("div");
    focusInterface.id = "focus-interface";
    focusInterface.className = "focus-interface";

    focusInterface.innerHTML = `
        <div class="focus-sidebar">
          <div class="playlist-header">
            <h3>Course Progress</h3>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${this.calculateProgress()}%"></div>
            </div>
            <span class="progress-text">${this.currentVideoIndex + 1} of ${
      this.playlistVideos.length
    } videos</span>
          </div>
          
          <div class="playlist-videos">
            ${this.playlistVideos
              .map(
                (video, index) => `
              <div class="video-item ${
                index === this.currentVideoIndex ? "active" : ""
              } ${index < this.currentVideoIndex ? "completed" : ""}" 
                   data-video-id="${video.videoId}" data-index="${index}">
                <div class="video-thumbnail">
                  <img src="${video.thumbnail}" alt="${video.title}">
                  <span class="video-duration">${video.duration}</span>
                  ${
                    index < this.currentVideoIndex
                      ? '<div class="completed-check">✓</div>'
                      : ""
                  }
                </div>
                <div class="video-info">
                  <h4>${video.title}</h4>
                  <span class="video-number">${index + 1}</span>
                </div>
              </div>
            `
              )
              .join("")}
          </div>
          
          <div class="notes-section">
            <h4>Notes</h4>
            <textarea id="video-notes" placeholder="Add your notes for this video...">${this.getCurrentVideoNotes()}</textarea>
            <button id="save-notes">Save Notes</button>
          </div>
        </div>
      `;

    // Insert the interface
    const primary = document.querySelector("#primary");
    if (primary) {
      primary.appendChild(focusInterface);
    }

    this.attachEventListeners();
  }

  calculateProgress() {
    return this.playlistVideos.length > 0
      ? (this.currentVideoIndex / this.playlistVideos.length) * 100
      : 0;
  }

  getCurrentVideoNotes() {
    const currentVideo = this.playlistVideos[this.currentVideoIndex];
    return currentVideo ? this.notes[currentVideo.videoId] || "" : "";
  }

  attachEventListeners() {
    // Video item click handlers
    document.querySelectorAll(".video-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        const videoId = item.getAttribute("data-video-id");
        const index = parseInt(item.getAttribute("data-index"));
        this.navigateToVideo(videoId, index);
      });
    });

    // Notes save handler
    const saveNotesBtn = document.querySelector("#save-notes");
    const notesTextarea = document.querySelector("#video-notes");

    if (saveNotesBtn && notesTextarea) {
      saveNotesBtn.addEventListener("click", () => {
        this.saveVideoNotes(notesTextarea.value);
      });

      // Auto-save on blur
      notesTextarea.addEventListener("blur", () => {
        this.saveVideoNotes(notesTextarea.value);
      });
    }
  }

  navigateToVideo(videoId, index) {
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set("v", videoId);
    const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
    window.history.pushState({}, "", newUrl);

    // Trigger YouTube's navigation
    window.dispatchEvent(new PopStateEvent("popstate"));

    this.currentVideoIndex = index;
    setTimeout(() => this.updateInterface(), 500);
  }

  saveVideoNotes(notes) {
    const currentVideo = this.playlistVideos[this.currentVideoIndex];
    if (currentVideo) {
      this.notes[currentVideo.videoId] = notes;
      this.saveSettings();

      // Show save confirmation
      const saveBtn = document.querySelector("#save-notes");
      if (saveBtn) {
        const originalText = saveBtn.textContent;
        saveBtn.textContent = "Saved!";
        saveBtn.style.background = "#00aa00";
        setTimeout(() => {
          saveBtn.textContent = originalText;
          saveBtn.style.background = "";
        }, 2000);
      }
    }
  }

  updateInterface() {
    const progressFill = document.querySelector(".progress-fill");
    const progressText = document.querySelector(".progress-text");
    const notesTextarea = document.querySelector("#video-notes");

    if (progressFill) {
      progressFill.style.width = `${this.calculateProgress()}%`;
    }

    if (progressText) {
      progressText.textContent = `${this.currentVideoIndex + 1} of ${
        this.playlistVideos.length
      } videos`;
    }

    if (notesTextarea) {
      notesTextarea.value = this.getCurrentVideoNotes();
    }

    // Update active video item
    document.querySelectorAll(".video-item").forEach((item, index) => {
      item.classList.remove("active", "completed");
      if (index === this.currentVideoIndex) {
        item.classList.add("active");
      } else if (index < this.currentVideoIndex) {
        item.classList.add("completed");
      }
    });
  }

  deactivateFocusMode() {
    // Remove focus interface
    const focusInterface = document.querySelector("#focus-interface");
    if (focusInterface) {
      focusInterface.remove();
    }

    // Restore hidden elements
    const hiddenElements = document.querySelectorAll(
      '[style*="display: none"]'
    );
    hiddenElements.forEach((el) => {
      el.style.display = "";
    });

    // Restore sidebar
    const secondary = document.querySelector("#secondary");
    if (secondary) {
      secondary.style.display = "";
    }

    // Restore primary content width
    const primary = document.querySelector("#primary");
    if (primary) {
      primary.style.maxWidth = "";
      primary.style.width = "";
    }
  }
}

// Initialize the extension
let playlistFocusMode;

// Wait for page to load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    playlistFocusMode = new YouTubePlaylistFocusMode();
  });
} else {
  playlistFocusMode = new YouTubePlaylistFocusMode();
}

// Handle page navigation in YouTube's SPA
window.addEventListener("yt-navigate-finish", () => {
  if (playlistFocusMode) {
    playlistFocusMode.handleURLChange();
  }
});
