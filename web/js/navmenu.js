$('body').on('click', '.nav-trigger', function() {
    $('.nav-trigger').toggleClass('on');
    $('.nav-menu').fadeToggle(200);
});

const closeMenu = function() {

    $('.nav-trigger').toggleClass('on');
    $('.nav-menu').fadeToggle(200);
}

$('body').on('click', '.nav-trigger-dark', closeMenu);

$('.nav-link').click(function() {
    const chapterNumber = +$(this).attr('id').replace('nav-link-', '') - 1;
    goToChapter(chapterNumber);
    closeMenu();
});