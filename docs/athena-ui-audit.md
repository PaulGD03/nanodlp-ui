# Athena UI audit and Work Package 1

## Work Package 1

Both `/custom/webcam` and `/custom/timelapse` render the same shared
`components/camera-timelapses.html` content. Navigation links only to the former;
existing job links to the latter, including `?plateid=`, remain valid. Each route
extends base.html once, so camera.js and timelapse.js each initialize once.
No binary route registrations or backend changes are needed.

System navigation hides Z Axis Control, Heater Control, Display Calibration and
the duplicate Help link. Their templates/routes remain intact. Monitoring,
service tools, access-lock conditions and the mode-switch IDs are preserved.

The combined view uses redesign.css tokens and Bootstrap 3 controls. Camera is
portrait on the left; the wider gallery is on the right and stacks below on
phones. Cards support keyboard preview activation, missing previews, aligned
actions, escaped job titles, secondary timestamps, empty results and retryable
load errors. Playback remains in the existing Bootstrap modal.

Preview rotation remains 90 degrees: the pre-existing thumbnail CSS and both
camera.js streamer implementations use this correction. The camera is mounted
in portrait while frames are landscape; confirm with actual printer previews.

## Validation

- JavaScript syntax check and git diff whitespace check passed.
- Headless Edge with local Bootstrap 3/jQuery/CSS and mocked timelapse APIs:
  1440, 1024, 768 and 390px layout checks passed, with no horizontal overflow;
  desktop camera-left and mobile stacking verified.
- Shared content has unique DOM IDs. Quoted/HTML-like job names round-trip safely.
- Job filtering, confirmed deletion, empty results and load-error UI passed;
  no page JavaScript errors in the mock run.
- Static trace preserves fetch URLs, delete payload fields, modal/video IDs,
  camera stream setup and CAMERA_LED_ON command. athena.js and camera.js unchanged.
- No NanoDLP binary or connected Athena printer was available for integration tests.

### Printer acceptance checks

Open both routes, including a Jobs timelapse link with a plate ID. Check the live
portrait feed, LED 10-second timeout, camera unavailable state, real preview
orientation, video playback/close, all time filters, delete cancel/confirm,
encoding progress and API failure/retry. Check Chrome and Safari and a mobile
viewport. Confirm the menu in Easy/Advanced and locked configurations.

### Existing concerns, outside this visual package

- Encoding polling stops for an empty filtered gallery; it only continues after
  the initial status check if an entry is already processing. It does not refresh
  the gallery automatically on completion. This can miss a first/new recording.
- Camera unavailable state requires reload to retry. Safari's adaptive streamer
  defines an onload method but buildCameraStream does not visibly wire it to the
  image load event; verify frame refresh on a printer before changing it.
- The navbar still has an initially hidden resin-temperature link to Heater
  Control, and Settings/Tools can expose calibration/service routes. Removing
  System menu entries is not access control.

## Reachable-page audit / retained follow-on scope

| Page / area | Classification | Next action |
| --- | --- | --- |
| Dashboard | Redesigned; hardware validation pending | Preserve Environment/Printer and pressure chart left, portrait camera right |
| Camera & Timelapses | Redesigned in WP1 | Printer acceptance checks above |
| Status | Redesigned; validation pending | Preserve Paul's latest rebuild |
| Jobs | WP2 information modal added | Athena slicing instructions for the modal; printer acceptance pending |
| Resins | Production behavior reconciled in WP5 | Printer acceptance for all-profile sorting, default badge, editor modes and database iframe |
| Analytics | Requires visual validation | Same metric colors on Dashboard/full charts; check ALL series together on dark backgrounds |
| Print History / Gcode Terminal | Needs visual redesign | Customer-visible legacy template layouts |
| Support & Connectivity | Redesigned in WP3 | Printer acceptance; see athena-support-diagnostics.md for hook inventory, download findings and existing functional issues |
| Resin Import | Route confirmed in WP5; layout separation deferred | `/import` retains both profile and machine-settings forms unchanged |
| Settings and Tools / Machine Settings | Tools redesigned in WP4; Machine Settings remains a service page | `/printer/restore` is a separate, untested ZIP Restore Backup page; shortcut remains Service Mode only |
| Z Axis / Heater / Display Calibration | Hide on Athena | Hidden from System; backend retained |
| Pause / Resume | Requires separate functional review | Inspect movement/state handling before any lift/resume work; protect Z max |

This is a focused navigation audit, not certification of every internal template.
Do customer-visible legacy pages before obscure service pages. Keep Bootstrap 3,
jQuery, server templates and all backend hooks; no framework migration.

## Work Package 2: Jobs, DragonFruit and navbar

- Jobs retains its existing layout and actions, with a gold outlined DragonFruit
  Slicer action next to New Job. A wide, responsive modal presents Get DragonFruit,
  Getting Started and Slicing for Athena. Content is a reusable template separate
  from the dialog shell. No backend or route changes.
- Official download URL was not found in repository/configuration/documentation.
  A disabled download button, visible explanation and source TODO mark the gap.
  Athena setup/profile and slicing instructions remain explicit placeholders.
- The obsolete NanoDLP Remote Slicer promotion was in New/Edit Job, not the Jobs
  list. Removed that presentation and the genuinely duplicated largeFile warning
  and duplicated enabled-status message. Kept one functional warning/status;
  the upload form is unchanged, including USB, data-remote, file-size, browser
  slicing and submit hooks. No job action URL or print-start behavior changed.
- Resin temperature now links to `/`. Bit depth remains dynamically updated in
  the same element, inside a non-interactive span with matching navbar spacing.
- Updated the redesign CSS cache key so existing printers load the new styles.

### Validation

Headless Edge fixture using local Bootstrap 3, jQuery and project CSS passed at
1440x1000, 1024x768, 768x1024, 390x844, 320x568 and 1024x500: Jobs action wrapping,
modal viewport bounds, scrolling, close/Escape, focus restoration, More menu,
unique IDs, disabled download placeholder and navbar targets. No page JS errors.
Desktop/mobile screenshots reviewed; modal bars and muted text explicitly use
existing design tokens to avoid inherited Bootstrap theme colors.

Static comparisons confirm the upload form and all pre-existing Jobs action
URLs are unchanged. The duplicate largeFile ID is removed. WP1 components and
camera/timelapse JS are unchanged; the WP1 mock layout/filter/delete/error checks
were rerun successfully. Git whitespace validation passed.

### Printer acceptance and remaining concerns

The fixture does not execute NanoDLP template rendering or real printer APIs.
Verify Jobs modal rendering on the locked binary, all Jobs actions (New Job,
USB/upload, 3D Editor, More, calibration and existing print controls), live navbar
updates for both 3-bit and 8-bit hardware, and Safari/mobile behavior. Confirm
WP1 stream/LED/video behavior as previously documented. The exact frozen binary's
routing implementation is not present here; no unverified route was assumed.

The preserved Remote slicing enabled status and file-size guidance describe
existing backend capabilities rather than promoting a slicer. Service settings
still expose RemoteSlicer configuration, intentionally unchanged.

## Work Package 3

Support & Connectivity now uses three resource cards, a wider ticket panel next
to Connectivity, and a full-width data-processing table. Privacy/consent wording,
all original hooks and resource destinations remain available. No scripts or
backend behavior changed. See [support diagnostics notes](athena-support-diagnostics.md)
for validation, the existing `/debug` download investigation and printer checks.

## Work Package 4: completed Tools scope; import split deferred

Settings & Tools redesign is complete, with grouped Printer, Backup & Restore,
Customization and Service Tools actions. Exports remain normally available.
The `/printer/restore` shortcut appears only for `viewMode == 1`; this does not
protect the backend route or alter restore behavior. Import templates, their
repository link and duplicate input IDs are deliberately unchanged pending
verification with Pascal/on Athena. Duplicate Pi/filesystem/timezone capabilities
are retained. See [WP4 notes](athena-settings-tools.md) for validation, preserved
hooks, exact scope and remaining printer checks.

## Work Package 5: production UI reconciliation and local review

The authorized Athena II test printer runs NanoDLP from `/home/pi/printer` under
`nanodlp.service`. Its UI templates, stylesheets and scripts were copied read-only
to a temporary local comparison snapshot before WP5. The printer was not changed.
Production is the functional reference for resin editing; the branch design is
the visual reference.

The Resins page now keeps the default profile in the same sortable list as every
other profile, with a Default badge. New Resin, Import, profile actions and
`ManufacturerLock` conditions remain. The production Athena Resin Database
bar and its expand/collapse state were adapted to the dark design. Proteus still
uses `https://proteus.concepts3d.eu`, the existing machine/image detection,
iframe messages and `/profile/import` upload. Only the production toggle/ARIA
handling was merged into the integration script.

The production `templates/profile/edit.html` was used as the functional base:
its paired Bottom/Normal settings, Easy/Advanced layout, field grouping and help
text are retained. Production resin-editor CSS and the peel-detection visibility
logic were merged selectively. Form actions and field names match the production
template. `templates/profile/simple.html` was identical and remains unchanged.

Read-only GETs on the frozen build established the import routes:

| Route | Rendered template | Content |
| --- | --- | --- |
| `/import` | `templates/import.html` | Profile JSON/URL import plus machine-settings JSON/URL restore forms; page title “Setup / Profile Import” |
| `/printer/restore` | `templates/setup/restore.html` | Separate `BackupFile` ZIP upload form; page title “Restore Backup” |

No route form was submitted. Pascal confirmed that Restore Backup has never been
tested on Athena. WP5 relabels its WP4 shortcut and warns that it is an untested
service function. The shortcut remains under `viewMode == 1`; no restore backend
or import form changed. Import-page separation and investigation of ZIP restore
behavior remain future work.

Camera capability was investigated read-only in `machine.json`, `printers.json`,
`custom-inputs.json`, nginx, `ustreamer.service` and existing UI scripts. The
legacy camera/timelapse settings are zero even while `/athena-camera/state`
reports `result.source.online: true`; they do not indicate installed hardware.
No reliable persistent installed-camera flag was found. System navigation
therefore remains visible. The unchanged `camera.js` still hides the Dashboard
Webcam column and expands controls when its existing state request reports
offline or fails. A capability flag is needed before camera-less printers can
hide navigation without also hiding it during temporary outages.

Jobs now presents DragonFruit, New Job, More and Calibrate Exposure in that
order. Its 3D Editor toolbar and row-menu links are removed; the editor
files/backend remain. The
System menu has no Machine heading and shows Machine Settings within Tools only
in Service Mode. Navbar height/status alignment and Dashboard card positioning
were adjusted without changing their live hooks. The Discord invite is now
`https://discord.gg/concepts3d`. The supplied replacement PNG was verified to
decode to that exact invite, copied to `public/shots/athena-discord.png`, and
restored on the Support page. The image also decoded at its 88 px display size.

### Local validation

The recovered editor retains all production field names, element IDs and form
actions, with all 45 production tooltip hooks. JavaScript syntax checks and
`git diff --check` passed. Static checks verified Jobs action order, removal
of only the 3D Editor link, one resin list containing the default badge,
sorting/action hooks, Service Mode restore gating, unchanged import forms and
unchanged `camera.js`. A headless Edge fixture checked Jobs, Resins, both editor
modes, Dashboard, menu, Tools and Support at 1440, 1024, 768 and 390 px: no
horizontal overflow or page errors. The Dashboard heading-to-card gap was
about 30 px at each width. A separate mocked interaction fixture passed resin
name sorting and Proteus open/close state, including iframe machine type.
These fixtures do not execute the frozen NanoDLP renderer or hardware APIs.

### Outstanding printer acceptance

After an explicitly approved deployment, check NanoDLP template rendering in
both modes, resin editing and saving on a disposable profile, default selection
and sorting, Proteus iframe/open/close and import, all Jobs actions, bit-depth
and other navbar live status, Dashboard spacing and camera online/offline layout,
Camera & Timelapses, Support/Discord, and WP4 Tools/exports. Do not test ZIP
restore as part of UI acceptance. Test desktop/mobile and Chrome/Safari.

## Work Package 6: final local cleanup before deployment

The navbar now has an explicit Dashboard link before Jobs. Its 50 px command
bar aligns the logo, navigation and live right-side readouts at desktop widths;
tablet widths collapse the navigation. The Dashboard news feed remains the
Concepts3D website feed, labelled News / Latest News. A separate Software
Update link to `/printer/upgrade` starts hidden and is revealed only by the
existing `update_changelog()` available state. Current and error states hide it.
Heater buttons now say Chamber Heater and Vat Heater in every state.

The resin database heading says Proteus Resin Database and its shell aligns
with the All Resins list. The existing iframe, profile messaging, machine type,
search and import behavior remain unchanged. `docs/athena-design-system.md`
records current WebUI tokens and derived sRGB fallbacks for Proteus/mobile use.

The `/import` page now groups its four existing JSON file/URL forms into Resin
Profile and Machine Settings cards. Actions, payload names, methods, enctype
and required inputs are preserved. File IDs are unique; the obsolete external
NanoDLP repository link is no longer presented. `/profile/compare` keeps both
selectors and JSON comparison logic, while showing an empty state for matching
profiles. New Job gives local file and production USB sources clear tabs;
`ZipFile`, `USBFile`, upload progress and advanced fields remain. The browser
slice button is hidden from Athena presentation while its ID and underlying
NanoDLP implementation remain available in code.

Production calibration reconciliation used the authorized printer read-only:
`calibrationConfig.json`, all six Concepts3D RERF STLs, its preview image, the
guide QR, current model name and the production evaluation instructions were
recovered. The QR decodes to the linked Concepts3D calibration guide. The
second J3D model remains unchanged; its image matched production. Calibration
form IDs, exposure calculations, submit route and print action were not changed;
no calibration print was executed.

Print History now presents statistics and existing result controls in the dark
card system, with semantic status colors and wrapping job names. The Gcode
Terminal uses the same card/control style while retaining its live output,
`#gcode` input and existing send hook. Settings & Tools no longer presents
Export NanoSupport Settings. The existing AEGIS control remains in
Customization with `#aegis-control-div` and `#aegis-available-toggle`, and
`aegis_checkbox_init()` still follows the Athena printer-type/API response.
Support now names technical and customer support and displays the verified
Discord QR at 124 px on desktop, 88 px on mobile.

### Printer acceptance still required

After an approved deployment, test both normal and Service Mode rendering,
navbar status alignment and collapse, Dashboard news and update states,
Proteus database open/close/import, all four import/restore forms only with
separate authorization, comparison with real profiles, local/USB job upload,
calibration preview and model selection, history result controls, terminal
output/input, AEGIS visibility, and Support QR scanning. Do not execute a
calibration print or a Gcode command as part of visual acceptance.

The Software Update page and `changeUpdateChannel()` workflow were not changed.
On physical Athena hardware, separately test channel change, reboot prompt,
cancel and accept paths, state after reboot, update availability, and update
launch/progress. Do not invoke these operations locally. Deeper Machine
Settings organization is deferred until real-printer testing.

## Work Package 7: final visual polish

The navbar logo asset has visible strokes and a faint glow almost to its image
edges, so it was not cropped. A shared 48 px navbar height, centered flex image
and aligned link/readout heights tighten the command bar without distorting the
logo. Jobs now groups DragonFruit Slicer, New Job, and Calibrate Exposure on the
left, with More last on the right. The USB source remains conditional on the
existing Linux context; Advanced Options uses the existing `viewMode` to hide
its toggle in Easy Mode without changing the advanced fields.

The Proteus header artifact came from the browser's default 5 px anchor focus
outline clipping against the rounded database shell after a mouse click. Mouse
focus no longer shows that outline, while keyboard focus has an inset gold ring.
The redundant close toolbar was removed; the header chevron still controls the
same iframe and integration. Calibration evaluation now places the existing
dark-on-light guide QR beside the wider text on desktop and below it on mobile.
The Gcode Terminal card is centered at a 960 px maximum and its Live Output
label uses muted text. Print History and Support were left unchanged.

Physical printer acceptance remains necessary for live navbar statuses,
Linux/USB job availability, Proteus messaging and import, calibration guide QR
scanning, and the existing service/update workflows. No printer writes or
calibration/terminal actions were performed for WP7.

## Work Package 8: first real-printer acceptance fixes

The first physical-printer review found a small optical logo offset, excessive
AEGIS precision, the missing production Z readout, a tall Printer Status page,
the 960 px Terminal cap, and a critical growth loop on full Analytics. WP8 is a
local UI-only correction set; it does not change printer configuration,
NanoDLP backend behavior, analytics source values, motion, Gcode, or heaters.

The production backup showed that the previous Dashboard read Z from the
read-only `/z-axis/info` route every 1.5 seconds and used
`current-height-mm`. That implementation is restored on Dashboard only. It
shows two decimal places in the existing Move Plate label row and keeps `--`
for missing, invalid, or failed responses. No motion command is part of the
readout.

AEGIS continues to use analytics IDs 21, 27, and 26. Formatting now happens
only when writing those values to the Dashboard: fan RPM is rounded to an
integer and VOC inlet/outlet values to one decimal place. The raw values still
feed the existing thresholds and filtering behavior.

Printer Status now places Usage Stats and System in a responsive 40/60 summary
grid. Usage retains all six counters in two columns, and System retains all
seven IDs, sparklines, and values in three columns. The cards stack below the
desktop breakpoint and collapse to single-column metrics on phones. Warnings,
reset, consumables, and Printer Log remain in their existing flow. The Gcode
Terminal now fills the normal shared page width.

The Analytics runaway came from measuring a parent whose height included the
chart and then writing the larger result back into uPlot on every refresh.
Parent fitting is now guarded by an explicit `fitParent` configuration flag.
Full Analytics uses a fixed 420 px desktop canvas and 320 px mobile canvas;
only viewport resize can change it. A representative real-browser fixture
recorded identical container/uPlot/canvas heights after updates 0, 10, and 100:
desktop 510.5/476.5/420 px and mobile 461.5/435.5/320 px. A second mobile
fixture containing both full chart groups and every configured series also
held steady at 697.5 and 933.5 px including their wrapped legends, with both
canvases fixed at 320 px. Neither viewport had chart overflow.

Dashboard-only chart configuration now sets minimum visual spans without
changing data: Force uses 200 g and resin temperature uses 1.0°C. Fixture
ranges of 3–11 g expanded to -93–107 g, while -120–150 g stayed unchanged;
25.0–25.3°C expanded to 24.65–25.65°C, while 24–26°C stayed unchanged. Full
Analytics has no minimum-span configuration.

Browser checks covered desktop, tablet, and mobile. The desktop status cards
rendered at 552/828 px within a 1392 px shared width, the expected 40/60 split;
tablet and phone layouts stacked without horizontal overflow. The Terminal
card used the full 1392 px inner shared width. The compact Z row fit at 390 px.
The shared navbar remained 48 px high (49 px including its border); a logo-only
1 px downward translation produced balanced optical spacing without moving the
brand box or changing collapsed navigation.

Physical printer re-test remains necessary for live Z updates during manual and
printer-driven motion, real AEGIS values, full Analytics during a long print,
status sparklines/log data, and the logo's final optical alignment on the
printer display. WP8 was not deployed and no printer actions were executed.

## Work Package 9: second real-printer polish and updater investigation

WP8 was subsequently deployed to the authorized Athena II test printer and its
read-only acceptance checks passed. WP9 applies the follow-up presentation
changes locally only. Full Analytics now opts only its Pressure scale into the
existing 200 g minimum-span behavior. The Dashboard keeps its 200 g Force span
and increases only its temperature minimum span from 1.0°C to 2.0°C. The
range helper still returns wider real ranges unchanged, so neither setting
clips, filters, or smooths source data.

Printer Status keeps the desktop 40/60 Usage/System grid but no longer stretches
the shorter Usage panel to the System panel height. Its six usage counters stay
in the two-by-three grid. The existing `/printer/stat/reset` action is now a
small danger ghost button in the Usage header and still uses the shared `ask`
handler with `data-ask="reset-confirm"`; its confirmation explicitly states
that resetting every usage statistic cannot be undone. No reset request was
made during validation. System tiles use the same value and sparkline IDs with
the label above and a compact value/sparkline row below. Uptime keeps its value
aligned without a sparkline.

The live printer screenshot and browser geometry showed the 30 px logo image at
10 px from the top with the earlier 1 px translation, while the first navigation
link began at 12.5 px. The logo wordmark was still visibly high because of its
internal optical bounds. The image now has a total 5 px downward translation;
the 48 px brand box, 30 px asset height, aspect ratio, and collapse rules are
unchanged.

The WebUI update modal retains `#update_notification`, `#theBar`,
`#progress-message`, `.progress-bar-main`, the existing one-second polling, the
same progress/message endpoints, disappearance-based completion detection, and
the same `/home/pi/athena-start-update.sh` launch. Its presentation now uses a
centered warm-dark Athena panel, live status above the gold progress bar, a
separate live percentage, and a persistent power warning. Invalid progress is
ignored, numeric progress is bounded for display, and the existing delayed
connection warning now describes a temporarily unavailable updater. There is
still no close or cancel affordance. Validation used mocked 0%, 42%, 100%, and
unavailable responses; it did not launch an update.

### Physical HMI update screen (read-only findings)

The physical update screen is the compiled Flutter release at
`/home/pi/athena-update-progress`, package `athena_update_progress` 1.0.0. Its
layout and polling code are compiled into `app.so`; the only application image
listed by its asset manifest is `assets/splash.png` (1024x600). No Dart source or
`pubspec.yaml` for this application is installed on the printer. The active
touch display reports `800x480` on `DSI-2`, so the update UI targets landscape
800x480 even though the splash source is larger.

`/home/pi/athena-start-update.sh` creates `/tmp/athena_message.txt` and
`/tmp/athena_progress.txt`, stops `nanodlp-dsi.service` (and therefore the
current Orion process), then starts `athena2-update-dsi.service` on Athena II.
That service copies `/root/nanodlp/hmi/dsi` to `/tmp/flutter` and launches:

```
/tmp/flutter --drm-vout-display DSI-2 --release /home/pi/athena-update-progress
```

Legacy models use `athena-update-dsi.service` with the same bundle and no
explicit display selector. The updater starts
`/home/pi/athena-update-server.py` in `/tmp` on port 8080. Both start and main
update scripts write the current status and percentage to the two `/tmp` files;
nginx exposes that directory to the WebUI through `/athena-update/`. Strings in
the compiled HMI application identify `/athena_message.txt`,
`/athena_progress.txt`, and an optional `/athena_headline.txt`; the installed
scripts do not write the headline file. Thus the HMI and WebUI consume the same
status and progress sources. On a recoverable startup error, the start script
stops the update display and restarts `nanodlp-dsi.service`. A successful main
update reaches 100% and either reboots or asks for a power cycle.

This screen is owned and delivered by the AthenaOS updater package, rather than
the Orion bundle at `/opt/orion`. Replacing only `assets/splash.png` is safe for
startup branding but cannot change the dynamic progress layout. An Orion-style
redesign should be made in the update application's source, rebuilt as a
complete Flutter release, and deployed as an atomic replacement of
`/home/pi/athena-update-progress` (at minimum `app.so`, asset manifests, and any
changed assets such as `assets/splash.png`). The service units, launch script,
local HTTP server, and `/tmp` progress/message contract need no change for a
visual-only redesign. Those live files and services were inspected read-only
and were not modified or restarted.

WP9 validation kept the full Analytics canvas/container heights identical at
refreshes 0, 10, and 100. Range checks produced -93 to 107 g for 3-11 g data,
left -120 to 150 g unchanged, and expanded 25.0-25.3°C to 24.15-26.15°C.
Desktop and phone fixtures showed the shorter Usage panel, side-by-side metric
sparklines, compact update modal, and no component overflow. JavaScript syntax
checks passed. Physical re-test remains for the final logo alignment, live
sparklines and Usage reset confirmation without accepting it, full Analytics
during a print, and observing the WebUI modal during a separately authorized
real software update.

## Work Package 10: final real-printer layout and navigation polish

The Dashboard sensor card is now titled Force & Resin Temperature. Its existing
200 g Force and 2°C resin-temperature minimum spans are unchanged. Dashboard
alone opts into the guarded parent-fitting path introduced in WP8; that path now
reserves the compact action row and the plot's CSS margins before sizing uPlot.
The chart therefore uses the remaining panel height without measuring a parent
whose height depends on the chart. The former centered text link is a small gold
ghost Full Analytics button with a chart icon, aligned right on desktop and full
width on phones, and still routes to `/analytic`.

Logo alignment is based on the wordmark pixels rather than the full asset. The
250×50 PNG's wordmark occupies source rows 12–46, with the stable opaque center
at row 29.5. At the unchanged 30 px display height that center is 17.7 px below
the image top. A centered 30 px image begins 9 px into the unchanged 48 px brand
box, while neighboring navbar text centers at 24 px. The required logo-only
translation is therefore 24 − (9 + 17.7) = −2.7 px, rounded to `translateY(-3px)`.
The image file, size, aspect ratio, navbar height, menu alignment, and collapse
rules are unchanged.

Printer Status now has nine System tiles in a desktop three-by-three grid:
CPU, Proc, CPU Temp; Disk, Memory, Uptime; Resin Temp, Chamber Temp, and UV Temp.
A read-only check on the authorized Athena II found no chamber or UV fields in
`/status`; the existing `/analytic/value/22` and `/analytic/value/8` endpoints
returned numeric Chamber Temp and UV Temp values respectively. The Status page
polls those endpoints only when `#stat` exists, on the existing roughly four
second status cadence. Values use one decimal place with °C, failed or invalid
responses show `--`, and up to 120 readings remain only in browser memory for
matching sparklines. No backend route or analytics persistence was added.

The desktop 40/60 summary grid now intentionally stretches Usage Stats and
System to the same height. Its six existing Usage tiles remain two by three and
share the available height across three modest rows; Reset retains its route,
confirmation, and header placement. Tablet layouts stack the panels while
keeping three System columns where space permits, and phone layouts use one
column. Software Update is now a normal-mode Tools entry after Settings and
Tools and before the Service Mode Machine Settings item. It routes to
`/printer/upgrade`; the existing build/version link and WP9 update page/modal
are unchanged.

Validation used a local browser fixture with the project Bootstrap, theme,
uPlot, analytics, and redesign assets. At 1440×1000 the panels were both
240.8125 px high, the System columns were 260.656/260.672/260.656 px, and the
Usage rows were three equal 49.9375 px rows. The Dashboard plot stayed 347 px
high after 100 refreshes and its 311 px canvas plus legend/action fit inside the
panel. At 900×900 and 390×844 the grids stacked as intended, the mobile action
filled its row, and document horizontal overflow remained zero. Browser console
checks were clean. JavaScript syntax and a focused helper test passed for live
value formatting, sparkline history, and unavailable fallback. No reset,
motion, Gcode, heat, print, update, configuration change, deployment, restart,
or reboot was performed.

Physical acceptance remains for the logo's optical alignment on the normal
single-row navbar and collapsed menu, live Chamber/UV polling and sparklines,
Dashboard chart sizing with real print analytics, equal Status panel heights at
the printer's usual browser size, the Software Update menu link, and Reset
confirmation dismissal without accepting it. A separately authorized update is
still required to observe the WP9 progress modal against the real updater.

## Work Package 11: Machine Settings and final presentation fixes

### Machine Settings field/category manifest

This manifest was recorded before implementation. “Hide” means suppress the
Athena presentation while retaining the existing form control, `name`, value,
and NanoDLP backend support. Shared fields stay visible through the listed kept
category even when another category is hidden.

| Current category | Field label | Backend field/name | Planned action |
| --- | --- | --- | --- |
| Interface and Appearance | Category title | `i_appearance` | Relabel to Interface & Appearance |
| Interface and Appearance | Printer Name; Language | `Name`; `Lang` | Keep |
| Interface and Appearance | View Mode: Basic / Expert | `ViewMode` values `0` / `1` | Relabel options to Easy / Advanced |
| Interface and Appearance | Theme | `Theme` | Hide |
| Interface and Appearance | Nextion Display Port Address | `USBDisplayAddress` | Hide |
| Interface and Appearance | Play Sound After Print Stop | `Mute` | Hide |
| Slicing and Print Quality | Category and category-only fields | `i_slicing`; `BarrelFactor`, `BarrelX`, `BarrelY`, `AutoSlice` | Hide category; preserve controls |
| Slicing and Print Quality / Display | Resolution, controller, mirror fields | `ProjectorWidth`, `ProjectorHeight`, `DisplayController`, `XYRes`, `YRes`, `ImageMirror` | Keep through Display |
| Slicing and Print Quality / Network | Remote Slicer | `RemoteSlicer` | Keep through Network unchanged |
| Dynamic G-Code | Bootup, shutdown, start, resume, pause, unpause, preflight, stop, cure, manual movement, parser, shutter open/close | `ShieldBootup`, `ShieldShutdown`, `ShieldStart`, `ShieldResume`, `ShieldPause`, `ShieldUnpause`, `PrinterCheck`, `ShieldFinish`, `CureGcode`, `ManualMoveGcode`, `BoardParser`, `ShutterOpenGcode`, `ShutterCloseGcode` | Keep |
| Dynamic G-Code / Movement | Lifecycle G-code also tagged for Movement | `ShieldStart`, `ShieldResume`, `ShieldPause`, `ShieldUnpause`, `PrinterCheck`, `ShieldFinish`, `CureGcode`, `ManualMoveGcode` | Hide from Movement; keep in Dynamic G-Code |
| Dynamic G-Code / Movement | Custom Acceleration | `SpeedFormula` | Keep in both; formula is movement configuration, not duplicate lifecycle G-code |
| Dynamic G-Code / Display / Slicing | Light Output Formula | `LightOutputFormula` | Hide everywhere |
| Movement | Step GPIO for Z-Axis | `ZAxisPin` | Hide |
| Movement / Hardware | Wait GPIO | `WaitPin` | Hide |
| Movement | Direction, limits, enable, positioning, axis direction, dimensions and speeds | `DirectionPin`, `LimitPin`, `LimitPinB`, `LimitPinMode`, `LimitPinReset`, `EnablePin`, `EnablePinState`, `EnablePinMode`, `ShieldPositioning`, `ShieldAxisMode`, `StopPositionMm`, `ResinDistanceMm`, `MaxSpeed`, `MinSpeed`, `StartupSpeed`, `MotorDegree`, `MicroStep`, `LeadscrewPitch`, `ZAxisHeight` | Keep |
| Display | Resolution, controller, mirror, display number/connection/framebuffer | `ProjectorWidth`, `ProjectorHeight`, `DisplayController`, `XYRes`, `YRes`, `ImageMirror`, `DisplayID`, `DispConn`, `FBPath` | Keep |
| Display | Communication type; warm-up; lamp query/brightness; baud; projector USB; on/off commands; power cycle | `ProjectorType`, `ProjectorWarmup`, `ProjectorLampQuery`, `ProjectorLampEffect`, `ProjectorSpeed`, `ProjectorAddress`, `ProjectorOn`, `ProjectorOff`, `ProjectorPowerCycle` | Hide |
| Network | WiFi Country; TCP Port; Remote Slicer | `WiFiCountry`, `Port`, `RemoteSlicer` | Keep unchanged |
| Camera | Entire category | `i_camera`; `CameraFrequency`, `CameraStore`, `CameraCommand` | Hide category; preserve controls |
| Hardware | Entire category and hardware-only controls | `i_hardware`; printer/controller/GPIO/shutter fields | Hide category; preserve controls |
| Other Settings | Category title and Athena custom inputs | `i_custom`; custom input names supplied by NanoDLP | Relabel category to Athena Settings; keep controls/hooks |

### Implementation and validation

The Athena Machine Settings sidebar now exposes Interface & Appearance,
Dynamic G-Code, Movement, Display, Network, and Athena Settings. Slicing and
Print Quality, Camera, and Hardware have no category buttons. Their controls
remain in the template and form so NanoDLP retains the same field names,
values, and backend support. A page-scoped `c3d-athena-hidden-setting` rule
keeps the specifically hidden controls suppressed even when the existing
category or conditional-display JavaScript calls `show()`.

Interface & Appearance uses Easy and Advanced as the labels for the unchanged
`ViewMode` values 0 and 1. Theme, Nextion Display Port Address, and Play Sound
After Print Stop are hidden. Dynamic G-Code remains the single presentation for
the duplicated lifecycle fields; those same controls no longer appear in
Movement. Custom Acceleration remains visible in both categories because it is
motion configuration rather than duplicated lifecycle G-code. Movement also
hides Step GPIO and Wait GPIO. Display hides the legacy communication, warm-up,
lamp query/brightness, baud, projector USB, on/off, power-cycle, and light-output
formula controls while retaining Athena's required resolution, controller,
mirror, display connection, and framebuffer controls. Network was not changed.
No requested field was unsafe to hide under this presentation-only policy.

The shared browser-title bug came from splitting the current title on `-` for
every status refresh. Redesigned pages without a separator returned an
undefined array element, while later refreshes parsed a title that had already
been rewritten. `main.js` now captures one stable product/printer suffix before
the first mutation, accepts a separator-free suffix only when it identifies
NanoDLP, Athena, or Concepts3D, and joins only non-empty title parts. Focused
tests covered Not Printing, Printing Layer 2/100, Connectivity Problem,
separator and separator-free product titles, page-only titles, repeated
updates, and an undefined status value; no case emitted the literal text
`undefined` or duplicated the suffix.

The dedicated Camera & Timelapses desktop grid is now 4fr/7fr, approximately
36/64 after the gap, and remains 1fr/2fr on tablet before stacking on narrow
screens. At a 1600 px fixture viewport the dedicated camera panel measured
551.625 px versus a 482.328 px Dashboard camera sample. The live view retained
its 9:16 aspect ratio. The timelapse gallery uses four columns above 1399 px,
three through smaller desktop widths, two through tablet widths, and one below
576 px. Fixture measurements at 1600, 1300, 900, and 500 px showed the expected
4/3/2/1 columns and zero document overflow. The preview image retained its 90
degree transform; Play opened the existing modal with its video source, and the
plate filter reduced six cards to one then restored all six. The existing
Delete confirmation, delete request code, metadata, missing-preview state,
encoding status, camera availability hooks, and LED control were not changed.

JavaScript syntax checks, the focused title test, template block balance, and
`git diff --check` passed. Browser console checks reported no errors or
warnings. No backend route, form name/value, saved configuration, camera logic,
timelapse API behavior, printer file, service, restart, or deployment was
changed.

Real-printer acceptance remains for Machine Settings category switching and a
save with deliberately unchanged values; titles on Dashboard, Camera &
Timelapses, Exposure Calibration, Jobs, Resin, Status, and Software Update
through idle, printing, and connectivity states; live camera detection,
unavailable state, stream, and LED behavior; optical comparison of the
dedicated and Dashboard camera widths; and real timelapse preview, filter,
encoding, Play, and separately authorized Delete behavior at the printer's
desktop, tablet, and phone-equivalent viewport sizes.

## Work Package 12: Machine Settings, Service Mode, and navbar branding

Machine Settings keeps the WP11 presentation policy and the original NanoDLP
form contract. The same six category hooks remain visible, and the hidden
Slicing and Print Quality, Camera, Hardware, and field-level controls remain in
the submitted form. The page now uses the Athena header, a compact gold-accented
category rail, and a bordered settings panel. Category selection adds a visual
and accessible selected state without replacing the existing switching code.
Normal fields use a responsive two-column grid where space permits, and the
NanoDLP-provided Athena custom inputs use two columns on desktop and one on
phones. A comparison with the WP11 template found the same 111 literal `name`
attributes, the same empty form action, and the same POST method.

Service Mode remains NanoDLP `viewMode == 1` and uses only the existing GET
`/printer/view/toggle` request. The top-level Settings & Tools action was
removed. In normal mode, a subdued Advanced Service Access section appears at
the bottom and opens an Athena warning modal. Cancel and Escape close it
without a request, focus moves to Cancel after the modal transition, and Enter
cannot activate the confirmation by default. The explicit confirmation sends
one existing toggle request and retains the reload callback. Active mode adds a
compact global banner below the navbar, a SERVICE badge beside System, and a
direct Leave Service Mode action. Settings & Tools also replaces the entry
section with an active-state exit section. Existing Service Tools, Restore
Backup, and Machine Settings gates are unchanged. Dashboard, Jobs, Resins,
Status, Camera & Timelapses, Settings & Tools, Machine Settings, and Software
Update all inherit the banner and badge from the shared base and menu templates.
No timeout or new backend route was added.

The official Concepts3D source SVG was separated structurally without changing
its geometry. `public/general/concepts3d-wordmark.svg` contains the source's
first ten paths with a tight `264.14 54.825 841.86 152.503` viewBox, while
`public/general/concepts3d-icon.svg` contains the eleventh path with a tight
`0 0 234.186 223` viewBox. Path data, white fills, and path fill rules match the
supplied source. One brand link now lays out the two assets with flex alignment:
the icon renders 33.59375 × 32 px, the wordmark 110.390625 × 20 px, and the gap
is 8 px. The icon, wordmark, and desktop navigation labels all measured a 24 px
vertical center in the unchanged 48 px content box; the navbar remains 49 px
including its border. No logo transform or raster scaling remains.

Validation used local mocked fixtures only. At a 1280 px desktop viewport the
Machine Settings layout measured 280 px plus 919 px, the Athena custom fields
measured two equal 432.5 px columns, and document overflow was zero. Effective
871 px and 378 px embedded tablet/phone viewports exercised the project media
queries: the tablet category rail measured 230 px with a 564 px panel; the phone
stacked both at 315 px and changed Athena fields to one 281 px column. The split
brand stayed visible at its desktop dimensions, the collapse toggle remained
available, both banner layouts remained inside the viewport, and overflow was
zero. Mocked entry confirmation and both exit paths each produced exactly one
GET to `/printer/view/toggle`; cancellation produced zero. Final fixture console
checks were clean. JavaScript syntax, template token balance, exact SVG path
comparison, form-name comparison, and `git diff --check` passed. No resin editor,
backend, database, profile, printer configuration, updater, printer file,
service, restart, deployment, or physical printer state was changed.

Real-printer acceptance remains for optical wordmark alignment and collapsed
navbar fit in the printer browser; Machine Settings category switching and a
save with deliberately unchanged values; inactive entry modal focus, Cancel,
Escape, and confirmation; active banner and SERVICE badge across the listed
routes; continued visibility of service-only tools and Restore Backup; and one
authorized enter/leave cycle confirming the live reload behavior. WP12 must be
deployed separately before those checks.
