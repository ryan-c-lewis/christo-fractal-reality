class FractalConfiguration {
    seed: Point2D;
    focus: Focus;
    dots: Dot[];

    constructor(seed: Point2D, focus: Focus, dots: Dot[]) {
        this.seed = seed;
        this.focus = focus;
        this.dots = dots;
    }
}