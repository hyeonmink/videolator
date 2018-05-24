console.log("hello this is inject.js");
console.log("?")
const YOUTUBE_URL = "https://www.youtube.com/watch?v=";
const YOUTUBE_KEY = "AIzaSyB3H6Fl0_1fx5DCGMJRBlubT4tSQgnFlOY";

const GOOGLE_API = "https://www.googleapis.com/youtube/v3/videos"
const GOOGLE_VIDEO_API = "https://video.google.com/timedtext";
const MS_URL = "https://api.microsofttranslator.com/V2/Http.svc";
const MS_KEY = "3d14dc244fe44275b61e49c8c22033a5";
const MS_TOKEN_URL = "https://api.cognitive.microsoft.com/sts/v1.0/issueToken";

var ytplayer = document.getElementsByClassName("video-stream html5-main-video")[0];
var ytplayerTime = setInterval(function () {
    ytplayer = document.getElementsByClassName("video-stream html5-main-video")[0];
    ytplayerTime = ytplayer.currentTime;
}, 500);

var timers = [];
var currCount = 0;

ytplayer.addEventListener("click",function(){
    let isPlaying = document.getElementsByClassName('ytp-bezel')[0].getAttribute("aria-label")=="Pause";
    if(isPlaying){
        // currAud.play();
        for(var i = currCount; i < timers.length; i++){
            timers[i].resume();
        }
        console.log(currCount);
        document.getElementById(`voice${currCount}`).play();
    } else{
        // currAud.pause();
        for(var i = currCount; i < timers.length; i++){
            timers[i].pause();
        }
        document.getElementById(`voice${currCount}`).pause();
    }
})


chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        clearTimer();
        $('#voicelator').remove();
        // console.log(request);
        var { videoId, lang, token, gender } = request;
        // console.log(videoId)
        document.getElementsByClassName("video-stream html5-main-video")[0].volume = 0.2;
        getLang();
        // $('.title').html(request.videoID);

        function getLang() {
            var script;
            $.ajax({
                url: GOOGLE_API,
                data: {
                    part: "snippet",
                    id: videoId,
                    key: YOUTUBE_KEY
                },
                success: (result) => {
                    // if (result.items.length == 1) {
                    //     languageFrom = result.items[0].snippet.language;
                    // } else {
                    //     languageFrom = 'en'
                    // }
                    languageFrom = result.items[0].snippet.defaultAudioLanguage;
                    languageFrom = languageFrom.substring(0,2).toLowerCase();
                    console.log("LANG FROM!!!" + languageFrom);
                    script = loadScript(videoId, languageFrom);
                }
            });
        }

        function loadScript(videoId, languageFrom) {
            let script;
            $.ajax({
                url: GOOGLE_VIDEO_API,
                data: {
                    v: videoId,
                    lang: languageFrom,
                },
                success: (result) => {
                    script = result.getElementsByTagName("text"); //array of scripts
                    ytplayer.currentTime = 0;
                    script = processScript(script);
                    console.log(script);
                    var voicelator = $("<div>");
                    voicelator.attr({ "id": `voicelator`});
                    $('body').append(voicelator);
                    for(var i = 0; i < script.length; i++){
                        translate(script[i].script, i);
                        (function(j) {
                            var timer = new Timer(()=>{
                                currCount = j;
                                document.getElementById(`voice${currCount}`).play();
                            }, script[j].startTime*1000);
                            timers.push(timer);
                        })(i);
                        
                    }
                    // setTimeout(()=>{
                    //     translate(script[i].script, i);
                    // }, script[i].startTime*1000);
                    // translate(script[i].script, i);
                }
            })
        }

        function processScript(originalScripts){
            let copiedScripts = [];

            //hard copy
            for(let i = 0; i < originalScripts.length; i++){
                let temp = {};
                temp.startTime = +originalScripts[i].getAttribute("start");
                temp.script = "" + originalScripts[i].innerHTML.replace(/\n/g," ").replace(/&amp;#39;/g, "\'").replace(/&amp;quot;/g, "\"");
                copiedScripts.push(temp);
            }

            for(let i = 0; i < copiedScripts.length; i++){
                if(isStartingWithLowerCase(copiedScripts[i].script)){
                    copiedScripts[i-1].script = (copiedScripts[i-1].script + " " + copiedScripts[i].script);
                    copiedScripts.splice(i, 1);
                    i--;
                }
            }
            return copiedScripts;
        }

        function isStartingWithLowerCase(myString) { 
            return (myString.charAt(0) != myString.charAt(0).toUpperCase()); 
        } 

        // 04/20/2018 5:24AM 현민: instead of using htmlDecode, used 'replace' to replace single and double quotes.
        // function htmlDecode(input) {
        //     var e = document.createElement('div');
        //     e.innerHTML = input;
        //     // console.log(e.childNodes[0].nodeValue);
        //     return e.childNodes.length === 0 ? "" : e.childNodes[0].nodeValue;
        // }
        function clearTimer(){
            for(let i = 0; i < timers.length; i++){
                timers[i].delete();
            }
            timers = [];
            currCount = 0;
        }

        function translate(script, i) {
            // script = htmlDecode(script);
            $.ajax({
                url: MS_URL + "/Translate",
                data: {
                    appid: "Bearer " + token,
                    to: lang,
                    text: script
                },
                success: (result) => {
                    var translatedScript = (result.getElementsByTagName('string')[0].innerHTML);
                    voiceOver(translatedScript, i);
                }
            })
        }

        function voiceOver(translatedScript, i) {
            var VidSource = `${MS_URL}/Speak?appid=Bearer ${token}&format=audio/mp3&options=${gender}&language=${lang}&text=${translatedScript}`;
            // if ($("#video-source") != null) {
            //     $("#video-source").remove();
            // }
            var aud = $("<audio>");
            $(aud).attr({ "id": `voice${i}`});
            var vidSrc = $("<source>");
            vidSrc.attr({
                "id": "video-source",
                "type": "audio/mpeg",
                "src": VidSource
            });
            aud.append(vidSrc);
            $('#voicelator').append(aud);
        }

    }
)

function Timer(callback, delay) {
    var timerId, start, remaining = delay;

    this.pause = function() {
        window.clearTimeout(timerId);
        remaining -= new Date() - start;
    };

    this.resume = function() {
        start = new Date();
        window.clearTimeout(timerId);
        timerId = window.setTimeout(callback, remaining);
    };

    this.delete = function() {
        window.clearTimeout(timerId);
    }

    this.resume();
}


