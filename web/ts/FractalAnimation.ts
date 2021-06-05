class FractalAnimation {
    readonly fractal: FractalManager;
    readonly start: FractalConfiguration;
    readonly end: FractalConfiguration;
    private isFinished: boolean;
    private steps: number = 15;
    private timeBetweenIterations: number = 20;
    
    constructor(fractal: FractalManager, start: FractalConfiguration, end: FractalConfiguration) {
        this.fractal = fractal;
        this.start = start;
        this.end = end;
    }
    
    perform() {
        this.update(0);
    }

    jumpToEnd() {
        this.update(this.steps);
    }
    
    cancel() {
        this.isFinished = true;
    }
    
    finished(): boolean {
        return this.isFinished;
    }
    
    private update(step: number) {
        if (this.isFinished)
            return;
        
        if (step < this.steps) {
            const newConfiguration = this.getUpdatedConfiguration(step);
            this.fractal.updateConfiguration(newConfiguration);

            let self = this;
                window.setTimeout(function () {
                    self.update(step + 1)
                }, this.timeBetweenIterations);
        } else {
            this.fractal.updateConfiguration(this.end);
            this.isFinished = true;
        }
    }
    
    private getUpdatedConfiguration(step: number): FractalConfiguration {
        return new FractalConfiguration(
            this.getUpdatedSeed(step),
            this.getUpdatedFocus(step),
            this.getUpdatedDots(step)
        )
    }
    
    private getUpdatedSeed(step: number): Point2D {
        let totalPercent = step / this.steps;
        let newX = this.start.seed.x + (this.end.seed.x - this.start.seed.x) * totalPercent;
        let newY = this.start.seed.y + (this.end.seed.y - this.start.seed.y) * totalPercent;
        return new Point2D(newX, newY);
    }
    
    private getUpdatedFocus(step: number): Focus {
        let totalPercent = step / this.steps;
        let newZoom = this.start.focus.zoom + (this.end.focus.zoom - this.start.focus.zoom) * totalPercent;

        let screenPositionAtAnimationStart: Point2D = this.start.focus.convertRealPointToScreen(this.end.focus.x, this.end.focus.y);
        let screenPositionAtAnimationEnd: Point2D = this.end.focus.convertRealPointToScreen(this.end.focus.x, this.end.focus.y);
        
        // TODO: why am I having to do this??
        screenPositionAtAnimationStart = new Point2D(W - screenPositionAtAnimationStart.x, H - screenPositionAtAnimationStart.y);
        screenPositionAtAnimationEnd = new Point2D(W - screenPositionAtAnimationEnd.x, H - screenPositionAtAnimationEnd.y);
        
        let screenXAtAnimationNow: number = screenPositionAtAnimationStart.x + (screenPositionAtAnimationEnd.x - screenPositionAtAnimationStart.x) * totalPercent;
        let screenYAtAnimationNow: number = screenPositionAtAnimationStart.y + (screenPositionAtAnimationEnd.y - screenPositionAtAnimationStart.y) * totalPercent;
        let realPositionAtAnimationNow: Point2D = new Focus(this.end.focus.x, this.end.focus.y, newZoom)
            .convertScreenPointToReal(screenXAtAnimationNow, screenYAtAnimationNow);

        return new Focus(realPositionAtAnimationNow.x, realPositionAtAnimationNow.y, newZoom);
    }

    private getUpdatedDots(step: number): Dot[] {
        // TODO
        return this.end.dots;
    }
}