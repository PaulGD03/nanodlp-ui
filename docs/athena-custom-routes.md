# Athena custom page routes

Athena HTML templates in `templates/athena-*.html` are served by the **NanoDLP binary**, not by this repository alone.

| URL | Template |
|-----|----------|
| `/custom/webcam` | `athena-webcam.html` |
| `/custom/heater` | `athena-heater.html` |
| `/custom/calibration` | `athena-calibration.html` |
| `/custom/timelapse` | `athena-timelapse.html` |

When adding a new Athena page, register the route in the NanoDLP source/binary so the URL resolves; then add a menu link in `templates/menu.html`.

## Combined camera page

The Athena menu links to `/custom/webcam` as **Camera & Timelapses**. Both webcam
and timelapse templates include `components/camera-timelapses.html`, preserving
old routes and plate-filter query links without changing the locked binary.

## DragonFruit information view (Work Package 2)

The frozen binary has no verified generic template route in this repository.
The existing Athena routes remain in use; hiding a menu entry does not make its
route safe to repurpose. `/static/` serves assets (including the existing editor),
but a standalone static information page would need its own shell and printer
verification. No new route or route replacement was introduced.

The approved approach is a Bootstrap 3 modal included by the Jobs template.
`components/dragonfruit-modal.html` owns the modal shell and includes the separate
`components/dragonfruit-info.html` content. The latter can be reused by a future
Odyssey OS page. The button uses Bootstrap's existing modal data API; no extra JS
or initialization is needed. The download button links to the official
`https://dragonfruit-slicer.com` in a new tab.
