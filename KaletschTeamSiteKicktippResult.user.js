// ==UserScript==
// @name         Kaletsch Team Site Kicktipp Result
// @namespace    http://www.kaletsch-medien.de/
// @version      1.1
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
game=x - markiere Spieler die Spiel x (1..n) am aktuellen Spieltag nicht getippt haben
dontblink=1 - roter Layer blinkt nicht
hidepoints=1 - zeige nicht die Punkte
hidenames=1 - blende die Namen aus
Beispiel: http://www.kaletsch-medien.de/uber-uns/?game=1&hidepoints=1&hidenames=1&dontblink=1
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

    var mark_missing_tips_for_game = parseInt(getUrlParameter('game'));
    var show_points = !getUrlParameter('hidepoints');
    var hide_names = Boolean(getUrlParameter('hidenames'));
    var dont_blink = Boolean(getUrlParameter('dontblink'));

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
		.blink {
		  animation: blink 1s step-start 0s infinite;
		  -webkit-animation: blink 1s step-start 0s infinite;
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
    `);

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

    $.get("http://cors.io/?u=https://www.kicktipp.de/kaletsch/tippuebersicht", function(data) {
        var $kicktipp = $(data);
        var pktMin;
        var pktMax;
        $kicktipp.find("table.kicktipp-tabs.kicktipp-table-fixed tbody tr[class*='teilnehmer']").each(function() {
            var $tr = $(this);
            var name = $tr.find('td.mg_class').text();
            var pkt = parseInt($tr.find('td.pkt:last').text());
            var id = $(this).attr("class").match(/teilnehmer(\d+)/)[1];
            var getippt;
            if (!isNaN(mark_missing_tips_for_game)) getippt = $.trim($tr.find('td:eq(' + (mark_missing_tips_for_game+2) + ')').text()) !== ''; // starting with 4th col

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

        $('section#team>div').each(function() {
            var $mitarbeiterDiv = $(this);
            var name = $.trim($mitarbeiterDiv.find('div.desc div.text-uppercase').text());
            var mitarbeiter = mitarbeiterList.find(function(item) {
                return item.name == name;
            });

            // Namen ausblenden, wenn hidenames gesetzt
            if (hide_names) {
                $mitarbeiterDiv.find('div.desc').css({'margin-top': 0, 'height': 30, 'min-height': 0}).empty();
            }

            if (mitarbeiter) {
                var img_height = $mitarbeiterDiv.find('div.responsive-image img').height();

                // Tipp-Vergessen-Marker einblenden
                if (mitarbeiter.kicktippGetippt === false) {
                    $mitarbeiterDiv.find('div.responsive-image').append( $('<div/>').addClass('redLayer ' + (dont_blink ? '' : 'blink') ).css('height', img_height) );
                }

                // Punktzahl einblenden
                var pkt_scale = (mitarbeiter.kicktippPkt - pktMin) / (pktMax - pktMin); // min = 0, max = 1, dazwischen linear
                var hue = Math.floor(pkt_scale * 120);
                var $div = $('<div/>').text(mitarbeiter.kicktippPkt).addClass('points').css({
                    'font-size': (img_height/1.5) + 'px',
                    'line-height': (img_height) + 'px',
                    color: 'hsla('+hue+', 67%, 50%, 0.85)'
                });
                if (show_points) $mitarbeiterDiv.find('div.responsive-image').append($div);
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