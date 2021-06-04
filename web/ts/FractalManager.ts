class FractalManager {
    private j:HTMLCanvasElement;
    private jtx:CanvasRenderingContext2D;

    private currentConfiguration: FractalConfiguration;
    private currentAnimation: FractalAnimation;
    
    private maxIterations: number = 50;
    private zoomFactorPerClick: number = 5;
    private lastClick: Point2D;
    private savedClicks: Point2D[] = [];

    constructor() {
        this.currentConfiguration = new FractalConfiguration(new Point2D(0, 0), new Focus(0, 0, 1), []);

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
        this.redraw();
    }

    putPixel(canvasData, x, y, r, g, b, a) {
        const index = (x + y * W) * 4;
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
        let text: string = "\"julia\": {\"x\":" + this.currentConfiguration.seed.x + ",\"y\":" + this.currentConfiguration.seed.y + "},\n" +
            "                    \"focus\": {\"x\":" + this.currentConfiguration.focus.x + ",\"y\":" + this.currentConfiguration.focus.y + ",\"zoom\":" + this.currentConfiguration.focus.zoom + "}";

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
        var row, col, color = 0;
        var x, y;
        var Z_imag, Z_real, Z2_imag, Z2_real;
        var delta = this.currentConfiguration.focus.Delta;

        let jtxData:ImageData = this.jtx.getImageData(0, 0, W, H);

        /* Julia set computation */
        y = this.currentConfiguration.focus.YMax;
        for(row = 0; row < H; row++){
            x = this.currentConfiguration.focus.XMin;
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

        for(let n = 0; n < this.currentConfiguration.dots.length; n++) {
            let dot:Dot = this.currentConfiguration.dots[n];
            let projected: Point2D = this.currentConfiguration.focus.convertRealPointToScreen(dot.x, dot.y);
            let drawX: number = W - Math.round(projected.x);
            let drawY: number = H - Math.round(projected.y);
            if (drawX < 0 || drawY < 0 || drawX > W || drawY > H)
                continue;

            for (let xDiff = -4; xDiff < 4; xDiff++)
                for (let yDiff = -4; yDiff < 4; yDiff++)
                    this.putPixel(jtxData, drawX + xDiff, drawY + yDiff, 255, 0, 0, 255);
        }

        for(let n = 0; n < this.savedClicks.length; n++) {
            let click:Point2D = this.savedClicks[n];
            let projected: Point2D = this.currentConfiguration.focus.convertRealPointToScreen(click.x, click.y);
            this.putPixel(jtxData, W - projected.x, H - projected.y, 255, 0, 0, 255);
        }

        this.updateCanvas(this.jtx, jtxData);

        for(let n = 0; n < this.currentConfiguration.dots.length; n++) {
            let dot:Dot = this.currentConfiguration.dots[n];
            let projected: Point2D = this.currentConfiguration.focus.convertRealPointToScreen(dot.x, dot.y);
            let drawX: number = W - Math.round(projected.x);
            let drawY: number = H - Math.round(projected.y);
            if (drawX < 0 || drawY < 0 || drawX > W || drawY > H)
                continue;

            this.jtx.fillText(dot.text, drawX, drawY + 24);
        }
    }
    
    changeSeed(dx: number, dy: number) {
        this.currentConfiguration.seed =
            new Point2D(this.currentConfiguration.seed.x + dx, this.currentConfiguration.seed.y + dy);
        this.redraw();
    }
    
    animateTo(newConfiguration: FractalConfiguration) {
        if (this.currentAnimation)
            this.currentAnimation.cancel();
        this.currentAnimation = new FractalAnimation(this, this.currentConfiguration, newConfiguration);
        this.currentAnimation.perform();
    }

    zoomTo(screenX: number, screenY: number) {
        if (!isEditMode)
            return;

        const rect = this.j.getBoundingClientRect();
        const x = screenX - rect.left;
        const y = screenY - rect.top;
        const dx = this.currentConfiguration.focus.convertScreenPointToReal(x, y).x;
        const dy = this.currentConfiguration.focus.convertScreenPointToReal(x, y).y;
        this.lastClick = new Point2D(dx, dy);

        if (this.currentAnimation && !this.currentAnimation.finished())
            return;

        let dZoom = this.currentConfiguration.focus.zoom;

        if (keyManager.pressedKeys["16"] || keyManager.pressedKeys["17"]) {
            if (keyManager.pressedKeys["16"] && keyManager.pressedKeys["17"]) // ctrl + shift
                dZoom /= this.zoomFactorPerClick * Math.pow(2, editMetaSpeed);
            else if (keyManager.pressedKeys["17"]) // ctrl
                dZoom *= this.zoomFactorPerClick * Math.pow(2, editMetaSpeed);

            this.animateTo(new FractalConfiguration(
                this.currentConfiguration.seed,
                new Focus(dx, dy, dZoom),
                this.currentConfiguration.dots
            ));
        } else if (keyManager.pressedKeys["18"]) {
            this.savedClicks = this.savedClicks.concat(this.lastClick);
        }
    }
}