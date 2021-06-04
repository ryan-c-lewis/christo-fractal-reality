class KeyManager {
    readonly pressedKeys = {};
    
    private seedChangeSpeed: number = 0.03;
    
    constructor() {
        let self = this;
        window.onkeyup = function(e) {
            self.onKeyUp(e);
        }
        window.onkeydown = function(e) {
            self.onKeyDown(e);
        }
        function arrowKeyTimer() {
            self.handleArrowKeys();
            setTimeout(arrowKeyTimer, 10);
        }
        arrowKeyTimer();
    }
    
    onKeyDown(e: KeyboardEvent) {
        this.pressedKeys[e.keyCode] = true;
    }
    
    onKeyUp(e: KeyboardEvent) {
        if (e.keyCode == 57) // 9
            editMetaSpeed -= 1;
        if (e.keyCode == 48) // 0
            editMetaSpeed += 1;

        if (e.keyCode == "M".charCodeAt(0)) {
            isEditMode = !isEditMode;
            document.getElementById("editModeText").hidden = !isEditMode;
        }

        this.pressedKeys[e.keyCode] = false;
    }

    handleArrowKeys() {
        if (isEditMode) {
            const speedSquared = Math.pow(2, editMetaSpeed);
            if (this.pressedKeys["W".charCodeAt(0)]) {
                fractal.changeSeed(0, -this.seedChangeSpeed * speedSquared);
            }
            if (this.pressedKeys["S".charCodeAt(0)]) {
                fractal.changeSeed(0, this.seedChangeSpeed * speedSquared);
            }
            if (this.pressedKeys["A".charCodeAt(0)]) {
                fractal.changeSeed(-this.seedChangeSpeed * speedSquared, 0);
            }
            if (this.pressedKeys["D".charCodeAt(0)]) {
                fractal.changeSeed(this.seedChangeSpeed * speedSquared, 0)
            }
        }
    }
}