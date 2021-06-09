$('body').on('click', '.nav-trigger', function() {
    $('.nav-trigger').toggleClass('on');
    $('.nav-menu').fadeToggle(200);
});

const closeMenu = function() {

    $('.nav-trigger').toggleClass('on');
    $('.nav-menu').fadeToggle(200);
}

$('body').on('click', '.nav-trigger-dark', closeMenu);

function updateURLParameter(url, param, paramVal)
{
    var TheAnchor = null;
    var newAdditionalURL = "";
    var tempArray = url.split("?");
    var baseURL = tempArray[0];
    var additionalURL = tempArray[1];
    var temp = "";

    if (additionalURL)
    {
        var tmpAnchor = additionalURL.split("#");
        var TheParams = tmpAnchor[0];
        TheAnchor = tmpAnchor[1];
        if(TheAnchor)
            additionalURL = TheParams;

        tempArray = additionalURL.split("&");

        for (var i=0; i<tempArray.length; i++)
        {
            if(tempArray[i].split('=')[0] != param)
            {
                newAdditionalURL += temp + tempArray[i];
                temp = "&";
            }
        }
    }
    else
    {
        var tmpAnchor = baseURL.split("#");
        var TheParams = tmpAnchor[0];
        TheAnchor  = tmpAnchor[1];

        if(TheParams)
            baseURL = TheParams;
    }

    if(TheAnchor)
        paramVal += "#" + TheAnchor;

    var rows_txt = temp + "" + param + "=" + paramVal;
    return baseURL + "?" + newAdditionalURL + rows_txt;
}

$('.nav-link').click(function() {
    const chapterNumber = +$(this).attr('id').replace('nav-link-', '');
    goToChapter(chapterNumber);
    window.location.href = updateURLParameter(window.location.href, 'chapter', chapterNumber).split('#')[0] + '#slide=1';
    closeMenu();
});