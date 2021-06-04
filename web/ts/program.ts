/// <reference path='Dot.ts'/>
/// <reference path='Focus.ts'/>
/// <reference path='FractalManager.ts'/>
/// <reference path='Globals.ts'/>
/// <reference path='JuliaSetSeed.ts'/>
/// <reference path='KeyManager.ts'/>
/// <reference path='Point2D.ts'/>
/// <reference path='PresentationData.ts'/>

let currentChapter:number = 0;

let isEditMode: boolean = false;
let editMetaSpeed: number = 0;

let fractal: FractalManager = new FractalManager();
let keyManager: KeyManager = new KeyManager();

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

const getJuliaAsOf = function(slideNum: number): JuliaSetSeed {
    let slideToCheck: number = slideNum;
    while (slideToCheck >= 0) {
        let slide = PresentationData.chapters[currentChapter].slides[slideToCheck];
        if (slide.julia)
            return new JuliaSetSeed(+slide.julia.x, +slide.julia.y);
        slideToCheck--;
    }
    return new JuliaSetSeed(0, 0);
}

const getFocusAsOf = function(slideNum: number): Focus {
    let slideToCheck: number = slideNum;
    while (slideToCheck >= 0) {
        let slide = PresentationData.chapters[currentChapter].slides[slideToCheck];
        if (slide.focus)
            return new Focus(+slide.focus.x, +slide.focus.y, +slide.focus.zoom);
        slideToCheck--;
    }
    return new Focus(0, 0, 1);
}

const getDotsAsOf = function(slideNum: number): Dot[] {
    let slideToCheck: number = slideNum;
    while (slideToCheck >= 0) {
        let slide = PresentationData.chapters[currentChapter].slides[slideToCheck];
        if (slide.dots) {
            let myDots: Dot[] = [];
            for (let n: number = 0; n < slide.dots.length; n++) {
                myDots = myDots.concat(new Dot(slide.dots[n].x, slide.dots[n].y, slide.dots[n].text));
            }
            return myDots;
        }
        slideToCheck--;
    }
    return [];
}

window.onmouseup = function() {
    const mouseEvent = event as MouseEvent;
    fractal.zoomTo(mouseEvent.pageX, mouseEvent.pageY);
}

window.onresize = function() {
    W = window.innerWidth;
    H = window.innerHeight;
    fractal.configureCanvas();
}

window.onload = function() {
    configureSlides();

    const divs = document.getElementsByTagName("section");
    for(let i: number = 0; i < divs.length; i++) {
        respondToVisibility(divs[i], (element, visible) => {
            if (visible) {
                let slideNum: number = +element.id.replace('section-', '') - 1;

                let newJulia:JuliaSetSeed = getJuliaAsOf(slideNum);
                let newFocus:Focus = getFocusAsOf(slideNum);
                let newDots = getDotsAsOf(slideNum);
                fractal.animateTo(newJulia, newFocus, newDots);
            }
        });
    }
}