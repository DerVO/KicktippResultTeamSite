// ==UserScript==
// @name         Kicktipp Bonus Marker
// @namespace    http://www.kaletsch-medien.de/
// @version      2018.4
// @description  Markiert die Halbfinal Bonustipps farbig
// @updateURL    https://github.com/DerVO/KicktippResultTeamSite/raw/master/KicktippBonusHalbfinalMarker.user.js
// @downloadURL  https://github.com/DerVO/KicktippResultTeamSite/raw/master/KicktippBonusHalbfinalMarker.user.js
// @author       DerVO
// @match        https://www.kicktipp.de/kaletsch/tippuebersicht*bonus=true*
// @grant        GM_addStyle
// @require http://code.jquery.com/jquery-latest.js
// ==/UserScript==

/*jshint esnext: true*/

(function() {
    'use strict';

    var col = {
        URU: 'h1',
        POR: 'h1',
        FRA: 'h1',
        ARG: 'h1',
        BRA: 'h2',
        MEX: 'h2',
        BEL: 'h2',
        JPN: 'h2',
        ESP: 'h3',
        RUS: 'h3',
        CRO: 'h3',
        DEN: 'h3',
        SWE: 'h4',
        CH: 'h4',
        KOL: 'h4',
        ENG: 'h4'
    };

    var tore = {
        // final
        FRA: 4,
        ENG: 6,
        DEU: 1,
        SRB: 1,
        ESP: 3,
        POR: 4,
        KOL: 3,
        BRA: 2,
    }

    GM_addStyle(`
		.tag {
            border-radius:3px;
            padding:3px;
            font-weight:bold;
            color:white;
            background-color:#BBBBBB;
        }
        sub.p {
            font-weight:bold;
        }
        .tore {font-weight:normal}
        .tag.h1 {background-color:#AA3939}
        .tag.h2 {background-color:#AA6C39}
        .tag.h3 {background-color:#0D4D4D}
        .tag.h4 {background-color:#2D882D}
        .tag.im_rennen {background-color:#50aad7}
    `);

    $('table#ranking tbody tr.teilnehmer').each(function() {
        // cycle over every relevant tr
        var $tr = $(this),
            $tds = $tr.find('td.ereignis'),
            $tds_semifinals = $tds.filter('.ereignis1, .ereignis2, .ereignis3, .ereignis4'),
            $tds_tor = $tds.filter('.ereignis0'),
            $tds_tor_wm = $tds.filter('.ereignis0, .ereignis5'),
            count = 0;

        // === Spalten markieren ===
        $tds.each(function() {
            var $td = $(this),
                ctry;
            ctry = $.trim($td.clone().children().remove().end().text()); // text content w/o child elements: https://stackoverflow.com/a/8851526/1037640
            if (ctry == '') return; // nicht getippt

            // if ($tds_semifinals.is($td)) return; // Halbfinaltipps nicht markieren

            //$td.wrapInner("<span class='tag'></span>"); // wrap the whole content
            $td.contents().filter(function(){return this.nodeType === 3}).wrap("<span class='tag'></span>"); // wrap only text content
            var $wrapper = $td.find('span.tag');

            if ($tds_tor.is($td) && tore[ctry] !== undefined) $wrapper.append(' <span class="tore">' + '⚽'.repeat(tore[ctry]) + '</span>'); // Torschuethenkoenig

            if ($td.hasClass('f')) return; // td.f ist ausgeschieden

            if ($tds_semifinals.is($td) && col[ctry] !== undefined) $wrapper.addClass(col[ctry]); // Halbfinals
            if ($tds_tor_wm.is($td) && col[ctry] !== undefined) $wrapper.addClass('im_rennen'); // Wer ist noch im Rennen um Tor und WM
        });

        // === Punkte zaehlen ===
        // Halbfinals
        if ($tds_semifinals.find('.h1').length) count++;
        if ($tds_semifinals.find('.h2').length) count++;
        if ($tds_semifinals.find('.h3').length) count++;
        if ($tds_semifinals.find('.h4').length) count++;
        // Torschuetzenkoenig und EM
        count += $tds_tor_wm.filter(':not(.f)').length; // td.f ist ausgeschieden
        // moegliche Punkte in Spalte Bonus speichern
        $tr.find('td.bonus').append(' (+' + count * 2 + ')');
    });
})();