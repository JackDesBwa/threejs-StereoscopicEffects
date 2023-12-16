This example uses jsdelivr to show how this effect can be used.
Start a server `python3 -m http.server` (or copy it to online server) and enjoy the example.

Essentially, you have to create a StereoscopicEffects object and replace the call to the render function of the renderer by a call to the render function of this object. Do not forget to set the pixelRatio to the underlying renderer and the size to the effets manager for the internal buffers.
