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
            width: 3px;
            height: 28px;
            pointer-events: none;
            transition: opacity 0.2s ease;
            box-shadow: 1px 1px 6px #191919;
            top: -15.5px;
        }
        #custom-timestamps {
            padding: 8px;
            border: 1px solid ${isDarkMode ? '#3d3d3d' : '#e0e0e0'};
            margin-bottom: 12px;
            background: ${isDarkMode ? '#212121' : '#fafafa'};
            font-size: 12px;
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
        #custom-timestamps input[type="text"] {
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
            font-size: 12px;
            margin-top: 8px;
        }
        #timestampList > li {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 12px;
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
        #marker-tooltip {
            position: absolute;
            top: -40px; /* Above the progress bar */
            left: 50%;
            transform: translateX(-50%);
            background: ${isDarkMode ? '#333' : '#fff'};
            color: ${isDarkMode ? '#e0e0e0' : '#333'};
            padding: 6px 10px;
            border: 1px solid ${isDarkMode ? '#555' : '#ccc'};
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
            z-index: 1001;
            opacity: 0;
            transition: opacity 0.2s ease;
            white-space: nowrap;
            pointer-events: none;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        #marker-tooltip.visible {
            opacity: 1;
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

        const headingInput = document.createElement("input");
        headingInput.type = "text";
        headingInput.placeholder = "Heading...";
        headingInput.id = "headingInput";

        const saveButton = document.createElement("button");
        saveButton.innerText = "Save Marker";
        saveButton.addEventListener("click", () => {
            const time = parseFloat(timeInput.value);
            const color = colorInput.value;
            const heading = headingInput.value.trim();

            if (!isNaN(time)) {
                saveTimestamp(time, color, heading, "", []); // Default empty note and array of links
            }
        });

        inputContainer.appendChild(timeInput);
        inputContainer.appendChild(colorInput);
        inputContainer.appendChild(headingInput);
        inputContainer.appendChild(saveButton);
        timestampContainer.appendChild(inputContainer);

        descriptionContainer.prepend(timestampContainer);
        console.log("Added timestamp UI at the top of description-inline-expander.");
    }
    updateStyles(); // Ensure styles are applied after UI setup
}

// Function to save timestamp (with optional heading, note, and links, defaulting to empty)
function saveTimestamp(time, color, heading = "", note = "", links = []) {
    const videoId = new URL(window.location.href).searchParams.get("v");
    if (!videoId) return;

    chrome.storage.local.get([videoId], (data) => {
        const timestamps = data[videoId] || [];
        timestamps.push({ time, color, heading, note, links });

        chrome.storage.local.set({ [videoId]: timestamps }, () => {
            addTimestampMarker(time, color);
            addTimestampsToList();
        });
    });
}

// Function to list saved timestamps with headings, notes, and links editable
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

        (data[videoId] || []).forEach(({ time, color, heading, note, links }, index) => {
            const item = document.createElement("li");
            item.style.display = "flex";
            item.style.justifyContent = "space-between"; // Push elements to left and right extremes
            item.style.alignItems = "center";
            item.style.gap = "8px"; // Small gap between groups
            item.style.marginBottom = "6px";
            item.style.padding = "4px 0"; // Slight padding for better spacing

            const timestampLink = document.createElement("a");
            timestampLink.href = "#"; // Use # to prevent navigation
            timestampLink.innerText = `\u{1F7E2} ${formatTime(time)}`; // Using Unicode for 🟢
            timestampLink.style.color = color;
            timestampLink.addEventListener("click", (e) => {
                e.preventDefault(); // Prevent default navigation/reload
                const video = document.querySelector("video");
                if (video) {
                    video.currentTime = time; // Jump to timestamp without page reload
                }
            });

            // Right side: Heading, Notes, Links, Delete (extreme right)
            const rightContainer = document.createElement("div");
            rightContainer.style.display = "flex";
            rightContainer.style.alignItems = "center";
            rightContainer.style.gap = "8px"; // Gap between right-side elements

            const headingElement = document.createElement("strong");
            headingElement.innerText = heading || "No heading";
            headingElement.style.color = color;
            headingElement.style.whiteSpace = "nowrap"; // Prevent heading from wrapping

            const noteButton = document.createElement("button");
            noteButton.innerText = "Notes";
            noteButton.addEventListener("click", () => openNotesEditor(index, note));

            const linksButton = document.createElement("button");
            linksButton.innerText = "Links";
            linksButton.addEventListener("click", () => openLinksEditor(index, [...links])); // Pass a copy of links

            const deleteButton = document.createElement("button");
            deleteButton.innerText = "🗑️";
            deleteButton.addEventListener("click", () => deleteTimestamp(index));

            // rightContainer.appendChild(headingElement);
            rightContainer.appendChild(noteButton);
            rightContainer.appendChild(linksButton);
            rightContainer.appendChild(deleteButton);

            item.appendChild(timestampLink);
            item.appendChild(headingElement);
            item.appendChild(rightContainer);
            list.appendChild(item);
        });

        timestampContainer.appendChild(list);
        updateStyles(); // Ensure styles refresh after list update
    });
}
// Function to open a notes editor popup with theme-aware styles (notes only)
function openNotesEditor(index, currentNote) {
    const isDarkMode = document.documentElement.getAttribute("dark") !== null;

    // Check if an editor already exists for this index to reuse or recreate
    let editor = document.querySelector(`#notes-editor-${index}`);
    if (editor) {
        // Update the existing editor with the current note
        const noteInput = editor.querySelector("textarea");
        if (noteInput) noteInput.value = currentNote || "";
        return;
    }

    // Create new editor if it doesn’t exist
    editor = document.createElement("div");
    editor.id = `notes-editor-${index}`; // Unique ID for each timestamp's editor
    editor.style.position = "fixed";
    editor.style.top = "50%";
    editor.style.left = "50%";
    editor.style.transform = "translate(-50%, -50%)";
    editor.style.backgroundColor = isDarkMode ? "#212121" : "#fff";
    editor.style.padding = "20px";
    editor.style.border = `1px solid ${isDarkMode ? '#3d3d3d' : '#e0e0e0'}`;
    editor.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
    editor.style.zIndex = "1000";
    editor.style.borderRadius = "8px";
    editor.style.width = "320px";
    editor.style.display = "flex";
    editor.style.flexDirection = "column";
    editor.style.alignItems = "center";
    editor.style.gap = "12px";

    // Close Button (×) at top right
    const closeButton = document.createElement("button");
    closeButton.innerText = "×";
    closeButton.style.position = "absolute";
    closeButton.style.top = "10px";
    closeButton.style.right = "10px";
    closeButton.style.background = "transparent";
    closeButton.style.border = "none";
    closeButton.style.color = isDarkMode ? "#e0e0e0" : "#333";
    closeButton.style.fontSize = "16px";
    closeButton.style.cursor = "pointer";
    closeButton.style.padding = "4px";
    closeButton.style.transition = "color 0.2s";
    closeButton.onmouseover = () => closeButton.style.color = isDarkMode ? "#fff" : "#000";
    closeButton.onmouseleave = () => closeButton.style.color = isDarkMode ? "#e0e0e0" : "#333";
    closeButton.addEventListener("click", () => {
        document.body.removeChild(editor);
    });
    editor.appendChild(closeButton);

    // Note Input (Textarea) with improved alignment
    const noteInput = document.createElement("textarea");
    noteInput.value = currentNote || "";
    noteInput.style.width = "100%";
    noteInput.style.minHeight = "120px"; // Slightly taller for better visibility
    noteInput.style.border = `1px solid ${isDarkMode ? '#555' : '#ccc'}`;
    noteInput.style.borderRadius = "6px";
    noteInput.style.padding = "10px"; // Increased padding for better spacing
    noteInput.style.fontSize = "14px";
    noteInput.style.background = isDarkMode ? "#333" : "#fff";
    noteInput.style.color = isDarkMode ? "#e0e0e0" : "#333";
    noteInput.style.outline = "none";
    noteInput.style.resize = "vertical"; // Allow vertical resizing only
    noteInput.style.boxShadow = "inset 0 1px 3px rgba(0,0,0,0.1)";
    noteInput.style.marginTop = "20px"; // Adjust for close button
    noteInput.style.lineHeight = "1.5"; // Better readability

    // Save Button
    const saveButton = document.createElement("button");
    saveButton.innerText = "Save";
    saveButton.style.background = isDarkMode ? "#4CAF50" : "#388E3C";
    saveButton.style.color = "#fff";
    saveButton.style.border = "none";
    saveButton.style.padding = "10px 16px";
    saveButton.style.borderRadius = "6px";
    saveButton.style.cursor = "pointer";
    saveButton.style.fontSize = "14px";
    saveButton.style.transition = "background 0.2s";
    saveButton.onmouseover = () => saveButton.style.background = isDarkMode ? "#45A049" : "#2E7D32";
    saveButton.onmouseleave = () => saveButton.style.background = isDarkMode ? "#4CAF50" : "#388E3C";

    saveButton.addEventListener("click", () => {
        updateNote(index, noteInput.value);
        document.body.removeChild(editor);
    });

    // Append everything
    editor.appendChild(noteInput);
    editor.appendChild(saveButton);
    document.body.appendChild(editor);
}


// Function to open a links editor popup with theme-aware styles (multiple links)
function openLinksEditor(index, currentLinks) {
    const isDarkMode = document.documentElement.getAttribute("dark") !== null;

    // Check if an editor already exists for this index to reuse or recreate
    let editor = document.querySelector(`#links-editor-${index}`);
    if (editor) {
        // Update the existing editor with new links
        updateLinksList(editor, currentLinks);
        return;
    }

    // Create new editor if it doesn’t exist
    editor = document.createElement("div");
    editor.id = `links-editor-${index}`; // Unique ID for each timestamp's editor
    editor.style.position = "fixed";
    editor.style.top = "50%";
    editor.style.left = "50%";
    editor.style.transform = "translate(-50%, -50%)";
    editor.style.backgroundColor = isDarkMode ? "#212121" : "#fff";
    editor.style.padding = "20px";
    editor.style.border = `1px solid ${isDarkMode ? '#3d3d3d' : '#e0e0e0'}`;
    editor.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
    editor.style.zIndex = "1000";
    editor.style.borderRadius = "8px";
    editor.style.width = "320px";
    editor.style.display = "flex";
    editor.style.flexDirection = "column";
    editor.style.alignItems = "center";
    editor.style.gap = "12px";

    // Close Button (×) at top right
    const closeButton = document.createElement("button");
    closeButton.innerText = "×";
    closeButton.style.position = "absolute";
    closeButton.style.top = "10px";
    closeButton.style.right = "10px";
    closeButton.style.background = "transparent";
    closeButton.style.border = "none";
    closeButton.style.color = isDarkMode ? "#e0e0e0" : "#333";
    closeButton.style.fontSize = "16px";
    closeButton.style.cursor = "pointer";
    closeButton.style.padding = "4px";
    closeButton.style.transition = "color 0.2s";
    closeButton.onmouseover = () => closeButton.style.color = isDarkMode ? "#fff" : "#000";
    closeButton.onmouseleave = () => closeButton.style.color = isDarkMode ? "#e0e0e0" : "#333";
    closeButton.addEventListener("click", () => {
        document.body.removeChild(editor);
    });
    editor.appendChild(closeButton);

    // Links List Container
    const linksContainer = document.createElement("div");
    linksContainer.style.width = "100%";
    linksContainer.style.maxHeight = "200px";
    linksContainer.style.overflowY = "auto";
    linksContainer.style.marginTop = "20px"; // Adjust for close button

    // Function to update the links list in the editor
    function updateLinksList(container, links) {
        const linksList = container.querySelector("ul") || document.createElement("ul");
        linksList.style.listStyle = "none";
        linksList.style.padding = "0";
        linksList.style.margin = "0";
        linksList.innerHTML = ""; // Clear existing list

        links.forEach((link, linkIndex) => {
            const li = document.createElement("li");
            li.style.display = "flex";
            li.style.justifyContent = "space-between"; // Space between link and remove button
            li.style.alignItems = "center";
            li.style.marginBottom = "8px";
            li.style.padding = "4px 0"; // Slight padding for better spacing

            const linkText = document.createElement("a");
            linkText.href = link;
            linkText.innerText = link.length > 30 ? link.substring(0, 27) + "..." : link;
            linkText.classList.add("timestamp-link");
            linkText.target = "_blank";
            linkText.style.color = isDarkMode ? "#8ab4f8" : "#007BFF";
            linkText.style.textDecoration = "none";
            linkText.style.fontSize = "14px";
            linkText.style.flexGrow = "1"; // Allow link to grow and push remove button to the right

            const removeButton = document.createElement("button");
            removeButton.innerText = "Remove";
            removeButton.style.background = isDarkMode ? "#D32F2F" : "#B71C1C";
            removeButton.style.color = "#fff";
            removeButton.style.border = "none";
            removeButton.style.padding = "4px 10px";
            removeButton.style.borderRadius = "4px";
            removeButton.style.cursor = "pointer";
            removeButton.style.fontSize = "12px";
            removeButton.style.transition = "background 0.2s";
            removeButton.onmouseover = () => removeButton.style.background = isDarkMode ? "#C62828" : "#9A0007";
            removeButton.onmouseleave = () => removeButton.style.background = isDarkMode ? "#D32F2F" : "#B71C1C";
            removeButton.addEventListener("click", () => {
                links.splice(linkIndex, 1); // Remove only the specific link
                updateLinksList(linksContainer, links); // Update the list in the current editor
                updateLinks(index, links); // Automatically save the updated links
            });

            li.appendChild(linkText);
            li.appendChild(removeButton);
            linksList.appendChild(li);
        });

        if (!container.querySelector("ul")) {
            container.appendChild(linksList);
        }
    }

    // Initial update of links list
    updateLinksList(linksContainer, currentLinks);

    // New Link Input
    const newLinkInput = document.createElement("input");
    newLinkInput.type = "url";
    newLinkInput.placeholder = "Add a new link...";
    newLinkInput.style.width = "100%";
    newLinkInput.style.padding = "6px 8px";
    newLinkInput.style.border = `1px solid ${isDarkMode ? '#555' : '#ccc'}`;
    newLinkInput.style.borderRadius = "6px";
    newLinkInput.style.fontSize = "14px";
    newLinkInput.style.background = isDarkMode ? "#333" : "#fff";
    newLinkInput.style.color = isDarkMode ? "#e0e0e0" : "#333";
    newLinkInput.style.outline = "none";

    // Add Link Button
    const addLinkButton = document.createElement("button");
    addLinkButton.innerText = "Add Link";
    addLinkButton.style.background = isDarkMode ? "#4CAF50" : "#388E3C";
    addLinkButton.style.color = "#fff";
    addLinkButton.style.border = "none";
    addLinkButton.style.padding = "8px 12px";
    addLinkButton.style.borderRadius = "6px";
    addLinkButton.style.cursor = "pointer";
    addLinkButton.style.fontSize = "14px";
    addLinkButton.style.transition = "background 0.2s";
    addLinkButton.onmouseover = () => addLinkButton.style.background = isDarkMode ? "#45A049" : "#2E7D32";
    addLinkButton.onmouseleave = () => addLinkButton.style.background = isDarkMode ? "#4CAF50" : "#388E3C";
    addLinkButton.addEventListener("click", () => {
        if (newLinkInput.value.trim()) {
            currentLinks.push(newLinkInput.value.trim());
            newLinkInput.value = "";
            updateLinksList(linksContainer, currentLinks); // Append new link to the existing list
            updateLinks(index, currentLinks); // Automatically save the updated links
        }
    });

    // Append everything
    editor.appendChild(linksContainer);
    editor.appendChild(newLinkInput);
    editor.appendChild(addLinkButton);
    document.body.appendChild(editor);

    // Alert if no links exist
    if (currentLinks.length === 0) {
        const alertDiv = document.createElement("div");
        alertDiv.innerText = "No links added yet.";
        alertDiv.style.color = isDarkMode ? "#f44336" : "#d32f2f"; // Red for alert
        alertDiv.style.fontSize = "12px";
        alertDiv.style.textAlign = "center";
        alertDiv.style.marginBottom = "10px";
        linksContainer.appendChild(alertDiv);
    }
}

// Function to update a timestamp's note
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

// Function to update a timestamp's links
function updateLinks(index, newLinks) {
    const videoId = new URL(window.location.href).searchParams.get("v");
    if (!videoId) return;

    chrome.storage.local.get([videoId], (data) => {
        let timestamps = data[videoId] || [];
        if (index >= 0 && index < timestamps.length) {
            timestamps[index].links = newLinks;
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
    return `${minutes}:${secs.toString().padStart(2, "0")}`; // Fixed syntax
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