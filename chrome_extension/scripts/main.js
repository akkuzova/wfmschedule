document.getElementById('load_schedule_btn').addEventListener('click', function () {
    chrome.runtime.sendMessage({action: "runScript"});
});