function parseSchedule() {
    function getHoursAndMinutes(timeString) {
        const [time, ampm] = timeString.trim().split(' ');
        let [hours, minutes] = time.split(':').map(part => parseInt(part.trim()));
        if (ampm.trim() === 'pm' && hours < 12) {
            hours += 12;
        }
        return [hours, minutes];
    }

    function getShiftDivs(shift) {
        if (!shift) return [
            [],
            []
        ];
        const jobs = shift.getElementsByClassName('jobdisplay');
        const [headerBlock, descBlock] = Array.from(jobs)
            .map(job => Array.from(job.getElementsByTagName('div')).map(div => div.innerText));
        return [headerBlock, descBlock];
    }

    function createTemplate(weekStarting, shifts) {
        const eventTemplate = 'BEGIN:VEVENT\nDTSTART;TZID=America/Vancouver:{dtstart}\nDTEND;TZID=America/Vancouver:{dtend}\nSUMMARY:{summary}\nLOCATION:{location}\nEND:VEVENT\n';
        const icsTemplate = 'BEGIN:VCALENDAR\nPRODID:< {id_info} >\n{header_info}\n{events}\nEND:VCALENDAR';

        const events = shifts.map(shift => {
            const icsEvent = eventTemplate;
            const [shiftStart, shiftEnd, shiftRole, shiftDesc] = shift
            const shiftLocation = shiftDesc[0];
            const shiftHours = shiftDesc[shiftDesc.length - 1];
            const description = `${shiftRole} ${shiftHours}`;

            return icsEvent
                .replace('{dtstart}', shiftStart)
                .replace('{dtend}', shiftEnd)
                .replace('{summary}', description)
                .replace('{location}', shiftLocation);
        });

        const icsContent = icsTemplate
            .replace('{id_info}', Math.floor(Math.random() * Date.now()).toString())
            .replace('{header_info}', `Schedule for week ${weekStarting.toString()}`)
            .replace('{events}', events.join(''));
        console.log(icsContent);
        console.log(weekStarting);
        const icsFile = new File([icsContent], `${weekStarting.toString().slice(0, 10)}.ics`);
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(icsFile);
        downloadLink.download = icsFile.name;
        downloadLink.click();
    }

    function dateTimeString(d, hours, minutes){
        //"%Y%m%dT%H%M%SZ"

        return `${d.getFullYear()}${addLeadingZero(d.getMonth() + 1)}${addLeadingZero(d.getDate())}T${addLeadingZero(hours)}${addLeadingZero(minutes)}00Z`;
    }

    function addLeadingZero(num){
        if (num < 10) {
            return '0' + num;
        }
        return num;
    }

    const iframes = document.getElementsByTagName("iframe");
    if (iframes.length) {
        const iframe = iframes[0];
        const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;

        const rows = iframeDocument.querySelectorAll("[id$='scheduledHoursRow']");
        const calendarInput = iframeDocument.querySelector("[id^='textfield'] input")?.value;

        let dates = []
        if (calendarInput) {
            const weekDates = calendarInput.match(/\d{2}\/\d{2}\/\d{4}/g);

            const [startDate, endDate] = weekDates.map(dateStr => {
                const [day, month, year] = dateStr.split('/').map(Number);
                return new Date(year, month - 1, day);
            });

            for (let date = startDate; date <= endDate; date = new Date(date.getTime() + 24 * 60 * 60 * 1000)) {
                dates.push(new Date(date));
            }
            console.log(dates);
        }

        let cells = rows[0]?.getElementsByTagName("td");
        if (!cells.length || dates.length < 7 || cells.length < 7) {
            console.log("Something went wrong. Not enough data for the schedule building");
            console.log(rows, cells, dates);
        }

        const shifts = [];
        cells = Array.from(cells).slice(1);

        let shift = [];
        console.log(cells);
        for (let i = 0; i < 7; i++) {

            shift = cells[i]?.getElementsByClassName('shiftdisplay');

            if (shift.length) {
                const [headerBlock, descBlock] = getShiftDivs(shift[0]);
                const [shiftTime, shiftRole] = headerBlock;
                const [timeStart, timeEnd] = shiftTime.split('-');
                const [timeStartHours, timeStartMinutes] = getHoursAndMinutes(timeStart);
                const [timeEndHours, timeEndMinutes] = getHoursAndMinutes(timeEnd);

                const shiftDate = dates[i];
                const shiftStart = dateTimeString(shiftDate, timeStartHours, timeStartMinutes);
                const shiftEnd = dateTimeString(shiftDate, timeEndHours, timeEndMinutes);

                shifts.push([shiftStart, shiftEnd, shiftRole, descBlock]);
            }
        }

        console.log(shifts);
        createTemplate(dates[0], shifts);
    }
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "runScript") {
        chrome.tabs.query({
            active: true,
            currentWindow: true
        }, function(tabs) {
            if (tabs.length > 0) {
                if (!tabs[0].url.match(".*\.jdadelivers\.com\/")) {
                    console.log("This extension works only on jdadelivers pages");
                }

                chrome.scripting.executeScript({
                    target: {
                        tabId: tabs[0].id
                    },
                    func: parseSchedule,
                });
            }
        });
    }
});