console.log("hello this is inject.js");
console.log("?")
const YOUTUBE_URL = "https://www.youtube.com/watch?v=";
const YOUTUBE_KEY = "AIzaSyB3H6Fl0_1fx5DCGMJRBlubT4tSQgnFlOY";

const GOOGLE_API = "https://www.googleapis.com/youtube/v3/captions"
const GOOGLE_VIDEO_API = "https://video.google.com/timedtext"; 
const MS_URL = "https://api.microsofttranslator.com/V2/Http.svc";
const MS_KEY = "a8255cb54abf4b85b6355ce1dfae1ccb";
const MS_TOKEN_URL = "https://api.cognitive.microsoft.com/sts/v1.0/issueToken";



var ytplayer = document.getElementsByClassName("video-stream html5-main-video")[0];
var ytplayerTime = setInterval(function(){
    ytplayer = document.getElementsByClassName("video-stream html5-main-video")[0];
    ytplayerTime = ytplayer.currentTime;
}, 500);

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        console.log(request);
        var {videoId, lang, token} = request;
        console.log(videoId)
        document.getElementsByClassName("video-stream html5-main-video")[0].volume = 0.2;
        getLang();
        // $('.title').html(request.videoID);

        function getLang() {
            var script;
            $.ajax({
                url: GOOGLE_API,
                data: {
                    part: "snippet",
                    videoId: videoId,
                    key: YOUTUBE_KEY
                },
                success: (result)=>{
                    if(result.items.length == 1){
                        languageFrom = result.items[0].snippet.language;
                    } else {
                        languageFrom = 'en'                        
                    }
                    console.log("success in getting language");
                    script = loadScript(videoId, languageFrom);
          
                }
            });
        }

        function loadScript(videoId, languageFrom){
            console.log("**********loadScript Start*********");
            console.log(videoId)
            let script;
            $.ajax({
                url: GOOGLE_VIDEO_API,
                data: {
                    v: videoId,
                    lang: languageFrom,
                },
                success: (result)=>{
                    script = result.getElementsByTagName("text");
                    ytplayer.currentTime = 0;          
                    for (var i = 0; i < script.length; i++) {
                      let startTime = script[i].getAttribute("start");
                      let val = script[i]["textContent"].replace(/\n/g, " ");
                      val = htmlDecode(val);
                      startTime = parseFloat(startTime);
          
                      // wait until audio and video sync
                      setTimeout(function() {
                        console.log(val);
                        console.log("startTime: " + startTime +" : playerTime:" + ytplayerTime);
                        translate(val);
                      }, (startTime * 1000));
                    }
          
                    
                }            
            })
        }

        function htmlDecode(input){
            var e = document.createElement('div');
            e.innerHTML = input;
            return e.childNodes.length === 0 ? "" : e.childNodes[0].nodeValue;
        }

        function translate(script){
            $.ajax({
                url: MS_URL + "/Translate",
                data: {
                    appid : "Bearer "+ token,
                    to: lang,
                    text: script
                },
                success: (result)=>{
                    var translatedScript = (result.getElementsByTagName('string')[0].innerHTML);
                    console.log(translatedScript)
                    voiceOver(translatedScript);
                }
            })
        }

        function voiceOver(translatedScript) {
            var VidSource = MS_URL + "/Speak?appid=Bearer "+ token + "&format=audio/mp3&options=male&language=" + lang + "&text=" + translatedScript;
            
            if ($("#video-source") != null) {
                $("#video-source").remove();
            }    
            var aud = $("<audio>");
            $(aud).attr({"id": "voice", "autoplay": ""});
            var vidSrc = $("<source>");
            vidSrc.attr({"id":"video-source",
                       "type": "audio/mpeg", 
                        "src": VidSource});
            aud.append(vidSrc);
            $('body').append(aud);
          }


    }
)



