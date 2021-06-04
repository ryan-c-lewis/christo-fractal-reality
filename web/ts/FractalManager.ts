class FractalManager {
    private j:HTMLCanvasElement;
    private jtx:CanvasRenderingContext2D;
    private seed: JuliaSetSeed = new JuliaSetSeed(0, 0);
    private originalFocus: Focus = new Focus(0, 0, 1);
    private currentFocus: Focus;
    private zooming = false;
    private maxIterations: number = 30;
    private animationSteps: number = 15;
    private zoomFactorPerClick: number = 5;
    private lastClick: Point2D;
    private savedClicks: Point2D[] = [];
    private dots: Dot[] = [];
    private isFirstAnimate = true;

    constructor() {
        this.currentFocus = new Focus(this.originalFocus.x, this.originalFocus.y, this.originalFocus.zoom);

        this.j = document.getElementById("julia") as HTMLCanvasElement;
        this.jtx = this.j.getContext("2d");
        this.configureCanvas();
    }

    configureCanvas() {
        document.documentElement.style.overflow = 'hidden'; // remove scrollbars
        this.jtx.canvas.width = W;
        this.jtx.canvas.height = H;
        this.jtx.font = '20px Courier';
        this.jtx.fillStyle = 'white';
        this.jtx.textAlign = 'center';
        this.j.style.width = W + "px";
        this.j.style.height = H + "px";
        this.j.style.position = "absolute";
        this.j.style.left = 0 + "px";
        this.julia(this.currentFocus);
    }

    putPixel(canvasData, x, y, r, g, b, a) {
        var index = (x + y * W) * 4;

        canvasData.data[index + 0] = r;
        canvasData.data[index + 1] = g;
        canvasData.data[index + 2] = b;
        canvasData.data[index + 3] = a; // 0 -- invisible, 255 
    }

    updateCanvas(canvas: CanvasRenderingContext2D, canvasData: ImageData) {
        this.updateEditText();
        canvas.putImageData(canvasData, 0, 0);
    }

    updateEditText() {
        let text: string = "\"julia\": {\"x\":" + this.seed.x + ",\"y\":" + this.seed.y + "},\n" +
            "                    \"focus\": {\"x\":" + this.currentFocus.x + ",\"y\":" + this.currentFocus.y + ",\"zoom\":" + this.currentFocus.zoom + "}";

        if (this.savedClicks.length > 0) {
            text += "\n                    \"dots\": [\n";
            for (let n:number = 0; n < this.savedClicks.length; n++) {
                let dot = this.savedClicks[n];
                text += "                        {\"text\": \"Dot " + (n + 1) + "\",\"x\":" + dot.x + ",\"y\":" + dot.y + "},\n";
            }
            text += "                    ]";
        }

        navigator.clipboard.writeText(text);
    }

    julia(focus) {
        let c_real = this.seed.x;
        let c_imag = this.seed.y;
        var row, col, color = 0;
        var x, y;
        var Z_imag, Z_real, Z2_imag, Z2_real;
        var delta = focus.Delta;

        let jtxData:ImageData = this.jtx.getImageData(0, 0, W, H);

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
                } while(color < this.maxIterations && (Z2_real + Z2_imag) < 4.0);

                /* plot pixel */
                if (color < this.maxIterations)
                    this.putPixel(jtxData, col, row, color, 4*color, 20+color, color * color);
                else
                    this.putPixel(jtxData, col, row, 0, 0, 0, 255);

                x += delta;
            }
            y -= delta;
        }

        for(let n = 0; n < this.dots.length; n++) {
            let dot:Dot = this.dots[n];
            let projected: Point2D = this.currentFocus.convertRealPointToScreen(dot.x, dot.y);
            let drawX: number = W - Math.round(projected.x);
            let drawY: number = H - Math.round(projected.y);
            if (drawX < 0 || drawY < 0 || drawX > W || drawY > H)
                continue;

            for (let xDiff = -4; xDiff < 4; xDiff++)
                for (let yDiff = -4; yDiff < 4; yDiff++)
                    this.putPixel(jtxData, drawX + xDiff, drawY + yDiff, 255, 0, 0, 255);

            console.log("adding text " + dot.text + " at " + drawX + ", " + drawY);
        }

        for(let n = 0; n < this.savedClicks.length; n++) {
            let click:Point2D = this.savedClicks[n];
            let projected: Point2D = this.currentFocus.convertRealPointToScreen(click.x, click.y);
            this.putPixel(jtxData, W - projected.x, H - projected.y, 255, 0, 0, 255);
        }

        this.updateCanvas(this.jtx, jtxData);

        for(let n = 0; n < this.dots.length; n++) {
            let dot:Dot = this.dots[n];
            let projected: Point2D = this.currentFocus.convertRealPointToScreen(dot.x, dot.y);
            let drawX: number = W - Math.round(projected.x);
            let drawY: number = H - Math.round(projected.y);
            if (drawX < 0 || drawY < 0 || drawX > W || drawY > H)
                continue;

            console.log("adding text " + dot.text + " at " + drawX + ", " + drawY);
            this.jtx.fillText(dot.text, drawX, drawY + 24);
        }
    }
    
    changeSeed(dx: number, dy: number) {
        this.seed = new JuliaSetSeed(this.seed.x + dx, this.seed.y + dy);
        console.log("seed: " + JSON.stringify(this.seed));

        if (!this.zooming)
            this.julia(this.currentFocus);
    }

    zoomTo(screenX: number, screenY: number) {
        if (!isEditMode)
            return;

        const rect = this.j.getBoundingClientRect();
        const x = screenX - rect.left;
        const y = screenY - rect.top;
        const dx = this.currentFocus.convertScreenPointToReal(x, y).x;
        const dy = this.currentFocus.convertScreenPointToReal(x, y).y;
        this.lastClick = new Point2D(dx, dy);

        if (this.zooming)
            return;

        let dZoom = this.currentFocus.zoom;

        if (pressedKeys["16"] || pressedKeys["17"]) {
            if (pressedKeys["16"] && pressedKeys["17"]) // ctrl + shift
                dZoom /= this.zoomFactorPerClick * Math.pow(2, editMetaSpeed);
            else if (pressedKeys["17"]) // ctrl
                dZoom *= this.zoomFactorPerClick * Math.pow(2, editMetaSpeed);

            let newFocus = new Focus(dx, dy, dZoom);
            this.animateZoomChange(this.currentFocus, newFocus, 1);
        } else if (pressedKeys["18"]) {
            this.savedClicks = this.savedClicks.concat(this.lastClick);
        }
    }

    animateZoomChange(focusBeforeZoom, focusAfterZoom, step) {
        this.zooming = true;
        if (step < this.animationSteps) {
            let totalPercent = step / this.animationSteps;
            let newZoom = focusBeforeZoom.zoom + (focusAfterZoom.zoom - focusBeforeZoom.zoom) * totalPercent;

            let screenPositionAtAnimationStart: Point2D = focusBeforeZoom.convertRealPointToScreen(focusAfterZoom.x, focusAfterZoom.y);
            let screenPositionAtAnimationEnd: Point2D = focusAfterZoom.convertRealPointToScreen(focusAfterZoom.x, focusAfterZoom.y);
            let screenXAtAnimationNow: number = screenPositionAtAnimationStart.x + (screenPositionAtAnimationEnd.x - screenPositionAtAnimationStart.x) * totalPercent;
            let screenYAtAnimationNow: number = screenPositionAtAnimationStart.y + (screenPositionAtAnimationEnd.y - screenPositionAtAnimationStart.y) * totalPercent;
            let realPositionAtAnimationNow: Point2D = new Focus(focusAfterZoom.x, focusAfterZoom.y, newZoom).convertScreenPointToReal(screenXAtAnimationNow, screenYAtAnimationNow);

            let thisFocus = new Focus(realPositionAtAnimationNow.x, realPositionAtAnimationNow.y, newZoom);
            this.currentFocus = thisFocus;
            this.julia(thisFocus);
            let self = this;
            window.setTimeout(function () {
                self.animateZoomChange(focusBeforeZoom, focusAfterZoom, step + 1)
            }, 20);
        }
        else {
            this.currentFocus = focusAfterZoom;
            this.julia(focusAfterZoom);
            this.zooming = false;
        }
    }

    originalSeed: JuliaSetSeed;
    changingSeed = false;
    animateSeedChange(goalSeed: JuliaSetSeed, step: number) {
        this.changingSeed = true;
        const steps = this.animationSteps;
        if (step < steps) {
            if (step === 0)
                this.originalSeed = this.seed;
            let totalPercent = step / steps;
            let newX = this.originalSeed.x + (goalSeed.x - this.originalSeed.x) * totalPercent;
            let newY = this.originalSeed.y + (goalSeed.y - this.originalSeed.y) * totalPercent;
            this.seed = new JuliaSetSeed(newX, newY);
            this.julia(this.currentFocus);
            let self = this;
            window.setTimeout(function () {
                self.animateSeedChange(goalSeed, step + 1)
            }, 20);
        }
        else {
            this.seed = goalSeed;
            this.julia(this.currentFocus);
            this.changingSeed = false;
        }
    }
    
    animateTo(newJulia: JuliaSetSeed, newFocus: Focus, newDots: Dot[], ) {
        this.dots = newDots;
        this.julia(this.currentFocus); // to update dots if nothing else is happening. need a better way

        if (newJulia.x !== this.seed.x || newJulia.y !== this.seed.y) {
            if (this.isFirstAnimate) {
                this.seed = newJulia;
                this.julia(this.currentFocus);
            } else
                this.animateSeedChange(newJulia, 0);
        }

        if (newFocus.x !== this.currentFocus.x || newFocus.y !== this.currentFocus.y) {
            if (this.isFirstAnimate) {
                this.currentFocus = newFocus;
                this.julia(this.currentFocus);
            } else
                this.animateZoomChange(this.currentFocus, newFocus, 1);
        }

        this.isFirstAnimate = false;
    }
}