function parseSchedule() {
    const iframes = document.getElementsByTagName("iframe");
    if (iframes) {
        const iframe = iframes[0]
        const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;

        const shifts = iframeDocument.getElementsByClassName('shiftdisplay');
        console.log(shifts);
        const jobElements = [];
        shiftElements = Array.from(shifts)
        shiftElements.forEach((shiftElement) => {
            const jobsWithinShift = shiftElement.getElementsByClassName('jobdisplay');
            jobElements.push(...jobsWithinShift);
        });
    }
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "runScript") {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs.length > 0) {
                if (!tabs[0].url.match(".*\.jdadelivers\.com\/")){
                    console.log("This extension works only on jdadelivers pages");
                }
            }
            chrome.scripting.executeScript({
                target: {tabId: tabs[0].id},
                func: parseSchedule,
            });
        });
    }
});
