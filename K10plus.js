{
	"translatorID": "70cd13b4-dd8f-46c0-be47-30cf6ab3a3d5",
	"label": "K10plus",
	"creator": "Philipp Zumstein",
	"target": "txt",
	"minVersion": "3.0",
	"maxVersion": "",
	"priority": 100,
	"inRepository": true,
	"translatorType": 2,
	"displayOptions": {
		"Gedruckte Ressource": false,
		"Lizenzfrei": true
	},
	"lastUpdated": "2019-07-24 15:00:00"
}


/*
	***** BEGIN LICENSE BLOCK *****

	Copyright © 2019 Philipp Zumstein

	This file is part of Zotero.

	Zotero is free software: you can redistribute it and/or modify
	it under the terms of the GNU Affero General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	Zotero is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
	GNU Affero General Public License for more details.

	You should have received a copy of the GNU Affero General Public License
	along with Zotero. If not, see <http://www.gnu.org/licenses/>.

	***** END LICENSE BLOCK *****
*/

var ssgNummer = false;
var exportAbstract = false;
var defaultLanguage = "eng";
var physicalForm = Zotero.getOption("Gedruckte Ressource") ? "A" : "O";// 0500 Position 1
var lf = Zotero.getOption("Lizenzfrei");
var cataloguingStatus = "u";// 0500 Position 3

var journalMapping = {
	"0021-9231": "!014411350!" // Journal of Biblical Literature  http://swb.bsz-bw.de/DB=2.1/PPNSET?PPN=014411350&INDEXSET=1
};

// Sprachcodes nach ISO 639-2
// http://swbtools.bsz-bw.de/winibwhelp/Liste_1500.htm
var languageMapping = {
	"en" : "eng",
	"de" : "ger",
	"fr" : "fre",
	"English" : "eng",
	"pt" : "por",
	"es" : "spa",
	"it" : "ita",
	"en-US" : "eng",
	"en_US" : "eng",
	"EN" : "eng",
	"da-DK" : "dan",
	"da" : "dan",
	"Da" : "dan",
	"pt-BR" : "por",
	"es-ES" : "spa",
	"No" : "nor",
	"Sv" : "swe", 
	"no" : "nor",
	"sv" : "swe", 
};
var issnLangMapping = {
	"1010-9919": "ger",
	"1010-9911": "eng",
	"1010-9913": "fre"
};
var issnVolumeMapping = {
	"2031-5929": "N.S.",
	"2031-5922": "A.S."
};

// Da alles asynchron ablaufen kann:
// Jede Lookup einer AutorIn zählt 1 zu count
// und nach Erledigung wieder 1 weg. Der
// Startwert ist 1 und nach Erledigung aller
// anderen Zeilen wird 1 subtrahiert. Erst
// bei 0 wird die Ausgabe aus outputText erzeugt.
var count = 1;
var outputText = "";

function writeLine(code, line) {
	if (!line) return;
	
	// Halbgeviertstrich etc. ersetzen
	line = line.replace(/–/g, '-').replace(/’/g, '\'').replace(/œ/g, '\\u0153')
		.replace(/a/g, '\\u0101')
		.replace(/â/g, '\\u00E2')
		.replace(/?/g, '\\u1E62')
		.replace(/?/g, '\\u1E63')
		.replace(/u/g, '\\u016B')
		.replace(/?/g, '\\u1E25')
		.replace(/i/g, '\\u012B')
		.replace(/?/g, '\\u1E6D')
		.replace(/?/g, '\\u02BE')
		.replace(/?/g, '\\u02BF')
		.replace(/–/g, '-')
		.replace(/&#160;/g, "")
		.replace(/"/g, '"')
		.replace(/“/g, '"')
		.replace(/”/g, '"');

	// Text zusammensetzen
	outputText += code + " " + line + "\n";
	
	//Lookup für Autoren
	if ((code == "3000" || code == "3010") && line[0] != "!") {
		count++;
		var authorName = line.substring(0,line.indexOf("\n"));
		var lookupUrl = "http://swb.bsz-bw.de/DB=2.104/SET=70/TTL=1/CMD?SGE=&ACT=SRCHM&MATCFILTER=Y&MATCSET=Y&NOSCAN=Y&PARSE_MNEMONICS=N&PARSE_OPWORDS=N&PARSE_OLDSETS=N&IMPLAND=Y&NOABS=Y&ACT0=SRCHA&SHRTST=50&IKT0=1&TRM0=" + authorName +"&ACT1=*&IKT1=2057&TRM1=*&ACT2=*&IKT2=8991&TRM2=(theolog*|neutestament*|alttestament*|kirchenhist*|judais*|Religionswi*)&ACT3=-&IKT3=8991&TRM3=1[0%2C1%2C2%2C3%2C4%2C5%2C6%2C7][0%2C1%2C2%2C3%2C4%2C5%2C6%2C7%2C8%2C9][0%2C1%2C2%2C3%2C4%2C5%2C6%2C7%2C8%2C9]"
				
		/*lookupUrl kann je nach Anforderung noch spezifiziert werden, im obigen Abfragebeispiel: 
		suchen [und] (Person(Phrase: Nachname, Vorname) [PER]) " Barth, Karl "
 		eingrenzen (Systematiknummer der SWD [SN]) *
 		eingrenzen (Relationierter Normsatz in der GND [RL]) (theolog*|neutestament*|alttestament*|kirchenhist*|judais*|Religionswi*)
 		ausgenommen (Relationierter Normsatz in der GND [RL]) 1[0,1,2,3,4,5,6,7][0,1,2,3,4,5,6,7,8,9][0,1,2,3,4,5,6,7,8,9]
		
		IKT0=1 > Nachname + Vorname 
		IKT1=2057 TRM1=* > GND-Systematik
		IKT2=8991 TRM2 > theolog*    für Berufsbezeichnung 550
		IKT3=8991  TRM3=1[1,2,3,4,5,6,7,8][0,1,2,3,4,5,6,7,8,9][0,1,2,3,4,5,6,7,8,9] > Geburts- und Sterbedatum (Bereich)
		
		###OPERATOREN vor "IKT"###
		UND-Verknüpfung "&" | ODER-Verknüpfung "%2B&" | Nicht "-&"
		
		###TYP IKT=Indikatoren|Zweite Spalte Schlüssel(IKT)###
		Liste der Indikatoren und Routine http://swbtools.bsz-bw.de/cgi-bin/help.pl?cmd=idx_list_typ&regelwerk=RDA&verbund=SWB
		*/
		
		ZU.processDocuments([lookupUrl], function(doc, url){
			var ppn = ZU.xpathText(doc, '//small[a[img]]');
			if (ppn) {
				outputText = outputText.replace(authorName, "!" + ppn.trim() + "!$BVerfasserIn$4aut \n8910 $azotkat$bAutor in der Zoterovorlage ["  + authorName + "] maschinell zugeordnet";
			}
		}, function() {
			count--;
			if (count === 0) {
				Zotero.write(outputText);
			}
		});
	}
}

function doExport() {
	var item;
	while ((item = Zotero.nextItem())) {
		// enrich items based on their ISSN
		if (!item.language && item.ISSN && issnLangMapping[item.ISSN]) {
			item.language = issnLangMapping[item.ISSN];
		}
		if (item.volume && item.ISSN && issnVolumeMapping[item.ISSN]) {
			item.volume = issnVolumeMapping[item.ISSN] + item.volume;
		}
		// save DOI always as item.DOI
		if (!item.DOI && item.extra) {
			var extraParts = item.extra.split("\n");
			for (let j = 0; j < extraParts.length; j++) {
				if (extraParts[j].indexOf("DOI:") === 0) {
					item.DOI = extraParts[j].substr(4).trim();
				}
			}
		}
		// normalize language field
		if (item.language && languageMapping[(item.language)]) {
			item.language = languageMapping[item.language];
		}

		var article = false;
		switch (item.itemType) {
			case "journalArticle":
			case "bookSection":
			case "magazineArticle": // wird bei der Erfassung von Rezensionen verwendet. Eintragsart "Magazin-Artikel" wird manuell geändert.
			case "newspaperArticle":
			case "encyclopediaArticle":
				article = true;
				break;
		}
		
		// item.type --> 0500 Bibliographische Gattung und Status
		// http://swbtools.bsz-bw.de/cgi-bin/k10plushelp.pl?cmd=kat&val=0500&katalog=Standard
		if (article) {
			writeLine("0500", physicalForm + "s" + cataloguingStatus);// z.B. Osu
		}
		else {
			writeLine("0500", physicalForm + "a" + cataloguingStatus);// z.B. Aau
		}
		
		// item.type --> 0501 Inhaltstyp
		writeLine("0501", "Text$btxt");
		
		if (physicalForm === "A") {
			// item.type --> 0502 Medientyp
			writeLine("0502", "ohne Hilfsmittel zu benutzen$bn");
			// item.type --> 0503 Datenträgertyp
			writeLine("0503", "Band$bnc");
		}
		
		if (physicalForm === "O") {
			// item.type --> 0502 Medientyp
			writeLine("0502", "Computermedien$bc");
			// item.type --> 0503 Datenträgertyp
			writeLine("0503", "Online-Ressource$bcr");
		}
		
		// item.date --> 1100
		var date = Zotero.Utilities.strToDate(item.date);
		if (date.year !== undefined) {
			writeLine("1100", date.year.toString() + "$n[" + date.year.toString() + "]");
		}
		
		// 1131 Art des Inhalts
		// da Zotero kein ItemType "Reviews" kennt, wird der Eintrag in Zotero bei Katalogisierung von Rezensionsartikeln in "magazineArticle" manuell geändert.
		if (item.itemType == "magazineArticle") {
			writeLine("1131", "!106186019!");
		}
		
		// item.language --> 1500 Sprachcodes
		writeLine("1500", item.language || defaultLanguage);

		// 1505 Katalogisierungsquelle
		writeLine("1505", "$erda");
		
		// item.ISBN --> 2000 ISBN
		if (item.ISBN && physicalForm === "A" && !article) {
			writeLine("2000", item.ISBN);
		}
		
		// item.DOI --> 2051 bei "Oou" bzw. 2053 bei "Aou"
		// http://swbtools.bsz-bw.de/cgi-bin/k10plushelp.pl?cmd=kat&val=2051&katalog=Standard
		if (physicalForm === "O") {
			writeLine("2051", item.DOI);
		}
		else if (physicalForm === "A") {
			writeLine("2053", item.DOI);
		}
		
		// Autoren --> 3000, 3010
		// Titel, erster Autor --> 4000
		var titleStatement = "";
		if (item.shortTitle) {
			titleStatement += item.shortTitle;
			if (item.title && item.title.length > item.shortTitle.length) {
				titleStatement += "$d" + item.title.substr(item.shortTitle.length).replace(/:(?!\d)\s*/,''));
			}
		}
		else {
			titleStatement += item.title.replace(/:(?!\d)\s*/,'$d')
		}
		// Sortierzeichen hinzufügen, vgl. https://github.com/UB-Mannheim/zotkat/files/137992/ARTIKEL.pdf
		if (item.language == "ger" || !item.language) {
			titleStatement = titleStatement.replace(/^(Der|Die|Das|Des|Dem|Den|Ein|Eines|Einem|Eine|Einen|Einer) ([^@])/, "$1 @$2");
		}
		if (item.language == "eng" || !item.language) {
			titleStatement = titleStatement.replace(/^(The|A|An) ([^@])/, "$1 @$2");
		}
		if (item.language == "fre" || !item.language) {
			titleStatement = titleStatement.replace(/^(Le|La|Les|Des|Un|Une) ([^@])/, "$1 @$2");
			titleStatement = titleStatement.replace(/^L'([^@])/, "L'@$1");
		}
		if (item.language == "ita" || !item.language) {
			titleStatement = titleStatement.replace(/^(La|Le|Lo|Gli|I|Il|Un|Una|Uno) ([^@])/, "$1 @$2");
			titleStatement = titleStatement.replace(/^L'([^@])/, "L'@$1");
		}
		if (item.language == "por" || !item.language) {
			titleStatement = titleStatement.replace(/^(A|O|As|Os|Um|Uma|Umas|Uns) ([^@])/, "$1 @$2");
		}
		if (item.language == "spa" || !item.language) {
			titleStatement = titleStatement.replace(/^(El|La|Los|Las|Un|Una|Unos|Unas) ([^@])/, "$1 @$2");
		}
		
		var i = 0, content, creator;
		while (item.creators.length>0) {
			creator = item.creators.shift();
			if (creator.creatorType == "author") {
					content = creator.lastName + (creator.firstName ? ", " + creator.firstName : "");
				}
				if (i === 0) {
					writeLine("3000", content + "\n");
					titleStatement += "$h" + (creator.firstName ? creator.firstName + " " : "") + creator.lastName;
				} else {
					writeLine("3010", content + "\n");
				}
				i++;
			}
	
		writeLine("4000", titleStatement);
		
		// Ausgabe --> 4020
		if (item.edition) {
			writeLine("4020", item.edition);
		}
		
		// Erscheinungsvermerk --> 4030
		if (!article) {
			var publicationStatement = "";
			if (item.place) {
				publicationStatement += item.place;
			}
			if (item.publisher) {
				publicationStatement += "$n" + item.publisher;
			}
			writeLine("4030", publicationStatement);
		}
		
		// Anzahl Seiten --> 4060
		if (physicalForm == "O") {
			var seitenAngabe = "1 Online-Ressource";
			if (item.pages && !item.numPages) {
				var m = item.pages.match(/\b(\d+)-(\d+)\b/);
				if (m) {
					item.numPages = parseInt(m[2]) - parseInt(m[1]) + 1;
				}
			}
			if (item.numPages) {
				seitenAngabe += " (" + item.numPages + " Seiten)";
			}
			writeLine("4060", seitenAngabe);
		}
		
		// 4070 $v Bandzählung $j Jahr $a Heftnummer $p Seitenzahl
		if (item.itemType == "journalArticle" || item.itemType == "magazineArticle" || item.itemType == "bookSection") {
			var volumeyearissuepage = "";
			if (item.volume) {
				volumeyearissuepage += "$v" + item.volume;
			}
			if (date.year !== undefined) {
				volumeyearissuepage += "$j" + date.year;
			}
			if (item.issue) {
				volumeyearissuepage += "$a" + item.issue.replace(/^0/, "");
			}
			if (item.pages) {
				volumeyearissuepage += "$p" + item.pages;
			}
			
			writeLine("4070", volumeyearissuepage);
		}
		
		// URL --> 4950
		var suffix = lf ? "$LF" : "";
		if (physicalForm == "O") {
			// Sowohl DOI wie auch URL werden angegeben, da wir annehmen,
			// dass die URL auf die Zweitveröffentlichung zeigt.
			if (item.DOI && item.DOI !== "") {
				writeLine("4950", "https://doi.org/" + item.DOI + "$xR" + suffix);
			}
			if (item.url && !item.url.includes(item.DOI)) {
				writeLine("4950", item.url + "$xH" + suffix);
			}
		}
		
		// Reihe --> 4110
		if (!article) {
			var seriesStatement = "";
			if (item.series) {
				seriesStatement += item.series;
			}
			if (item.seriesNumber) {
				seriesStatement += " ; " + item.seriesNumber;
			}
			writeLine("4110", seriesStatement);
		}
		
		// Sonstige Anmerkungen (manuell eintragen) --> 4201
		writeLine("4201", "");
		
		// Inhaltliche Zusammenfassung --> 4207
		if (item.abstractNote && exportAbstract) {
			writeLine("4207", item.abstractNote);
		}
		
		// item.publicationTitle --> 4241 Beziehungen zur größeren Einheit
		if (item.itemType == "journalArticle" || item.itemType == "magazineArticle" || item.itemType == "bookSection") {
			if (item.ISSN && journalMapping[ZU.cleanISSN(item.ISSN)]) {
				writeLine("4241", "Enthalten in" + journalMapping[ZU.cleanISSN(item.ISSN)]);
			}
			else if (item.publicationTitle) {
				writeLine("4241", "Enthalten in!PPN!" + item.publicationTitle);
			}
			else {
				writeLine("4241", "Enthalten in!PPN!" + ZU.cleanISSN(item.ISSN));
			}
		}
		
		// 4261 Themenbeziehungen (Beziehung zu der Veröffentlichung, die beschrieben wird)|case:magazineArticle
		if (item.itemType == "magazineArticle") {
			writeLine("4261", "Rezension von!!"); // zwischen den Ausrufezeichen noch die PPN des rezensierten Werkes manuell einfügen.
		}
		
		// Schlagwörter aus einem Thesaurus (Fremddaten) --> 5520
		for (i = 0; i < item.tags.length; i++) {
			writeLine("5520", "|s|" + item.tags[i].tag.replace(/\s?--\s?/g, ';'));
		}
		
		// SSG-Nummer --> 5056
		if (ssgNummer) {
			writeLine("5056", ssgNummer);
		}
		
		// Lokaldatensatz generieren
		writeLine("E* l01", "\n" + "7100 $B" + "hier Bibliothekssiegel" + "$a");
		
	}
	outputText += "\n";
	
	count--;
	if (count === 0) {
		Zotero.write(outputText);
	}
}
