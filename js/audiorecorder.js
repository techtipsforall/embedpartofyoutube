(function(window){
 
  var WORKER_PATH = 'https://raw.githubusercontent.com/techtipsforall/embedpartofyoutube/gh-pages/js/recorderworker.js';
 
  var Recorder = function(source, cfg){
    var config = cfg || {};
    var bufferLen = config.bufferLen || 4096;
    this.context = source.context;
    this.node = (this.context.createScriptProcessor ||
                 this.context.createJavaScriptNode).call(this.context,
                                                         bufferLen, 2, 2);
    var worker = new Worker(config.workerPath || WORKER_PATH);
    worker.postMessage({
      command: 'init',
      config: {
        sampleRate: this.context.sampleRate
      }
    });
    var recording = false,
      currCallback;
 
    this.node.onaudioprocess = function(e){
      if (!recording) return;
      worker.postMessage({
        command: 'record',
        buffer: [
          e.inputBuffer.getChannelData(0),
          e.inputBuffer.getChannelData(1)
        ]
      });
    };
 
    this.configure = function(cfg){
      for (var prop in cfg){
        if (cfg.hasOwnProperty(prop)){
          config[prop] = cfg[prop];
        }
      }
    };
 
    this.record = function(){
      recording = true;
    };
 
    this.stop = function(){
      recording = false;
    };
 
    this.clear = function(){
      worker.postMessage({ command: 'clear' });
    };
 
    this.getBuffer = function(cb) {
      currCallback = cb || config.callback;
      worker.postMessage({ command: 'getBuffer' });
    };
 
    this.exportWAV = function(cb, type){
      currCallback = cb || config.callback;
      type = type || config.type || 'audio/wav';
      if (!currCallback) throw new Error('Callback not set');
      worker.postMessage({
        command: 'exportWAV',
        type: type
      });
    };
 
    worker.onmessage = function(e){
      var blob = e.data;
      currCallback(blob);
    };
 
    source.connect(this.node);
    this.node.connect(this.context.destination);    //this should not be necessary
  };
 
  Recorder.forceDownload = function(blob, filename){
    var url = (window.URL || window.webkitURL).createObjectURL(blob);
    var link = window.document.createElement('a');
    link.href = url;
    link.download = filename || 'output.wav';
    var click = document.createEvent("Event");
    click.initEvent("click", true, true);
    link.dispatchEvent(click);
  };
 
  window.Recorder = Recorder;
 
})(window);
 
 
var worker_code = "var recLength = 0,  recBuffersL = [],  recBuffersR = [],  sampleRate;this.onmessage = function(e){  switch(e.data.command){    case \'init\':      init(e.data.config);      break;    case \'record\':      record(e.data.buffer);      break;    case \'exportWAV\':      exportWAV(e.data.type);      break;    case \'getBuffer\':      getBuffer();      break;    case \'clear\':      clear();      break;  }};function init(config){  sampleRate = config.sampleRate;}function record(inputBuffer){  recBuffersL.push(inputBuffer[0]);  recBuffersR.push(inputBuffer[1]);  recLength += inputBuffer[0].length;}function exportWAV(type){  var bufferL = mergeBuffers(recBuffersL, recLength);  var bufferR = mergeBuffers(recBuffersR, recLength);  var interleaved = interleave(bufferL, bufferR);  var dataview = encodeWAV(interleaved);  var audioBlob = new Blob([dataview], { type: type });  this.postMessage(audioBlob);}function getBuffer() {  var buffers = [];  buffers.push( mergeBuffers(recBuffersL, recLength) );  buffers.push( mergeBuffers(recBuffersR, recLength) );  this.postMessage(buffers);}function clear(){  recLength = 0;  recBuffersL = [];  recBuffersR = [];}function mergeBuffers(recBuffers, recLength){  var result = new Float32Array(recLength);  var offset = 0;  for (var i = 0; i < recBuffers.length; i++){    result.set(recBuffers[i], offset);    offset += recBuffers[i].length;  }  return result;}function interleave(inputL, inputR){  var length = inputL.length + inputR.length;  var result = new Float32Array(length);  var index = 0,    inputIndex = 0;  while (index < length){    result[index++] = inputL[inputIndex];    result[index++] = inputR[inputIndex];    inputIndex++;  }  return result;}function floatTo16BitPCM(output, offset, input){  for (var i = 0; i < input.length; i++, offset+=2){    var s = Math.max(-1, Math.min(1, input[i]));    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);  }}function writeString(view, offset, string){  for (var i = 0; i < string.length; i++){    view.setUint8(offset + i, string.charCodeAt(i));  }}function encodeWAV(samples){  var buffer = new ArrayBuffer(44 + samples.length * 2);  var view = new DataView(buffer);  /* RIFF identifier */  writeString(view, 0, \'RIFF\');  /* file length */  view.setUint32(4, 32 + samples.length * 2, true);  /* RIFF type */  writeString(view, 8, \'WAVE\');  /* format chunk identifier */  writeString(view, 12, \'fmt \');  /* format chunk length */  view.setUint32(16, 16, true);  /* sample format (raw) */  view.setUint16(20, 1, true);  /* channel count */  view.setUint16(22, 2, true);  /* sample rate */  view.setUint32(24, sampleRate, true);  /* byte rate (sample rate * block align) */  view.setUint32(28, sampleRate * 4, true);  /* block align (channel count * bytes per sample) */  view.setUint16(32, 4, true);  /* bits per sample */  view.setUint16(34, 16, true);  /* data chunk identifier */  writeString(view, 36, \'data\');  /* data chunk length */  view.setUint32(40, samples.length * 2, true);  floatTo16BitPCM(view, 44, samples);  return view;}";
 
var stream = null;
 
var startButton = document.getElementById("start");
var stopButton = document.getElementById("stop");
var pauseButton = document.getElementById("pause");
var resumeButton = document.getElementById("resume");
var dowButton = document.getElementById("download");
var output = document.getElementById("output");
var recorder = null;
 
window.URL = window.URL || window.webkitURL;
navigator.getUserMedia  = navigator.getUserMedia || 
  navigator.webkitGetUserMedia || 
  navigator.mozGetUserMedia || 
  navigator.msGetUserMedia;
 
var bb = new Blob([worker_code]);
 
var onFail = function(e){
  console.log('Rejected!', e);
};
 
var onSuccess = function(s){
  stream = s;
  var context = new webkitAudioContext();
  var mediaStreamSource = context.createMediaStreamSource(s);
  
  recorder = new Recorder(mediaStreamSource, {
      workerPath: window.URL.createObjectURL(bb)
  });
  recorder.record();
};
 
function startRecording() {
  if (navigator.getUserMedia) {
    navigator.getUserMedia({audio: true}, onSuccess, onFail);
  } else {
    console.log('navigator.getUserMedia not present');
  }
}
 
function stopRecording() {
       recorder.stop();
        recorder.exportWAV(function(s) {
          output.src = window.URL.createObjectURL(s);
        });
}
 
startButton.addEventListener("click", function(event){
  console.log("start");
  startRecording();
  document.getElementById('status').innerHTML="Recording started";
  document.getElementById("start").style.display="none";
  document.getElementById("stop").style.display="";
});
 
stopButton.addEventListener("click", function(event){
  console.log("stop");
  stopRecording();
  stream.stop();
  document.getElementById('status').innerHTML="Recording Stop now you can download it";
 
  document.getElementById("stop").style.display="none";
   document.getElementById("start").style.display="";
});

pauseButton.addEventListener("click", function(event){
  console.log("pause");
  document.getElementById('status').innerHTML="Recording Paused...";
   recorder.stop();
   document.getElementById("pause").style.display="none";
    document.getElementById("resume").style.display="";
});

resumeButton.addEventListener("click", function(event){
  document.getElementById('status').innerHTML="Recording Resume... ";
  recorder.record();

    document.getElementById("resume").style.display="none";
    document.getElementById("pause").style.display="";
});

dowButton.addEventListener("click", function(event){
  console.log("download");
  document.getElementById('status').innerHTML="Recording Downloading... ";
   recorder.exportWAV(function (blob) {
			Recorder.forceDownload(blob);
        recorder.clear();});
});
