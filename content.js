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
                top: -40px;
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
    console.log("adding time stamp before check");
    if (!progressBar) return;
    console.log("adding time stamp after check");
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
    console.log("loading the saved markers ************************************");
    const data = JSON.parse(localStorage.getItem(videoId) || '[]');
    data.forEach(({ time, color }) => {
        addTimestampMarker(time, color);
    });
}

function setupTimestampUI() {
    const descriptionContainer = document.getElementById("description-inline-expander");
    if (!descriptionContainer) return;

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
            timeInput.placeholder = "Time in sec";
            headingInput.placeholder = "Heading...";

            if (!isNaN(time)) {
                saveTimestamp(time, color, heading, "", []);
            }
        });

        inputContainer.appendChild(timeInput);
        inputContainer.appendChild(colorInput);
        inputContainer.appendChild(headingInput);
        inputContainer.appendChild(saveButton);
        timestampContainer.appendChild(inputContainer);

        descriptionContainer.prepend(timestampContainer);
    }
}

function removeExistingMarkers() {
    document.querySelectorAll('.custom-marker').forEach(marker => {
        marker.remove();
    });
}

// Function to save timestamp
function saveTimestamp(time, color, heading = "", note = "", links = []) {
    try {
        const videoId = new URL(window.location.href).searchParams.get("v");
        if (!videoId) return;

        const timestamps = JSON.parse(localStorage.getItem(videoId) || '[]');
        const timestampAdded = new Date().toISOString();
        timestamps.push({ time, color, heading, note, links, timestampAdded });

        localStorage.setItem(videoId, JSON.stringify(timestamps));
        addTimestampMarker(time, color);
        addTimestampsToList();
    } catch (error) {
        console.error("Error in saveTimestamp function:", error);
    }
}

// Function to list saved timestamps
async function addTimestampsToList() {
    try {
        const videoId = new URL(window.location.href).searchParams.get("v");
        if (!videoId) return;

        const timestampContainer = document.getElementById("custom-timestamps");
        if (!timestampContainer) return;

        const oldList = document.getElementById("timestampList");
        if (oldList) oldList.remove();

        const list = document.createElement("ul");
        list.id = "timestampList";

        const timestamps = JSON.parse(localStorage.getItem(videoId) || '[]');
        timestamps.forEach(({ time, color, heading, note, links }, index) => {
            const item = document.createElement("li");
            item.style.display = "flex";
            item.style.justifyContent = "space-between";
            item.style.alignItems = "center";
            item.style.gap = "8px";
            item.style.marginBottom = "6px";
            item.style.padding = "4px 0";

            const timestampLink = document.createElement("a");
            timestampLink.href = "#";
            timestampLink.innerText = `${index + 1}. ${formatTime(time)}`;
            timestampLink.style.color = color;
            timestampLink.style.fontWeight = "bolder";
            timestampLink.addEventListener("click", (e) => {
                e.preventDefault();
                const video = document.querySelector("video");
                if (video) video.currentTime = time;
            });

            const rightContainer = document.createElement("div");
            rightContainer.style.display = "flex";
            rightContainer.style.alignItems = "center";
            rightContainer.style.gap = "8px";

            const headingElement = document.createElement("strong");
            headingElement.innerText = heading || "No heading";
            headingElement.style.color = color;
            headingElement.style.whiteSpace = "nowrap";

            const noteButton = document.createElement("button");
            noteButton.innerText = "Notes";
            noteButton.addEventListener("click", () => openNotesEditor(index, note));

            const linksButton = document.createElement("button");
            linksButton.innerText = "Links";
            linksButton.addEventListener("click", () => openLinksEditor(index, [...links]));

            const deleteButton = document.createElement("button");
            deleteButton.innerText = "🗑️";
            deleteButton.addEventListener("click", () => deleteTimestamp(index));

            rightContainer.appendChild(noteButton);
            rightContainer.appendChild(linksButton);
            rightContainer.appendChild(deleteButton);

            item.appendChild(timestampLink);
            item.appendChild(headingElement);
            item.appendChild(rightContainer);
            list.appendChild(item);
        });

        timestampContainer.appendChild(list);
    } catch (error) {
        console.error("Error in addTimestampsToList:", error);
    }
}

function openLinksEditor(index, currentLinks) {
    const isDarkMode = document.documentElement.getAttribute("dark") !== null;

    let editor = document.querySelector(`#links-editor-${index}`);
    if (editor) {
        updateLinksList(editor, currentLinks);
        return;
    }

    editor = document.createElement("div");
    editor.id = `links-editor-${index}`;
    editor.innerHTML = `
        <style>
            #links-editor-${index} {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background-color: ${isDarkMode ? '#212121' : '#fff'};
                padding: 20px;
                border: 1px solid ${isDarkMode ? '#3d3d3d' : '#e0e0e0'};
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                z-index: 1000;
                border-radius: 8px;
                width: 320px;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 12px;
            }
            #links-editor-${index} button.close {
                position: absolute;
                top: 10px;
                right: 10px;
                background: transparent;
                border: none;
                color: ${isDarkMode ? '#e0e0e0' : '#333'};
                font-size: 16px;
                cursor: pointer;
                padding: 4px;
                transition: color 0.2s;
            }
            #links-editor-${index} button.close:hover {
                color: ${isDarkMode ? '#fff' : '#000'};
            }
            #links-editor-${index} button.close:active {
                color: ${isDarkMode ? '#e0e0e0' : '#333'};
            }
            #links-editor-${index} .links-container {
                width: 100%;
                max-height: 200px;
                overflow-y: auto;
                margin-top: 20px;
            }
            #links-editor-${index} ul {
                list-style: none;
                padding: 0;
                margin: 0;
            }
            #links-editor-${index} li {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
                padding: 4px 0;
            }
            #links-editor-${index} a.timestamp-link {
                color: ${isDarkMode ? '#8ab4f8' : '#007BFF'};
                text-decoration: none;
                font-size: 14px;
                flex-grow: 1;
            }
            #links-editor-${index} a.timestamp-link:hover {
                text-decoration: underline;
            }
            #links-editor-${index} button.remove {
                background: ${isDarkMode ? '#D32F2F' : '#B71C1C'};
                color: #fff;
                border: none;
                padding: 4px 10px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                transition: background 0.2s;
            }
            #links-editor-${index} button.remove:hover {
                background: ${isDarkMode ? '#C62828' : '#9A0007'};
            }
            #links-editor-${index} button.remove:active {
                background: ${isDarkMode ? '#D32F2F' : '#B71C1C'};
            }
            #links-editor-${index} input {
                width: 100%;
                padding: 6px 8px;
                border: 1px solid ${isDarkMode ? '#555' : '#ccc'};
                border-radius: 6px;
                font-size: 14px;
                background: ${isDarkMode ? '#333' : '#fff'};
                color: ${isDarkMode ? '#e0e0e0' : '#333'};
                outline: none;
            }
            #links-editor-${index} button.add-link {
                background: ${isDarkMode ? '#4CAF50' : '#388E3C'};
                color: #fff;
                border: none;
                padding: 8px 12px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                transition: background 0.2s;
            }
            #links-editor-${index} button.add-link:hover {
                background: ${isDarkMode ? '#45A049' : '#2E7D32'};
            }
            #links-editor-${index} button.add-link:active {
                background: ${isDarkMode ? '#4CAF50' : '#388E3C'};
            }
            #links-editor-${index} .no-links-alert {
                color: ${isDarkMode ? '#f44336' : '#d32f2f'};
                font-size: 12px;
                text-align: center;
                margin-bottom: 10px;
            }
        </style>
        <button class="close">×</button>
        <div class="links-container"></div>
        <input type="url" placeholder="Add a new link...">
        <button class="add-link">Add Link</button>
    `;

    document.body.appendChild(editor);

    const linksContainer = editor.querySelector('.links-container');
    const newLinkInput = editor.querySelector('input');
    const addLinkButton = editor.querySelector('.add-link');
    const closeButton = editor.querySelector('.close');

    function updateLinksList(container, links) {
        const linksList = container.querySelector("ul") || document.createElement("ul");
        linksList.innerHTML = "";

        links.forEach((link, linkIndex) => {
            const li = document.createElement("li");
            li.innerHTML = `
                <a href="${link}" target="_blank" class="timestamp-link">${link.length > 30 ? link.substring(0, 27) + "..." : link}</a>
                <button class="remove">Remove</button>
            `;

            const removeButton = li.querySelector('.remove');
            removeButton.addEventListener("click", () => {
                links.splice(linkIndex, 1);
                updateLinksList(container, links);
                updateLinks(index, links);
            });

            linksList.appendChild(li);
        });

        if (links.length === 0) {
            const alertDiv = document.createElement("div");
            alertDiv.className = "no-links-alert";
            alertDiv.textContent = "No links added yet.";
            container.innerHTML = "";
            container.appendChild(alertDiv);
        } else {
            container.innerHTML = "";
            container.appendChild(linksList);
        }
    }

    updateLinksList(linksContainer, currentLinks);

    addLinkButton.addEventListener("click", () => {
        if (newLinkInput.value.trim()) {
            currentLinks.push(newLinkInput.value.trim());
            newLinkInput.value = "";
            updateLinksList(linksContainer, currentLinks);
            updateLinks(index, currentLinks);
        }
    });

    closeButton.addEventListener("click", () => {
        editor.remove();
    });
}

// Function to update a timestamp's links
function updateLinks(index, newLinks) {
    const videoId = new URL(window.location.href).searchParams.get("v");
    if (!videoId) return;

    try {
        let timestamps = JSON.parse(localStorage.getItem(videoId) || '[]');
        if (index >= 0 && index < timestamps.length) {
            timestamps[index].links = newLinks;
            localStorage.setItem(videoId, JSON.stringify(timestamps));
            addTimestampsToList();
        }
    } catch (error) {
        console.error("Error updating links:", error);
    }
}

// Function to update a timestamp's note
function updateNote(index, newNote) {
    const videoId = new URL(window.location.href).searchParams.get("v");
    if (!videoId) return;

    try {
        let timestamps = JSON.parse(localStorage.getItem(videoId) || '[]');
        if (index >= 0 && index < timestamps.length) {
            timestamps[index].note = newNote;
            localStorage.setItem(videoId, JSON.stringify(timestamps));
            addTimestampsToList();
        }
    } catch (error) {
        console.error("Error updating note:", error);
    }
}

// Function to delete a timestamp by index
function deleteTimestamp(index) {
    const videoId = new URL(window.location.href).searchParams.get("v");
    if (!videoId) return;

    try {
        let timestamps = JSON.parse(localStorage.getItem(videoId) || '[]');
        if (index >= 0 && index < timestamps.length) {
            const { time } = timestamps[index];
            timestamps.splice(index, 1);
            localStorage.setItem(videoId, JSON.stringify(timestamps));
            removeTimestampMarker(time);
            addTimestampsToList();
        }
    } catch (error) {
        console.error("Error deleting timestamp:", error);
    }
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
function openNotesEditor(index, currentNote) {
    const isDarkMode = document.documentElement.getAttribute("dark") !== null;

    let editor = document.querySelector(`#notes-editor-${index}`);
    if (editor) return;

    editor = document.createElement("div");
    editor.id = `notes-editor-${index}`;
    editor.innerHTML = `
        <style>
            #notes-editor-${index} {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background-color: ${isDarkMode ? '#212121' : '#fff'};
                padding: 20px;
                border: 1px solid ${isDarkMode ? '#3d3d3d' : '#e0e0e0'};
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                z-index: 1000;
                border-radius: 8px;
                width: 320px;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 12px;
            }
            #notes-editor-${index} button.close {
                position: absolute;
                top: 10px;
                right: 10px;
                background: transparent;
                border: none;
                color: ${isDarkMode ? '#e0e0e0' : '#333'};
                font-size: 16px;
                cursor: pointer;
                padding: 4px;
                transition: color 0.2s;
            }
            #notes-editor-${index} button.close:hover {
                color: ${isDarkMode ? '#fff' : '#000'};
            }
            #notes-editor-${index} button.close:active {
                color: ${isDarkMode ? '#e0e0e0' : '#333'};
            }
            #notes-editor-${index} input.topic-input {
                width: 100%;
                padding: 6px 8px;
                border: 1px solid ${isDarkMode ? '#555' : '#ccc'};
                border-radius: 6px;
                font-size: 14px;
                background: ${isDarkMode ? '#333' : '#fff'};
                color: ${isDarkMode ? '#e0e0e0' : '#333'};
                outline: none;
                margin-top: 8px;
            }
            #notes-editor-${index} textarea {
                width: 100%;
                height: 120px;
                padding: 6px 8px;
                border: 1px solid ${isDarkMode ? '#555' : '#ccc'};
                border-radius: 6px;
                font-size: 14px;
                background: ${isDarkMode ? '#333' : '#fff'};
                color: ${isDarkMode ? '#e0e0e0' : '#333'};
                outline: none;
                resize: vertical;
                margin-top: 14px;
            }
            #notes-editor-${index} .button-container {
                display: flex;
                gap: 8px;
                width: 100%;
                justify-content: center;
            }
            #notes-editor-${index} button.save, #notes-editor-${index} button.generate {
                background: ${isDarkMode ? '#4CAF50' : '#388E3C'};
                color: #fff;
                border: none;
                padding: 8px 12px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                transition: background 0.2s;
            }
            #notes-editor-${index} button.save:hover, #notes-editor-${index} button.generate:hover {
                background: ${isDarkMode ? '#45A049' : '#2E7D32'};
            }
            #notes-editor-${index} button.save:active, #notes-editor-${index} button.generate:active {
                background: ${isDarkMode ? '#4CAF50' : '#388E3C'};
            }
        </style>
        <button class="close">×</button>
        <input class="topic-input" type="text" placeholder="Add topic to generate">
        <textarea placeholder="Add your notes here...">${currentNote || ''}</textarea>
        <div class="button-container">
            <button class="save">Save Note</button>
            <button class="generate">Generate</button>
        </div>
    `;

    document.body.appendChild(editor);

    const closeButton = editor.querySelector('.close');
    const saveButton = editor.querySelector('.save');
    const generateButton = editor.querySelector('.generate');
    const textarea = editor.querySelector('textarea');
    const topicInput = editor.querySelector('.topic-input');

    closeButton.addEventListener("click", () => {
        editor.remove();
    });

    saveButton.addEventListener("click", () => {
        const newNote = textarea.value.trim();
        updateNote(index, newNote);
        editor.remove();
    });

    generateButton.addEventListener("click", () => {
        const topic = topicInput.value.trim();
        if (topic) {
            const notes = generateManualNotes(topic);
            textarea.value = notes;
            topicInput.value = ""; // Clear the input after generating
        }
    });
}
function runFunctions() {
    console.log("Running functions after navigation or reload...");
    addTimestampsToList();
    setupTimestampUI();
    removeExistingMarkers();
    loadSavedMarkers();
}

window.addEventListener("yt-navigate-finish", () => {
    console.log("YouTube navigation detected (yt-navigate-finish)");
    runFunctions();
});

const titleObserver = new MutationObserver(() => {
    console.log("Title changed, indicating navigation");
    runFunctions();
});

const titleElement = document.querySelector("title");
if (titleElement) {
    titleObserver.observe(titleElement, { childList: true });
}

window.addEventListener("load", () => {
    console.log("Page fully reloaded");
    runFunctions();
});

runFunctions();