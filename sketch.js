let video;
let poseNet;
let pose;
let skeleton;
var left = false;
var right = false;
var xposedict = {'left_shoulder':[0, 0],'right_shoulder':[0, 0]};
var yposedict = {'left_shoulder':[0, 0],'right_shoulder':[0, 0]};
var cnt = 0;
var xintpdict = {'left_shoulder':[0, 0],'right_shoulder':[0, 0]};
var yintpdict = {'left_shoulder':[0, 0],'right_shoulder':[0, 0]};

const FPS = 30;
    
let cameraStream = null;
let processingStream = null;
let mediaRecorder = null;
let mediaChunks = null;
let processingPreviewIntervalId = null;

function generateDownloadbutton() {
  let mediaBlob = new Blob(mediaChunks, { type: "video/webm" });
  let mediaBlobUrl = URL.createObjectURL(mediaBlob);
  
  let downloadButton = document.getElementById("downloadButton");
  downloadButton.href = mediaBlobUrl;
  downloadButton.download = "RecordedVideo.webm";
}

function startCapture() {
  let processingPreview = document.getElementById("video_canvas");
  processingPreview.getContext('2d');
  processingStream = processingPreview.captureStream(FPS);
      
  mediaRecorder = new MediaRecorder(processingStream);
  mediaChunks = []
      
  mediaRecorder.ondataavailable = function(event) {
  mediaChunks.push(event.data);
  if(mediaRecorder.state == "inactive") {
    generateDownloadbutton();
      }
  };
      
  mediaRecorder.start();
}

function stopCapture() {
  if(mediaRecorder != null) {
    if(mediaRecorder.state == "recording") {
        mediaRecorder.stop();
    }
  }
};

function setup() {
  canvas = createCanvas(640, 480);
  canvas.id('video_canvas')
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();
  poseNet = ml5.poseNet(video, 'single' , modelLoaded);
  poseNet.on('pose', gotPoses);
}

function request(url) {
  httpDo(url,got_response)
}

function got_response(data) {
  console.log(data)
}

function gotPoses(poses) {
  if (poses.length > 0) {
    pose = poses[0].pose;
    let distance = dist(pose.leftEye.x,pose.leftEye.y,pose.rightEye.x,pose.rightEye.y);
    if (cnt > 1) {
      cnt = 0;
    }else{
      cnt = cnt + 1;
    }
    if (pose.leftShoulder.confidence > 0.7 && distance < 35 && pose.leftHip.y < 400 && pose.rightHip.y < 400) {
      xposedict.left_shoulder[cnt] = Math.round(pose.leftShoulder.x)
      yposedict.left_shoulder[cnt] = Math.round(pose.leftShoulder.y)
      xintpdict.left_shoulder = lerp(xposedict.left_shoulder[0], xposedict.left_shoulder[1], 0.75)
      yintpdict.left_shoulder = lerp(yposedict.left_shoulder[0], yposedict.left_shoulder[1], 0.75)
      xposedict.right_shoulder[cnt] = Math.round(pose.rightShoulder.x)
      yposedict.right_shoulder[cnt] = Math.round(pose.rightShoulder.y)
      xintpdict.right_shoulder = lerp(xposedict.right_shoulder[0], xposedict.right_shoulder[1], 0.75)
      yintpdict.right_shoulder = lerp(yposedict.right_shoulder[0], yposedict.right_shoulder[1], 0.75)
      if(xintpdict.right_shoulder < 640*0.2 && right == false) {
        request('http://192.168.1.40:5000/right')
        console.log('right')
        right = true
      }
      if(xintpdict.left_shoulder > 640*0.8 && left == false) {
        request('http://192.168.1.40:5000/left')
        console.log('left')
        left = true
      }
      if(xintpdict.right_shoulder > 640*0.2 && xintpdict.left_shoulder < 640*0.8 && right == true) {
        request('http://192.168.1.40:5000/stop')
        console.log('centre')
        right = false
      }
      if(xintpdict.right_shoulder > 640*0.2 && xintpdict.left_shoulder < 640*0.8 && left == true) {
        request('http://192.168.1.40:5000/stop')
        console.log('centre')
        left = false
      }
    }
  }
}

function modelLoaded() {
  console.log('poseNet ready');
}

function draw() {
  image(video, 0, 0);
}