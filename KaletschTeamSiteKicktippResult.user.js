// ==UserScript==
// @name         Kaletsch Team Site Kicktipp Result
// @namespace    http://www.kaletsch-medien.de/
// @version      1.3
// @description  Zeigt aktuelle Kicktipp-Punkte auf Team-Seite, vergessene Tipps blinken (param game=1)
// @updateURL    https://github.com/DerVO/KicktippResultTeamSite/raw/master/KaletschTeamSiteKicktippResult.user.js
// @downloadURL  https://github.com/DerVO/KicktippResultTeamSite/raw/master/KaletschTeamSiteKicktippResult.user.js
// @homepage     https://github.com/DerVO/KicktippResultTeamSite
// @author       DerVO
// @match        http://www.kaletsch-medien.de/uber-uns/*
// @grant        GM_addStyle
// ==/UserScript==

/*
Unterstuetze URL Parameter
nextgame=[x,]y - überschreibe Auto Erkennung für Spieltag und Spiel, x = Spieltag (1..n), y = Spiel (1..n)
dontblink=1 - roter Layer blinkt nicht
hidepoints=1 - zeige nicht die Punkte
hidenames=1 - blende die Namen aus
distractionfree=1 - blende andere Items aus
Beispiel: http://www.kaletsch-medien.de/uber-uns/?nextgame=1&hidepoints=1&hidenames=1&dontblink=1&distractionfree=1
*/

/*jshint esnext: true*/

(function() {
    'use strict';

    var mitarbeiterString = `
		14402457,Björn Gießler
		14406833,Gerald Kühn
		14406880,Michael Brinkmann
		14407364,Peter Kaletsch
		14407375,Clarissa Niediek
		14407555,Klaus Meyer
		14433437,Joachim Lindner
		14464419,Nicole Gießler
		14509941,Gilda Sperling
		14514901,Christian Kaletsch
		14516161,Christian Philipp
		14578860,Tobias Brunner
		14681436,Michael Hänsch
		14915694,Anna Schoberth
		14920323,Thomas König
		14924912,Michael Liebler
		14972326,Martin Engelhardt
		15086639,Alexander Klose
		15087724,Elizaveta Shlosberg
		15087990,Regine Kaletsch
		15088741,Felix Sembach
		15223647,Marion Lämmermann
		15232387,Morteza Biglari
		15245408,Karen Schlögl
		15271647,Michael Kaletsch
		15553500,Irmgard Baratto
		15572724,Jonas Beez
		15597870,Antonia Hoepffner
		15700377,Dineo Zeil
		15721575,Shawn Fütterer
		15793081,Isabell Schindler
		15876059,Frank Kretschmann
		15967985,Andrea Hänsch
        16223811,Patrick Stieber
    `;

    // read in url params
    var hide_points = Boolean(parseInt(getUrlParameter('hidepoints')));
    var hide_names = Boolean(parseInt(getUrlParameter('hidenames')));
    var dont_blink = Boolean(parseInt(getUrlParameter('dontblink')));
    var distraction_free = Boolean(parseInt(getUrlParameter('distractionfree')));

    var nextgame, override_spieltag, override_game;
    if ($.type(nextgame = getUrlParameter('nextgame')) === 'string') {
        var Parts = nextgame.split(',');
        if (Parts.length == 2) {
            override_spieltag = parseInt(Parts[0]);
            override_game = parseInt(Parts[1]);
        } else {
            override_game = parseInt(Parts[0]);
        }
    }
    console.log(override_spieltag, override_game);

    GM_addStyle(`
		@keyframes blink {
		  50% {
			opacity: 0.0;
		  }
		}
		@-webkit-keyframes blink {
		  50% {
			opacity: 0.0;
		  }
		}

        div.responsive-image {
            position: relative;
            overflow: hidden;
        }

        div.points {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            text-align: center;
            font-family: Impact, Haettenschweiler, "Franklin Gothic Bold", Charcoal, "Helvetica Inserat", "Bitstream Vera Sans Bold", "Arial Black", "sans serif";
            -webkit-text-stroke-width: 5px;
            -webkit-text-stroke-color: black;
        }

        div.redLayer {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: hsla(0, 67%, 50%, 0.5);
        }

        span.red {
            color: hsla(0, 67%, 50%, 1);
        }
        span.green {
            color: hsla(120, 67%, 50%, 1);
        }
    `);

    // nicht blinken, wenn dontblink gesetzt
    if (!dont_blink) {
        GM_addStyle(`
		    .blink {
		      animation: blink 1s step-start 0s infinite;
		      -webkit-animation: blink 1s step-start 0s infinite;
		    }
        `);
    }

    // header, footer, andere sections ausblenden, wenn distractionfree gesetzt
    if (distraction_free) {
        GM_addStyle(`
		    header, footer, div#content>div, div#content>section:not(#team) {display:none}
            section#team {padding:0}
        `);
    }

    // Namen ausblenden, wenn hidenames gesetzt
    if (hide_names) {
        GM_addStyle(`
		    div.desc {
		        margin-top: 0 !important;
                height: 30px !important;
                min-height: 0 !important;
		    }
            div.desc * { display:none; }
        `);
    }

    // Punkte ausblenden, wenn hidepoints gesetzt
    if (hide_points) {
        GM_addStyle(`
            div.points { display:none; }
        `);
    }

    var mitarbeiterList = [];
    mitarbeiterString.split("\n").forEach(function(rowString) {
        var row = rowString.split(",");
        if (row.length == 2) {
            mitarbeiterList.push({
                id: $.trim(row[0]),
                name: $.trim(row[1])
            });
        }
    });

    var url = "http://cors.io/?u=https%3A%2F%2Fwww.kicktipp.de%2Fkaletsch%2Ftippuebersicht";
    if (override_spieltag !== undefined) url += '%3FtippspieltagIndex%3D' + override_spieltag;
    $.get(url, function(data) {
        var $kicktipp = $(data);

        // get the gameList
        var Games = [];
        $kicktipp.find("table.kicktipp-tabs.nw:not(.kicktipp-table-fixed) tbody tr").each(function() {
            var $gameTr = $(this);
            var Game = {
                termin: $.trim($(this).find('td:eq(0)').text()),
                teamA: $.trim($(this).find('td:eq(1)').text()),
                teamB: $.trim($(this).find('td:eq(2)').text()),
                result: $.trim($(this).find('td:eq(4)').text()),
                spiel_abgeschlossen: $(this).find('td.ergebnis span.kicktipp-abpfiff').length > 0,
                spiel_laeuft: $(this).find('td.ergebnis span.kicktipp-liveergebnis').length > 0
            };
            Game.uhrzeit = Game.termin.replace(/^[^\s]+\s/, '');
            Games.push(Game);
        });

        // get the next Game, get the current game
        var nextGameIdx, nextGame, currentGameIdx, currentGame;
        Games.forEach(function(Game, idx) {
            if (nextGameIdx === undefined && !Game.spiel_abgeschlossen) {nextGameIdx = idx; nextGame = Games[nextGameIdx];}
        });
        if (!isNaN(override_game)) {nextGameIdx = override_game - 1; nextGame = Games[nextGameIdx];}

        // read in points zu mitarbeiterList
        var pktMin;
        var pktMax;
        var tippsMissing = 0;
        $kicktipp.find("table.kicktipp-tabs.kicktipp-table-fixed tbody tr[class*='teilnehmer']").each(function() {
            var $tr = $(this);
            var name = $tr.find('td.mg_class').text();
            var pkt = parseInt($tr.find('td.pkt:last').text());
            var id = $(this).attr("class").match(/teilnehmer(\d+)/)[1];
            var getippt;
            if (nextGameIdx !== undefined) getippt = $.trim($tr.find('td:eq(' + (nextGameIdx+3) + ')').text()) !== ''; // starting with 4th col
            tippsMissing += getippt === false ? 1 : 0;

            mitarbeiterList.forEach(function(mitarbeiter) {
                if (mitarbeiter.id == id) {
                    mitarbeiter.kicktippPkt = pkt;
                    mitarbeiter.kicktippName = name;
                    mitarbeiter.kicktippGetippt = getippt;
                }
                // set min and max points current in the game
                if (typeof pktMin == 'undefined') {
                    pktMin = pkt;
                    pktMax = pkt;
                } else {
                    if (pkt < pktMin) pktMin = pkt;
                    if (pkt > pktMax) pktMax = pkt;
                }
                //console.log(name, pktMin, pktMax);
            });
        });

        // Show next game in title
        if (nextGame !== undefined) {
            var headline = nextGame.teamA + ' - ' + nextGame.teamB;
            headline += '<br />' + nextGame.uhrzeit + ' Uhr';
            headline += '<br />(<span id="countdown" data-startzeit="' + nextGame.termin + '"></span>)';
            if (tippsMissing > 0) {
                headline += ' <br /><span class="red blink">' + tippsMissing + ' tipp(s) missing</span>';
            } else {
                headline += ' <br /><span class="green">alle getippt</span>';
            }
            $('section#team h1').html(headline);
            setInterval(function(){
            $('#countdown').each(function() {
                var remaining = getTimeRemaining($(this).data('startzeit'));
                var output = '';
                if (remaining.days) output += remaining.days + ' Tage, ';
                output += remaining.time;
                $(this).text(output);
            });
            }, 1000);
        }

        // Add info to each team member
        $('section#team>div').each(function() {
            var $mitarbeiterDiv = $(this);
            var name = $.trim($mitarbeiterDiv.find('div.desc div.text-uppercase').text());
            var mitarbeiter = mitarbeiterList.find(function(item) {
                return item.name == name;
            });

            if (mitarbeiter) {
                var img_height = $mitarbeiterDiv.find('div.responsive-image img').height();

                // Tipp-Vergessen-Marker einblenden
                if (mitarbeiter.kicktippGetippt === false) {
                    $mitarbeiterDiv.find('div.responsive-image').append( $('<div/>').addClass('redLayer blink').css('height', img_height) );
                }

                // Punktzahl einblenden
                var pkt_scale = (mitarbeiter.kicktippPkt - pktMin) / (pktMax - pktMin); // min = 0, max = 1, dazwischen linear
                var hue = Math.floor(pkt_scale * 120);
                var $div = $('<div/>').text(mitarbeiter.kicktippPkt).addClass('points').css({
                    'font-size': (img_height/1.5) + 'px',
                    'line-height': (img_height) + 'px',
                    color: 'hsla('+hue+', 67%, 50%, 0.85)'
                });
                $mitarbeiterDiv.find('div.responsive-image').append($div);
            } else {
                //console.log('Mitarbeiter ' + name + ' in Tippspiel nicht gefunden. Graue sein Bild aus.');
                $mitarbeiterDiv.find('div.responsive-image img').css('-webkit-filter', 'grayscale(80%)');
            }
        });

    });

})();

function getUrlParameter(sParam) {
    var sPageURL = decodeURIComponent(window.location.search.substring(1)),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : sParameterName[1];
        }
    }
}

function getTimeRemaining(endtime){
    var Parts = endtime.match(/^([0-9]+)\.([0-9]+)\.([0-9]+)\s([0-9]+):([0-9]+)(:([0-9]+))?$/);
    var Endtime = new Date(2000 + parseInt(Parts[3]), parseInt(Parts[2]) - 1, parseInt(Parts[1]), parseInt(Parts[4]), parseInt(Parts[5]));
    var Starttime = new Date();
    var t = Math.abs(Endtime - new Date());
    var seconds = Math.floor( (t/1000) % 60 );
    var minutes = Math.floor( (t/1000/60) % 60 );
    var hours = Math.floor( (t/(1000*60*60)) % 24 );
    var days = Math.floor( t/(1000*60*60*24) );
    var time = ((hours<10) ? ''+hours : hours) + ':' + ((minutes<10) ? '0'+minutes : minutes) + ':' + ((seconds<10) ? '0'+seconds : seconds) + '';
    return {
        'vergangen': Endtime>Starttime,
        'total': t,
        'days': days,
        'hours': hours,
        'minutes': minutes,
        'seconds': seconds,
        'time': time
    };
}