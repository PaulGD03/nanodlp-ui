toastr.options = {
	"positionClass": "toast-top-center",
}
//************** Resin Profile Functions  */
$("#DwEnableSimple").change(function () {
	if ($(this).is(":checked")) {
		$("#WaitBeforePrintSimple").val(0).prop("disabled", true);
		$("#SupportWaitBeforePrintSimple").val(0).prop("disabled", true);
	} else {
		$("#WaitBeforePrintSimple").prop("disabled", false);
		$("#SupportWaitBeforePrintSimple").prop("disabled", false);
	}
});

$("#setup2").submit(function(){
	$("#CdEnableSimple").prop("checked", true);
	$("#PdEnableSimple").prop("checked", true);
	$("#RlEnableSimple").prop("checked", true);
	$("#DwEnableSimple").prop("checked", true);
	$("#PreheatMixSimple").prop("checked", true);

	const slowLiftSpeed = document.getElementById('SimpleSlowLiftSpeed').value;
	const liftSpeed = document.getElementById('SimpleLiftSpeed').value;
	const liftLayers = document.getElementById('SimpleSlowLiftLayers').value;
	const slowRetractSpeed = document.getElementById('SimpleSlowRetractSpeed').value;
	const retractSpeed = document.getElementById('SimpleRetractSpeed').value;
	const retractLayers = document.getElementById('SimpleSlowRetractLayers').value;


	saveSpeed(slowLiftSpeed, liftSpeed, liftLayers, $("#SimpleDynamicSpeed"))
	saveSpeed(slowRetractSpeed, retractSpeed, retractLayers, $("#SimpleDynamicRetractSpeed"))
});

/**
 * Translation layer for saving the dynamic speed values
 * @param slowSpeed - The value of the slow speed as an integer
 * @param fastSpeed - The value of the fast speed as an integer
 * @param layers - The count of layers to save
 * @param formElement - The Jquery input element from the expert mode form
 */
function saveSpeed(slowSpeed, fastSpeed, layers, formElement) {
	const newConfigTextBlock = `[JS] if ([[LayerNumber]] < ${layers}) {
output = "${slowSpeed}";
} else {
output = "${fastSpeed}";
};[/JS]`;

	formElement.prop('value', newConfigTextBlock)
}
function setUpCheckboxToggle($checkboxElem, $toggleSection) {
	$checkboxElem.change(() => {
		if ($checkboxElem.is(':checked')) {
			$checkboxElem.prop('value', "0");
			if ($toggleSection) $toggleSection.show();
		} else {
			$checkboxElem.prop('value', "1");
			if ($toggleSection) $toggleSection.hide();
		}
	})
}

setUpCheckboxToggle($("#PdEnableSimple"), $('.peel-detection-settings'));
$("#PdEnableSimple").change(updatePeelDetectionSettingsVisibility);
setUpCheckboxToggle($("#RlEnableSimple"));
setUpCheckboxToggle($("#DwEnableSimple"));
setUpCheckboxToggle($("#CdEnableSimple"), $('.crash-detection-settings'));
setUpCheckboxToggle($("#PreheatMixSimple"));

function updatePeelDetectionSettingsVisibility(){
	const peelDetectionSettings = $('.peel-detection-settings');
	if (!peelDetectionSettings.length) return;

	if (!isEasyModeEnabled() && $("#PdEnableSimple").is(':checked')) {
		peelDetectionSettings.show();
	} else {
		peelDetectionSettings.hide();
	}
}

function isEasyModeEnabled(){
	return window.localStorage.getItem("ProfileEasyMode") !== "false";
}

function setEasyMode(enabled){
	if(enabled){
		window.localStorage.setItem("ProfileEasyMode", "true");
	}else {
		window.localStorage.setItem("ProfileEasyMode", "false");
	}

	updateEasyModeNavButtonText();
	updateEasyModeProfileFieldVisibility();
}

function updateEasyModeNavButtonText(){
	let navButton = $("#easyModeNavButtonText");

	if(isEasyModeEnabled()){
		navButton.text("Advanced Mode");
	}else {
		navButton.text("Easy Mode");
	}
}

function updateEasyModeProfileFieldVisibility(){
		if(isEasyModeEnabled()) {
			$(".advance_mode").hide();
			$(".easy_mode").show();
		}else {
			$(".advance_mode").show();
			$(".easy_mode").hide();
		}

		updatePeelDetectionSettingsVisibility();
}


function setupEasyMode(){

	updateEasyModeNavButtonText();
	updateEasyModeProfileFieldVisibility();

	let navButton = $("#easyModeNavButtonText");
	navButton.click(function () {
		setEasyMode(!isEasyModeEnabled());
	});

	$("#profileEasyModeSwitchBtn").click(function () {
		setEasyMode(false);
	});
}

//$(document).ready(function(){
	setupEasyMode();
//})


$(document).ready(function() {

	// Add click event listener to the confirm button on forceStop
	// navigates user to /plates after a forceStop
	$("#confirmButton").click(function () {
		// Save a reference to the current element
		var $this = $(this);

		// This setTimeout is just a placeholder to simulate some delay
		setTimeout(function () {
			// Change the href attribute after the delay
			$this.attr("href", "/plates");

			// Manually trigger the click event to navigate to the new URL
			$this.trigger("click");
		}, 2000); // Adjust the delay time as needed (in milliseconds)
	})

	currentUrl = window.location.href
	resinTitle = $("#Title").val()

	if (resinTitle && resinTitle.startsWith("[AFP]")) {

		if (currentUrl.includes("clone")) {
			resinTitle = resinTitle.substring(6)
			$("#Title").val("")
			$("#Title").trigger('change');

			$("#TitleSimple").val("")
			$("#TitleSimple").trigger('change');
			$("#TitleSimple").focus();
		} else {
			$("#setup-profile :input").prop("disabled", true);
			$("#setup-profile2 :input").prop("disabled", true);
			$(".setting-cat").prop("disabled", false);
		}
	}

	$('.form-control').each(function () {
		var originalValue = $(this).val();
		var step = $(this).attr('step');
		// Check if the original value is a valid number and if step is less than 1
		if (!isNaN(originalValue) && originalValue !== "" && step && parseFloat(step) < 1) {
			var formattedValue = parseFloat(originalValue).toFixed(2);
			$(this).val(formattedValue);
		}
	});

	$('.form-control').change(function () {
		var originalValue = $(this).val();
		var step = $(this).attr('step');
		// Check if the original value is a valid number and if step is less than 1
		if (!isNaN(originalValue) && originalValue !== "" && step && parseFloat(step) < 1) {
			var formattedValue = parseFloat(originalValue).toFixed(2);
			$(this).val(formattedValue);
		}
	});

	$('[data-toggle="tooltip"]').tooltip();
});

// Support Page Helpers

$("#SupportSubmitButton").click(function(){

	const ticketTimestamp = Date.now();
	data = {
		email: $("#SupportEmailField").val(),
		name: $("#SupportNameField").val(),
		text: $("#SupportTextField").val(),
		timestamp: ticketTimestamp,
		ai_analysis: $("#SupportAiAnalysisField").is(":checked")
	};

	$("#SupportEmailField").val("");
	$("#SupportNameField").val("");
	$("#SupportTextField").val("");

	const submission = window.btoa(unescape(encodeURIComponent(JSON.stringify(data))));

	$('#support_notification').modal({backdrop: 'static', keyboard: false})
	$('#support_notification').modal('show');

	$.ajax({
		url: '/gcode',
		headers: {'Content-Type': 'application/x-www-form-urlencoded'},
		method: 'POST',
		data: new URLSearchParams({
			'gcode': `[[Exec  /home/pi/athena-debug-submission.sh "${submission}"]]`
		}).toString(),
		success: function (result) {
			setUpSupportPoller(ticketTimestamp)
		},
		error: function (result) {
			ticketFailedHandler()
		}
	});
});

function setUpSupportPoller(ticketTimestamp) {
	const TICKET_SUBMISSION_TIMEOUT = 30000;
	const TICKET_SUBMISSION_POLL_RATE = 1000;
	let duration = 0;
	const interval = setInterval(async () => {
		duration += TICKET_SUBMISSION_POLL_RATE;

		if (duration >= TICKET_SUBMISSION_TIMEOUT) {
			ticketFailedHandler(interval)
		}

		const success = await pollForSuccessfulTicket(ticketTimestamp)
		if (success) {
			toastr.success("Ticket submitted")
			clearInterval(interval);
			$('#support_notification').modal('hide');
		}
	}, TICKET_SUBMISSION_POLL_RATE);
}

async function pollForSuccessfulTicket(ticketTimestamp) {
	try {
		// Backend should write a file to this path on ticket submission success
		const response = await fetch(`static/tickets/${ticketTimestamp}`);
		if (!response.ok) {
			throw new Error("Response unsuccessful")
		}
		return true;
	} catch (e) {
		return false;
	}
}

function ticketFailedHandler(interval) {
	toastr.error("Reach out to us via Discord or Email.", "Ticket failed to submit")
	$('#support_notification').modal('hide');

	if (interval)
		clearInterval(interval);
}

$("#BtnToggleHeater").click(async function(){
	await updateMachineCustomValues((customValues) => {
		const heaterEnable = customValues['HeaterEnable'];

		if (heaterEnable && heaterEnable === "0") {
			$("#BtnToggleHeater").html("Enable Heater");
			return { ...customValues, HeaterEnable: "1" }
		} else {
			$("#BtnToggleHeater").html("Disable Heater");
			return { ...customValues, HeaterEnable: "0" }

		}
	})
});


async function updateMachineCustomValues(callback) {
	const response = await fetch('/json/db/machine.json');
	const machineJson = await response.json();
	const customValues = machineJson['CustomValues'];
	machineJson.CustomValues = callback(customValues);

	const formData = new FormData();
	const jsondata = JSON.stringify(machineJson);
	const file = new Blob([jsondata]);
	formData.append('JsonFile', file, "machine.json");
	await fetch('/setup/import', {
		method: 'POST',
		body: formData,
		contentType : false,
	})
}

/**
 * Conversion layer for the dynamic speed code blocks
 * @param dynamicSpeed - The code block from the NanoDLP API
 * @param fastElem - JQuery html input to store the fast speed in
 * @param slowElem - JQuery html input to store the slow speed in
 * @param layersElem - JQuery html input to store the layers in
 * @param defaults - Object containing defaultSpeed, defaultSlowSpeed and defaultLayers to fall back to if none found
 */
function convertDynamicSpeed(dynamicSpeed, fastElem, slowElem, layersElem, defaults ) {
	const liftSpeedData = decodeHTMLEntities(dynamicSpeed);
	const bottomSpeed = liftSpeedData.match(/< \d+\) {\s*output = "(\d+)";/);
	const fastSpeed = liftSpeedData.match(/else {\s*output = "(\d+)";/);
	const layers = liftSpeedData.match(/LayerNumber\]\] < (\d+)/);

	fastElem.value = fastSpeed ? fastSpeed[1] : defaults.defaultSpeed;
	slowElem.value = bottomSpeed ? bottomSpeed[1] : defaults.defaultSlowSpeed;
	layersElem.value = layers ? layers[1] : defaults.defaultLayers;
}

/**
 * Acts as a translation layer between expert values from NanoDLP API into simple form values on the Basic Mode page
 * Any form values that need to be translated to simpler values should be handled here
 * @param dynamicLiftSpeed - NanoDLP DynamicSpeed code block
 * @param dynamicRetractSpeed - NanoDLP DynamicRetractSpeed code block
 */
function expertToSimpleElementConversion(dynamicLiftSpeed, dynamicRetractSpeed) {
	convertDynamicSpeed(
		dynamicLiftSpeed,
		document.getElementById('SimpleLiftSpeed'),
		document.getElementById('SimpleSlowLiftSpeed'),
		document.getElementById('SimpleSlowLiftLayers'),
		{ defaultSpeed: 50, defaultSlowSpeed: 150, defaultLayers: 30}
	);
	convertDynamicSpeed(
		dynamicRetractSpeed,
		document.getElementById('SimpleRetractSpeed'),
		document.getElementById('SimpleSlowRetractSpeed'),
		document.getElementById('SimpleSlowRetractLayers'),
		{ defaultSpeed: 150, defaultSlowSpeed: 600, defaultLayers: 11}
	);
}

/*
	Hack to decode NanoDLP safe values
 */
function decodeHTMLEntities(text) {
	const textArea = document.createElement('textarea');
	textArea.innerHTML = text;
	return textArea.value;
}

$(document).ready(function(){
	const cdEnable = $("#CdEnableSimple");
	loadInitialCheckboxState(cdEnable, $('.crash-detection-settings'));
	const pdEnable = $("#PdEnableSimple");
	loadInitialCheckboxState(pdEnable, $('.peel-detection-settings'));
	updatePeelDetectionSettingsVisibility();
	const rlEnable = $("#RlEnableSimple");
	loadInitialCheckboxState(rlEnable);
	const dwEnable = $("#DwEnableSimple");
	if(dwEnable.length){
		if( dwEnable.val() !== "0"){
			dwEnable.prop('checked', false);
			dwEnable.prop('value', "1");
		}else{
			dwEnable.prop('checked', true);
			dwEnable.prop('value', "0");
			$("#WaitBeforePrintSimple").val(0).prop("disabled", true);
			$("#SupportWaitBeforePrintSimple").val(0).prop("disabled", true);
		}
	}
	const preheatMixEnable = $("#PreheatMixSimple");
	loadInitialCheckboxState(preheatMixEnable);
} );

function loadInitialCheckboxState($checkboxElem, $toggleSection) {
	if ($checkboxElem.length) {
		if ($checkboxElem.val() !== "0") {
			$checkboxElem.prop('checked', false);
			$checkboxElem.prop('value', "1");
			if ($toggleSection) $toggleSection.hide()
		} else {
			$checkboxElem.prop('checked', true);
			$checkboxElem.prop('value', "0");
			if ($toggleSection) $toggleSection.show()
		}
	}
}

$("#UvPwmValuePercentSimple").change(function () {
	//clamp value
	if (this.value > 100) this.value = 100;
	if (this.value < 1) this.value = 1;
	var percentValue = parseFloat(this.value);
	if (!isNaN(percentValue)) {
		var actualValue = percentValue / 100;
		document.getElementById("UvPwmValueSimple").value = actualValue.toFixed(2);
	}
});

//This is used to adjust any values just for display
document.addEventListener("DOMContentLoaded", function () {
	var UvPwmComp = document.getElementById("UvPwmValuePercentSimple");
	if (UvPwmComp) {
		var scaledValue = UvPwmComp.value * 100;
		UvPwmComp.value = scaledValue.toFixed(0);
	}
});

//************** Calibrations Functions  */

var movement = 1000; // Default movement value is 1 mm

function moveZAxis(direction) {
	console.log(`/z-axis/move/${direction}/micron/${movement}`);
	$.ajax({ url: `/z-axis/move/${direction}/micron/${movement}`, type: "GET", dataType: "json" });
}

function updateMovementButtons() {
	$(".btn-movement").removeClass("btn-movement-active"); // Remove active class from all buttons
	$("#btnMove" + movement).addClass("btn-movement-active"); // Add active class to the selected button
}

$("#btnUp").click(function () {
	moveZAxis("up");
});

$("#btnDown").click(function () {
	moveZAxis("down");
});

$("#btnMove100").click(function () {
	movement = 100;
	updateMovementButtons();
});

$("#btnMove1000").click(function () {
	movement = 1000;
	updateMovementButtons();
});

$("#btnMove10000").click(function () {
	movement = 10000;
	updateMovementButtons();
});

$("#btnMove100000").click(function () {
	movement = 100000;
	updateMovementButtons();
});

$("#btnStop").click(function () {
	$.ajax({ url: `/printer/force-stop`, type: "GET", dataType: "json" });
});

$("#btnMoveHome").click(function () {
	$.ajax({ url: `/z-axis/calibrate`, type: "GET", dataType: "json" });
});

$("#btnMovePark").click(function () {
	$.ajax({ url: `/z-axis/top`, type: "GET", dataType: "json" });
});

$("#btnMoveBottom").click(function () {
	$.ajax({ url: `/z-axis/bottom`, type: "GET", dataType: "json" });
});


//************** Update page Functions  */

var channel = "";
var image_version = "";
var printer_type= "";
var version_str = "";
var printer_name = "";

function update_channel() {
	$.ajax({
		url: "/static/channel",
		cache: false,
		success: function (result) {
			channel = result;
			$("#channel").html("Current Software Channel: " + result);
			update_changelog();
		},
		error: function (result) {
			channel = "stable";
			$("#channel").html("Current Software Channel: " + channel);
			update_changelog();
		}
	});
}
function update_printertype() {
	$.ajax({
		url: "/static/printer_type",
		cache: false,
		success: function (result) {
			printer_type = result;
			$("#printer_type").html("Printer Type: " + result);
			update_changelog();
			aegis_checkbox_init();
		}
	});
}

function update_image_version() {
	$.ajax({
		url: "/static/image_version",
		cache: false,
		success: function (result) {
			image_version = result;
			$("#image_version").html("Image Version: " + result);
			parts = image_version.split('+');
			version_str = parts[1];
			$("#version_str").html("Upgrade from Version: " + parts[1]);
			update_changelog();
		}
	});
}

function update_printer_name() {

	$.ajax({
		url: "/static/printer_name",
		cache: false,
		success: function (result) {
			printer_name = result;
			update_changelog();
		}
	});
}

function update_changelog(){

	if( printer_type !== "" && image_version !== "" && channel !== "" && printer_name !== ""){

		$.ajax({
			url: "https://olymp.concepts3d.eu/api/changelog?printer_type="+printer_type+"&channel="+channel+"&current_version="+version_str+"&printer_qualified_name="+printer_name,
			success: function( result ) {
				let version_str = $("#athena-version-str");

				$( "#changelog-display" ).html( result );
				if(!result.includes("No Update available")){
					$("#btn-update-container").removeClass();
					version_str.html("Update Available");
					version_str.addClass("label");
					version_str.addClass("label-success");
				}
				else{
					version_str.html("Build: "+parts[1]);
				}
			},
			error: function( result){
				console.error('Error: ${result}');
			}

		});

	}
}

async function changeUpdateChannel(channel) {
	try {
		 await fetch('/gcode', {
			method: 'post',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: new URLSearchParams({
				'gcode': '[[Exec echo "' + channel + '" > /home/pi/channel]]'
			})
		});

		const text = document.getElementById(`btn-${channel}`);
		toastr.success(`Channel updated to ${text.innerText}!`);
		if (confirm('A reboot is required for the channel change to take effect. Reboot now?')) {
			window.location.href = '/printer/restart';
		}
	} catch (err) {
		toastr.error('Failed to switch channels.')
	}
}

const url_progress = "/athena-update/athena_progress.txt";
const url_message = "/athena-update/athena_message.txt";

function open_update_modal(){
	let update_status_helper = "";

	let ajax_error_cnt = 0;

	$('#theBar').width(5+"%");
	$('#theBar').html(5+"%");
	$('#progress-message').html("Launching updater");

	var counterBack = setInterval(function()
	{
		$.ajax({
			url: url_progress,
			success: function( result ) {
				if(update_status_helper === ""){
					update_status_helper = "running";
				}
				result = result.replace(/[\r\n]+/gm, "") + "%";

				$('#theBar').width(result)
				$('#theBar').html(result);
			},
			error: function( result){
				if(update_status_helper === "running"){
					clearTimeout(counterBack);
					$('#update_notification').modal('hide');
					update_image_version();
				}
				ajax_error_cnt++;

				if(ajax_error_cnt >= 20){
					$('#progress-message').html("Connection to the updater seems to have failed, please reload this page");
				}

			}});

		$.ajax({
			url: url_message,
			success: function( result ) {
				$('#progress-message').html(result);
			},

		});

	}, 1000);

	$('#update_notification').modal({backdrop: 'static', keyboard: false})
	$('#update_notification').modal('show');
}

function check_if_update_running(){
	if (!$('#update_notification').is(':visible')) {

		$.ajax({
			url: url_progress,
			success: function( result ) {
				open_update_modal();
			}
		});

	}
}

$(document).ready(function() {
	update_channel();
	update_printertype();
	update_image_version();
	update_printer_name();

	check_if_update_running();

	$("#btn-update").click(function(){
		try {
			open_update_modal();
			const response = fetch('/gcode', {
				method: 'post',
				headers:{
					'Content-Type': 'application/x-www-form-urlencoded'
				},
				body: new URLSearchParams({
					'gcode':  "[[Exec /home/pi/athena-start-update.sh]]"
				})
			});
			console.log('Completed!', response);
		} catch(err) {
			console.error('Error: ${err}');
		}
	});

	$("#btn-lts").click(function(){
		changeUpdateChannel("lts");
	});

	$("#btn-stable").click(function(){
		changeUpdateChannel("stable");
	});

	$("#btn-beta").click(function(){
		changeUpdateChannel("beta");
	});

	$("#btn-alpha").click(function(){
		changeUpdateChannel("alpha");
	});

	$("#btn-master").click(function(){
		changeUpdateChannel("master");
	});

});


function aegis_checkbox_init() {
	element = $("#aegis-available-toggle")[0];
	container = $("#aegis-control-div");

	if (element && (printer_type.startsWith("Athena2") || printer_type.startsWith("AthenaPro"))) {

		element.addEventListener('change', e => {

			if (e.target.checked) {
				fetch(BASE_URL + "/athena-iot/aegis/enable",{
					method: "POST"});
			} else {
				fetch(BASE_URL + "/athena-iot/aegis/disable",{
					method: "POST"});
			}

		});

		fetch(BASE_URL + "/athena-iot/aegis/available").then(
			async value => {
				let data = await value.json();
				element.checked = !!data.available;
			}

		)
		container.show();
	}else{
		container.hide();
	}
}

$.ajax({
	url: "/json/db/machine.json",
	success: function( result ) {
		const obj = JSON.parse(result);

		$("#WiFiCountryTools").val(obj["WiFiCountry"]);

		if(obj["CustomValues"]["HeaterEnable"] && obj["CustomValues"]["HeaterEnable"] == 0){
			$("#BtnToggleHeater").html("Disable Heater")
		}else{
			$("#BtnToggleHeater").html("Enable Heater")
		}
	}
});


let last_progress_ts;
let last_progress_loaded;
let upload_started_ts;
let upload_xhr = null;

function bytesToStringRep(bytes){
	let loaded_unit = "b";

	if(bytes > 1000000000){
		bytes = Math.floor(bytes/1000000);
		bytes = bytes/1000;
		loaded_unit = "Gb";
	}else if(bytes > 1000000){
		bytes = Math.floor(bytes/1000000);
		loaded_unit = "Mb";
	}else if(bytes > 1000){
		bytes = Math.floor(bytes/1000);
		loaded_unit = "Kb";
	}

	return bytes + " " + loaded_unit;
}

function sToTime(s) {
	var secs = s % 60;
	s = (s - secs) / 60;
	var mins = s % 60;
	var hrs = (s - mins) / 60;

	let str = "";

	if(hrs < 10) str+="0";
	str += hrs;
	str+=":";
	if(mins < 10) str+="0";
	str+=mins;
	str+=":";


	secs = Math.floor(secs);
	if(secs < 10) str+="0";
	str+=secs;

	return str;
}

function progressHandler(e){
	let bar = $("#upload-modal-progress-bar");
	let tex = $("#upload-modal-text");
	let progtex = $("#upload-modal-progress-text");

	let percent = (e.loaded / e.total) *100;

	let loaded_str = bytesToStringRep(e.loaded);
	let total_str = bytesToStringRep(e.total);

	bar.width(percent + "%");

	progtex.html(loaded_str+ " / " + total_str);

	let time_since_last_call = Date.now() - last_progress_ts;
	let upload_amount_since_last_call = e.loaded - last_progress_loaded;

	last_progress_ts = Date.now();
	last_progress_loaded = e.loaded;

	let bytes_per_second = upload_amount_since_last_call / (time_since_last_call / 1000);

	let upload_speed_str = bytesToStringRep(bytes_per_second) + "/s";

	let average_upload_speed = e.loaded / ((Date.now() - upload_started_ts) / 1000);

	let seconds_remaining = (e.total - e.loaded) / average_upload_speed;

	let remaining_time_str = sToTime(seconds_remaining);

	tex.html("Upload Speed: "+upload_speed_str+"</br> Remaining Time: "+remaining_time_str);

	if(e.loaded === e.total){
		tex.html("File is being processed");
		progtex.html("");
		$("#btn-uploadmodal-cancel").prop('hidden', true);
		setInterval(processingHandler, 500)
	}

	return true;
}

function processingHandler() {
	$.get("/api/v1/progress/copy", function (response) {
		const responsePercentage = response + "%";

		$("#upload-modal-progress-bar").width(responsePercentage);
		$("#upload-modal-progress-text").html(responsePercentage);

		if(response === 100){
			completeHandler();
		}
	});
}
function completeHandler(){
	setTimeout(() => {
		removeUploadProgressModal();
		upload_xhr = null;
		window.location.replace("/plates");
	}, 1000);
}

function errorHandler(){
	bar = $("#upload-modal-progress-bar");
	tex = $("#upload-modal-text");
	progtex = $("#upload-modal-progress-text");

	tex.html("An error occurred during upload");
	progtex.html("");
	bar.width(100 + "%");

}

function abortHandler(){
	removeUploadProgressModal();
}

function abortUpload(upload_xhr){
	upload_xhr.abort();
}

function removeUploadProgressModal(){
	$("#upload-modal").remove()
}

function showUploadProgressModal(){
	const msg='<div class="modal fade" id="upload-modal" tabindex="-1" role="dialog" aria-labelledby="modalLabelSmall" aria-hidden="false">'
		+'<div class="modal-dialog">'
		+'<div class="modal-content">'
		+'<div class="modal-header">'
		+'<h5 class="modal-title" id="modalLabelSmall"><center>'
		+'FILE UPLOAD </center></h5>'
		+ '</div>' //end modal header
		+ '<div class="modal-body">'
		+'<div class="progress text-center">'
		+'<div id="upload-modal-progress-bar" class="progress-bar progress-bar-warning progress-bar-striped active" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0">'
		+'</div>'
		+'<span style="color: black" id="upload-modal-progress-text"></span>'
		+'</div>'
		+'</br>'
		+'<div style="text-align: center">'
		+'<h7 id="upload-modal-text"></h7>'
		+'</div>'
		+ '</div>' //end modal body
		+ '<div class="div-modal-buttons" style="align-content: center">'
		+ '<button type="button" id="btn-uploadmodal-cancel" class="btn-sm btn-danger btn-mod-center">Cancel</button>'
		+'</br>'
		+'</div>' //end modal footer
		+'</div>' //end model content
		+'</div>' //end modal dialog
		+'</div>'; //end modal fade

	$(".navbar").after(msg);

	$('#upload-modal').modal({backdrop: 'static', keyboard: false})
	$('#upload-modal').modal('show');

	upload_started_ts = Date.now();

}

$('.upload-disable').submit(function(e) {
	let currentUrl = window.location.href

	if( upload_xhr == null && currentUrl.includes("plate/add")){
		e.preventDefault();

		const formData = new FormData(document.getElementById("plate-upload-form"));

		upload_xhr = new XMLHttpRequest();
		//upload_xhr.open("POST", "/athena-iot/printjob/upload");
		upload_xhr.open("POST", "/plate/add");

		//
		upload_xhr.setRequestHeader("Accept","text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7");

		upload_xhr.upload.addEventListener("progress", progressHandler, false);
		//upload_xhr.addEventListener("loadend", completeHandler, false);
		upload_xhr.addEventListener("error", errorHandler, false);
		upload_xhr.addEventListener("abort", abortHandler, false);
		showUploadProgressModal();

		$("#btn-uploadmodal-cancel").click(function (){
			abortUpload(upload_xhr);
		})

		upload_xhr.send(formData);

	}else if(upload_xhr != null){
		console.error("Upload Submit triggered multiple times");
	}else {
		var form = $(this);
		var submitButton = form.find('button[type="submit"]');
		submitButton.prop('disabled', true);
		$(".upload-progress-bar").show();
	}

});

$(function() {
	fetch_resin_target();
	setInterval(function(){fetch_resin_target();}, 10000);

	fetch_resin_actual();
	setInterval(function(){fetch_resin_actual();}, 10000);

	fetch_navbar_bit_depth();
});

function fetch_resin_target(){
	$.ajax({
		url:`${BASE_URL}/analytic/value/12`,
		type: 'GET',
		timeout: 2000
	}).done(function(data) {
		var msg = "";
		if (data === null) return;
		$('.navbar-resin-temp').show()

		if(data == 0){
			$("#navbar-resin-target-text").text("Heater is Off");
		}else{
			$("#navbar-resin-target-text").text("Target :"+data+"°C");
		}

	});
}

function fetch_resin_actual(){
	$.ajax({
		url:'/analytic/value/7',
		type: 'GET',
		timeout: 2000
	}).done(function(data) {
		if (data === 0){
			$('.navbar-resin-temp').hide();
		}else {
			$('.navbar-resin-temp').show();
			$("#navbar-resin-temp-text").text(data + "");
		}
	});
}

function fetch_navbar_bit_depth(){
	$.ajax({
		url: "/json/db/machine.json",
		type: 'GET',
		timeout: 2000
	}).done(function(result) {
		var obj = (typeof result === "string") ? JSON.parse(result) : result;
		var width = obj["ProjectorWidth"];
		var is16k = (width == 15120 || width == 15136);
		if (!is16k) {
			$('.navbar-bit-depth').hide();
			return;
		}
		var bitDepth = (obj["DisplayController"] == 1) ? "8-bit" : "3-bit";
		$("#navbar-bit-depth-text").text(bitDepth);
		$('.navbar-bit-depth').show();
	});
}


$(function() {
	setInterval(function(){display_notification_athena();}, 2000);
});

display_notification_athena.prev_msg='';
display_notification_athena.prev_data='';

function display_notification_athena(){
	$.ajax({
		url:'/notification',
		type: 'GET',
		timeout: 2000
	}).done(function(data){
		var msg="";
		if (data===null) return;

		if(data.length > 0){
			$.each(data,function(k,v){

				if( display_notification_athena.prev_data === "" || v['Timestamp'] >= display_notification_athena.prev_data['Timestamp']){

					var date = new Date();
					date.setTime(v['Timestamp']*1000);

					var hour = date.getHours();
					var min = date.getMinutes();
					var sec = date.getSeconds();

					hour = (hour < 10 ? "0" : "") + hour;
					min = (min < 10 ? "0" : "") + min;
					sec = (sec < 10 ? "0" : "") + sec;

					var str = hour + ":" + min + ":" + sec;

					msg='<div class="modal fade" id="notificationModal" tabindex="-1" role="dialog" aria-labelledby="modalLabelSmall" aria-hidden="false">'
						+'<div class="modal-dialog">'
						+'<div class="modal-content">'
						+'<div class="modal-header">'
						+'<h4 class="modal-title" id="modalLabelSmall"><center>'+v["Type"].toUpperCase()+'</center></h4>'
						+'</div>' //end modal header
						+'<div class="modal-body">'
						+'<center>'+str+' - '+v["Text"]+'</center>'
						+'</br>'
						+'</div>' //end modal body
						+'<div class="div-modal-buttons">';
					if(v["Type"] === "aegis-info" || v["Type"] === "aegis-error" || v["Type"] === "klipper-error") {
						msg += '<button type="button" id="btn-modal-approve" class="btn btn-info btn-mod-center"> Close</button>';
					}else if(v["Type"] !== "error") {
						msg += '<button type="button" id="btn-modal-continue" class="btn btn-info btn-mod-l"> Continue Anyways</button>';
						msg += '<button type="button" id="btn-modal-cancel" class="btn btn-danger btn-mod-r"> Cancel Print</button>'
					}else{
						msg += '<button type="button" id="btn-modal-cancel" class="btn btn-danger btn-mod-center"> Cancel Print</button>'
					}
					msg+='</div>' //end modal footer
						+'</div>' //end model content
						+'</div>' //end modal dialog
						+'</div>'; //end modal fade

					if(v["Type"] === "error"){
						$('#btn-modal-continue').hide();
					}
					display_notification_athena.prev_data=v;


				}
			});

			if (msg===display_notification_athena.prev_msg) return;
			display_notification_athena.prev_msg=msg;
			$("#notificationModal").remove();
			$(".navbar").after(msg);


			$('#btn-modal-continue').click(function(){
				try {
					const response = fetch('/notification/disable/'+display_notification_athena.prev_data["Timestamp"], {
						method: 'get'
					});
					const response2 = fetch('/printer/unpause', {
						method: 'get'
					});
					console.log('Completed!', response);
				} catch(err) {
					console.error('Error: ${err}');
				}
				$('#notificationModal').modal('hide');

			});
			$('#btn-modal-cancel').click(function(){
				try {
					const response = fetch('/notification/disable/'+display_notification_athena.prev_data["Timestamp"], {
						method: 'get'
					});
					const response2 = fetch('/api/v1/printer/printer/stop', {
						method: 'get'
					});
					console.log('Completed!', response);
				} catch(err) {
					console.error('Error: ${err}');
				}
				$('#notificationModal').modal('hide');
			});

			$('#btn-modal-approve').click(function(){
				try {
					const response = fetch('/notification/disable/'+display_notification_athena.prev_data["Timestamp"], {
						method: 'get'
					});
					console.log('Completed!', response);
				} catch(err) {
					console.error('Error: ${err}');
				}
				$('#notificationModal').modal('hide');
			});

			$('#notificationModal').modal({backdrop: 'static', keyboard: false})
			$('#notificationModal').modal('show');


		}else{
			msg="";
			$('#notificationModal').modal('hide');
			$("#notificationModal").remove();
		}
	});
}


$(document).on('click', '.list-more-button',async (event) => {
	let plateId = event.target.id.split("show-more-")[1];
	const response = await fetch(BASE_URL+`/athena-iot/control/timelapse_processing_status?plateid=${plateId}`, { method: "GET" });

	const timelapseStatus = await response.json();

	if (timelapseStatus.state === "invalidrequest") return;
	if (timelapseStatus.state === "processing") {
		let elementId = `show-more-timelapse-pending-${plateId}`;
		document.getElementById(elementId).style.display = 'block';
	}

	if (timelapseStatus.state === "fileexists") {
		let elementId = `show-more-timelapse-${plateId}`;
		document.getElementById(elementId).style.display = 'block';
	}
})



async function runGcode(gcode) {
	return await fetch('/gcode', {
		headers: {'Content-Type': 'application/x-www-form-urlencoded'},
		method: 'post',
		body: new URLSearchParams({
			'gcode': `${gcode}`
		}).toString(),

	});
}

function setup_diskspace(json){
	if(json.hasOwnProperty("nvme0n1p1")){
		console.log("Printer has SSD installed");


		let emmc_storage_text = $("#emmc-freespace-text");
		let emmc_storage_value = $("#emmc-freespace-value");
		let ssd_storage_container = $("#ssd-freespace-container");
		let ssd_storage_text = $("#ssd-freespace-text");
		let ssd_storage_value = $("#ssd-freespace-value");

		emmc_storage_text.html("Free Disk Space (System)");

		if("root" in json){
			emmc_storage_value.html(json.root.Used + " of "+json.root.Size);
		}else{
			emmc_storage_value.html(json.mmcblk0p2.Avail + " of "+json.mmcblk0p2.Size);
		}
		
		ssd_storage_container.removeClass("hidden");
		ssd_storage_text.html("Free Disk Space (Jobs)");
		ssd_storage_value.html(json.nvme0n1p1.Avail + " of "+json.nvme0n1p1.Size);

	}else{
		console.log("No SSD Installed, skipping");
	}
}

async function updateIdWithAnalytic(elemId, analyticId) {
	const elementById = document.getElementById(elemId);
	const analyticValue = await getAnalytic(analyticId);

	if (elementById) {
		elementById.innerHTML = analyticValue;
	}
	return analyticValue;
}

async function getAnalytic(analyticId) {
	if (DEV_MODE) return Math.floor(Math.random() * 100)

	const response = await fetch(`/analytic/value/${analyticId}`, {});
	return await response.text();
}

$(document).ready(function () {
	let result = fetch(`${BASE_URL}/athena-iot/status/disk_storage`,{ method: "GET" })
	result.then(async value => {
		if (value.ok) {
			let diskspace_data = await value.json();
			setup_diskspace(diskspace_data);
		}
	})

})

// Dashboard live Z-position updater
function setupDashboardZPosition() {
    const zPosition = $("#dashboard-z-position");

    // athena.js is loaded on every Athena page. Only poll on the Dashboard.
    if (!zPosition.length) {
        return;
    }

    function updateDashboardZPosition() {
        $.getJSON("/z-axis/info")
            .done(function (data) {
                const z = parseFloat(data["current-height-mm"]);
                if (!isNaN(z)) {
                    zPosition.text(z.toFixed(2) + " mm");
                }
            });
    }

    updateDashboardZPosition();
    setInterval(updateDashboardZPosition, 1500);
}

$(document).ready(function () {
    setupDashboardZPosition();
});
