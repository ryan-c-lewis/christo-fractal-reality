/// <reference path='Globals.ts'/>
/// <reference path='Point2D.ts'/>

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

    convertScreenPointToReal(screenX: number, screenY: number): Point2D {
        const realX: number = this.XMin + (this.Delta * screenX);
        const realY: number = this.YMin + (this.Delta * (H - screenY));
        return new Point2D(realX, realY);
    }

    convertRealPointToScreen(realX: number, realY: number): Point2D {
        const screenX: number = W - (realX - this.XMin) / this.Delta;
        const screenY: number = (realY - this.YMin) / this.Delta;
        return new Point2D(screenX, screenY);
    }
}