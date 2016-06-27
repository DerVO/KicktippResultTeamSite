// ==UserScript==
// @name         Kicktipp Halbfinal Marker
// @namespace    http://www.kaletsch-medien.de/
// @version      0.1
// @description  Markiert die Halbfinal Bonustipps farbig
// @updateURL    https://github.com/DerVO/KicktippResultTeamSite/raw/master/KicktippBonusHalbfinalMarker.user.js
// @downloadURL  https://github.com/DerVO/KicktippResultTeamSite/raw/master/KicktippBonusHalbfinalMarker.user.js
// @author       DerVO
// @match        https://www.kicktipp.de/kaletsch/tippuebersicht*tippspieltagIndexTippspieltageTab=6
// @grant        GM_addStyle
// @require http://code.jquery.com/jquery-latest.js
// ==/UserScript==

/*jshint esnext: true*/

(function() {
    'use strict';

    var col = {
        CH: 'h1',
        POL: 'h1',
        KRO: 'h1',
        POR: 'h1',
        WAL: 'h2',
        NIR: 'h2',
        UNG: 'h2',
        BEL: 'h2',
        DEU: 'h3',
        SLO: 'h3',
        ITA: 'h3',
        SPA: 'h3',
        FRA: 'h4',
        IRL: 'h4',
        ENG: 'h4',
        ISL: 'h4'
    };

    GM_addStyle(`
		.tag {
            border-radius:3px;
            padding:3px;
            font-weight:bold;
            color:white;
            background-color:#BBBBBB;
        }
        .tag.h1 {background-color:#AA3939}
        .tag.h2 {background-color:#AA6C39}
        .tag.h3 {background-color:#0D4D4D}
        .tag.h4 {background-color:#2D882D}
    `);

    $('table.nw.kicktipp-tabs.kicktipp-table-fixed tbody tr.kicktipp-toolbar-activator').each(function() {
        // cycle over every relevant tr
        var $tr = $(this);
        var $tds = $tr.find('td:nth-child(n+5):nth-last-child(n+5)');
        $tds.each(function() {
            var $acronym = $(this).find('acronym');
            var ctry = $.trim($acronym.text());
            $acronym.addClass('tag');
            if (col[ctry] !== undefined) $acronym.addClass(col[ctry]);
        });
        var count = 0;
        if ($tds.find('.h1').length) count++;
        if ($tds.find('.h2').length) count++;
        if ($tds.find('.h3').length) count++;
        if ($tds.find('.h4').length) count++;
        // Torschuetzenkoenig und EM
        count += $tr.find('td:nth-child(4) span.t, td:nth-child(9) span.t').length; // enthalten vierte und 9te Spalte ein span.t?
        // moegliche Punkte in Spalte Bonus speichern
        $tr.find('td:nth-child(10)').text(count * 2);
    });
})();