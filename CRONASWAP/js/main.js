$(document).ready(function(){
    //--------------------------dropdown faq----------------------//

    $(".item-faq").click(function() {
        let child = $(this).children(".container-info-faq");

        $(".item-faq").children(".container-info-faq").slideUp(300);
        $(".close-faq-item").removeClass('active-btn-faq');

        if (child.is(":hidden")) {
            child.slideDown(300);
            $(this).find('.close-faq-item').addClass('active-btn-faq');
        };
    });


    //--------------------------open window faq and connect ----------------------//

    $(".faq-btn").click(function (){
       $(".wrapper-dark").addClass("active-bg");
       $(".container-faq").addClass("active-faq");
    });

    $(".close-window").click(closeWindow);



    $(".warn-btn").click(function (){
       $(this).closest(".warn-container").hide("slow");
    });

    $('#depositRouterButton').click(function () {
        const offset = $('#investmentSectionTitle').offset().top
        $("html, body").animate({
            scrollTop: offset
        }, 1000)
    })

    const numericConfig = { negative: false }
    $('#depositAmount').numeric(numericConfig)

});

function closeWindow() {
    const darkWrap = $(".wrapper-dark")

    darkWrap.removeClass("active-bg")
    darkWrap.find(".container-faq").removeClass("active-faq")
    darkWrap.find(".container-news").removeClass("active-news")
}

function showWarningPopup (titleContent, mainContent, closeTimeout=undefined) {
    $('#warnTitleContent').text(titleContent)
    $('#warnMainContent').text(mainContent)
    $('#warn').fadeIn('slow')

    if (closeTimeout) {
        setTimeout(() => closeWarningPopup(), closeTimeout)
    }
}

function closeWarningPopup () {
    $('#warn').hide('slow')
}

function showErrorPopup (titleContent, mainContent, closeTimeout=undefined) {
    $('#errorTitleContent').text(titleContent)
    $('#errorMainContent').text(mainContent)
    $('#warn1').fadeIn('slow')

    if (closeTimeout) {
        setTimeout(() => closeErrorPopup(), closeTimeout)
    }
}

function closeErrorPopup () {
    $('#warn1').hide('slow')
}
