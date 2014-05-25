 $(document).ready(function() {
    url = window.location;
    startTime = gup(url,'st'); //Start Time
    endTime = gup(url,'et'); //End Time
    videoId = gup(url,'vId'); //video Id
    loop = gup(url,'l'); //Loop
    loopNoOfTime = gup(url,'lnf'); //Loop Noof Time
    autoPlay = gup(url,'ap'); //Auto play

    var videoUrl = 'https://www.youtube.com/embed/' + videoId + '?enablejsapi=1&html5=1&start=' + startTime + '&end=' + endTime;
    if(autoPlay === 'yes'){
     videoUrl = videoUrl + '&autoplay=1';
    }
    $('#playVideo').attr('src',videoUrl);
    var tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
   });