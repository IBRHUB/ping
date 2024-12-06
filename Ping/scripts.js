// Toggle dark/light mode
const themeToggleButton = document.getElementById('themeToggle');
themeToggleButton.addEventListener('change', () => {
    document.body.classList.toggle('dark-mode');
});

function currentTimeMillis() {
    return (new Date()).getTime();
}

async function fetchUrl(url, supportsCors, abortController) {
    const OPTS = {
        signal: abortController.signal,
        'cache': 'no-store',
        'credentials': 'omit',
        'redirect': 'error'
    };
    if (supportsCors) {
        await fetch(url, OPTS);
    } else {
        try {
            await fetch(url, OPTS);
        } catch (e) {
            if (e instanceof TypeError) {
                console.error('Ignoring error, which should be a CORS error');
            } else {
                throw e;
            }
        }
    }
}

async function doBox(box) {
    let timedOut = false;
    try {
        const abortController = new AbortController();
        const timeoutId = setTimeout(() => {
            timedOut = true;
            abortController.abort();
        }, 5 * 1000);
        const pingUrl = box.getAttribute('pingUrl');
        const supportsCors = box.getAttribute('supportsCors') !== 'false';
        box.innerHTML = 'connecting';
        await fetchUrl(pingUrl, supportsCors, abortController);
        box.innerHTML = 'pinging';
        const startTime = currentTimeMillis();
        await fetchUrl(pingUrl, supportsCors, abortController);
        const endTime = currentTimeMillis();
        const elapsed = endTime - startTime;
        box.innerHTML = elapsed.toString() + ' ms';
        clearTimeout(timeoutId);
    } catch (e) {
        if (timedOut && e instanceof DOMException && (e.name === 'AbortError')) {
            box.innerHTML = 'timeout';
        } else {
            console.error(e);
            box.innerHTML = 'error';
        }
    }
}

async function worker(boxes) {
    while (true) {
        let box = boxes.pop();
        if (box === undefined) {
            break;
        }
        await doBox(box);
    }
}

const pingButton = document.getElementById('pingButton');
pingButton.addEventListener('click', async function () {
    pingButton.setAttribute('disabled', 'disabled');
    let latencyBoxes = Array.from(document.querySelectorAll('.latency'));
    latencyBoxes.reverse();
    await Promise.all([
        worker(latencyBoxes),
        worker(latencyBoxes),
        worker(latencyBoxes),
        worker(latencyBoxes),
        worker(latencyBoxes)
    ]);
    pingButton.removeAttribute('disabled');
});
