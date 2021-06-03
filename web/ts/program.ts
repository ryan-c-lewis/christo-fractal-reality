/// <reference path='Focus.ts'/>
/// <reference path='Globals.ts'/>
/// <reference path='JuliaSetSeed.ts'/>
/// <reference path='Point2D.ts'/>
/// <reference path='PresentationData.ts'/>

const j:HTMLCanvasElement = document.getElementById("julia") as HTMLCanvasElement;
const jtx:CanvasRenderingContext2D = j.getContext("2d");

let currentChapter:number = 0;

let seed: JuliaSetSeed = new JuliaSetSeed(0, 0);
const seedChangeSpeed: number = 0.03;

const originalFocus: Focus = new Focus(0, 0, 1);
let currentFocus: Focus;

const maxIterations: number = 30;
const animationSteps: number = 3;
const zoomFactorPerClick: number = 5;
let lastClick: Point2D;
let savedClicks: Point2D[] = [];

let dots: Point2D[] = [];

let isEditMode: boolean = false;
let editMetaSpeed: number = 0;

function configureCanvas() {
    document.documentElement.style.overflow = 'hidden'; // remove scrollbars
    jtx.canvas.width = W;
    jtx.canvas.height = H;
    j.style.width = W + "px";
    j.style.height = H + "px";
    j.style.position = "absolute";
    j.style.left = 0 + "px";
    julia(currentFocus);
}

function putPixel(canvasData, x, y, r, g, b, a) {
    var index = (x + y * W) * 4;

    canvasData.data[index + 0] = r;
    canvasData.data[index + 1] = g;
    canvasData.data[index + 2] = b;
    canvasData.data[index + 3] = a; // 0 -- invisible, 255 
}

function updateCanvas(canvas,canvasData) {
    updateEditText();
    canvas.putImageData(canvasData, 0, 0);
}

function julia(focus) {
    let c_real = seed.x;
    let c_imag = seed.y;
    var row, col, color = 0;
    var x, y;
    var Z_imag, Z_real, Z2_imag, Z2_real;
    var delta = focus.Delta;

    var jtxData = jtx.getImageData(0, 0, W, H);

    /* Julia set computation */
    y = focus.YMax;
    for(row = 0; row < H; row++){
        x = focus.XMin;
        for(col = 0; col < W; col++){
            color = 0;
            Z_real = x; /* Z := x+yi */
            Z_imag = y;

            /* Iteration */
            do {
                /* Z_{n+1} = Z_n^2 + c */
                Z2_real = Z_real * Z_real;
                Z2_imag = Z_imag * Z_imag;
                Z_imag = 2.0 * Z_imag * Z_real + c_imag;
                Z_real = Z2_real - Z2_imag + c_real;
                color++;
            } while(color < maxIterations && (Z2_real + Z2_imag) < 4.0);

            /* plot pixel */
            if (color < maxIterations)
                putPixel(jtxData, col, row, color, 4*color, 20+color, color * color);
            else
                putPixel(jtxData, col, row, 0, 0, 0, 255);

            x += delta;
        }
        y -= delta;
    }

    for(let n = 0; n < dots.length; n++) {
        let dot:Point2D = dots[n];
        let projected: Point2D = currentFocus.convertRealPointToScreen(dot.x, dot.y);
        console.log("dot: " + JSON.stringify(projected));
        for (let xDiff = -4; xDiff < 4; xDiff++)
            for (let yDiff = -4; yDiff < 4; yDiff++)
                putPixel(jtxData, W - Math.round(projected.x) + xDiff, H - Math.round(projected.y) + yDiff, 255, 0, 0, 255);
    }
    
    for(let n = 0; n < savedClicks.length; n++) {
        let click:Point2D = savedClicks[n];
        let projected: Point2D = currentFocus.convertRealPointToScreen(click.x, click.y);
        putPixel(jtxData, W - projected.x, H - projected.y, 255, 0, 0, 255);
    }

    updateCanvas(jtx, jtxData);
}

let pressedKeys = {};
window.onkeyup = function(e) {
    if (e.keyCode == "P".charCodeAt(0))
        alert("Seed: " + JSON.stringify(seed) + "\n"
            + "Zoom: " + JSON.stringify(currentFocus));
    
    if (e.keyCode == "57") // 9
        editMetaSpeed -= 1;
    if (e.keyCode == "48") // 0
        editMetaSpeed += 1;

    if (e.keyCode == "M".charCodeAt(0)) {
        isEditMode = !isEditMode;
        document.getElementById("editModeText").hidden = !isEditMode;
    }

    pressedKeys[e.keyCode] = false;
}
window.onkeydown = function(e) { pressedKeys[e.keyCode] = true; }

function checkForArrowKeys() {
    if (isEditMode) {
        const speedSquared = Math.pow(2, editMetaSpeed);
        if (pressedKeys["W".charCodeAt(0)]) {
            seed = new JuliaSetSeed(seed.x, seed.y - seedChangeSpeed * speedSquared);
            console.log("seed: " + JSON.stringify(seed));
        }
        if (pressedKeys["S".charCodeAt(0)]) {
            seed = new JuliaSetSeed(seed.x, seed.y + seedChangeSpeed * speedSquared);
            console.log("seed: " + JSON.stringify(seed));
        }
        if (pressedKeys["A".charCodeAt(0)]) {
            seed = new JuliaSetSeed(seed.x - seedChangeSpeed * speedSquared, seed.y);
            console.log("seed: " + JSON.stringify(seed));
        }
        if (pressedKeys["D".charCodeAt(0)]) {
            seed = new JuliaSetSeed(seed.x + seedChangeSpeed * speedSquared, seed.y);
            console.log("seed: " + JSON.stringify(seed));
        }

        if (!zooming)
            julia(currentFocus);
    }
    
    setTimeout(checkForArrowKeys, 10);
}

window.onmouseup = function() {
    if (!isEditMode)
        return;

    const mouseEvent = event as MouseEvent;
    const rect = j.getBoundingClientRect();
    const x = mouseEvent.pageX - rect.left;
    const y = mouseEvent.pageY - rect.top;
    const dx = currentFocus.convertScreenPointToReal(x, y).x;
    const dy = currentFocus.convertScreenPointToReal(x, y).y;
    lastClick = new Point2D(dx, dy);
    
    if (zooming)
        return;
    
    let dZoom = currentFocus.zoom;
    
    if (pressedKeys["16"] || pressedKeys["17"]) {
        if (pressedKeys["16"] && pressedKeys["17"]) // ctrl + shift
            dZoom /= zoomFactorPerClick * Math.pow(2, editMetaSpeed);
        else if (pressedKeys["17"]) // ctrl
            dZoom *= zoomFactorPerClick * Math.pow(2, editMetaSpeed);

        let newFocus = new Focus(dx, dy, dZoom);
        zoomTo(currentFocus, newFocus, 1);
    } else if (pressedKeys["18"]) {
        savedClicks = savedClicks.concat(lastClick);
    }
}

let zooming = false;
function zoomTo(focusBeforeZoom, focusAfterZoom, step) {
    zooming = true;
    if (step < animationSteps) {
        let totalPercent = step / animationSteps;
        let newZoom = focusBeforeZoom.zoom + (focusAfterZoom.zoom - focusBeforeZoom.zoom) * totalPercent;

        let screenPositionAtAnimationStart: Point2D = focusBeforeZoom.convertRealPointToScreen(focusAfterZoom.x, focusAfterZoom.y);
        let screenPositionAtAnimationEnd: Point2D = focusAfterZoom.convertRealPointToScreen(focusAfterZoom.x, focusAfterZoom.y);
        let screenXAtAnimationNow: number = screenPositionAtAnimationStart.x + (screenPositionAtAnimationEnd.x - screenPositionAtAnimationStart.x) * totalPercent;
        let screenYAtAnimationNow: number = screenPositionAtAnimationStart.y + (screenPositionAtAnimationEnd.y - screenPositionAtAnimationStart.y) * totalPercent;
        let realPositionAtAnimationNow: Point2D = new Focus(focusAfterZoom.x, focusAfterZoom.y, newZoom).convertScreenPointToReal(screenXAtAnimationNow, screenYAtAnimationNow);

        let thisFocus = new Focus(realPositionAtAnimationNow.x, realPositionAtAnimationNow.y, newZoom);
        currentFocus = thisFocus;
        julia(thisFocus);
        window.setTimeout(function () {
            zoomTo(focusBeforeZoom, focusAfterZoom, step + 1)
        }, 20);
    }
    else {
        currentFocus = focusAfterZoom;
        julia(focusAfterZoom);
        zooming = false;
    }
}

let originalSeed: JuliaSetSeed;
let changingSeed = false;
const changeSeed = function(goalSeed: JuliaSetSeed, step: number) {
    changingSeed = true;
    const steps = animationSteps;
    if (step < steps) {
        if (step === 0)
            originalSeed = seed;
        let totalPercent = step / steps;
        let newX = originalSeed.x + (goalSeed.x - originalSeed.x) * totalPercent;
        let newY = originalSeed.y + (goalSeed.y - originalSeed.y) * totalPercent;
        seed = new JuliaSetSeed(newX, newY);
        julia(currentFocus);
        window.setTimeout(function () {
            changeSeed(goalSeed, step + 1)
        }, 20);
    }
    else {
        seed = goalSeed;
        julia(currentFocus);
        changingSeed = false;
    }
}

window.onresize = function() {
    W = window.innerWidth;
    H = window.innerHeight;
    configureCanvas();
}

const respondToVisibility = function(element, callback) {
    const options = {
        root: document.documentElement
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            callback(element, entry.intersectionRatio > 0);
        });
    }, options);

    observer.observe(element);
}

const getChildElementsByTagName = function(element: HTMLElement, childTagName: string) {
    const c: HTMLCollection = element.children;
    var x: Element[] = [];
    for(var i =0; i<c.length;i++) {
        if(c[i].tagName === childTagName){
            x.push(c[i]);
        }
    }
    return x;
}

const updateEditText = function() {
    let text: string = "\"julia\": {\"x\":" + seed.x + ",\"y\":" + seed.y + "},\n" +
        "                    \"focus\": {\"x\":" + currentFocus.x + ",\"y\":" + currentFocus.y + ",\"zoom\":" + currentFocus.zoom + "}";
    
    if (savedClicks.length > 0) {
        text += "\n                    \"dots\": [\n";
        for (let n:number = 0; n < savedClicks.length; n++) {
            let dot = savedClicks[n];
            text += "                        {\"text\": \"Dot " + (n + 1) + "\",\"x\":" + dot.x + ",\"y\":" + dot.y + "},\n";
        }
        text += "                    ]";
    }
    
    navigator.clipboard.writeText(text);
}

const configureSlides = function() {
    let slidesHTML:string = "";
    for(let slideNum:number = 0; slideNum < PresentationData.chapters[currentChapter].slides.length; slideNum++) {
        let slide = PresentationData.chapters[currentChapter].slides[slideNum];
        let text:string = slide.text;
        
        slidesHTML += "<section class='slide-bottom'>";
        slidesHTML += "  <julia seedX='0' seedY='0'></julia>";
        slidesHTML += "  <div class='wrap content-center'>";
        slidesHTML += "    <p>" + text + "</p>";
        slidesHTML += "  </div>";
        slidesHTML += "</section>";
    }
    
    document.getElementById("webslides").innerHTML = slidesHTML;
    document.dispatchEvent(new CustomEvent("afterConfigureSlides"));
}

const getJuliaAsOf = function(slideNum: number): JuliaSetSeed {
    let slideToCheck: number = slideNum;
    while (slideToCheck >= 0) {
        let slide = PresentationData.chapters[currentChapter].slides[slideToCheck];
        if (slide.julia)
            return new JuliaSetSeed(+slide.julia.x, +slide.julia.y);
        slideToCheck--;
    }
    return new JuliaSetSeed(0, 0);
}

const getFocusAsOf = function(slideNum: number): Focus {
    let slideToCheck: number = slideNum;
    while (slideToCheck >= 0) {
        let slide = PresentationData.chapters[currentChapter].slides[slideToCheck];
        if (slide.focus)
            return new Focus(+slide.focus.x, +slide.focus.y, +slide.focus.zoom);
        slideToCheck--;
    }
    return new Focus(0, 0, 1);
}

const getDotsAsOf = function(slideNum: number): Point2D[] {
    let slideToCheck: number = slideNum;
    while (slideToCheck >= 0) {
        let slide = PresentationData.chapters[currentChapter].slides[slideToCheck];
        if (slide.dots) {
            let myDots: Point2D[] = [];
            for (let n: number = 0; n < slide.dots.length; n++) {
                myDots = myDots.concat(new Point2D(slide.dots[n].x, slide.dots[n].y));
            }
            return myDots;
        }
        slideToCheck--;
    }
    return [];
}

window.onload = function() {
    currentFocus = new Focus(originalFocus.x, originalFocus.y, originalFocus.zoom);
    configureSlides();
    configureCanvas();
    checkForArrowKeys();

    var divs = document.getElementsByTagName("section");
    for(let i: number = 0; i < divs.length; i++) {
        respondToVisibility(divs[i], (element, visible) => {
            if (visible) {
                let slideNum: number = +element.id.replace('section-', '') - 1;

                dots = getDotsAsOf(slideNum);
                julia(currentFocus);
                
                let currentJulia:JuliaSetSeed = getJuliaAsOf(slideNum);
                if (currentJulia.x !== seed.x || currentJulia.y !== seed.y) {
                    changeSeed(currentJulia, 0);
                }
                
                let focus:Focus = getFocusAsOf(slideNum);
                if (focus.x !== currentFocus.x || focus.y !== currentFocus.y) {
                    zoomTo(currentFocus, focus, 1);
                }
            }
        });
    }
}