/// <reference path='Dot.ts'/>
/// <reference path='Focus.ts'/>
/// <reference path='FractalAnimation.ts'/>
/// <reference path='FractalConfiguration.ts'/>
/// <reference path='FractalManager.ts'/>
/// <reference path='KeyManager.ts'/>
/// <reference path='Point2D.ts'/>
/// <reference path='PresentationData.ts'/>
/// <reference path='SlideManager.ts'/>

let H: number = window.innerHeight;
let W: number = window.innerWidth;
let isEditMode: boolean = false;
let editMetaSpeed: number = 0;
let fractal: FractalManager;
let keyManager: KeyManager;
let slideManager: SlideManager;

window.onmousedown = function() {
    const mouseEvent = event as MouseEvent;
    fractal.mousedown(mouseEvent.pageX, mouseEvent.pageY);
}

window.onmousemove = function() {
    const mouseEvent = event as MouseEvent;
    fractal.mousemove(mouseEvent.pageX, mouseEvent.pageY);
}

window.onmouseup = function() {
    const mouseEvent = event as MouseEvent;
    fractal.mouseup(mouseEvent.pageX, mouseEvent.pageY);
}

window.onresize = function() {
    W = window.innerWidth;
    H = window.innerHeight;
    fractal?.afterWindowResized();
}

window.onload = function() {
    keyManager = new KeyManager();
    fractal = new FractalManager();
    
    let chapter: number = +new URLSearchParams(window.location.search).get('chapter');
    if (chapter == 0)
        chapter = 1;
    goToChapter(chapter);
}

const goToChapter = function(n: number) {
    slideManager = new SlideManager(n - 1);
}