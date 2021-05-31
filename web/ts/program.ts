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
const animationSteps: number = 5;
const zoomFactorPerClick: number = 5;

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

    updateCanvas(jtx, jtxData);
}

let pressedKeys = {};
window.onkeyup = function(e) {
    if (pressedKeys["65"])
        alert("Seed: " + JSON.stringify(seed) + "\n"
            + "Zoom: " + JSON.stringify(currentFocus));

    pressedKeys[e.keyCode] = false;
}
window.onkeydown = function(e) { pressedKeys[e.keyCode] = true; }

function checkForArrowKeys() {
    if (pressedKeys["37"])
        seed = new JuliaSetSeed(seed.x, seed.y - seedChangeSpeed);
    if (pressedKeys["39"])
        seed = new JuliaSetSeed(seed.x, seed.y + seedChangeSpeed);
    if (pressedKeys["38"])
        seed = new JuliaSetSeed(seed.x - seedChangeSpeed, seed.y);
    if (pressedKeys["40"])
        seed = new JuliaSetSeed(seed.x + seedChangeSpeed, seed.y);

    if (!zooming)
        julia(currentFocus);

    setTimeout(checkForArrowKeys, 10);
}

window.onmouseup = function() {
    if (zooming)
        return;

    const mouseEvent = event as MouseEvent;
    const rect = j.getBoundingClientRect();
    const x = mouseEvent.pageX - rect.left;
    const y = mouseEvent.pageY - rect.top;
    const dx = currentFocus.convertScreenPointToReal(x, y).x;
    const dy = currentFocus.convertScreenPointToReal(x, y).y;
    const dZoom = currentFocus.zoom * zoomFactorPerClick;

    let newFocus = new Focus(dx, dy, dZoom);
    zoomTo(currentFocus, newFocus, 1);
}

let zooming = false;
function zoomTo(previousFocus, goalFocus, step) {
    zooming = true;
    if (step < animationSteps) {
        let totalPercent = step / animationSteps;
        let newZoom = currentFocus.zoom + (goalFocus.zoom - currentFocus.zoom) * totalPercent;

        let screenPositionAtAnimationStart: Point2D = currentFocus.convertRealPointToScreen(goalFocus.x, goalFocus.y);
        let screenPositionAtAnimationEnd: Point2D = goalFocus.convertRealPointToScreen(goalFocus.x, goalFocus.y);
        let screenXAtAnimationNow: number = screenPositionAtAnimationStart.x + (screenPositionAtAnimationEnd.x - screenPositionAtAnimationStart.x) * totalPercent;
        let screenYAtAnimationNow: number = screenPositionAtAnimationStart.y + (screenPositionAtAnimationEnd.y - screenPositionAtAnimationStart.y) * totalPercent;
        let realPositionAtAnimationNow: Point2D = new Focus(goalFocus.x, goalFocus.y, newZoom).convertScreenPointToReal(screenXAtAnimationNow, screenYAtAnimationNow);

        let thisFocus = new Focus(realPositionAtAnimationNow.x, realPositionAtAnimationNow.y, newZoom);
        julia(thisFocus);
        window.setTimeout(function () {
            zoomTo(thisFocus, goalFocus, step + 1)
        }, 20);
    }
    else {
        julia(goalFocus);
        currentFocus = goalFocus;
        zooming = false;
    }
}

let originalSeed: JuliaSetSeed;
let changingSeed = false;
const changeSeed = function(goalSeed: JuliaSetSeed, step: number) {
    changingSeed = true;
    const steps = 20;
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
        julia(currentFocus);
        seed = goalSeed;
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

let hasSetFirstSeed: boolean = false;
window.onload = function() {
    currentFocus = new Focus(originalFocus.x, originalFocus.y, originalFocus.zoom);
    configureSlides();
    configureCanvas();
    checkForArrowKeys();

    var divs = document.getElementsByTagName("section");
    for(let i: number = 0; i < divs.length; i++) {
        respondToVisibility(divs[i], (element, visible) => {
            if (visible) {
                let juliaElement: Element = getChildElementsByTagName(element, "JULIA")[0];
                let seedX: number = +juliaElement.getAttribute("seedX");
                let seedY: number = +juliaElement.getAttribute("seedY");
                
                if (hasSetFirstSeed)
                    changeSeed(new JuliaSetSeed(seedX, seedY), 0);
                else {
                    hasSetFirstSeed = true;
                    seed = new JuliaSetSeed(seedX, seedY);
                }
            }
        });
    }
}