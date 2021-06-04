/// <reference path='Dot.ts'/>
/// <reference path='Focus.ts'/>
/// <reference path='FractalManager.ts'/>
/// <reference path='Globals.ts'/>
/// <reference path='JuliaSetSeed.ts'/>
/// <reference path='KeyManager.ts'/>
/// <reference path='Point2D.ts'/>
/// <reference path='PresentationData.ts'/>
/// <reference path='SlideManager.ts'/>

let isEditMode: boolean = false;
let editMetaSpeed: number = 0;

let fractal: FractalManager = new FractalManager();
let keyManager: KeyManager = new KeyManager();
let slideManager: SlideManager;

window.onmouseup = function() {
    const mouseEvent = event as MouseEvent;
    fractal.zoomTo(mouseEvent.pageX, mouseEvent.pageY);
}

window.onresize = function() {
    W = window.innerWidth;
    H = window.innerHeight;
    fractal?.configureCanvas();
}

window.onload = function() {
    keyManager = new KeyManager();
    slideManager = new SlideManager(0);
    fractal = new FractalManager();
}