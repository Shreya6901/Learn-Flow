// Popup script for YouTube Playlist Focus Mode
document.addEventListener("DOMContentLoaded", async () => {
  const toggleBtn = document.getElementById("toggle-focus");
  const statusDot = document.getElementById("status-dot");
  const statusMessage = document.getElementById("status-message");
  const playlistWarning = document.getElementById("playlist-warning");

  // Get current tab info
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const isYouTubePlaylist =
    tab.url.includes("youtube.com/watch") && tab.url.includes("list=");

  // Load current settings
  chrome.storage.sync.get(["focusModeActive"], (result) => {
    const isActive = result.focusModeActive || false;
    updateUI(isActive, isYouTubePlaylist);
  });

  // Toggle button event listener
  toggleBtn.addEventListener("click", () => {
    if (!isYouTubePlaylist) {
      showPlaylistWarning();
      return;
    }

    chrome.storage.sync.get(["focusModeActive"], (result) => {
      const newState = !(result.focusModeActive || false);

      // Save new state
      chrome.storage.sync.set({ focusModeActive: newState }, () => {
        updateUI(newState, isYouTubePlaylist);

        // Send message to content script to toggle focus mode
        chrome.tabs
          .sendMessage(tab.id, {
            action: "toggleFocusMode",
            state: newState,
          })
          .catch(() => {
            // If content script isn't loaded, reload the page
            chrome.tabs.reload(tab.id);
          });
      });
    });
  });

  function updateUI(isActive, isPlaylistPage) {
    // Update status indicator
    statusDot.classList.toggle("active", isActive);

    // Update status message
    if (isActive) {
      statusMessage.textContent = "Focus mode active";
      toggleBtn.textContent = "Disable Focus Mode";
    } else {
      statusMessage.textContent = "Focus mode inactive";
      toggleBtn.textContent = "Enable Focus Mode";
    }

    // Handle playlist warning
    if (!isPlaylistPage) {
      toggleBtn.disabled = true;
      toggleBtn.textContent = "Visit YouTube Playlist";
      showPlaylistWarning();
    } else {
      toggleBtn.disabled = false;
      hidePlaylistWarning();
    }
  }

  function showPlaylistWarning() {
    playlistWarning.style.display = "block";
  }

  function hidePlaylistWarning() {
    playlistWarning.style.display = "none";
  }

  // Listen for storage changes to update UI
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (changes.focusModeActive) {
      updateUI(changes.focusModeActive.newValue, isYouTubePlaylist);
    }
  });
});
