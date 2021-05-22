class Point2D {
    readonly x: number;
    readonly y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

class Focus {
    readonly center: Point2D;
    readonly zoom: number;
    readonly Delta: number;
    readonly YMin: number;
    readonly YMax: number;
    readonly XMin: number;
    readonly XMax: number;
    
    get x(): number {
        return this.center.x;
    }
    get y(): number {
        return this.center.y;
    }
    
    constructor(x: number, y: number, zoom: number) {
        this.center = new Point2D(x, y);
        this.zoom = zoom;

        const halfYHeight: number = 1 / this.zoom;
        const halfXHeight: number = halfYHeight * W / H;
        this.Delta = halfYHeight * 2 / H;
        this.YMin = this.y - halfYHeight;
        this.YMax = this.y + halfYHeight;
        this.XMin = this.x - halfXHeight;
        this.XMax = this.x + halfXHeight;
    }
}

class JuliaSetSeed {
    readonly x: number;
    readonly y: number;
    
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

let H: number = window.innerHeight;
let W: number = window.innerWidth;

const j:HTMLCanvasElement = document.getElementById("julia") as HTMLCanvasElement;
const jtx:CanvasRenderingContext2D = j.getContext("2d");

let seed: JuliaSetSeed = new JuliaSetSeed(0, 0);
const seedChangeSpeed: number = 0.03;

const originalFocus: Focus = new Focus(0, 0, 1);
let currentFocus: Focus;

const maxIterations: number = 100;
const animationSteps: number = 20;
const zoomFactorPerClick: number = 5;

function init() {
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
    const dx = screen_xy_to_real(x, y, currentFocus).x;
    const dy = screen_xy_to_real(x, y, currentFocus).y;
    const dZoom = currentFocus.zoom * zoomFactorPerClick;
    console.log("zooming to: " + dx + ", " + dy);

    let newFocus = new Focus(dx, dy, dZoom);
    zoomTo(currentFocus, newFocus, 1);
}

function screen_xy_to_real(x, y, focus) {
    var dx = focus.XMin + (focus.Delta * x);
    var dy = focus.YMin + (focus.Delta * (H - y));
    return { x: dx, y: dy }
}

function real_xy_to_screen(dx, dy, focus) {
    var x = W - (dx - focus.XMin) / focus.Delta;
    var y = (dy - focus.YMin) / focus.Delta;
    return { x: x, y: y }
}

let zooming = false;
function zoomTo(previousFocus, goalFocus, step) {
    zooming = true;
    if (step < animationSteps) {
        let totalPercent = step / animationSteps;
        let newZoom = currentFocus.zoom + (goalFocus.zoom - currentFocus.zoom) * totalPercent;

        let screenPositionAtAnimationStart = real_xy_to_screen(goalFocus.x, goalFocus.y, currentFocus);
        let screenPositionAtAnimationEnd = real_xy_to_screen(goalFocus.x, goalFocus.y, goalFocus);
        let screenXAtAnimationNow = screenPositionAtAnimationStart.x + (screenPositionAtAnimationEnd.x - screenPositionAtAnimationStart.x) * totalPercent;
        let screenYAtAnimationNow = screenPositionAtAnimationStart.y + (screenPositionAtAnimationEnd.y - screenPositionAtAnimationStart.y) * totalPercent;
        let realPositionAtAnimationNow = screen_xy_to_real(screenXAtAnimationNow, screenYAtAnimationNow, new Focus(goalFocus.x, goalFocus.y, newZoom));

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

window.onresize = function() {
    W = window.innerWidth;
    H = window.innerHeight;
    init();
}

window.onload = function() {
    currentFocus = new Focus(originalFocus.x, originalFocus.y, originalFocus.zoom);
    init();
    checkForArrowKeys();
}