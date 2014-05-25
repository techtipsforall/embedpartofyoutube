var vId;
var vDuration;
var vStart;
var vEnd;
var vAutostart;
var vLoop;
var vNoofLoop;
var loop = 0;
var loopNoOfTime = 0;
var player;
var startTime;
var endTime;
var autoPlay;
var loopCount = 1;
var flag = 0;

function fnSearchVideo(){
	var url = $('#text_url').val();
	var v_id = gup(url,'v');
	if(v_id != ''){
		$.getJSON("http://gdata.youtube.com/feeds/api/videos/" + v_id + "?v=2&alt=jsonc&callback=?", function(json){
			vId = json.data.id;
			vDuration = json.data.duration;

			vStart = $('#text_start').val();
            vEnd = $('#text_end').val();
			vAutostart = $('#lstAutoplay').val();
			vLoop = $('#lstLoop').val();
			vNoofLoop = $('#text_loop').val();

			var tempStr = '';
			if(vAutostart === 'yes'){
				tempStr = tempStr + '&autoplay=1';
			}

			if(vStart != ''){
				tempStr = tempStr + '&start=' + vStart;
				startTime = vStart;
			}
			else{
				startTime = 0;
				$('#text_start').val(0);
			}

			if(vEnd != ''){
				tempStr = tempStr + '&end=' + vEnd;
			}
			else{
				$('#text_end').val(vDuration);
			}

			if(vLoop === 'yes'){
				if(vNoofLoop != ''){
					loop = vLoop;
					loopNoOfTime = vNoofLoop;
				}
			}

			var htmlStr = '';
			var htmlStr = 'https://www.youtube.com/embed/' + vId + '?enablejsapi=1&html5=1' + tempStr + '';
			var newHtml = '<iframe id="playVideo" width="640" height="400" src="' + htmlStr + '" frameborder="0" allowfullscreen></iframe>';
			$('#showPreview').html('');
			$('#showPreview').append(newHtml);
			if(flag == 0 ){
				flag = 1;
				fnLoadSlider();				
				var tag = document.createElement('script');
				tag.src = "https://www.youtube.com/iframe_api";
				var firstScriptTag = document.getElementsByTagName('script')[0];
				firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
			}
			else{
				onYouTubeIframeAPIReady();	
			}
			loopCount = 1;			

			$('#showPreview').show();
			$('#divVideoContainer').show();
			$('#divShareMyLink').hide();
			$('#divShareMyLink').html('');
			
			fStart = fnConvertSecToTime(startTime);
            fEnd = fnConvertSecToTime(vDuration);

            $('#rangeOutputStart').html('Start: ' + fStart);
            $('#rangeOutputEnd').html('End: ' + fEnd);
		});
	}
	else{
		alert('Please Enter Video URL');
		$('#text_url').focus();
	}
}
function fnShareMyLink(){
	var tempUrl = $('#text_url').val();
	var tempVideoId = gup(tempUrl,'v');
	if(tempVideoId == ''){
		alert('Please Enter Video URL');
		$('#text_url').focus();
		return false;
	}
	else{
		vId = tempVideoId;
	}

	var text_start = $('#text_start').val()
	if(text_start == ''){
		text_start = 0;
	}
	var text_end = $('#text_end').val();
	if(text_end == ''){
		text_end = 0;
	}
	var text_loop = $('#text_loop').val();
	if(text_loop == ''){
		text_loop = 0;
	}
	var text_start = parseInt(text_start);
	var text_end = parseInt(text_end);
	var autoplay = $('#lstAutoplay').val();
	var lstLoop = $('#lstLoop').val();
	var text_loop = parseInt(text_loop);

	var htmlStr = 'http://techtipsforall.github.io/embedpartofyoutube/showVideo.html'; // change your domain name here
	htmlStr = htmlStr + '?st=' + text_start; //Start Time
	htmlStr = htmlStr + '&et=' + text_end; //End Time
	htmlStr = htmlStr + '&vId=' + vId;// Video Id
	htmlStr = htmlStr + '&l=' + lstLoop;// Loop
	htmlStr = htmlStr + '&lnf=' + text_loop;//Loop Noof Time
	htmlStr = htmlStr + '&ap=' + autoplay;//Auto Play

	$('#divShareMyLink').html('');
	$('#divShareMyLink').append(htmlStr);
	$('#divShareMyLink').show();
}
function gup(url,name) {
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regexS = "[\\?&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec(url);
    if (results == null)
        return "";
    else
        return results[1];
}
function fnLoadSlider(){
	$('#slideBar').slider({
        range: true,
        min: 0,
        max: 640,
        values: [0, 640],
        slide: function(event, ui) {
            var tempDurSec = vDuration;
            var sStart = ui.values[ 0 ];
            var sEnd = ui.values[ 1 ];

            var tstart = (sStart * 100) / 640;
            var tEnd = (sEnd * 100) / 640;

            var fStart = Math.round((tempDurSec * tstart) / 100);
            var fEnd = Math.round((tempDurSec * tEnd) / 100);
            $('#text_start').val(fStart);
            $('#text_end').val(fEnd);

            fStart = fnConvertSecToTime(fStart);
            fEnd = fnConvertSecToTime(fEnd);

            $('#rangeOutputStart').html('Start: ' + fStart);
            $('#rangeOutputEnd').html('End: ' + fEnd);
            $('#rangeStart').css('left', ui.values[ 0 ]);
            $('#rangeEnd').css('left', ui.values[ 1 ]);
        }
    });
    $('.vRangeSelector').show();
}
function fnConvertSecToTime(sec) {
	var sec_num = parseInt(sec);
	var hours = Math.floor(sec_num / 3600);
	var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
	var seconds = sec_num - (hours * 3600) - (minutes * 60);

	if (hours < 10) {
	    hours = "0" + hours;
	}
	if (minutes < 10) {
	    minutes = "0" + minutes;
	}
	if (seconds < 10) {
	    seconds = "0" + seconds;
	}
	if (sec_num > 3600) {
	    var time = hours + ':' + minutes + ':' + seconds;
	}
	else {
	    var time = minutes + ':' + seconds;
	}
	return time;
}
function onYouTubeIframeAPIReady() {
	player = new YT.Player('playVideo', {
	  events: {
	    'onStateChange' : onStateChange,
	  }
	});
}
function onStateChange(status){
	if(status.data == 0){
		if(loop === "yes"){
			if(loopCount < loopNoOfTime){
				player.seekTo(startTime, true);
			}
			loopCount = loopCount + 1;
		}
	}
}
