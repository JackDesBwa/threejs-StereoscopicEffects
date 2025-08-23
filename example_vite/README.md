This example uses `vite` to show how this effect can be used.

First start with `npm install` which will download dependancies (to be done only once) and `npm run dev` to run the dev server (see vite doc for more).

Note that you can run `VITE_REPOLIB=1 npm run dev` to serve StereoscopicEffects from the local repo instead of npm installed version.

Essentially, you have to create a StereoscopicEffects object and replace the call to the render function of the renderer by a call to the render function of this object. Do not forget to set the pixelRatio to the underlying renderer and the size to the effets manager for the internal buffers.
