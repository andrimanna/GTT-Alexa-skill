const alexaSDK = require('alexa-sdk');
const awsSDK = require('aws-sdk');
const fetch = require('fetch');

const appId = '##################################################';

const instructions = 'Benvenuto. Per conoscere gli orari dell\'autobus che vuoi prendere, dimmi il numero della fermata e la linea che cerchi. Oppure dimmi: "aiuto" per altre informazioni.';
const aiutami ='Questa è la skill non ufficiale della <say-as interpret-as="characters">GTT</say-as>. Ti permette di conoscere quando passerà l\'autobus che vuoi prendere dalla fermata da cui vuoi salire. Per esempio puoi chiedermi: "quando passa il 56 dalla fermata numero <say-as interpret-as="digits">3279</say-as>?". Oppure per fare prima mi puoi svegliare dicendo: "Alexa, chiedi a <say-as interpret-as="characters">GTT</say-as> quando passa il 56 da <say-as interpret-as="digits">3279</say-as>." Se vuoi uscire basta che mi dici: "annulla".';

const handlers = {
    
    'LaunchRequest'() {
        this.emit(':ask', instructions);
    },
    
    'Unhandled'() {
        console.error('problem', this.event);
        this.emit(':tell', 'Si è verficato un errore!');
    },
    
    'AMAZON.HelpIntent'() {
        this.emit(':ask', aiutami);
    },
    
    'FermataIntent'() {
        const { slots } = this.event.request.intent;
        var x = this;
        if (!slots.numero.value || slots.numero.value < 3) {
            const slotToElicit = 'numero';
            const speechOutput = 'Dimmi il numero della fermata.';
            return this.emit(':elicitSlot', slotToElicit, speechOutput);
        } else{
            var palina = slots.numero.value;
            if (palina > 3600)
                this.emit(':tell', 'La fermata che mi hai chiesto non esiste!');
            else {
                if (!slots.linea.value) {
                    const slotToElicit = 'linea';
                    const speechOutput = 'Quale linea cerchi?';
                    return this.emit(':elicitSlot', slotToElicit, speechOutput);
                } else
                {
                    const linean = slots.linea.value;
                    lettura = new String('il ' + linean);
                    orari = new Array();
                    fetch.fetchUrl("https://gpa.madbob.org/query.php?stop=" + palina, leggiapi);
                    
                    function leggiapi(error, meta, body){
                        var risp = JSON.parse(body.toString());
                        var i = 2, j = 0;
                        while (i != 0 && risp[j] != undefined){
                            if (risp[j].line == linean){
                                i--;
                                orari.push(j);
                            }
                            j++;
                        }
                        if (i == 2) lettura += ' non passa da questa fermata';
                        else if (i == 1) {
                            if ( risp[orari[0]].hour.indexOf(":")== -1)
                                lettura += ' passerà domani';
                            else{
                                if (risp[orari[0]].realtime == 'true')
                                    lettura += ' passerà alle<break strength="weak"/> ' + risp[orari[0]].hour;
                                else
                                    lettura += ' è programmato alle<break strength="weak"/> ' + risp[orari[0]].hour;
                            }
                        }
                        else {
                            if ( risp[orari[0]].hour.indexOf(":")== -1)
                                lettura += ' passerà: domani';
                            else{
                                if (risp[orari[0]].realtime == 'true'){
                                    lettura += ' passerà alle<break strength="weak"/> ' + risp[orari[0]].hour;
                                    if (risp[orari[1]].realtime == 'true')
                                        lettura += '<break strength="weak"/> e alle<break strength="weak"/> ' + risp[orari[1]].hour;
                                    else
                                        lettura += '<break strength="weak"/> ed è programmato alle<break strength="weak"/> ' + risp[orari[1]].hour;
                                }
                                else
                                {
                                    lettura += ' è programmato alle<break strength="weak"/> ' + risp[orari[0]].hour;
                                    if (risp[orari[1]].realtime == 'true')
                                        lettura += '<break strength="weak"/> e passerà alle<break strength="weak"/> ' + risp[orari[1]].hour;
                                    else
                                        lettura += '<break strength="weak"/> e alle<break strength="weak"/> ' + risp[orari[1]].hour;
                                }
                            }
                        }
                        lettura += '.';
                        x.emit(':tell', lettura);
                    }
                }
            }
        }
    },
    
    'AMAZON.StopIntent'() {
        this.emit(':tell', '<say-as interpret-as="interjection">buon viaggio</say-as><break strength="weak"/><audio src=\'soundbank://soundlibrary/transportation/amzn_sfx_bus_drive_past_01\'/>');
    }
};

exports.handler = function handler(event, context) {
    const alexa = alexaSDK.handler(event, context);
    alexa.APP_ID = appId;
    alexa.registerHandlers(handlers);
    alexa.execute();
};
