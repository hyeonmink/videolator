"use strict";
$(function(){
    console.log("Hello this is app.js");
    const YOUTUBE_URL = "https://www.youtube.com/watch?v=";
    const MS_TOKEN_URL = "https://api.cognitive.microsoft.com/sts/v1.0/issueToken";
    const MS_KEY = "30a867c272fe41d5b11e3e4ebaf63f7a";

    const DEFAULT_LANGUAGE_TO = "en"
    //get vidId
    let vidId;
    let languageTo = "";
    let voiceGender = "";

    chrome.tabs.getSelected(null, (tab)=>{
        if(tab.url.startsWith(YOUTUBE_URL)){
            console.log("HERE")
            let queries = tab.url.substring(tab.url.indexOf('?')+1);
            let params = queries.split('&');
            console.log("params: ",params)
            for(var i = 0; i < params.length; i++){
                let query = params[i].split('=');
                if(query[0]=='v'){
                    vidId = query[1];
                    console.log(vidId);
                }
            }
        }
    });

    function getToken() {
        $.ajax({
            type: "POST",
            url: MS_TOKEN_URL,
            headers: {
                'Ocp-Apim-Subscription-Key':MS_KEY,
            },
            success: (result)=>{
                console.log("token success: " + result)
                chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                    chrome.tabs.sendMessage(tabs[0].id, {videoId: vidId, lang: languageTo, token: result, gender: voiceGender }, null);
                });
            }  
        })
    }

    $('#speak').on('click', ()=>{
        getToken();
    });
    
    $("#lang-option").change(function() {
        languageTo = $(this).val();
        console.log(languageTo);
    });

    $("#gender-option").change(function() {
        voiceGender = $(this).val();
        console.log(languageTo);
    });

});
