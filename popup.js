document.getElementById("addTimestamp").addEventListener("click", async () => {
    const time = parseFloat(document.getElementById("timestamp").value);
    const color = document.getElementById("colorPicker").value;

    if (!isNaN(time)) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.id) {
            chrome.tabs.sendMessage(tab.id, { action: "addTimestamp", time, color });
        }
    }
});
