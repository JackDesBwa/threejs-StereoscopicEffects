This example uses A-FRAME framework to show how this effect can be used.
Start a server `python3 -m http.server` (or copy it to online server) and enjoy the example.
Note: WebXR will work only with HTTPS server.

Essentially, you have to create a StereoscopicEffects object and use its inject parameter so that it injects itself into the renderer used by aframe.

In more details, there are tricks used here.
- A file `use-aframe-three.js` and the importmap are used to make StereoscopicEffects load three embedded in aframe
- `aframe-stereofx.js` have the definitions of
  - component `cam-focus` that allows to select at which distance of the camera will be the depth at which objects lie on the screen,
  - system `stereofx` used to inject StereoscopicEffects into aframe. The parameter is the effect number.
- There is a script to add selector for display mode
- The scene is parametered to allow AR & VR with built-in `xr-mode-ui`
