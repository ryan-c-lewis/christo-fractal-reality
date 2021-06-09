class FractalManager {
    private j:HTMLCanvasElement;
    private jtx:CanvasRenderingContext2D;

    private colors: FractalColors;
    private currentConfiguration: FractalConfiguration;
    private currentAnimation: FractalAnimation;
    
    private maxIterations: number = 50;
    private zoomFactorPerClick: number = 5;
    
    private isDraggingDot: boolean;
    private draggingDotNumber: number;
    private addedDots: Dot[] = [];

    constructor() {
        this.currentConfiguration = new FractalConfiguration(new Point2D(0, 0), new Focus(0, 0, 1), []);
        this.colors = new FractalColors(new Color(0, 0, 0, 0), new Color(0, 0, 0, 0), new Color(0, 0, 0, 0));

        this.j = document.getElementById("julia") as HTMLCanvasElement;
        this.jtx = this.j.getContext("2d");
        this.configureCanvas();
        
    }

    configureCanvas() {
        document.documentElement.style.overflow = 'hidden'; // remove scrollbars
        this.jtx.canvas.width = W;
        this.jtx.canvas.height = H;
        this.jtx.font = 'bold 20px Courier';
        //this.jtx.fillStyle = 'white';
        this.jtx.textAlign = 'center';
        this.j.style.width = W + "px";
        this.j.style.height = H + "px";
        this.j.style.position = "absolute";
        this.j.style.left = 0 + "px";
        this.redraw();
    }

    putPixel(canvasData, x, y, color: Color) {
        const index = (x + y * W) * 4;
        canvasData.data[index] = color.r;
        canvasData.data[index + 1] = color.g;
        canvasData.data[index + 2] = color.b;
        canvasData.data[index + 3] = color.a;
    }

    updateCanvas(canvas: CanvasRenderingContext2D, canvasData: ImageData) {
        this.copyJsonToClipboard();
        canvas.putImageData(canvasData, 0, 0);
    }

    copyJsonToClipboard() {
        if (!isEditMode)
            return;
        
        let text: string = "\"julia\": {\"x\":" + this.currentConfiguration.seed.x + ",\"y\":" + this.currentConfiguration.seed.y + "},\n" +
            "                    \"focus\": {\"x\":" + this.currentConfiguration.focus.x + ",\"y\":" + this.currentConfiguration.focus.y + ",\"zoom\":" + this.currentConfiguration.focus.zoom + "}";

        if (this.currentConfiguration.dots.length + this.addedDots.length > 0) {
            text += ",\n                    \"dots\": [\n";
            for (let n:number = 0; n < this.currentConfiguration.dots.length; n++) {
                let dot = this.currentConfiguration.dots[n];
                text += "                        {\"text\": \"" + dot.text + "\",\"x\":" + dot.x + ",\"y\":" + dot.y + "},\n";
            }
            for (let n:number = 0; n < this.addedDots.length; n++) {
                let dot = this.addedDots[n];
                text += "                        {\"text\": \"" + dot.text + "\",\"x\":" + dot.x + ",\"y\":" + dot.y + "},\n";
            }
            text += "                    ]";
        }

        navigator.clipboard.writeText(text);
    }
    
    setColors(newColors: FractalColors) {
        this.colors = newColors;
    }
    
    afterWindowResized() {
        this.currentConfiguration.focus =
            new Focus(this.currentConfiguration.focus.x, this.currentConfiguration.focus.y, this.currentConfiguration.focus.zoom);
        this.configureCanvas();
        this.redraw();
    }
    
    updateConfiguration(newConfiguration: FractalConfiguration) {
        this.currentConfiguration = newConfiguration;
        this.redraw();
    }

    redraw() {
        let c_real = this.currentConfiguration.seed.x;
        let c_imag = this.currentConfiguration.seed.y;
        let delta = this.currentConfiguration.focus.Delta;

        let jtxData:ImageData = this.jtx.getImageData(0, 0, W, H);
        
        let fractalColor: Color = this.colors.fractal;
        let dotColor: Color = this.colors.dot;
        let textColor: Color = this.colors.text;

        let realY = this.currentConfiguration.focus.YMax;
        for(let screenY = 0; screenY < H; screenY++){
            let realX = this.currentConfiguration.focus.XMin;
            for(let screenX = 0; screenX < W; screenX++){
                let iteration = 0;
                let Z_real = realX;
                let Z_imag = realY;
                let Z2_real, Z2_imag;

                do {
                    Z2_real = Z_real * Z_real;
                    Z2_imag = Z_imag * Z_imag;
                    Z_imag = 2.0 * Z_imag * Z_real + c_imag;
                    Z_real = Z2_real - Z2_imag + c_real;
                    iteration++;
                } while(iteration < this.maxIterations && (Z2_real + Z2_imag) < 4.0);

                if (iteration < this.maxIterations) {
                    const colorMultiplier = 1 / (iteration / this.maxIterations);
                    const alpha = iteration * iteration / 3;
                    const drawColor: Color = new Color(fractalColor.r * colorMultiplier, fractalColor.g * colorMultiplier, fractalColor.b * colorMultiplier, alpha);
                    this.putPixel(jtxData, screenX, screenY, drawColor);
                }
                else {
                    this.putPixel(jtxData, screenX, screenY, new Color(0, 0, 0, 255));
                }

                realX += delta;
            }
            realY -= delta;
        }
        
        let allDots: Dot[] = [];
        allDots = allDots.concat(this.currentConfiguration.dots);
        allDots = allDots.concat(this.addedDots);

        for(let n = 0; n < allDots.length; n++) {
            let dot:Dot = allDots[n];
            let draw: Point2D = this.currentConfiguration.focus.convertRealPointToScreen(dot.x, dot.y);
            if (draw.x < 0 || draw.y < 0 || draw.x > W || draw.y > H)
                continue;

            const fadedDotColor: Color = new Color(dotColor.r, dotColor.g, dotColor.b, Math.round(dot.alpha * 255));
            for (let xDiff = -4; xDiff < 4; xDiff++)
                for (let yDiff = -4; yDiff < 4; yDiff++)
                    this.putPixel(jtxData, Math.round(draw.x + xDiff), Math.round(draw.y + yDiff), fadedDotColor);
        }

        this.updateCanvas(this.jtx, jtxData);

        for(let n = 0; n < allDots.length; n++) {
            let dot:Dot = allDots[n];
            let draw: Point2D = this.currentConfiguration.focus.convertRealPointToScreen(dot.x, dot.y);
            if (draw.x < 0 || draw.y < 0 || draw.x > W || draw.y > H)
                continue;

            this.jtx.fillStyle = "rgba(" + textColor.r + ", " + textColor.g + ", " + textColor.b + ", " + dot.alpha + ")";
            this.jtx.fillText(dot.text, draw.x, draw.y + 24);
        }
    }
    
    changeSeed(dx: number, dy: number) {
        this.currentConfiguration.seed =
            new Point2D(this.currentConfiguration.seed.x + dx, this.currentConfiguration.seed.y + dy);
        this.redraw();
    }
    
    animateTo(newConfiguration: FractalConfiguration) {
        if (this.currentAnimation) {
            this.currentAnimation.cancel();
            this.currentAnimation = new FractalAnimation(this, this.currentConfiguration, newConfiguration);
            this.currentAnimation.perform();
        } else {
            this.currentAnimation = new FractalAnimation(this, this.currentConfiguration, newConfiguration);
            this.currentAnimation.jumpToEnd();
        }
    }

    getRealPoint(screenX: number, screenY: number): Point2D {
        const rect = this.j.getBoundingClientRect();
        const x = screenX - rect.left;
        const y = screenY - rect.top;
        return this.currentConfiguration.focus.convertScreenPointToReal(x, y);
    }

    getScreenPoint(realX: number, realY: number): Point2D {
        return this.currentConfiguration.focus.convertRealPointToScreen(realX, realY);
    }

    mousedown(screenX: number, screenY: number) {
        if (!isEditMode)
            return;
        
        for (let n: number = 0; n < this.currentConfiguration.dots.length; n++) {
            let dot = this.currentConfiguration.dots[n];
            let dotScreenLocation: Point2D = this.getScreenPoint(dot.x, dot.y);
            if (Math.abs(dotScreenLocation.x - screenX) + Math.abs(dotScreenLocation.y - screenY) < 10) {
                this.isDraggingDot = true;
                this.draggingDotNumber = n;
            }
        }
    }

    mousemove(screenX: number, screenY: number) {
        if (!isEditMode)
            return;
        if (!this.isDraggingDot)
            return;

        let newPoint: Point2D = this.getRealPoint(screenX, screenY);
        this.currentConfiguration.dots[this.draggingDotNumber] = new Dot(
            newPoint.x,
            newPoint.y,
            this.currentConfiguration.dots[this.draggingDotNumber].text);
        this.redraw();
    }

    mouseup(screenX: number, screenY: number) {
        if (!isEditMode)
            return;
        
        if (this.isDraggingDot) {
            this.isDraggingDot = false;
            this.draggingDotNumber = null;
            
            // TODO ?
            
            return;
        }

        let realPoint: Point2D = this.getRealPoint(screenX, screenY);

        if (this.currentAnimation && !this.currentAnimation.finished())
            return;

        let newZoom = this.currentConfiguration.focus.zoom;

        if (keyManager.pressedKeys["16"] || keyManager.pressedKeys["17"]) {
            if (keyManager.pressedKeys["16"] && keyManager.pressedKeys["17"]) // ctrl + shift
                newZoom /= this.zoomFactorPerClick * Math.pow(2, editMetaSpeed);
            else if (keyManager.pressedKeys["17"]) // ctrl
                newZoom *= this.zoomFactorPerClick * Math.pow(2, editMetaSpeed);

            this.animateTo(new FractalConfiguration(
                this.currentConfiguration.seed,
                new Focus(realPoint.x, realPoint.y, newZoom),
                this.currentConfiguration.dots
            ));
        } else if (keyManager.pressedKeys["18"]) {
            this.addedDots = this.addedDots.concat(new Dot(realPoint.x, realPoint.y, "Dot" + (this.addedDots.length + 1)));
            this.redraw();
        }
    }
}