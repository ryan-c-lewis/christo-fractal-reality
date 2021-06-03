/// <reference path='Point2D.ts'/>

class Dot extends Point2D {
    readonly text: string;

    constructor(x: number, y: number, text: string) {
        super(x, y);
        this.text = text;
    }
}