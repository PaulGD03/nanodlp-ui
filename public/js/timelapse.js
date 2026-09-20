const TIMELAPSE_STATUS_POLL_MS = 5000;

let timelapsePollTimer = null;
let timelapsePlateIdsToPoll = [];
let allTimelapseEntries = [];
let plateNameById = {};

$(document).ready(function () {
    if (!$('#timelapse-gallery').length) {
        return;
    }

    $('#timelapse-retry').on('click', refreshTimelapseGallery);
    initTimelapsePlayerModal();
    initFilters();
    refreshTimelapseGallery();

    $('#timelapse-gallery').on('click', '.timelapse-thumbnail', function () {
        const link = $(this).data('video-link');
        const title = $(this).data('video-title');
        openTimelapsePlayer(link, title);
    });

    $('#timelapse-gallery').on('click', '.timelapse-play', function (e) {
        e.preventDefault();
        const link = $(this).data('video-link');
        const title = $(this).data('video-title');
        openTimelapsePlayer(link, title);
    });

    $('#timelapse-gallery').on('click', '.timelapse-delete', async function (e) {
        e.preventDefault();
        const confirmText = $('#delete-timelapse-confirm').text();
        const button = this;
        c3dConfirm(confirmText, async function () {
        const entry = {
            plateId: $(button).data('plate-id'),
            filename: $(button).data('filename'),
            previewfilename: $(button).data('previewfilename'),
        };

        try {
            const result = await deleteTimelapse(entry);
            if (result === 'ok') {
                toastr.success('Timelapse deleted');
                allTimelapseEntries = allTimelapseEntries.filter(function (item) {
                    return !(String(item.plateId) === String(entry.plateId) && item.filename === entry.filename);
                });
                renderFilteredGallery();
                populatePlateFilter();
            } else {
                toastr.error('Failed to delete timelapse');
            }
        } catch (err) {
            toastr.error('Failed to delete timelapse');
        }
        });
    });
});

function initTimelapsePlayerModal() {
    $('#timelapse-player-modal').on('hidden.bs.modal', function () {
        const video = document.getElementById('timelapse-player-video');
        if (!video) {
            return;
        }
        video.pause();
        video.removeAttribute('src');
        video.load();
    });
}

function initFilters() {
    const params = new URLSearchParams(window.location.search);
    const preselectedPlateId = params.get('plateid');
    if (preselectedPlateId) {
        $('#timelapse-filter-plate').val(String(preselectedPlateId));
    }

    $('#timelapse-filter-plate, #timelapse-filter-time').on('change', function () {
        renderFilteredGallery();
    });
}

function openTimelapsePlayer(link, title) {
    const video = document.getElementById('timelapse-player-video');
    if (!video) {
        return;
    }
    $('#timelapse-player-modal-label').text(title || '');
    video.src = link;
    video.load();
    $('#timelapse-player-modal').modal('show');
    $('#timelapse-player-modal').one('shown.bs.modal', function () {
        video.play().catch(function () {});
    });
}

async function loadTimelapses() {
    const response = await fetch(BASE_URL + '/athena-iot/control/timelapse_get_all', { method: 'GET' });
    if (!response.ok) {
        throw new Error('Failed to load timelapses');
    }
    return await response.json();
}

async function loadPlateNames() {
    try {
        const response = await fetch(BASE_URL + '/json/db/plates.json', { method: 'GET' });
        if (!response.ok) {
            return {};
        }
        const plates = await response.json();
        const mapping = {};
        plates.forEach(function (plate) {
            mapping[String(plate.PlateID)] = plate.Path || '';
        });
        return mapping;
    } catch (err) {
        return {};
    }
}

async function deleteTimelapse(entry) {
    const response = await fetch(BASE_URL + '/athena-iot/control/timelapse_delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            plateId: String(entry.plateId),
            filename: entry.filename,
            previewfilename: entry.previewfilename,
        }),
    });
    return await response.text();
}

async function fetchTimelapseProcessingStatus(plateId) {
    const response = await fetch(
        BASE_URL + `/athena-iot/control/timelapse_processing_status?plateid=${encodeURIComponent(plateId)}`,
        { method: 'GET' }
    );
    return await response.json();
}

async function fetchCurrentPlateId() {
    try {
        const response = await fetch(BASE_URL + '/status', { method: 'GET' });
        if (!response.ok) {
            return null;
        }
        const data = await response.json();
        if (data.Printing && data.PlateID) {
            return String(data.PlateID);
        }
    } catch (err) {
        /* ignore */
    }
    return null;
}

function parseTimelapseFilename(filename) {
    const match = /^timelapse_(\d{2}):(\d{2}):(\d{2})_(\d{2})-(\d{2})-(\d{4})\.mp4$/.exec(filename);
    if (!match) {
        return null;
    }
    const day = parseInt(match[4], 10);
    const month = parseInt(match[5], 10) - 1;
    const year = parseInt(match[6], 10);
    const hour = parseInt(match[1], 10);
    const minute = parseInt(match[2], 10);
    const second = parseInt(match[3], 10);
    return new Date(year, month, day, hour, minute, second);
}

function formatTimelapseLabel(filename) {
    const date = parseTimelapseFilename(filename);
    if (!date || isNaN(date.getTime())) {
        return filename.replace(/^timelapse_/, '').replace(/\.mp4$/, '');
    }
    return date.toLocaleString();
}

function sortTimelapses(entries) {
    return entries.slice().sort(function (a, b) {
        const dateA = parseTimelapseFilename(a.filename);
        const dateB = parseTimelapseFilename(b.filename);
        if (dateA && dateB) {
            return dateB.getTime() - dateA.getTime();
        }
        return b.filename.localeCompare(a.filename);
    });
}

function escapeHtml(text) {
    return $('<div>').text(text == null ? '' : String(text)).html().replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function resolvePlateName(plateId) {
    const name = plateNameById[String(plateId)];
    if (!name || name.trim() === '') {
        return '';
    }
    return name;
}

function renderTimelapseCard(entry) {
    const label = formatTimelapseLabel(entry.filename);
    const previewLink = escapeHtml(entry.previewlink);
    const videoLink = escapeHtml(entry.link);
    const plateId = escapeHtml(String(entry.plateId));
    const filename = escapeHtml(entry.filename);
    const previewfilename = escapeHtml(entry.previewfilename);
    const plateName = escapeHtml(resolvePlateName(entry.plateId));
    const rawPlateName = resolvePlateName(entry.plateId);
    const videoTitle = rawPlateName ? `${rawPlateName} · ${label}` : label;

    return (
        '<div class="timelapse-card" data-plate-id="' + plateId + '">' +
        '<div class="c3d-card">' +
        '<div class="timelapse-card-body">' +
        '<button type="button" class="timelapse-thumbnail" aria-label="Play timelapse" data-video-link="' + BASE_URL + videoLink + '" data-video-title="' + escapeHtml(videoTitle) + '">' +
        '<span class="timelapse-preview-placeholder"><span class="glyphicon glyphicon-film" aria-hidden="true"></span>Preview unavailable</span>' +
        (entry.previewlink ? '<img src="' + BASE_URL + previewLink + '" alt="">' : '') +
        '</button>' +
        '<p class="timelapse-card-title"><strong>' + (plateName || ('Plate ' + plateId)) + '</strong><br>' +
        '<small class="text-muted">ID ' + plateId + ' · ' + escapeHtml(label) + '</small></p>' +
        '</div>' +
        '<div class="c3d-card-actions">' +
        '<button type="button" class="btn btn-primary btn-sm timelapse-play" data-video-link="' + BASE_URL + videoLink + '" data-video-title="' + escapeHtml(videoTitle) + '">' +
        '<span class="glyphicon glyphicon-play"></span> Play' +
        '</button>' +
        '<button type="button" class="btn btn-danger btn-sm timelapse-delete" data-plate-id="' + plateId + '" data-filename="' + filename + '" data-previewfilename="' + previewfilename + '">' +
        '<span class="glyphicon glyphicon-trash"></span> Delete' +
        '</button>' +
        '</div>' +
        '</div>' +
        '</div>'
    );
}

function showTimelapseEmpty(show) {
    $('#timelapse-empty').toggle(show);
    $('#timelapse-gallery').toggle(!show);
}

function getFilteredEntries() {
    const selectedPlate = $('#timelapse-filter-plate').val();
    const selectedTime = $('#timelapse-filter-time').val();
    const now = Date.now();

    return allTimelapseEntries.filter(function (entry) {
        if (selectedPlate && String(entry.plateId) !== String(selectedPlate)) {
            return false;
        }

        if (selectedTime !== 'all') {
            const date = parseTimelapseFilename(entry.filename);
            if (!date) {
                return false;
            }
            const ageMs = now - date.getTime();
            if (selectedTime === '24h' && ageMs > 24 * 60 * 60 * 1000) {
                return false;
            }
            if (selectedTime === '7d' && ageMs > 7 * 24 * 60 * 60 * 1000) {
                return false;
            }
            if (selectedTime === '30d' && ageMs > 30 * 24 * 60 * 60 * 1000) {
                return false;
            }
        }

        return true;
    });
}

function populatePlateFilter() {
    const select = $('#timelapse-filter-plate');
    const existingValue = select.val();
    const selectedFromQuery = new URLSearchParams(window.location.search).get('plateid');
    const selectedValue = existingValue || selectedFromQuery || '';

    const plateIds = Array.from(new Set(allTimelapseEntries.map(function (entry) {
        return String(entry.plateId);
    }))).sort(function (a, b) {
        return Number(a) - Number(b);
    });

    const options = ['<option value="">All jobs</option>'];
    plateIds.forEach(function (plateId) {
        const name = resolvePlateName(plateId);
        const label = name ? `${name} (ID ${plateId})` : `Plate ${plateId}`;
        options.push('<option value="' + escapeHtml(plateId) + '">' + escapeHtml(label) + '</option>');
    });

    select.html(options.join(''));
    if (selectedValue) {
        select.val(String(selectedValue));
    }
}

function collectPlateIds(entries) {
    const ids = new Set();
    entries.forEach(function (entry) {
        if (entry.plateId !== undefined && entry.plateId !== null && String(entry.plateId) !== '') {
            ids.add(String(entry.plateId));
        }
    });
    return Array.from(ids);
}

function renderFilteredGallery() {
    const entries = getFilteredEntries();
    const gallery = $('#timelapse-gallery');
    gallery.empty();

    if (!entries.length) {
        showTimelapseEmpty(true);
        timelapsePlateIdsToPoll = [];
        hideEncodingHint();
        stopEncodingStatusPoll();
        return;
    }

    showTimelapseEmpty(false);
    gallery.html(entries.map(renderTimelapseCard).join(''));
    gallery.find('.timelapse-thumbnail img').each(function () {
        // Listen directly: image error events do not bubble. Handle cached failures too.
        $(this).on('error', function () { $(this).hide(); });
        if (this.complete && !this.naturalWidth) { $(this).hide(); }
    });
    startEncodingStatusPoll(entries);
}

async function refreshTimelapseGallery() {
    $('#timelapse-load-error').hide();
    try {
        const [entries, plateNames] = await Promise.all([
            loadTimelapses(),
            loadPlateNames(),
        ]);

        plateNameById = plateNames;
        allTimelapseEntries = sortTimelapses(entries);
        populatePlateFilter();
        renderFilteredGallery();
    } catch (err) {
        toastr.error('Failed to load timelapses');
        $('#timelapse-empty, #timelapse-gallery').hide();
        $('#timelapse-load-error').show();
        stopEncodingStatusPoll();
    }
}

async function startEncodingStatusPoll(entries) {
    stopEncodingStatusPoll();

    const plateIds = new Set(collectPlateIds(entries));

    const currentPlateId = await fetchCurrentPlateId();
    if (currentPlateId) {
        plateIds.add(currentPlateId);
    }

    timelapsePlateIdsToPoll = Array.from(plateIds);
    if (!timelapsePlateIdsToPoll.length) {
        hideEncodingHint();
        return;
    }

    const isProcessing = await checkAnyProcessing();
    applyEncodingHint(isProcessing);
    if (!isProcessing.processing) {
        return;
    }

    timelapsePollTimer = setInterval(async function () {
        const stillProcessing = await checkAnyProcessing();
        applyEncodingHint(stillProcessing);
        if (!stillProcessing.processing) {
            stopEncodingStatusPoll();
        }
    }, TIMELAPSE_STATUS_POLL_MS);
}

function stopEncodingStatusPoll() {
    if (timelapsePollTimer) {
        clearInterval(timelapsePollTimer);
        timelapsePollTimer = null;
    }
}

function hideEncodingHint() {
    $('#timelapse-encoding-hint').hide();
    $('#timelapse-encoding-progress').text('');
}

async function checkAnyProcessing() {
    if (!timelapsePlateIdsToPoll.length) {
        return { processing: false, progressText: '' };
    }

    for (const plateId of timelapsePlateIdsToPoll) {
        try {
            const status = await fetchTimelapseProcessingStatus(plateId);
            if (status.state === 'processing') {
                let progressText = '';
                if (typeof status.data === 'number' || (typeof status.data === 'string' && status.data !== '')) {
                    progressText = ' (' + status.data + '%)';
                }
                return { processing: true, progressText: progressText };
            }
        } catch (err) {
            /* ignore per-plate errors */
        }
    }

    return { processing: false, progressText: '' };
}

function applyEncodingHint(result) {
    if (result.processing) {
        $('#timelapse-encoding-hint').show();
        $('#timelapse-encoding-progress').text(result.progressText);
    } else {
        hideEncodingHint();
    }
}

$(window).on('beforeunload', function () {
    stopEncodingStatusPoll();
});
