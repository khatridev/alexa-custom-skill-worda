var Alexa = require("alexa-sdk");
var Data = require("./src/data");
var Config = require("./src/config.js");
var http = require('http');

const SKILLNAME = "Worda";

// Base Handler
exports.handler = function (event, ctx) {
    var _this = this;

    var alexa = Alexa.handler(event, ctx);
    alexa.appId = Config.ALEXA_APPID;
    alexa.registerHandlers(newSessionHandlers, startGameHandlers, turnModeHandlers, alexaTurnModeHandlers);
    alexa.execute();
};

// TURNMODE : When user is expected to give his word
// STARTMODE : When game is started
// RETURNMODE : when Alexa is supposed to decide and speak
const states = {
    TURNMODE: '_USERMODE', STARTMODE: '_STARTMODE', RETURNMODE: '_ALEXAMODE'
}



const newSessionHandlers = {
    'NewSession': function () {
        if ((this.attributes).length === 0) {
            this.attributes['gamesPlayed'] = 0;
        }
        this.handler.state = states.STARTMODE;
        this.response.speak(Data.WelcomeMsg + Data.LetsPlay)
            .listen('Say yes to start the game or no to quit.');
        this.emit(':responseReady');
    },
    "AMAZON.StopIntent": function () {
        this.response.speak("Goodbye!");
        this.emit(':responseReady');
    },
    "AMAZON.CancelIntent": function () {
        this.response.speak("Goodbye!");
        this.emit(':responseReady');
    },
    'SessionEndedRequest': function () {
        console.log('session ended!');
        this.attributes['endedSessionCount'] += 1;
        this.response.speak("Goodbye!");
        this.emit(':responseReady');
    },
    'Unhandled': function () {
        console.log("UNHANDLED");
        const message = 'Say yes to continue, or no to end the game.';
        this.response.speak(message).listen(message);
        this.emit(':responseReady');
    }
};

const startGameHandlers = Alexa.CreateStateHandler(states.STARTMODE, {
    'NewSession': function () {
        this.handler.state = '';
        this.emitWithState('NewSession'); // Uses the handler in newSessionHandlers
    },
    'HelpIntent': function () {

        this.response.speak(Data.HowToPlay).listen(Data.HowToPlay);
        this.emit(':responseReady');
    },
    'StartGameIntent': function () {
        this.handler.state = states.TURNMODE;

        var URL = Config.API_BASEURL + "/randomWord?hasDictionaryDef=false&minCorpusCount=0&maxCorpusCount=-1&minDictionaryCount=1&maxDictionaryCount=-1&minLength=5&maxLength=-1&api_key=" + Config.WORD_APIKEY;
        var _this = this;
        var resp = '';
        http.get(URL, (res) => {
            console.log('statusCode:', res.statusCode);
            console.log('headers:', res.headers);

            res.on('data', (d) => {
                resp += d;
            });

            res.on('end', (res) => {
                var jObj = JSON.parse(resp);
                console.log("RESPONSE ", jObj.word);
                _this.response.speak(jObj.word).listen(Data.WaitingForAWord);
                _this.attributes['alexaword'] = jObj.word;
                _this.emit(':responseReady');

            });

        }).on('error', function (res) {
            console.error("Error " + e);
        });
    },
    'RestartIntent': function () {
        //this.response.speak('Ok, restarting the game');
       // this.handler.state = states.STARTMODE;
        this.emit('StartGameIntent');
    },
    'AMAZON.NoIntent': function () {
        console.log("NOINTENT");
        this.response.speak('Ok, see you next time!');
        this.emit(':responseReady');
    },
    "AMAZON.StopIntent": function () {
        console.log("STOPINTENT");
        this.response.speak("Goodbye!");
        this.emit(':responseReady');
    },
    "AMAZON.CancelIntent": function () {
        console.log("CANCELINTENT");
        this.response.speak("Goodbye!");
        this.emit(':responseReady');
    },
    'SessionEndedRequest': function () {
        console.log("SESSIONENDEDREQUEST IN START MODE");
        this.attributes['endedSessionCount'] += 1;
        this.response.speak("Goodbye!");
        this.emit(':responseReady');
    }
    ,
    'Unhandled': function () {
        console.log("UNHANDLED");
        const message = 'Say yes to continue, or no to end the game.';
        this.response.speak(message).listen(message);
        this.emit(':responseReady');
    }
});


const turnModeHandlers = Alexa.CreateStateHandler(states.TURNMODE, {
    'NewSession': function () {
        this.handler.state = '';
        this.emitWithState('NewSession'); // Equivalent to the Start Mode NewSession handler
    },
    'NextTurnIntent': function () {
        if (this.event.request.intent.name == 'NextTurnIntent') {
            // this.handler.state = states.RETURNMODE;
            var myWord = this.event.request.intent.slots.myword.value;
            console.log("WORD>>>" + myWord);
            //this.response.speak(myWord).listen(Data.WaitingForAWord);
            //this.emit(':responseReady');
            this.handler.state = states.RETURNMODE;
            this.emitWithState('AlexaTurn', myWord);
        }

    },


    'RestartIntent': function () {
        this.response.speak('Ok, restarting the game');
        this.handler.state = states.STARTMODE;
        this.emitWithState('StartGameIntent');
    },

    'RepeatIntent': function () {
        this.response.speak('My Word is ' + this.attributes['alexaword']).listen();
        this.emit(':responseReady');
    },

    'SpellIntent': function () {
        var alexaWord = this.attributes['alexaword'];
        var wordArray =[];
        for(var i =0;i<alexaWord.length;i++){
           wordArray.push(alexaWord[i]);
        }
        this.response.speak(wordArray +" ,<emphasis level=\"strong\">" + alexaWord + "</emphasis>" ).listen();
        this.emit(':responseReady');
    },


    'HelpIntent': function () {
        var alexaWord = this.attributes['alexaword'];
        this.response.speak('<s>My Word is ' + alexaWord + '</s> <s> You would start with Letter <emphasis level=\"strong\">' + alexaWord.charAt(alexaWord.length - 1)+ '</emphasis> </s>').listen();
        this.emit(':responseReady');
    },
    "AMAZON.StopIntent": function () {
        this.response.speak(Data.ReservedWord).listen();
        this.emit(':responseReady');
    },
    "AMAZON.NoIntent": function () {
        this.response.speak(Data.ReservedWord).listen();
        this.emit(':responseReady');
    },
    "AMAZON.YesIntent": function () {
        this.response.speak(Data.ReservedWord).listen();
        this.emit(':responseReady');
    },
    'SessionEndedRequest': function () {
        console.log("SESSIONENDEDREQUEST IN TURN MODE");
        this.attributes['endedSessionCount'] += 1;
        this.response.speak("Goodbye!");
        this.emit(':responseReady');
    }
    ,
    'Unhandled': function () {
        console.log("UNHANDLED");
        this.response.speak('Sorry, I didn\'t get that.');
        this.emit(':responseReady');
    }
});


const alexaTurnModeHandlers = Alexa.CreateStateHandler(states.RETURNMODE, {
    // 'NewSession': function () {
    //     //this.handler.state = '';
    //     this.emitWithState('NewSession'); // Equivalent to the Start Mode NewSession handler
    // },
    'AlexaTurn': function (userWord) {

        var verifyURL = Config.API_BASEURL_SINGULAR + "/" + userWord + "/definitions?includeRelated=true&useCanonical=false&includeTags=false&api_key=" + Config.WORD_APIKEY;

        console.log("VERIFY URL >>" + verifyURL);
        var _this_V = this;
        var resp = '';
        http.get(verifyURL, (res) => {
            console.log('statusCode2:', res.statusCode);
            console.log('headers2:', res.headers);

            // res.on('data', (d) => {
            //     resp += d;
            // });

            res.on('data', (res) => {
                console.log("VALID WORD RESPONSE" + res);
                //var obj = JSON.parse(res);
                // chck if word is a valid English word
                if (res != undefined && res.length > 3) { // including two brackets []
                    // check for words characters
                    var alexaWord = this.attributes['alexaword'];
                    console.log("Alexa word" + alexaWord);
                    var alexaLastChar = alexaWord.charAt(alexaWord.length - 1);
                    console.log("Alexa last" + alexaLastChar);
                    var userFirstChar = userWord.charAt(0);
                    console.log("User first" + userFirstChar);
                    // if both the end and start are appropriate
                    if (alexaLastChar.toLowerCase() === userFirstChar.toLowerCase()) {
                        console.log("CHARACTERS MATCH");
                        var userLastChar = userWord.charAt(userWord.length - 1);
                        // this.response.speak('my word was ' + this.attributes['alexaword'] + 'I would start with ' + userLastChar);
                        // Call query API here..
                        //this.handler.state = states.TURNMODE;

                        // search for the word that starts with the last character of user's word
                        var URL = Config.API_BASEURL + "/search/" + userLastChar + "?caseSensitive=false&limit=10&api_key=" + Config.WORD_APIKEY;
                        console.log("CHARACTERS MATCH>>" + URL);
                        var _this = this;
                        var resp = '';
                        http.get(URL, (res) => {
                            console.log('statusCode2:', res.statusCode);
                            console.log('headers2:', res.headers);

                            res.on('data', (d) => {
                                resp += d;
                            });

                            res.on('end', (res) => {
                                var jObj = JSON.parse(resp);
                                console.log("RESPONSE2 ", jObj);
                                var limit = jObj.totalResults;
                                console.log("Limit ", limit);
                                var randomNumber = Math.floor((Math.random() * 10));
                                console.log("Random ", randomNumber);
                                var results = jObj.searchResults[randomNumber].word;
                                if (results.length == 1)
                                    results = jObj.searchResults[randomNumber + 1].word;
                                console.log("RESPONSE word ", results);

                                _this.response.speak(results).listen(Data.WaitingForAWord);
                                _this.attributes['alexaword'] = results;
                                this.handler.state = states.TURNMODE;
                                this.emit(':responseReady');

                            });

                        }).on('error', function (res) {
                            console.error("Error " + e);
                            this.response.speak('There was some problem , try again');
                            this.handler.state = states.TURNMODE;
                            this.emit(':responseReady');
                        });



                    } else {
                        // this.response.speak('Please give me a correct word');
                        // this.handler.state = states.TURNMODE;
                        // this.emit(':responseReady');

                        // if word spoken by user starts with a wrong charcater

                        this.response.speak("<say-as interpret-as=\"interjection\">oh dear</say-as> <s>Wrong word.</s> <s>I won.</s> <s> Better luck next time</s>");
                        this.emit(':responseReady');
                    }

                } else {
                    // if user;s word is invalid english word
                    _this_V.handler.state = states.TURNMODE;
                    _this_V.response.speak("<say-as interpret-as=\"interjection\">nah</say-as> <s> This is not a valid word </s>").listen();
                    _this_V.emit(':responseReady');
                }
            });

        }).on('error', function (res) {
            console.error("Error " + e);
            this.response.speak('There was some problem , try again');
            this.handler.state = states.TURNMODE;
            this.emit(':responseReady');
        });
    },

    'RestartIntent': function () {
        this.response.speak('Ok, restarting the game');
        this.handler.state = states.STARTMODE;
        this.emitWithState('StartGameIntent');
    },


    // 'AMAZON.HelpIntent': function () {
    //     this.response.tell(Data.HowToPlay);
    //     this.emit(':responseReady');
    // },
    "AMAZON.StopIntent": function () {
        console.log("STOPINTENT");
        this.response.speak("Goodbye!");
        this.emit(':responseReady');
    },
    'SessionEndedRequest': function () {
        console.log("SESSIONENDEDREQUEST IN TURN MODE");
        this.attributes['endedSessionCount'] += 1;
        this.response.speak("Goodbye!");
        this.emit(':responseReady');
    }
    ,
    'Unhandled': function () {
        console.log("UNHANDLED");
        this.response.speak('Sorry, I didn\'t get that.');
        this.emit(':responseReady');
    }
});


