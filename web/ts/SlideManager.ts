class SlideManager {
    private currentChapter:number;

    constructor(chapter: number) {
        this.currentChapter = chapter;
        this.configureSlides();

        const divs = document.getElementsByTagName("section");
        for(let i: number = 0; i < divs.length; i++) {
            this.respondToVisibility(divs[i], (element, visible) => {
                if (visible) {
                    let slideNum: number = +element.id.replace('section-', '') - 1;

                    let newJulia:JuliaSetSeed = this.getJuliaAsOf(slideNum);
                    let newFocus:Focus = this.getFocusAsOf(slideNum);
                    let newDots = this.getDotsAsOf(slideNum);
                    fractal.animateTo(newJulia, newFocus, newDots);
                }
            });
        }
    }

    respondToVisibility(element, callback) {
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

    configureSlides() {
        let slidesHTML:string = "";
        for(let slideNum:number = 0; slideNum < PresentationData.chapters[this.currentChapter].slides.length; slideNum++) {
            let slide = PresentationData.chapters[this.currentChapter].slides[slideNum];
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

    getJuliaAsOf(slideNum: number): JuliaSetSeed {
        let slideToCheck: number = slideNum;
        while (slideToCheck >= 0) {
            let slide = PresentationData.chapters[this.currentChapter].slides[slideToCheck];
            if (slide.julia)
                return new JuliaSetSeed(+slide.julia.x, +slide.julia.y);
            slideToCheck--;
        }
        return new JuliaSetSeed(0, 0);
    }

    getFocusAsOf(slideNum: number): Focus {
        let slideToCheck: number = slideNum;
        while (slideToCheck >= 0) {
            let slide = PresentationData.chapters[this.currentChapter].slides[slideToCheck];
            if (slide.focus)
                return new Focus(+slide.focus.x, +slide.focus.y, +slide.focus.zoom);
            slideToCheck--;
        }
        return new Focus(0, 0, 1);
    }

    getDotsAsOf(slideNum: number): Dot[] {
        let slideToCheck: number = slideNum;
        while (slideToCheck >= 0) {
            let slide = PresentationData.chapters[this.currentChapter].slides[slideToCheck];
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
}