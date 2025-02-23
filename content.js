// Function to detect YouTube's current theme more reliably
function getYouTubeTheme() {
    // Check computed background color of body as a fallback
    const bgColor = window.getComputedStyle(document.body).backgroundColor;
    const isDark = bgColor.includes('rgb(0, 0, 0)') || bgColor.includes('rgb(33, 33, 33)') || document.documentElement.classList.contains('dark');
    return isDark ? 'dark' : 'light';
}

// Add and update style block based on theme
function updateStyles() {
    let style = document.head.querySelector('#timestamp-styles');
    if (!style) {
        style = document.createElement('style');
        style.id = 'timestamp-styles';
        document.head.appendChild(style);
    }

    const isDarkMode = document.documentElement.getAttribute("dark") !== null;
    style.textContent = `
        .custom-marker {
            position: absolute;
            width: 4px;
            height: 250%;
            pointer-events: none;
            transition: opacity 0.2s ease;
        }
        #custom-timestamps {
            padding: 8px;
            border: 1px solid ${isDarkMode ? '#3d3d3d' : '#e0e0e0'};
            margin-bottom: 12px;
            background: ${isDarkMode ? '#212121' : '#fafafa'};
            font-size:12px
            border-radius: 4px;
        }
        #custom-timestamps h4 {
            margin: 0 0 8px;
            font-size: 14px;
            font-weight: 500;
            color: ${isDarkMode ? '#e0e0e0' : '#333'};
        }
        #custom-timestamps input, #custom-timestamps button {
            padding: 4px 8px;
            font-size: 12px;
            border: 1px solid ${isDarkMode ? '#555' : '#ddd'};
            border-radius: 3px;
            outline: none;
            background: ${isDarkMode ? '#333' : '#fff'};
            color: ${isDarkMode ? '#e0e0e0' : '#333'};
        }
        #custom-timestamps input[type="number"] {
            width: 80px;
        }
        #custom-timestamps input[type="text"], #custom-timestamps input[type="url"] {
            flex: 1;
        }
        #custom-timestamps input[type="color"] {
            padding: 0;
            width: 30px;
            height: 24px;
        }
        #custom-timestamps button {
            background: ${isDarkMode ? '#424242' : '#f5f5f5'};
            cursor: pointer;
            transition: background 0.2s ease;
        }
        #custom-timestamps button:hover {
            background: ${isDarkMode ? '#616161' : '#e0e0e0'};
        }
        #custom-timestamps > div {
            display: flex;
            gap: 6px;
            align-items: center;
        }
        #timestampList {
            font-size : 12px
            margin-top: 8px;
        }
        #timestampList > li {
            display: flex;
            margin : 10px 0px;
            align-items: center;
            gap: 8px;
            font-size : 12px;
            margin-bottom: 6px;
        }
        #timestampList a {
            text-decoration: none;
            font-size: 12px;
        }
        #timestampList a:hover {
            text-decoration: underline;
        }
        #timestampList button {
            padding: 2px 6px;
            font-size: 12px;
        }
        #timestampList .timestamp-link {
            color: ${isDarkMode ? '#8ab4f8' : '#007BFF'};
        }
        #timestampList .timestamp-link:hover {
            text-decoration: underline;
        }
    `;
}

// Initial style application
updateStyles();

// Function to add a timestamp marker to the progress bar
function addTimestampMarker(time, color) {
    const progressBar = document.querySelector('.ytp-timed-markers-container');
    if (!progressBar) return;

    const video = document.querySelector('video');
    if (!video || isNaN(video.duration)) return;

    const marker = document.createElement('div');
    marker.classList.add('custom-marker');
    marker.dataset.time = time;
    marker.style.left = (time / video.duration) * 100 + "%";
    marker.style.backgroundColor = color;

    progressBar.appendChild(marker);
}

// Function to load and display saved markers when the page loads
function loadSavedMarkers() {
    const videoId = new URL(window.location.href).searchParams.get("v");
    if (!videoId) return;

    chrome.storage.local.get([videoId], (data) => {
        const timestamps = data[videoId] || [];
        timestamps.forEach(({ time, color }) => {
            addTimestampMarker(time, color);
        });
    });
}

// Function to add timestamp UI inside the description box at the top
function setupTimestampUI() {
    const descriptionContainer = document.getElementById("description-inline-expander");
    if (!descriptionContainer) {
        console.log("description-inline-expander not found, waiting...");
        return;
    }

    let timestampContainer = document.getElementById("custom-timestamps");
    if (!timestampContainer) {
        timestampContainer = document.createElement("div");
        timestampContainer.id = "custom-timestamps";

        const title = document.createElement("h4");
        title.innerText = "Custom Timestamps";
        timestampContainer.appendChild(title);

        const inputContainer = document.createElement("div");
        const timeInput = document.createElement("input");
        timeInput.type = "number";
        timeInput.placeholder = "Time in sec";
        timeInput.id = "timestampInput";

        const colorInput = document.createElement("input");
        colorInput.type = "color";
        colorInput.id = "colorPicker";
        colorInput.value = "#ff0000";

        const noteInput = document.createElement("input");
        noteInput.type = "text";
        noteInput.placeholder = "Add a note you can edit later...";
        noteInput.id = "noteInput";

        const linkInput = document.createElement("input");
        linkInput.type = "url";
        linkInput.placeholder = "Add a link...";
        linkInput.id = "linkInput";

        const saveButton = document.createElement("button");
        saveButton.innerText = "Save Marker";
        saveButton.addEventListener("click", () => {
            const time = parseFloat(timeInput.value);
            const color = colorInput.value;
            const note = noteInput.value.trim();
            const link = linkInput.value.trim();

            if (!isNaN(time)) {
                saveTimestamp(time, color, note, link);
            }
        });

        inputContainer.appendChild(timeInput);
        inputContainer.appendChild(colorInput);
        inputContainer.appendChild(noteInput);
        inputContainer.appendChild(linkInput);
        inputContainer.appendChild(saveButton);
        timestampContainer.appendChild(inputContainer);

        descriptionContainer.prepend(timestampContainer);
        console.log("Added timestamp UI at the top of description-inline-expander.");
    }
    updateStyles(); // Ensure styles are applied after UI setup
}

// Function to save timestamp
function saveTimestamp(time, color, note, link) {
    const videoId = new URL(window.location.href).searchParams.get("v");
    if (!videoId) return;

    chrome.storage.local.get([videoId], (data) => {
        const timestamps = data[videoId] || [];
        timestamps.push({ time, color, note, link });

        chrome.storage.local.set({ [videoId]: timestamps }, () => {
            addTimestampMarker(time, color);
            addTimestampsToList();
        });
    });
}

// Function to list saved timestamps with links displayed directly
function addTimestampsToList() {
    const videoId = new URL(window.location.href).searchParams.get("v");
    if (!videoId) return;

    chrome.storage.local.get([videoId], (data) => {
        const timestampContainer = document.getElementById("custom-timestamps");
        if (!timestampContainer) return;

        const oldList = document.getElementById("timestampList");
        if (oldList) oldList.remove();

        const list = document.createElement("ul");
        list.id = "timestampList";

        (data[videoId] || []).forEach(({ time, color, note, link }, index) => {
            const item = document.createElement("li");

            const timestampLink = document.createElement("a");
            timestampLink.href = "#";
            timestampLink.innerText = `🟢 ${formatTime(time)}`;
            timestampLink.style.color = color;
            timestampLink.addEventListener("click", () => {
                const video = document.querySelector("video");
                if (video) video.currentTime = time;
            });

            const noteButton = document.createElement("button");
            noteButton.innerText = "Notes";
            noteButton.addEventListener("click", () => openNoteEditor(index, note));

            const deleteButton = document.createElement("button");
            deleteButton.innerText = "🗑️";
            deleteButton.addEventListener("click", () => deleteTimestamp(index));

            item.appendChild(timestampLink);
            item.appendChild(noteButton);

            if (link) {
                const linkElement = document.createElement("a");
                linkElement.href = link;
                linkElement.innerText = link.length > 30 ? link.substring(0, 27) + "..." : link;
                linkElement.classList.add("timestamp-link");
                linkElement.target = "_blank";
                item.appendChild(linkElement);
            }

            item.appendChild(deleteButton);
            list.appendChild(item);
        });

        timestampContainer.appendChild(list);
        updateStyles(); // Ensure styles refresh after list update
    });
}

// Function to open a note editor popup with theme-aware styles
function openNoteEditor(index, currentNote) {
    const isDarkMode = getYouTubeTheme() === 'dark';
    const editor = document.createElement("div");
    editor.style.position = "fixed";
    editor.style.top = "50%";
    editor.style.left = "50%";
    editor.style.transform = "translate(-50%, -50%)";
    editor.style.backgroundColor = isDarkMode ? "#212121" : "#fff";
    editor.style.padding = "16px";
    editor.style.border = `1px solid ${isDarkMode ? '#3d3d3d' : '#e0e0e0'}`;
    editor.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
    editor.style.zIndex = "1000";
    editor.style.borderRadius = "4px";

    const textarea = document.createElement("textarea");
    textarea.value = currentNote || "";
    textarea.style.width = "300px";
    textarea.style.height = "100px";
    textarea.style.marginBottom = "8px";
    textarea.style.border = `1px solid ${isDarkMode ? '#555' : '#ddd'}`;
    textarea.style.borderRadius = "3px";
    textarea.style.padding = "4px";
    textarea.style.fontSize = "12px";
    textarea.style.background = isDarkMode ? "#333" : "#fff";
    textarea.style.color = isDarkMode ? "#e0e0e0" : "#333";

    const saveButton = document.createElement("button");
    saveButton.innerText = "Save";
    saveButton.style.background = isDarkMode ? "#424242" : "#f5f5f5";
    saveButton.style.color = isDarkMode ? "#e0e0e0" : "#333";
    saveButton.addEventListener("click", () => {
        updateNote(index, textarea.value);
        document.body.removeChild(editor);
    });

    const cancelButton = document.createElement("button");
    cancelButton.innerText = "Cancel";
    cancelButton.style.background = isDarkMode ? "#424242" : "#f5f5f5";
    cancelButton.style.color = isDarkMode ? "#e0e0e0" : "#333";
    cancelButton.addEventListener("click", () => {
        document.body.removeChild(editor);
    });

    editor.appendChild(textarea);
    editor.appendChild(saveButton);
    editor.appendChild(cancelButton);
    document.body.appendChild(editor);
}

// Function to update a note
function updateNote(index, newNote) {
    const videoId = new URL(window.location.href).searchParams.get("v");
    if (!videoId) return;

    chrome.storage.local.get([videoId], (data) => {
        let timestamps = data[videoId] || [];
        if (index >= 0 && index < timestamps.length) {
            timestamps[index].note = newNote;
            chrome.storage.local.set({ [videoId]: timestamps }, () => {
                addTimestampsToList();
            });
        }
    });
}

// Function to delete a timestamp by index
function deleteTimestamp(index) {
    const videoId = new URL(window.location.href).searchParams.get("v");
    if (!videoId) return;

    chrome.storage.local.get([videoId], (data) => {
        let timestamps = data[videoId] || [];
        if (index >= 0 && index < timestamps.length) {
            const { time } = timestamps[index];
            timestamps.splice(index, 1);

            chrome.storage.local.set({ [videoId]: timestamps }, () => {
                removeTimestampMarker(time);
                addTimestampsToList();
            });
        }
    });
}

// Function to remove a timestamp marker from the progress bar
function removeTimestampMarker(time) {
    document.querySelectorAll('.custom-marker').forEach(marker => {
        if (parseFloat(marker.dataset.time) === time) {
            marker.remove();
        }
    });
}

// Function to format time into mm:ss
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

// Start observing the document and ensure theme updates
const observer = new MutationObserver(() => {
    const descriptionContainer = document.getElementById("description-inline-expander");
    if (descriptionContainer) {
        observer.disconnect();
        setupTimestampUI();
        addTimestampsToList();
        loadSavedMarkers();
    }
    updateStyles(); // Refresh styles on DOM changes
});
observer.observe(document.body, { childList: true, subtree: true });

// Periodically check theme in case it changes without attribute update
setInterval(updateStyles, 1000); // Check every second