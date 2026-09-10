const multicureConfig = {
    1: {
        name: "Concepts 3D Exposure Calibration - RERF",
        models: 6
    },
    2: {
        name: "J3D Calibration Boxes of Calibration",
        models: 6
    }
}

$(document).ready(function () {
    onPageLoad()
});

async function onPageLoad() {
    const calibrationOptions = await getCalibrationOptions();
    setUpCalibrationSelection(calibrationOptions);
    populateExposurePreview(0.2, 1.5, calibrationOptions[0])
    setUpProfiles()
    const calibrationForm = document.getElementById('calibration-form');
    calibrationForm.addEventListener('input', (e) => {
        const form = e.target.form;  // Get the form element
        const values = formDataToObject(form);


        const {exposureIncrement, startExposure, calibrationModelId} = values;

        const selectedCalibration = calibrationOptions.find(calibrationOption => calibrationOption.id === +calibrationModelId);
        populateExposurePreview(exposureIncrement, startExposure, selectedCalibration);

        onCalibrationModelChange(calibrationModelId);
    })
    calibrationForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const button = document.getElementById('calibration-form-button-submit');
        button.disabled = true;
        button.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Submitting...`;


        // refetch the latest form reference
        const form = document.getElementById('calibration-form');
        const data = formDataToObject(form);
        const selectedCalibration = calibrationOptions.find(calibrationOption => calibrationOption.id === +data.calibrationModelId);
        submitForm(data, button, selectedCalibration);
    })

    document.getElementById("calibration-form-confirm").addEventListener('click', (e) => {
        // Calibration started workflow
        document.querySelector('#calibration-confirm').style.display = 'none';
        document.querySelector('#calibration-progress').style.display = 'block';
        document.querySelector('.modal-footer').style.display = 'none';
        document.querySelector('#modalLabel').textContent = "Slicing calibration file..."
    })
}

function onCalibrationModelChange(calibrationModelId) {
    document.querySelectorAll('.evaluation-text').forEach(el => el.style.display = 'none');
    const target = document.getElementById(`model-evaluation-${calibrationModelId}`);
    if (target) {
        target.style.display = 'block';
    }

    const img = document.getElementById('calibration-model-image');
    if (img) {
        img.src = `/static/shots/calibration-images/${calibrationModelId}.png`;
    }
}

async function setUpCalibrationSelection(calibrationOptions) {
    const $calibrationSelect = document.getElementById('calibration-model');

    calibrationOptions.forEach(calibrationOption => {
        const option = document.createElement("option");
        option.value = calibrationOption.id;
        option.textContent = calibrationOption.name;
        $calibrationSelect.appendChild(option);
    });
}

/**
 * Hack to populate a profile dropdown as NanoDLP does not expose profiles to this endpoint yet
 */
async function setUpProfiles() {
    const $profileSelect = document.getElementById('profile-id');

    const profilesResponse = await fetch('/json/db/profiles.json');
    const profiles = await profilesResponse.json();

    profiles.forEach(profile => {
        const option = document.createElement("option");
        option.value = profile['ProfileID'];
        option.textContent = `${profile['Title']} (${profile['Depth']}um)`;
        $profileSelect.appendChild(option);
    })

}

function populateExposurePreview(increment, startTime, selectedCalibration) {
    const previewElem = document.getElementById('exposure-value-preview');
    let secondValues = Array(selectedCalibration.models).fill(0)
        .map((value, index) => (index * increment + startTime).toFixed(1));

    previewElem.textContent = `Generating model exposures at: ${secondValues.map(i => i + "s").join(", ")}`
}

function formDataToObject(form) {
    const formData = new FormData(form);
    const object = Object.fromEntries(formData.entries());
    return {
        startExposure: Number(object['start-exposure']),
        exposureIncrement: Number(object['exposure-increment']),
        calibrationModelId: object['calibration-model'],
        profileID: object['profile-id'],
    }
}

async function submitForm(form, $button, selectedCalibration) {
    const {calibrationModelId, exposureIncrement, startExposure, profileID} = form;

    const multicureValues = Array(selectedCalibration.models)
        .fill(0)
        .map((value, index) => (index * exposureIncrement + startExposure).toFixed(1))
        .join(',');


    const body = {
        curetimes: multicureValues,
        ProfileID: profileID
    }

    const response = fetch(`/api/v1/athena/calibration/add/${calibrationModelId}`, {
        method: 'POST',
        body: new URLSearchParams(body),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        }
    });

    setUpSlicerPoller();

    if (!(await response).ok) {
        toastr.error("Failed to submit calibration")
        $button.disabled = false;
        $button.innerHTML = 'Submit and Print';
    }

}

async function setUpSlicerPoller() {
    const pollFunc = async () => {
        const response = await fetch('/slicer');
        const {percentage} = await response.json();


        document.getElementById('calibration-modal-progress-bar').style.width = `${percentage}%`

        // Calibration prints don't report back percentage correctly in the /slicer endpoint so we need to hack to
        // access the plates db directly and check plate 0 Processed value to know for sure
        const platesResponse = await fetch('/json/db/plates.json');
        const plates = await platesResponse.json();
        const calibrationPlate = plates?.find(plate => plate.PlateID === 0)
        if (calibrationPlate?.Processed === true) window.location.href = "/";
    }

    setInterval(pollFunc, 500)
}

async function getCalibrationOptions() {
    const response = await fetch("/static/config/calibrationConfig.json");
    return await response.json();
}