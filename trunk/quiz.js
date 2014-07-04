/***************************************************
* JavaScript-Framework für interaktive Lernaufgaben
****************************************************
*
* V 2.4 (2011/10/20)
*
* Dieses Script wandelt Teile einer Website
* in interaktive Quiz-Aufgaben um. Dazu orientiert
* es sich an CSS-Klassen einzelner HTML-Elemente.
* Dadurch können interaktive Aufgaben auf Websiten
* in einem einfachen WYSIWYG-Editor erstellt
* werden. Die Interaktion geschieht dann mittels
* dieses nachgeladenen Javascripts.
*
* SOFTWARE LICENSE: LGPL
* (C) 2007 Felix Riesterer
* This library is free software; you can redistribute it and/or
* modify it under the terms of the GNU Lesser General Public
* License as published by the Free Software Foundation; either
* version 2.1 of the License, or (at your option) any later version.
* 
* This library is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
* Lesser General Public License for more details.
* 
* You should have received a copy of the GNU Lesser General Public
* License along with this library; if not, write to the Free Software
* Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
*
* Felix Riesterer (Felix.Riesterer@gmx.net)
*/


var Quiz = {

	triggerClass : "-quiz",	/* Variable, in der das Suffix der CSS-Klasse steht,
		auf die das Script reagiert, um eine Übung als solche zu erkennen und umzuwandeln.
		Es gibt derzeit folgende Übungen, deren Klassennamen wie folgt lauten:
		* Zuordnungsspiel
			-> class="zuordnungs-quiz"
		* Lückentext-Aufgabe
			-> class="lueckentext-quiz"
		* Memo
			-> class="memo-quiz"
		* Multiple Choice - Quiz
			-> class="multiplechoice-quiz"
		* Schüttelrätsel
			-> class="schuettel-quiz"
		* Kreuzworträtsel
			-> class="kreuzwort-quiz"
		*/

	poolClass : "daten-pool", // CSS-Klasse für das Element, in welchem die zu ziehenden Felder liegen

	feldClass : "feld", // CSS-Klasse für Datenfelder

	bewertungsClass : "quiz-bewertung", // CSS-Klasse für den Textabsatz mit den Bewertungsergebnissen

	highlightClass : "anvisiert", // CSS-Klasse für das Ziel-Highlighting

	highlightElm : null, // hier steht später eine Referenz auf das HTML-Element, welches gerade als potenzielles Ziel anvisiert wird

	baseURL : false, // enthält später den Pfad zum Ordner dieses Scripts

	codeTabelle : false, // wird später durch ein nachgeladenes Script mit einem Objekt befüllt

	draggableClass : "quiz-beweglich", // CSS-Klasse, die ein Element für Drag&Drop freigibt, damit es beweglich wird.

	draggedClass : "quiz-gezogen", // CSS-Klasse, wenn ein Element gerade bewegt wird.

	dragMode : false, // entscheidet, ob ein Element bei onmousedown gezogen werden soll, oder nicht

	dragElm : null, // hier steht später eine Referenz auf das HTML-Element in dem der mousedown stattfand

	dragElmOldVisibility : "", // hier steht später der originale Wert des gezogenen Elements (wird für's Highlighten verändert)

	mouseLastCoords : {
		// wird später mit den Mauskoordinaten überschrieben werden
		left : 0,
		top : 0
	},

	// Anzahl mouseover-Events, nach denen das Drag-Element unsichtbar geschaltet wird (reduziert das Flimmern beim Draggen)
	visibilityCountDefault : 5,

	// Hier findet später der Countdown statt, um das Drag-Element nicht bei jedem mouseover-Event unsichtbar zu schalten
	visibilityCount : 0,

	// Platzhalter für Eventhandler
	oldWinOnLoad : "leer",
	oldDocOnMouseMove : "leer",
	oldDocOnMouseOver : "leer",
	oldDocOnMouseUp : "leer",
	oldDocOnKeyUp : "leer",

	// Alle Quizze auf einer Seite werden hier beim Initialisieren abgespeichert
	alleQuizze : new Object(),

	// Das gerade benutze Quiz
	aktivesQuiz : null,

	init : function () {
		// baseURL herausfinden
		var i, script, scripts;
		scripts = document.getElementsByTagName("script");
		for (i = 0; i< scripts.length; i++)
			if (scripts[i].src && scripts[i].src.match(/\/quiz.js/))
				Quiz.baseURL = scripts[i].src.substr(0, scripts[i].src.lastIndexOf("/") + 1);
		// Mehrsprachigkeit einbinden
		script = document.createElement("script");
		script.type = "text/javascript";
		script.src = Quiz.baseURL + "multilingual.js";
		document.getElementsByTagName("head")[0].appendChild(script);

		// UTF-8-Normalizer einbinden
		script = document.createElement("script");
		script.type = "text/javascript";
		script.src = Quiz.baseURL + "utf8-normalizer.js";
		document.getElementsByTagName("head")[0].appendChild(script);

		// Die Initialisierung könnte mehrfach benötigt werden, die folgenden Umleitungen dürfen aber nur einmal gemacht werden!
		if (Quiz.oldDocOnMouseMove == "leer") {
			Quiz.oldDocOnMouseMove = document.onmousemove;
			document.onmousemove = function (e) {
				if (typeof(Quiz.oldDocOnMouseMove) == "function")
					Quiz.oldDocOnMouseMove(e);
				Quiz.whileDrag(e);
			}
		}

		// OnMouseOver-Handler nur einmal eintragen
		if (Quiz.oldDocOnMouseOver == "leer") {
			Quiz.oldDocOnMouseOver = document.onmouseover;
			document.onmouseover = function (e) {
				if (typeof(Quiz.oldDocOnMouseOver) == "function")
					Quiz.oldDocOnMouseOver(e);
				Quiz.einBlender(e);
			}
		}

		// OnLoad-Handler nur einmal eintragen
		if (Quiz.oldWinOnLoad == "leer") {
			Quiz.oldWinOnLoad = window.onload;
			window.onload = function () {
				if (typeof(Quiz.oldWinOnLoad) == "function")
					Quiz.oldWinOnLoad();
				Quiz.initQuizze();
			}
		}

		// OnMouseUp-Handler nur einmal eintragen
		if (Quiz.oldDocOnMouseUp == "leer") {
			Quiz.oldDocOnMouseUp = document.onmouseup;
			document.onmouseup = function (e) {
				if (typeof(Quiz.oldDocOnMouseUp) == "function") {
					Quiz.oldDocOnMouseUp(e);
				}

				for (i in Quiz.alleQuizze) {
					if (Quiz.alleQuizze[i].element.onmouseup) {
						Quiz.alleQuizze[i].element.onmouseup(e);
					}
				}
			}
		}

		// OnKeyUp-Handler nur einmal eintragen
		if (Quiz.oldDocOnKeyUp == "leer") {
			Quiz.oldDocOnKeyUp = document.onkeyup;
			document.onkeyup = function (e) {
				if (typeof(Quiz.oldDocOnKeyUp) == "function") {
					Quiz.oldDocOnKeyUp(e);
				}

				for (i in Quiz.alleQuizze) {
					if (Quiz.alleQuizze[i].element.onkeyup) {
						Quiz.alleQuizze[i].element.onkeyup(e);
					}
				}
			}
		}

		// Erweiterung für das native String-Objekt in JavaScript: trim()-Methode (wie in PHP verfügbar)
		if (typeof(new String().quizTrim) != "function") {
			String.prototype.quizTrim = function () {
				var ltrim = new RegExp("^[" + String.fromCharCode(32) + String.fromCharCode(160) + "\t\r\n]+", "g");
				var rtrim = new RegExp("[" + String.fromCharCode(32) + String.fromCharCode(160) + "\t\r\n]+$", "g");

				var s = this.replace(ltrim, "");
				s = s.replace(rtrim, "");

				return s;
			};
		}

		// Erweiterung für das native Array-Objekt: shuffle()-Methode
		if (typeof(new Array().quizShuffle) != "function") {
			Array.prototype.quizShuffle = function () {
				var ar = [], zufall, i, vorhanden;

				while (ar.length < this.length) {
					vorhanden = false;
					zufall = Math.floor(Math.random() * this.length);

					for (i = 0; i < ar.length; i++) {
						if (ar[i] === this[zufall])
							vorhanden = true;
					}

					if (!vorhanden) {
						ar.push(this[zufall]);
					}
				}

				for (i = 0; i < ar.length; i++)
					this[i] = ar[i];
			};
		}
	},

/*
=================
 Quiz - Funktionen
=================
 */


	/* Diese Funktion erzeugt ein Zuordnungs-Quiz. Dazu braucht sie eine Tabelle innerhalb eines
	Elternelements mit dem CSS-Klassen-Präfix "matching", z.B. "matching-quiz", wenn "-quiz"
	das Suffix der Quiz.triggerClass ist.
	Die Tabelle mit den Daten enthält Spalten (ohne <th>!), in denen die Werte stehen. */

	zuordnungsQuiz : function (div) {
		var i, j, k, test, tabelle, gefunden, daten;

		var quiz = {
			// Objekt-Gestalt eines Zuordnungs-Quizzes
			name : "Quiz-x", // Platzhalter - hier steht später etwas anderes.
			typ : "Zuordnungs-Quiz",
			spielModus : "paarweise", // entweder paarweise oder gruppenweise Zuordnungen
			loesungsClass : "loesungs-paar",
			element : div, // Referenz auf das DIV-Element, in welchem sich das Quiz befindet
			daten : new Array(), // Hier stehen später Wertegruppen (in Arrays).
			felder : new Array(), // Hier stehen später Referenzen auf SPAN-Elemente
			auswertungsButton : null, // Hier steht später das HTML-Element des Auswertungs-Buttons.
			versuche : 0, // Speichert die Anzahl Versuche, die für die Lösung gebraucht wurden.
			sprache : (div.lang && div.lang != "") ? div.lang : "de", // deutsche Meldungen als Voreinstellung

			// Funktion zum Auswerten der Drag&Drop-Aktionen des Benutzers
			dragNDropAuswerten : function (element, ziel) {
				var vorgaenger, test;
				var pool = Quiz.getElementsByClassName(Quiz.poolClass, this.element)[0];

				// Element einpflanzen
				element.parentNode.removeChild(element);
				ziel.appendChild(element);
				test = Quiz.getElementsByClassName(Quiz.draggableClass, ziel);

				// bei paarweise: War bereits ein Element hier eingefügt? -> Zurück in den Pool damit!
				if (this.spielModus == "paarweise" && test.length > 1) {
					vorgaenger = ziel.removeChild(test[0]);
					pool.appendChild(vorgaenger);
				}

				// Auswertungsbutton entfernen, falls vorhanden
				if (this.auswertungsButton.parentNode)
					this.auswertungsButton.parentNode.removeChild(this.auswertungsButton);

				// letztes Element verwendet -> Auswertungs-Button anbieten
				if (Quiz.getElementsByClassName(Quiz.draggableClass, pool).length < 1)
					pool.appendChild(this.auswertungsButton);
			},

			// Funktion zum Auswerten der Zuordnungen
			auswerten : function () {
				var loesungen = Quiz.getElementsByClassName(this.loesungsClass, this.element);
				var pool = Quiz.getElementsByClassName(Quiz.poolClass, this.element)[0];
				var i, gruppe, test, element;

				// Anzahl Lösungsversuche um eins erhöhen
				this.versuche++;

				// Zuordnungen einzeln überprüfen
				for (i = 0; i < loesungen.length; i++) {
					gruppe = loesungen[i].getElementsByTagName("span");

					// Stimmen die IDs bis auf ihre letzte Zahl überein?
					test = gruppe[0].id.substring(0, gruppe[0].id.lastIndexOf("_"));
					test = new RegExp("^"+test);

					for (j = gruppe.length - 1; j > 0; j--) {
						if (!gruppe[j].id.match(test)) {
							// Nein! Zweites Element zurück in den Pool!
							element = gruppe[j].parentNode.removeChild(gruppe[j]);
							pool.appendChild(element);
						}
					}
				}

				// Auswertungsbutton entfernen, falls vorhanden
				if (this.auswertungsButton.parentNode)
					this.auswertungsButton.parentNode.removeChild(this.auswertungsButton);

				// Sind keine Felder mehr im Pool? -> Quiz erfolgreich gelöst!
				if (pool.getElementsByTagName("span").length < 1) {
					// Eventhandler entfernen
					this.element.onmousedown = null;
					this.element.onmousemove = null;
					this.element.onmouseup = null;
					this.solved = true;
					pool.parentNode.removeChild(pool);

					// Bewegungscursor entfernen
					loesungen = Quiz.getElementsByClassName(Quiz.draggableClass, this.element);
					test = new RegExp(" ?" + Quiz.draggableClass);
					for (i = 0; i < loesungen.length; i++) {
						loesungen[i].className = loesungen[i].className.replace(test, "");
						loesungen[i].style.cursor = "";
					}

					// Erfolgsmeldung ausgeben
					test = document.createElement("p");
					test.className = Quiz.bewertungsClass;
					test.innerHTML = Quiz.meldungen[this.sprache]["lob" + (this.versuche > 2 ? 3 : this.versuche)]
						+ " "
						+ Quiz.meldungen[this.sprache]["ergebnis" + (this.versuche > 2 ? 3 : this.versuche)].replace(/%n/i, this.versuche);
					this.element.appendChild(test);
				}
			},

			// Funktion zum Mischen und Austeilen der Wörter
			init : function () {
				var loesung, pool, feld, i, j, gruppe, benutzte, zufall, gemischte;

				// Spracheinstellungen auf deutsch zurück korrigieren, falls entsprechende Sprachdaten fehlen
				if (!Quiz.meldungen[this.sprache])
					this.sprache = "de";

				/* Jeder Wert aus den Werten der Daten wird zu einem SPAN-Element ("Feld") und erhält eine ID.
				Die ID eines solchen Feldes enthält den Namen des Quizes, die laufende Nummer der Wertegruppe, der er entstammt
				und anschließend die laufende Nummer innerhalb der Wertegruppe. Dadurch kann später die Zuordnung ausgewertet werden,
				da die ID bis auf die letzte Nummer übereinstimmen muss, wenn die Zuordnung stimmen soll. */

				pool = document.createElement("p"); // Behälter für die beweglichen Teile
				pool.className = Quiz.poolClass;
				this.element.appendChild(pool); // ins Dokument einfügen

				// Wertegruppen durchgehen, Felder erzeugen
				for (i = 0; i < this.daten.length; i++) {
					// Jedes Datum besteht aus einem Array, das mindestens zwei Felder besitzt.
					if (this.daten[i].length > 2)
						this.spielModus = "gruppenweise";

					for (j = 0; j < this.daten[i].length; j++) {
						gruppe = this.daten[i];
						feld = document.createElement("span");
						feld.id = this.name + "_" + i + "_" + j;
						feld.className = Quiz.feldClass;
						feld.innerHTML = gruppe[j];
						feld.style.cursor = "move";
						this.felder.push(feld);
					}
				}

				// Felder mischen und verteilen!
				benutzte = new Array(); // Hier werden bereits benutzte Gruppen markiert
				gemischte = new Array(); // Felder einer Gruppe die in den Pool sollen, hier eintragen
				for (j = 0; j < this.daten.length; j++) {
					// Lösungs-Absatz erzeugen
					loesung = document.createElement("p");
					loesung.className = this.loesungsClass;

					// Gruppe auswählen
					gruppe = true; // Wertegruppe schon verwendet?
					while (gruppe) {
						zufall = Math.floor(Math.random() * this.daten.length);
						gruppe = benutzte[zufall]; // prüfen auf "bereits verwendet"
					}

					benutzte[zufall] = true; // Gruppe jetzt als verwendet eintragen.

					/*
						Je nach Spiel-Modus ("paarweise" oder "gruppenweise") darf die inhaltliche Vorbelegung des
						Lösungsabsatzes nicht zufällig belegt werden. Bei paarweisen Zuordnungen ist immer "logisch",
						welches Feld aus dem Pool dem bereits im Lösungsabsatz stehenden zugeordnet werden muss. Bei
						gruppenweisen Zuordnungen muss dort aber eine Art Oberbegriff stehen, der dann der ersten
						Tabellenzelle der Vorgaben entspricht!
					*/

					feld = 0; // erstes Feld einer Gruppe
					if (this.spielModus == "paarweise") {
						// Feld im Lösungsabsatz zufällig auswählen.
						feld = Math.floor(Math.random() * 2);
					}

					// Feld aus der Liste der erstellten Felder ermitteln und in Lösungsabsatz schreiben. Restliche Felder der Gruppe in den Pool schreiben.
					for (i = 0; i < this.felder.length; i++) {
						if (this.felder[i].id.match(new RegExp(this.name + "_" + zufall + "_"))) {
							// Feld aus dieser Gruppe ermittelt!
							if (this.felder[i].id.match(new RegExp(this.name + "_" + zufall + "_" + feld))) {
								// Feld in den Lösungsabsatz eintragen
								this.felder[i].style.cursor = "";
								loesung.appendChild(this.felder[i]);
								pool.parentNode.insertBefore(loesung, pool);
							} else {
								// Feld zu den gemischten einordnen
								gemischte.push(this.felder[i]);
							}
						}
					}
				}

				// zuzuordnende Felder vermischt ausgeben
				i = gemischte.length;
				while (i > 0) {
					feld = "leer"; // Feld zum Eintragen gefunden?
					while (feld == "leer") {
						zufall = Math.floor(Math.random() * gemischte.length);
						feld = gemischte[zufall];
					}

					pool.appendChild(gemischte[zufall]);
					gemischte[zufall] = "leer"; // Array-Eintrag löschen
					i--;
				}

				// ID für das umgebende DIV-Element vergeben
				this.element.id = this.name;

				// Eventhandler für bewegliche Felder einrichten
				this.element.onmousedown = Quiz.startDrag;
				this.element.onmouseover = Quiz.highlight;
				this.element.onmouseup = Quiz.stopDrag;

				gruppe = Quiz.getElementsByClassName(Quiz.feldClass, pool);
				for (i = 0; i < gruppe.length; i++)
					gruppe[i].className += " " + Quiz.draggableClass;

				// Auswertungs-Button erzeugen
				test = document.createElement("span");
				test.className = "auswertungs-button";
				test.innerHTML = '<a href="javascript:Quiz.alleQuizze.'
					+ this.name
					+ '.auswerten()">'
					+ Quiz.meldungen[this.sprache].pruefen
					+ '</a>';
				this.auswertungsButton = test;
			}
		};

		// Laufende Nummer ermitteln -> Quiz-Name wird "quiz" + laufende Nummer
		i = 0;
		for (test in Quiz.alleQuizze)
			i++;
		quiz.name = "quiz" + i;

		// Gibt es Quiz-Daten?
		tabelle = div.getElementsByTagName("table");

		if (tabelle.length < 1)
			return false;

		// Daten sind also vorhanden? -> Auswerten
		test = tabelle[0].getElementsByTagName("tr"); // Tabellenzeilen nach Daten durchforsten
		for (i = 0; i < test.length; i++) {
			daten = test[i].getElementsByTagName("td"); // Tabellenzellen nach Daten durchforsten
			if (daten.length > 1) {
				gefunden = new Array(); // Eine Wertegruppe anlegen
				for (j = 0; j < daten.length; j++) {
					k = false; // normalisierter Zelleninhalt
					if (daten[j] && daten[j].innerHTML && daten[j].innerHTML != "") {
						k = daten[j].innerHTML.replace(/&nbsp;/, " ").quizTrim();
					}

					if (k && k != "")
						gefunden[j] = k;
				}

				// Falls Wertegruppe mindestens ein Wertepaar enthält, dieses den Daten hinzufügen.
				if (gefunden.length > 1)
					quiz.daten.push(gefunden);
			}
		}

		// Keine brauchbare Daten? -> Verwerfen!
		if (quiz.daten.length < 1)
			return false;

		// Quiz in die Liste aufnehmen und initialisieren
		Quiz.alleQuizze[quiz.name] = quiz;
		tabelle[0].parentNode.removeChild(tabelle[0]);
		quiz.element.quiz = quiz;
		Quiz.alleQuizze[quiz.name].init();

		return true;
	},


	/* Diese Funktion erzeugt ein Lückentext-Quiz. Dazu braucht sie ein Elternelement mit dem
	CSS-Klassen-Präfix "lueckentext", z.B. "lueckentext-quiz", wenn "-quiz" das Suffix der Quiz.triggerClass ist.
	Die mit <strong>, <em>, <b> oder <i> ausgezeichneten Textstellen werden durch Drag&Drop-Felder ersetzt. Sollten
	Lösungshinweise in Klammern stehen, so werden die Textstellen durch Eingabefelder ersetzt. */

	lueckentextQuiz : function (div) {
		var i, j, test, inhalt, daten, feld, ids = 0;

		var quiz = {
			// Objekt-Gestalt eines Lückentext-Quizzes
			name : "Quiz-x", // Platzhalter - hier steht später etwas anderes.
			typ : "Lückentext-Quiz",
			loesungsClass : "luecke",
			lueckenPlatzhalter : "&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;", // Leerzeichen als Platzhalter für Lücken
			element : div, // Referenz auf das DIV-Element, in welchem sich das Quiz befindet
			felder : new Array(), // Hier stehen später Referenzen auf SPAN-Elemente
			inputs : new Array(), // Hier stehen später Referenzen auf die Text-Eingabefelder und ihre Lösungen
			auswertungsButton : null, // Hier steht später das HTML-Element des Auswertungs-Buttons.
			versuche : 0, // Speichert die Anzahl Versuche, die für die Lösung gebraucht wurden.
			sprache : (div.lang && div.lang != "") ? div.lang : "de", // deutsche Meldungen als Voreinstellung

			// Funktion zum Auswerten der Drag&Drop-Aktionen des Benutzers
			dragNDropAuswerten : function (element, ziel) {
				var vorgaenger, test, ok, i;
				var pool = Quiz.getElementsByClassName(Quiz.poolClass, this.element)[0];

				if (element && ziel) {
					// Element bewegen
					test = new RegExp(this.loesungsClass, "");
					// Zuerst überflüssige Leerzeichen im Ziel-Element entfernen?
					if (ziel.className.match(test) && Quiz.getElementsByClassName(Quiz.draggableClass, ziel).length < 1)
						ziel.innerHTML = ""; // Leerzeichen in einer Lücke zuvor entfernen

					// Bewegliches Element ausschneiden
					vorgaenger = element.parentNode;
					vorgaenger.removeChild(element);

					// Entleertes Element mit Leerzeichen auffüllen?
					if (vorgaenger.className.match(test) && Quiz.getElementsByClassName(Quiz.draggableClass, vorgaenger).length < 1)
						vorgaenger.innerHTML = this.lueckenPlatzhalter; // Leerzeichen in einer Lücke als Platzhalter einfügen

					// Bewegliches Element einpflanzen
					ziel.appendChild(element);
					test = Quiz.getElementsByClassName(Quiz.draggableClass, ziel);

					// War bereits ein Element hier eingefügt? -> Zurück in den Pool damit!
					if (test.length > 1) {
						vorgaenger = ziel.removeChild(test[0]);
						pool.appendChild(vorgaenger);
					}
				}

				// Auswertungsbutton entfernen, falls vorhanden
				if (this.auswertungsButton.parentNode)
					this.auswertungsButton.parentNode.removeChild(this.auswertungsButton);

				// Auswertungs-Button anbieten?
				if (Quiz.getElementsByClassName(Quiz.draggableClass, pool).length < 1) {
					// letztes Element verwendet -> Alle Eingabefelder ausgefüllt?
					ok = true; // Wir gehen jetzt einmal davon aus...
					test = this.element.getElementsByTagName("input");
					for (i = 0; i < test.length; i++) {
						if (test[i].value == "")
							ok = false; // Aha, ein Eingabefeld war leer!
					}

					if (ok)
						pool.appendChild(this.auswertungsButton);
				}
			},

			// Funktion zum Auswerten der Lösungen
			auswerten : function () {
				var loesungen = new Array();
				var pool = Quiz.getElementsByClassName(Quiz.poolClass, this.element)[0];
				var i, j, test, element, ok;

				// Anzahl Lösungsversuche um eins erhöhen
				this.versuche++;

				// Drag&Drop-Felder überprüfen
				loesungen = Quiz.getElementsByClassName(this.loesungsClass, this.element);

				if (loesungen.length > 0) {
					// Es gibt Drag&Drop-Felder zu überprüfen...
					for (i = 0; i < loesungen.length; i++) {
						test = new RegExp("^" + loesungen[i].id.replace(/^([^_]+_\d+)\w+.*$/, "$1"), "")
						element = Quiz.getElementsByClassName(Quiz.draggableClass, loesungen[i])[0];

						if (!element.id.match(test)) {
							// Falsche Zuordnung! Zurück in den Pool damit!
							element.parentNode.removeChild(element);
							pool.appendChild(element);
							loesungen[i].innerHTML = this.lueckenPlatzhalter;
						}
					}
				}

				// Eingabefelder überprüfen
				loesungen = Quiz.getElementsByClassName(this.loesungsClass + "_i", this.element);
				ok = true; // Wir gehen einmal davon aus, dass alles richtig ist...

				for (i = 0; i < loesungen.length; i++) {
					for (j = 0; j < this.inputs.length; j++) {
						element = document.getElementById(loesungen[i].id + "i");
						if (element.id == this.inputs[j].element.getElementsByTagName("input")[0].id) {
							// Inhalt prüfen
							test = this.inputs[j].loesung;
							element.value = element.value.quizTrim();
							if (element.value != test) {
								ok = false; // Falsche Eingabe!
								element.value = "";
							}
						}
					}
				}

				// Auswertungsbutton entfernen
				this.auswertungsButton.parentNode.removeChild(this.auswertungsButton);

				// Sind keine Felder mehr im Pool? -> Quiz erfolgreich gelöst!
				if (pool.getElementsByTagName("span").length < 1 && ok) {
					// Eventhandler entfernen
					this.element.onmousedown = null;
					this.element.onmousemove = null;
					this.element.onmouseup = null;
					this.solved = true;
					pool.parentNode.removeChild(pool);

					// Elementen die Beweglichkeit nehmen
					loesungen = Quiz.getElementsByClassName(Quiz.draggableClass, this.element);
					test = new RegExp(" ?" + Quiz.draggableClass, "");
					for (i = 0; i < loesungen.length; i++) {
						loesungen[i].className = loesungen[i].className.replace(test);
						loesungen[i].style.cursor = "";
					}

					// Eingabefelder durch gelöste Felder ersetzen
					loesungen = Quiz.getElementsByClassName(this.loesungsClass + "_i", this.element);
					for (i = 0; i < loesungen.length; i++) {
						element = document.createElement("span");
						element.className = this.loesungsClass;
						element.innerHTML = document.getElementById(loesungen[i].id + "i").value;
						loesungen[i].parentNode.insertBefore(element, loesungen[i]);
						loesungen[i].parentNode.removeChild(loesungen[i]);
					}

					// Erfolgsmeldung ausgeben
					test = document.createElement("p");
					test.className = Quiz.bewertungsClass;
					test.innerHTML = Quiz.meldungen[this.sprache]["lob" + (this.versuche > 2 ? 3 : this.versuche)]
						+ " "
						+ Quiz.meldungen[this.sprache]["ergebnis" + (this.versuche > 2 ? 3 : this.versuche)].replace(/%n/i, this.versuche);
					this.element.appendChild(test);
				}
			},

			// Funktion zum Erstellen der Lücken, Mischen und Austeilen der beweglichen Wörter, bzw Umwandeln der Wörter zu Engabefeldern
			init : function () {
				var input, felder, benutzte, pool, zufall, luecke, test, i;

				// Spracheinstellungen auf deutsch zurück korrigieren, falls entsprechende Sprachdaten fehlen
				if (!Quiz.meldungen[this.sprache])
					this.sprache = "de";

				/* Jeder markierte Textabschnitt (zum Markieren dienen die Elemente <i>, <b>, <em> und <strong>) wird zu entweder
				einem beweglichen SPAN-Element ("Feld"), oder (wenn eine öffnende Klammer für Hilfsangaben enthalten sind)
				einem Input-Feld. Das markierende Element (also das <i>, <b> etc.) wird ersetzt durch ein <span>-Element mit der
				CSS_Klasse, die in quiz.loesungsClass definiert wurde.

				Beispiel1: <p>Eine Henne legt ein <i>Ei</i>.</p>
				wird zu 
				<p>Eine Henne legt ein <span class="luecke" id="......"> nbsp; nbsp; nbsp; </span>.</p>
				->"Ei" wird zu <span id="quiz0_xb" class="beweglich">Ei</span> und landet im Pool.

				Beispiel2: <p>Eine Henne <b>legt (legen)</b> ein Ei.</p>
				wird zu 
				<p>Eine Henne <span class="luecke"><input type="text" id="......" /></span> (legen) ein Ei.</p>

				Die ID eines solchen Feldes enthält den Namen des Quizes, die laufende Nummer des Wertepaares, dem er entstammt
				und entweder ein "a" oder ein "b". Dadurch kann später die Zuordnung ausgewertet werden, da die ID bis auf den
				letzten Buchstaben übereinstimmen muss, wenn die Zuordnung stimmen soll. */

				// Wenn es Drag&Drop-Felder gibt, dann wird ein Pool benötigt
				if (this.felder.length > 0 || this.inputs.length >0) {
					pool = document.createElement("p"); // Behälter für die beweglichen Teile
					pool.className = Quiz.poolClass;
					this.element.appendChild(pool); // ins Dokument einfügen

					// Felder im Pool ablegen und Lücken erzeugen
					benutzte = new Array(); // Hier werden bereits benutzte Felder markiert

					for (i = 0; i < this.felder.length; i++) {
						test = true;
						while (test) {
							zufall = Math.floor(Math.random() * this.felder.length);
							test = benutzte[zufall];
						}

						pool.appendChild(this.felder[zufall].element);
						luecke = document.createElement("span");
						luecke.innerHTML = this.lueckenPlatzhalter;
						luecke.id = this.felder[zufall].element.id + "_" + this.loesungsClass;
						luecke.className = this.loesungsClass;

						// Lücke ins Dokument schreiben
						this.felder[zufall].original.parentNode.insertBefore(luecke, this.felder[zufall].original);
						this.felder[zufall].original.parentNode.removeChild(this.felder[zufall].original);

						// Feld als benutzt markieren
						benutzte[zufall] = true;
					}

					// Eventhandler für bewegliche Felder einrichten
					this.element.onmousedown = Quiz.startDrag;
					this.element.onmouseover = Quiz.highlight;
					this.element.onmouseup = Quiz.stopDrag;

					felder = Quiz.getElementsByClassName(Quiz.feldClass, pool);
					for (i = 0; i < felder.length; i++) {
						felder[i].className += " " + Quiz.draggableClass;
						felder[i].style.cursor = "move";
					}
				}

				// falls Eingabefelder vorhanden -> einbinden
				if (this.inputs.length > 0) {
					for (input in this.inputs) {
						if (typeof this.inputs[input] != "function") {
							this.inputs[input].original.parentNode.insertBefore(this.inputs[input].element, this.inputs[input].original);
							this.inputs[input].original.parentNode.removeChild(this.inputs[input].original);
						}
					}
				}

				// ID für das umgebende DIV-Element vergeben
				this.element.id = this.name;

				// Auswertungs-Button erzeugen
				test = document.createElement("span");
				test.className = "auswertungs-button";
				test.innerHTML = '<a href="javascript:Quiz.alleQuizze.'
					+ this.name
					+ '.auswerten()">'
					+ Quiz.meldungen[this.sprache].pruefen
					+ '</a>';
				this.auswertungsButton = test;
			}
		};

		// Laufende Nummer ermitteln -> Quiz-Name wird "quiz" + laufende Nummer
		i = 0;
		for (test in Quiz.alleQuizze)
			i++;
		quiz.name = "quiz" + i;

		// Gibt es Quiz-Daten?
		daten = {
			bolds : div.getElementsByTagName("b"),
			italics : div.getElementsByTagName("i"),
			strongs : div.getElementsByTagName("strong"),
			ems : div.getElementsByTagName("em")
		}

		// keine potentiellen Daten gefunden? -> abbrechen!
		if (daten.bolds.length < 1
			&& daten.italics.length < 1
			&& daten.strongs.length < 1
			&& daten.ems.length < 1
		)
			return false;

		// Daten sind also vorhanden? -> Auswerten
		for (i in daten) {
			for (j = 0; j < daten[i].length; j++) {
				test = daten[i][j].innerHTML.replace(/<\/a>/i, "").replace(/<a[^>]*>/i, "");

				if (test.match(/\(/)) {
					// Eingabefeld!
					test = document.createElement("span");
					test.className = quiz.loesungsClass + "_i";
					test.id = quiz.name + "_" + ids;

					// Lösungsinhalt "säubern"
					inhalt = daten[i][j].innerHTML.replace(/[\t\r\n]/g, " ");
					inhalt = inhalt.replace(/^([^(]+).*$/, "$1");
					inhalt = inhalt.replace(/(&nbsp; | &nbsp;)/, " ");
					inhalt = inhalt.replace(/ +/, " ");
					inhalt = inhalt.quizTrim();

					test.innerHTML = '<input type="text" id="' + test.id + 'i"'
						+ ' onkeyup="Quiz.alleQuizze.' + quiz.name + '.dragNDropAuswerten()"'
						+ ' /> '
						+ daten[i][j].innerHTML.replace(/^[^(]*(\(.*) *$/, "$1");
					test.innerHTML = test.innerHTML.replace(/ ?\(\)$/, "");

					quiz.inputs.push({
						element : test,
						original : daten[i][j],
						loesung : inhalt
					});

					ids++; // verwendete ID eintragen, damit keine doppelten IDs entstehen

				} else {
					// Drag&Drop-Feld!
					if (daten[i][j].innerHTML != "") {
						// Feld ist nicht leer
						test = document.createElement("span");
						test.className = Quiz.feldClass;
						test.innerHTML += daten[i][j].innerHTML.replace(/^ *([^ ](.*[^ ])?) *$/, "$1");
						test.id = "";

						// Gibt es bereits Felder mit identischem Inhalt? Deren IDs müssen bis auf die Buchstaben am Ende übereinstimmen!
						for (feld in quiz.felder) {
							if (typeof(quiz.felder[feld].element) != "undefined" && quiz.felder[feld].element.innerHTML == test.innerHTML)
								// ID übernehmen!
								test.id = quiz.felder[feld].element.id;
						}

						if (test.id == "") {
							test.id = quiz.name + "_" + ids + "a";
							ids++;
						} else {
							// übernommene ID eines bereits existierenden Feldes ändern
							test.id = test.id.substr(0, test.id.length - 1) + String.fromCharCode(test.id.charCodeAt(test.id.length - 1));
						}

						quiz.felder.push({
							element : test,
							original : daten[i][j]
						});
					}
				}
			}
		}

		// Keine brauchbare Daten? -> Verwerfen!
		i = 0;
		for (test in quiz.felder)
			i++;
		for (test in quiz.inputs)
			i++;

		if (i < 1)
			return false;

		// Quiz in die Liste aufnehmen und initialisieren
		Quiz.alleQuizze[quiz.name] = quiz;
		quiz.element.quiz = quiz;
		Quiz.alleQuizze[quiz.name].init();

		return true;
	},


	/* Diese Funktion erzeugt ein memo-quiz. Dazu braucht sie eine Tabelle innerhalb eines Elternelementes
	mit dem CSS-Klassen-Präfix "memo", z.B. "memo-quiz", wenn "-quiz" das Suffix der Quiz.triggerClass ist.
	In der Tabelle stehen die Set-Daten: Die Anzahl an Spalten steht für die Anzahl der Felder pro Set, die Anzahl
	der Zeilen ist die Anzahl der Sets. */

	memoQuiz : function (div) {
		var i, j, test, daten, feld, tabelle, gefunden;

		var quiz = {
			// Objekt-Gestalt eines memo-quizzes
			name : "Quiz-x", // Platzhalter - hier steht später etwas anderes.
			typ : "memo-quiz",
			inhaltsClass : "feld-inhalt", // CSS-Klasse für den Inhalt eines Feldes
			aktivClass : "aktiv", // CSS-Klasse für ein aktiviertes Feld
			fertigClass : "fertig", // CSS-Klasse für ein Feld, das aussortiert wurde
			element : div, // Referenz auf das DIV-Element, in welchem sich das Quiz befindet
			angeklickt : null, // Referenz auf das angeklickte Element innerhalb des DIVs
			felder : new Array(), // Hier stehen später Referenzen auf SPAN-Elemente.
			setGroesse : 2, // Anzahl der zu einem Set gehörenden Felder
			versuche : 0, // Speichert die Anzahl Versuche, die für die Lösung gebraucht wurden.
			sprache : (div.lang && div.lang != "") ? div.lang : "de", // deutsche Meldungen als Voreinstellung

			// Funktion zum Aufdecken eines Feldes (kommt über Eventhandler onclick)
			aufdecken : function (e) {
				var test, muster, i, imgs;
				if (!e)
					e = window.event;

				if (e.target)
					this.angeklickt = e.target; // W3C DOM

				if (e.srcElement) {
					this.angeklickt = e.srcElement; // IE
				}

				// Nur bei Klick auf ein Feld (oder eines seiner Nachfahren-Elemente) reagieren!
				var muster = new RegExp("(^|\\s)" + Quiz.feldClass + "(\\s|$)");
				var test = this.angeklickt;

				while (!test.className || !test.className.match(muster)) {
					test = test.parentNode;
					if (test == document.body)
						return false;
				}

				Quiz.aktivesQuiz = Quiz.alleQuizze[test.id.replace(/^([^_]+).+$/, "$1")];
				Quiz.aktivesQuiz.angeklickt = test; // das angeklickte Feld abspeichern

				// Feld wurde angeklickt -> aufdecken?
				test = Quiz.getElementsByClassName(Quiz.aktivesQuiz.aktivClass, Quiz.aktivesQuiz.element);
				if (test.length >= Quiz.aktivesQuiz.setGroesse) {
					// Nein, denn es sind schon alle Felder für ein Set aufgedeckt!
					return false;
				} else {
					// Das aktuelle Set ist noch nicht vollständig aufgedeckt...
					muster = new RegExp("(^|\\s)" + Quiz.aktivesQuiz.aktivClass + "(\\s|$)", "");

					if (!Quiz.aktivesQuiz.angeklickt.className.match(muster))
						// OK, Feld wurde noch nicht aufgedeckt. -> aufdecken
						Quiz.aktivesQuiz.angeklickt.className += " " + Quiz.aktivesQuiz.aktivClass;

						//eventuelle Markierungen aufheben (stört bei Bildern)
						try { window.getSelection().collapse(Quiz.aktivesQuiz.angeklickt, 0); } catch (e) { };
						try { document.selection.clear(); } catch (e) { };

						if (Quiz.getElementsByClassName(Quiz.aktivesQuiz.aktivClass, Quiz.aktivesQuiz.element).length >= Quiz.aktivesQuiz.setGroesse)
							// Alle Felder für ein Feld wurden aufgedeckt! -> auswerten
							window.setTimeout("Quiz.alleQuizze." + Quiz.aktivesQuiz.name + ".auswerten()", 1500);
				}
			},

			// Funktion zum Auswerten eines aufgedeckten Sets
			auswerten : function () {
				var i, ok, test, muster;

				// Anzahl Lösungsversuche um eins erhöhen
				this.versuche++;

				// aufgedeckte Felder ermitteln
				test = Quiz.getElementsByClassName(this.aktivClass, this.element);

				// IDs der Felder vergleichen
				muster = new RegExp(test[0].id.replace(/^([^_]+_\d+).*$/, "$1"), ""); // ID des ersten Feldes ohne letzten Buchstaben
				ok = true; // Wir gehen von einer Übereinstimmung aus...
				for (i = 0; i < test.length; i++)
					if (!test[i].id.match(muster))
						ok = false;

				// IDs haben übereingestimmt?
				muster = new RegExp(" ?" + this.aktivClass, "");
				for (i = 0; i < test.length; i++) {
					if (ok) {
						// Ja. -> aufgedekte Felder "entfernen"
						test[i].className = this.fertigClass;
					} else {
						// Nein! -> Felder wieder umdrehen!
						test[i].className = test[i].className.replace(muster, "");
					}
				}

				// Alle Felder abgeräumt?
				test = Quiz.getElementsByClassName(Quiz.feldClass, this.element);
				if (test.length < 1) {

					// Gratulieren und nachfragen
					var nachfrage = Quiz.meldungen[this.sprache]["lob" + (this.versuche > 2 ? 3 : this.versuche)]
						+ " "
						+ Quiz.meldungen[this.sprache].alleGefunden
						+ "\n"
						+ Quiz.meldungen[this.sprache]["ergebnis" + (this.versuche > 2 ? 3 : this.versuche)].replace(/%n/i, this.versuche)
						+ "\n"
						+ Quiz.meldungen[this.sprache].erneut;

					if (confirm(nachfrage)) {
						test = Quiz.getElementsByClassName(Quiz.poolClass, this.element);
						if (test.length > 0)
							test[0].parentNode.removeChild(test[0]);
						this.init(); // Quiz erneut starten

					} else
						this.solved = true; // Quiz gelöst
				}
			},

			// Funktion zum Mischen und Austeilen der Wörter
			init : function () {
				var pool, i, sets, zufall, test;

				// Spracheinstellungen auf deutsch zurück korrigieren, falls entsprechende Sprachdaten fehlen
				if (!Quiz.meldungen[this.sprache])
					this.sprache = "de";

				/* Jeder Wert aus den Set-Daten wird zu einem SPAN-Element ("Feld") und erhält eine ID.
				Die ID eines solchen Feldes enthält den Namen des Quizes, die laufende Nummer des Sets, dem das Feld entstammt
				und einen "laufenden Buchstaben". Dadurch kann später die Zuordnung ausgewertet werden, da die ID bis auf den
				letzten Buchstaben übereinstimmen muss, wenn die Zuordnung stimmen soll. */

				pool = document.createElement("p"); // Behälter für die beweglichen Teile
				pool.className = Quiz.poolClass;
				this.element.appendChild(pool); // ins Dokument einfügen

				// Felder vermischt in den Pool schreiben
				sets = new Array(); // Hier werden bereits benutzte Felder markiert

				for (i = 0; i < this.felder.length; i++) {
					test = true;
					while (test) {
						zufall = Math.floor(Math.random() * this.felder.length);
						test = sets[zufall];
					}

					pool.appendChild(this.felder[zufall].cloneNode(true));
					sets[zufall] = true; // Feld als benutzt markieren
				}

				// Elternelement vorbereiten
				this.element.onclick = Quiz.alleQuizze[this.name].aufdecken; // Eventhandler vergeben
				this.element.id = this.name; // ID vergeben
				this.versuche = 0; // Anzahl Versuche zurücksetzen
			}
		}


		// Laufende Nummer ermitteln -> Quiz-Name wird "quiz" + laufende Nummer
		i = 0;
		for (test in Quiz.alleQuizze)
			i++;
		quiz.name = "quiz" + i;

		// Gibt es Quiz-Daten?
		tabelle = div.getElementsByTagName("table");

		if (tabelle.length < 1)
			// Keine Tabelle für Quiz-Daten gefunden! -> abbrechen
			return false;

		// Daten sind also vorhanden? -> Auswerten
		test = tabelle[0].getElementsByTagName("tr"); // Tabellenzeilen nach Daten durchforsten
		for (i = 0; i < test.length; i++) {
			daten = test[i].getElementsByTagName("td");
			if (daten.length > 1) {
				quiz.setGroesse = daten.length;
				for (j = 0; j < daten.length; j++) {
					feld = document.createElement("span");
					feld.className = Quiz.feldClass;
					feld.innerHTML = '<span class="' + quiz.inhaltsClass + '">' + daten[j].innerHTML + "</span>";
					feld.id = quiz.name + "_" + i + String.fromCharCode(j + 97);

					// Feld abspeichern
					quiz.felder.push(feld);
				}
			}
		}

		// Keine brauchbare Daten? -> Verwerfen!
		i = 0;
		for (test in quiz.felder)
			i++;

		if (i < 1)
			return false;

		// Quiz in die Liste aufnehmen und initialisieren
		Quiz.alleQuizze[quiz.name] = quiz;
		tabelle[0].parentNode.removeChild(tabelle[0]);
		quiz.element.quiz = quiz;
		Quiz.alleQuizze[quiz.name].init();

		return true;
	},


	/* Diese Funktion erzeugt ein Multiple Choice - Quiz. Dazu braucht sie Textabsätze innerhalb eines Elternelementes
	mit dem CSS-Klassen-Präfix "multiplechoice", z.B. "multiplechoice-quiz", wenn "-quiz" das Suffix der Quiz.triggerClass ist.
	In den Textabsätzen stehen die jeweiligen Quiz-Fragen, die Antworten stehen am Ende der Absätze in runden Klammern. Falsche
	Antworten haben innerhalb der Klammer gleich als erstes Zeichen ein Ausrufezeichen, richtige Antworten nicht.
	Textabsätze ohne Klammernpaar am Ende werden nicht als Quiz-Fragen interpretiert. */

	multiplechoiceQuiz : function (div) {
		var i, test, daten, fragen;

		var quiz = {
			// Objekt-Gestalt eines Multiple Choice - Quizzes
			name : "Quiz-x", // Platzhalter - hier steht später etwas anderes.
			typ : "Multiple Choice - Quiz",
			loesungsClass : "quiz-antworten", // CSS-Klasse für das Elternelement mit den Antworten
			element : div, // Referenz auf das DIV-Element, in welchem sich das Quiz befindet
			fragen : new Array(), // Hier stehen später die Fragen zusammen mit ihren Antworten
			sprache : (div.lang && div.lang != "") ? div.lang : "de", // deutsche Meldungen als Voreinstellung

			// Funktion zum Auswerten eines aufgedeckten Sets
			auswerten : function () {
				var i, j, anzahl, test, liPunkt, antworten, richtigkeit, ok;

				// Antwort-Blöcke ermitteln
				antworten = Quiz.getElementsByClassName(this.loesungsClass, this.element);
				richtigkeit = 0; // Anzahl der gezählten Treffer
				anzahl = 0; // Anzahl der möglichen richtigen Antworten

				for (i = 0; i < antworten.length; i++) {
					// Jeden Antwortblock einzeln durchgehen
					test = antworten[i].getElementsByTagName("input");
					ok = 0; // Anzahl Treffer abzüglich falscher Treffer

					for (j = 0; j < test.length; j++) {
						// <li>-Element ermitteln, um es später einzufärben
						liPunkt = test[j].parentNode;
						while (!liPunkt.tagName || liPunkt.tagName.toLowerCase() != "li")
							liPunkt = liPunkt.parentNode;

						// Checkbox unveränderlich machen
						test[j].disabled = "disabled";

						if (test[j].id.match(/_f$/)) {
							// Aha, eine Falschantwort...
							if (test[j].checked) {
								// ... wurde fälschlicherweise angewählt!
								liPunkt.className = "falsch";
								ok--;
							}

						} else {
							// Aha, eine richtige Antwort...
							liPunkt.className = "richtig";
							anzahl++; // Anzahl der möglichen richtigen Antworten erhöhen

							if (test[j].checked) {
								// ...wurde korrekt angewählt
								ok++;
							}
						}
					}

					if (ok < 0)
						ok = 0;

					richtigkeit += ok; // richtige Treffer merken
				}

				richtigkeit = (anzahl > 0) ?
					richtigkeit = Math.floor(richtigkeit / anzahl * 1000) / 10
					: 0;

				// Auswertung ins Dokument schreiben
				test = document.createElement("p");
				test.className = Quiz.bewertungsClass;
				test.innerHTML = Quiz.meldungen[this.sprache].ergebnisProzent.replace(/%n/i, richtigkeit);
				this.element.appendChild(test);
				this.solved = true;

				// Auswertungs-Button entfernen
				test = Quiz.getElementsByClassName("auswertungs-button", this.element);
				if (test.length > 0)
					this.element.removeChild(test[0]);
			},

			// Funktion zum Anzeigen der Fragen und der vermischten möglichen Antworten
			init : function () {
				var frage, antworten, i, j, zufall, html, ID, benutzt;

				// Spracheinstellungen auf deutsch zurück korrigieren, falls entsprechende Sprachdaten fehlen
				if (!Quiz.meldungen[this.sprache])
					this.sprache = "de";

				/* Jede Antwort wird zu einem Listen-Element innerhalb einer geordneten Liste. Die Liste erhält
				die CSS-Klasse quiz.loesungsClass.
				Die Listenelemente erhalten eine ID, die sich nur am letzten Buchstaben unterscheidet. Die ID einer
				Falschantwort erhält zusätzlich ein "_f". */

				for (i = 0; i < this.fragen.length; i++) {
					// Frage in das Dokument schreiben
					frage = document.createElement("p");
					frage.innerHTML = this.fragen[i].frage;
					this.element.insertBefore(frage, this.fragen[i].original);

					// Antworten zusammenstellen und vermischt ausgeben
					antworten = document.createElement("ol");
					antworten.className = this.loesungsClass;
					html = "";
					benutzt = new Array(); // Hier werden bereits benutzte Fragen markiert.

					for (j = 0; j < this.fragen[i].antworten.length; j++) {
						test = true;
						while (test) {
							zufall = Math.floor(Math.random() * this.fragen[i].antworten.length);
							test = benutzt[zufall];
						}

						ID = this.name + "_" + i + String.fromCharCode(j + 97);
						if (this.fragen[i].antworten[zufall].match(/^\!/))
							ID += "_f"; // Falschantwort markieren

						html += '<li><input type="checkbox" id="' + ID + '">'
						+ '<label for="' + ID + '"> '
						+ this.fragen[i].antworten[zufall].replace(/^\!/, "")
						+ "</label></li>";
						benutzt[zufall] = true;
					}

					html += "</ol>";
					antworten.innerHTML += html;
					this.element.insertBefore(frage, this.fragen[i].original);
					this.element.insertBefore(antworten, this.fragen[i].original);
					this.element.removeChild(this.fragen[i].original);
				}

				// Auswertungsbutton anzeigen
				test = document.createElement("p");
				test.className = "auswertungs-button";
				test.innerHTML = '<a href="javascript:Quiz.alleQuizze.'
					+ this.name
					+ '.auswerten()">'
					+ Quiz.meldungen[this.sprache].pruefen
					+ '</a>';

				this.element.appendChild(test);

				// ID für das umgebende DIV-Element vergeben
				this.element.id = this.name;
			}
		}


		// Laufende Nummer ermitteln -> Quiz-Name wird "quiz" + laufende Nummer
		i = 0;
		for (test in Quiz.alleQuizze)
			i++;
		quiz.name = "quiz" + i;

		// Gibt es Quiz-Daten?
		fragen = div.getElementsByTagName("p");

		if (fragen.length < 1)
			// Keine Textabsätze für Quiz-Daten gefunden! -> abbrechen
			return false;

		// Daten sind also vorhanden? -> Auswerten
		for (i = 0; i < fragen.length; i++) {
			// Textabsatz durchforsten
			daten = {
				frage : "",
				antworten : new Array(),
				original : null // Referenz auf den originalen Textabsatz, um ihn später zu entfernen
			};

			test = fragen[i].innerHTML.replace(/[\t\r\n]/g, " ");

			// Zeilenumbrüche und überflüssige Leerzeichen entfernen
			test = test.replace(/(<br>|<br\/>|<br \/>|&bnsp;| )*$/ig, "");

			while (test.match(/\)$/)) {
				daten.antworten.push(test.replace(/^.*\(([^\(\)]*)\)$/, "$1"));

				// extrahierte Antwort aus dem String entfernen
				test = test.replace(/^(.*)\([^\(\)]*\)$/, "$1");
				test = test.quizTrim();
			}

			// Passende Fragen im aktuellen Textabsatz gefunden?
			if (daten.antworten.length > 0) {
				// Ja! Frage mit dazu ...
				daten.frage = test;
				daten.original = fragen[i]; // Referenz zum ursprünglichen Textabsatz

				// ... und Daten ins Quiz übertragen
				quiz.fragen.push(daten);
			}
		}

		// Keine brauchbare Daten? -> Verwerfen!
		i = 0;
		for (test in quiz.fragen)
			i++;

		if (i < 1)
			return false;

		// Quiz in die Liste aufnehmen und initialisieren
		Quiz.alleQuizze[quiz.name] = quiz;
		quiz.element.quiz = quiz;
		Quiz.alleQuizze[quiz.name].init();

		return true;
	},


	/* Diese Funktion erzeugt ein Schüttel-Quiz. Dazu braucht sie ein Elternelement mit dem
	CSS-Klassen-Präfix "schuettel", z.B. "schuettel-quiz", wenn "-quiz" das Suffix der Quiz.triggerClass ist.
	Die mit <strong>, <em>, <b> oder <i> ausgezeichneten Textstellen werden durch Drag&Drop-Felder ersetzt. Sollten
	Lösungshinweise in Klammern stehen, so werden die Textstellen durch Eingabefelder ersetzt. */

	schuettelQuiz : function (div) {
		var i, j, test, inhalt, daten;

		var quiz = {
			// Objekt-Gestalt eines Schüttel-Quizzes
			name : "Quiz-x", // Platzhalter - hier steht später etwas anderes.
			typ : "Schüttel-Quiz",
			loesungsClass : "luecke",
			element : div, // Referenz auf das DIV-Element, in welchem sich das Quiz befindet
			felder : new Array(), // Hier stehen später Referenzen auf die Text-Eingabefelder und ihre Lösungen
			auswertungsButton : null, // Hier steht später das HTML-Element des Auswertungs-Buttons.
			versuche : 0, // Speichert die Anzahl Versuche, die für die Lösung gebraucht wurden.
			sprache : (div.lang && div.lang != "") ? div.lang : "de", // deutsche Meldungen als Voreinstellung

			// Funktion zum Auswerten der Lösungen
			auswerten : function (klick) {
				var felder, loesungen, nummer, eingabe, test, i, ok;

				if (klick) {
					// Auswertungs-Button wurde geklickt! Auswerten!
					felder = Quiz.getElementsByClassName(this.loesungsClass, this.element);
					ok = true; // Mal davon ausgehen, dass alles richtig ist...

					// Anzahl Lösungsversuche um eins erhöhen
					this.versuche++;

					for (i = 0; i < felder.length; i++) {
						eingabe = felder[i].getElementsByTagName("input");
						if (eingabe.length > 0) {
							eingabe = eingabe[0];
							nummer = eingabe.id.replace(/^.*_(\d+)$/, "$1");

							if (eingabe.value.toLowerCase() == this.felder[nummer].loesung.toLowerCase()) {
								// Eingabefeld wurde richtig ausgefüllt!
								felder[i].innerHTML = this.felder[nummer].loesung;
							} else {
								// Eingabefeld wurde falsch ausgefüllt! -> leeren
								eingabe.value = "";
								ok = false;
							}
						}
					}

					if (ok) {
						// Quiz wurde korrekt gelöst! -> Erfolgsmeldung ausgeben
						eingabe = document.createElement("p");
						eingabe.className = Quiz.bewertungsClass;
						eingabe.innerHTML = Quiz.meldungen[this.sprache]["lob" + (this.versuche > 2 ? 3 : this.versuche)]
							+ " "
							+ Quiz.meldungen[this.sprache]["ergebnis" + (this.versuche > 2 ? 3 : this.versuche)].replace(/%n/i, this.versuche);
						this.element.appendChild(eingabe);
						this.solved = true;
					}
				}

				// Auswertungsbutton entfernen, falls vorhanden
				if (this.auswertungsButton.parentNode)
					this.auswertungsButton.parentNode.removeChild(this.auswertungsButton);

				// Eingabefelder überprüfen
				loesungen = this.element.getElementsByTagName("input");
				ok = loesungen.length > 0; // Mal davon ausgehen, dass alle ausgefüllt sind... wenn es welche gibt!

				for (i = 0; i < loesungen.length; i++) {
					if (loesungen[i].value == "")
						ok = false; // Feld war leer!
				}

				// Sind alle Eingabefelder ausgefüllt?
				if (ok) {
					// Ja. -> Button ins Dokument schreiben
					this.element.appendChild(this.auswertungsButton);
				}
			},

			// Funktion zum Umwandeln der Wörter zu Engabefeldern
			init : function () {
				var benutzte, zufall, luecke, loesung, test, i, j;

				// Spracheinstellungen auf deutsch zurück korrigieren, falls entsprechende Sprachdaten fehlen
				if (!Quiz.meldungen[this.sprache])
					this.sprache = "de";

				/* Jeder markierte Textabschnitt (zum Markieren dienen die Elemente <i>, <b>, <em> und <strong>) wird durch ein
				SPAN-Element, in welchem sich ein Input-Element mit einer Lösucngsvorgabe in Klammern befindet, ersetzt.
				Es erhält die CSS_Klasse, die in quiz.loesungsClass definiert wurde.

				Beispiel: <p>Eine <i>Henne</i> legt ein.</p>
				wird zu
				<p>Eine <span class="luecke"><input id="......" /> (eeHnn)</span> legt ein Ei.</p>

				Die ID eines solchen Input-Elements korrespondiert mit der laufenden Nummer des Daten-Eintrages in
				"quiz.felder". */

				for (i = 0; i < this.felder.length; i++) {
					// Lücke mit Eingabe-Element vorbereiten
					luecke = document.createElement("span");
					luecke.className = this.loesungsClass;

					// Lösung verschlüsseln
					loesung = "";
					benutzte = new Array();

					for (j = 0; j < this.felder[i].loesung.length; j++) {
						test = true;
						while (test) {
							zufall = Math.floor(Math.random() * this.felder[i].loesung.length);
							test = benutzte[zufall];
						}

						loesung += this.felder[i].loesung.substr(zufall, 1);
						benutzte[zufall] = true; // Zeichen wurde benutzt
					}

					// Lücke fertigstellen und abspeichern
					luecke.innerHTML = '<input id="' + this.name + "_" + i + '"'
						+ ' onkeyup="Quiz.alleQuizze.' + this.name + '.auswerten()"'
						+ ' />'
						+ "&nbsp;(" + loesung.toLowerCase() + ")";
					this.felder[i].element = luecke;
				}

				// Alle im Dokument markierten Wörter in Eingabefelder umwandeln
				for (i = 0; i < this.felder.length; i++) {
					this.felder[i].original.parentNode.insertBefore(this.felder[i].element, this.felder[i].original);
					this.felder[i].original.parentNode.removeChild(this.felder[i].original);
				}

				// ID für das umgebende DIV-Element vergeben
				this.element.id = this.name;

				// Auswertungs-Button erzeugen
				test = document.createElement("p");
				test.className = "auswertungs-button";
				test.innerHTML = '<a href="javascript:Quiz.alleQuizze.'
					+ this.name
					+ '.auswerten(this)">'
					+ Quiz.meldungen[this.sprache].pruefen
					+ '</a>';
				this.auswertungsButton = test;
			}
		};

		// Laufende Nummer ermitteln -> Quiz-Name wird "quiz" + laufende Nummer
		i = 0;
		for (test in Quiz.alleQuizze)
			i++;
		quiz.name = "quiz" + i;

		// Gibt es Quiz-Daten?
		daten = {
			bolds : div.getElementsByTagName("b"),
			italics : div.getElementsByTagName("i"),
			strongs : div.getElementsByTagName("strong"),
			ems : div.getElementsByTagName("em")
		}

		// keine potentiellen Daten gefunden? -> abbrechen!
		if (daten.bolds.length < 1
			&& daten.italics.length < 1
			&& daten.strongs.length < 1
			&& daten.ems.length < 1
		)
			return false;

		// Daten sind also vorhanden? -> Auswerten
		for (i in daten) {
			for (j = 0; j < daten[i].length; j++) {
				// Lösungsinhalt "säubern"
				inhalt = daten[i][j].innerHTML.replace(/[\t\r\n]/g, " ");
				inhalt = inhalt.replace(/^<\/?[^>]+>$/, "");
				inhalt = inhalt.replace(/(nbsp; | &nbsp;)/, " ");
				inhalt = inhalt.replace(/ +/, " ");
				inhalt = inhalt.quizTrim();

				quiz.felder.push({
					element : null,
					original : daten[i][j],
					loesung : inhalt
				});
			}
		}

		// Keine brauchbare Daten? -> Verwerfen!
		i = 0;
		for (test in quiz.felder)
			i++;

		if (i < 1)
			return false;

		// Quiz in die Liste aufnehmen und initialisieren
		Quiz.alleQuizze[quiz.name] = quiz;
		quiz.element.quiz = quiz;
		Quiz.alleQuizze[quiz.name].init();

		return true;
	},


	/* Diese Funktion erzeugt ein Kreuzwort-Quiz. Dazu braucht sie ein Elternelement mit dem
	CSS-Klassen-Präfix "kreuzwort", z.B. "kreuzwort-quiz", wenn "-quiz" das Suffix der Quiz.triggerClass ist.
	Die Daten für das Quiz müssen in einer zweispaltigen Tabelle stehen:
	1. Zelle enthält das Lösungswort,
	2. Zelle enthält eine Lösungshilfe
	*/

	kreuzwortQuiz : function (div) {
		var i, tabelle, test, daten, gefunden;

		var quiz = {
			// Objekt-Gestalt eines Kreuzwort-Quizzes
			name : "Quiz-x", // Platzhalter - hier steht später etwas anderes.
			typ : "Kreuzwort-Quiz",
			loesungsClass : "feld",
			loesungsClass2 : "eingabe-feld",
			element : div, // Referenz auf das DIV-Element, in welchem sich das Quiz befindet
			eingabe : document.createElement("div"), // Eingabebereich
			tabelle : div, // Referenz auf das HTML-Element, in dem das Kreuzworträtsel angezeigt wird
			daten : new Array(), // Hier stehen später Objekte, die die Quiz-Daten enthalten.
			auswertungsButton : null, // Hier steht später das HTML-Element des Auswertungs-Buttons.
			versuche : 0, // Speichert die Anzahl Versuche, die für die Lösung gebraucht wurden.
			sprache : (div.lang && div.lang != "") ? div.lang : "de", // deutsche Meldungen als Voreinstellung

			// Funktion zum Auswerten der Lösungen
			auswerten : function (werte) {
				/* "werte" hat folgende Struktur: {
					wort: <String>,
					quizItem: {
						wort: <String>,
						x: <Number>,
						y: <Number>,
						hilfe: <String>,
						richtung: "waagrecht|senkrecht",
						name: <String>
					},
					form: <HTMLFormObject>
				} */
				var i, p, button, zelle, alleZellen, forms, test = true;

				if (werte.wort && werte.quizItem) {
					// Es wurde ein Button geklickt... Eintragen!
					p = {
						wort : werte.quizItem.wort,
						x : werte.quizItem.x,
						y : werte.quizItem.y,
						richtung : werte.quizItem.richtung
					};

					alleZellen = this.findeZellen(p)
					for (i = 0; i < alleZellen.length; i ++) {
						if (werte.wort.length > i) {
							// Buchstabe in die Zelle eintragen
							zelle = Quiz.getElementsByClassName(this.loesungsClass2, alleZellen[i]); // span-Element für Buchstaben finden
							if (zelle.length > 0) {
								zelle[0].firstChild.nodeValue = werte.wort.substr(i, 1).replace(/ /, String.fromCharCode(160));
							}
						}
					}

					// Eingabeformular(e) entfernen/aktualisieren
					werte.form.parentNode.removeChild(werte.form);

					if (this.eingabe.getElementsByTagName("form").length > 0) {
						// weitere Eingabe(n) möglich -> Formular(e) neu aufbauen
						forms = this.eingabe.getElementsByTagName("form");
						p = new Array();
						for (i = 0; i < forms.length; i++) {
							p.push({
								wort : forms[i].quizDaten.wort,
								x : forms[i].quizDaten.x,
								y : forms[i].quizDaten.y,
								hilfe : forms[i].quizDaten.hilfe,
								richtung : forms[i].quizDaten.richtung
							});
						}

						// Formulare neu erstellen lassen
						return this.eintragen(p);

					} else {
						// keine weiteren Eingaben mehr zu tätigen -> weg damit oder Auswertungsbutton anzeigen?
						alleZellen = Quiz.getElementsByClassName(this.loesungsClass2, this.tabelle);

						for (i = 0; i < alleZellen.length; i++) {
							if (!alleZellen[i].lastChild.nodeValue || alleZellen[i].lastChild.nodeValue == "" || alleZellen[i].lastChild.nodeValue == String.fromCharCode(160))
								test = false;
						}

						if (test) {
							// Alles ausgefüllt! -> Auswertungs-Button anzeigen!
							alleZellen = this.eingabe.getElementsByTagName("p");
							for (i = 0; i < alleZellen.length; i++)
								alleZellen[i].style.display = "none";

							this.eingabe.insertBefore(this.auswertungsButton, this.eingabe.lastChild);

						} else {
							// weg damit!
							this.eingabe.style.display = "none";
						}
					}

					return false;
				}

				// Auswertungsbutton geklickt?
				if (werte == "auswertungs-button") {
					// Auswerten!
					this.versuche++;
					test = true;
					alleZellen = Quiz.getElementsByClassName(this.loesungsClass2, this.tabelle);

					for (i = 0; i < alleZellen.length; i++) {
						if (alleZellen[i].firstChild.nodeValue != alleZellen[i].parentNode.id.replace(/^.*(\w)$/, "$1").replace(/_/g, " ")) {
							// Falsche Eingabe! -> Löschen
							alleZellen[i].firstChild.nodeValue = String.fromCharCode(160);
							test = false;
						}
					}

					if (test) {
						// Alles richtig!
						p = document.createElement("p");
						p.className = Quiz.bewertungsClass;
						p.appendChild(document.createTextNode(
							Quiz.meldungen[this.sprache]["lob" + (this.versuche > 2 ? 3 : this.versuche)]
							+ " "
							+ Quiz.meldungen[this.sprache]["ergebnis" + (this.versuche > 2 ? 3 : this.versuche)].replace(/%n/i, this.versuche)
						));
						this.eingabe.parentNode.insertBefore(p, this.eingabe);

						// Auswertungs-Button und alle Eventhandler entfernen
						this.eingabe.parentNode.removeChild(this.eingabe);
						this.element.onmousedown = null;
						this.element.onmouseup = null;
						this.solved = true;

					} else {
						// zurück zum Ausfüllen
						alleZellen = this.eingabe.getElementsByTagName("p");
						for (i = 0; i < alleZellen.length; i++) {
							alleZellen[i].style.display = "";
						}

						this.eingabe.style.display = "none";
					}
				}

				return false;
			},

			// Funktion zum Eintragen von Kreuzwort-Wörtern
			eintragen : function (werte) {
				/* "werte" hat folgende Struktur: Array[
					{
						wort: <String>,
						x: <Number>,
						y: <Number>,
						hilfe: <String>,
						richtung: "waagrecht|senkrecht"
					}  // eventuell ein weiteres Objekt:
					,{
						wort: <String>,
						x: <Number>,
						y: <Number>,
						hilfe: <String>,
						richtung: "waagrecht|senkrecht"
					} 
				] */
				var i, p, w, test, text, eingabefeld, zellen;

				// Auswertungsbutton entfernen falls vorhanden
				if (this.auswertungsButton.parentNode == this.eingabe)
					this.eingabe.removeChild(this.auswertungsButton);

				while (this.eingabe.getElementsByTagName("form").length > 0)
					this.eingabe.removeChild(this.eingabe.getElementsByTagName("form")[0]);

				// Formular erstellen - für jeden Suchbegriff eines
				for (i = 0; i < werte.length; i++) {
					eingabefeld = document.createElement("form");
					eingabefeld.quizDaten = werte[i];
					eingabefeld.quizDaten.name = this.name;
					this.eingabe.appendChild(eingabefeld);

					// Textabsatz mit Lösungshinweis erstellen
					p = document.createElement("p");
					// Nummer in einem extra <span>-Element
					text = document.createElement("span");
					text.className = "nummer";
					text.appendChild(document.createTextNode(werte[i].hilfe.replace(/^(\d+).*$/, "$1")));
					p.appendChild(text);

					// Die Richtung (mehrsprachig!) auch in einem extra <span>-Element
					text = document.createElement("span");
					text.className = "richtung";
					text.appendChild(
						document.createTextNode(
							Quiz.meldungen[
								Quiz.alleQuizze[werte[i].name].sprache
							][werte[i].richtung]
							+ ":"
						)
					);
					p.appendChild(text);
					// die eigentliche Lösungshilfe
					text = document.createTextNode(werte[i].hilfe.replace(/^\d+ */, ""));
					p.appendChild(text);
					eingabefeld.appendChild(p);

					// korrespondierende Zellen ermitteln, um bereits Eingetragenes mit anzubieten
					zellen = this.findeZellen({
						wort : werte[i].wort,
						x : werte[i].x,
						y : werte[i].y,
						richtung : werte[i].richtung
					});

					// Textabsatz als Eingabezeile erstellen, in welchem die Eingaben in <span>-Elementen stehen
					p = document.createElement("p");
					p.className = "eingabezeile";
					eingabefeld.appendChild(p);

					// <span>-Elemente erstellen
					for (w = 0; w < werte[i].wort.length; w++) {
						// bereits vorhandenen Zelleninhalt vorbereiten
						test = zellen[w].innerHTML.replace(/<\/?[^>]+>/g, "");
						test = test.replace(/<\/?[^>]+>/g, ""); // HTML-Tags entfernen
						test = test.replace(/&nbsp;/g, " "); // Leerzeichen
						test = test.replace(/.*(.)$/, "$1").quizTrim(); // nur letztes Zeichen nehmen (es könnte ja auch eine Eingabeziffer darin stehen

						// Zelleninhalt voreintragen
						text = document.createElement("span");
						text.appendChild(document.createTextNode(test.length > 0 ? test : String.fromCharCode(160)));
						p.appendChild(text);

						// Jedes Span-Element wird anklickbar und muss dem versteckten Textinput den Focus geben.
						text.onmouseup = function () {
							var spans = this.parentNode.getElementsByTagName("span"),
								i;
							for (i = 0; i < spans.length; i++) {
								spans[i].className = "";
							}
							this.className = "aktiv";
							Quiz.getElementsByClassName("texteingabefeld", this.parentNode)[0].focus();
						};
					}

					// Submit-Button braucht keinen Eventhandler, da das Formular onclick geprüft wird.
					w = document.createElement("input");
					w.type = "submit";
					w.value = Quiz.meldungen[this.sprache].eintragen;
					p.appendChild(w);

					// Das versteckte Textinputfeld, das nach jedem Tastendruck ausgelesen wird.
					w = document.createElement("input");
					w.type = "text";
					w.className = "texteingabefeld";
					p.appendChild(w);

					// Eventhandler für jeden Tastenanschlag
					w.onkeyup = function (e) {
						return Quiz.alleQuizze[this.parentNode.parentNode.quizDaten.name].tasteAuswerten(
							{
								obj: this,
								e: e
							}
						);
					};

					// Eventhandler für das Verlieren des Focus
					w.onblur = function () {
						var i, spans;
						spans = this.parentNode.getElementsByTagName("span");
						for (i = 0; i < spans.length; i++) {
							spans[i].className = "";
						}
					};

					eingabefeld.onsubmit = function () {
						var werte = {
								wort : "",
								quizItem : this.quizDaten,
								form: this
							},
							i, spans;

						spans = Quiz.getElementsByClassName("eingabezeile", this)[0].getElementsByTagName("span");
						for (i = 0; i < spans.length; i++) {
							werte.wort += spans[i].innerHTML.replace(/&nbsp;/g, " ").quizTrim();
						}

						return Quiz.alleQuizze[this.quizDaten.name].auswerten(werte);
					};

					// Erstes Eingabefeld aktiv setzen und den Fokus auf das versteckte Eingabefeld legen:
					window.setTimeout(""
						+ "Quiz.alleQuizze." + this.name + ".eingabefeldAktivieren({"
						+ "eingabezeile: Quiz.getElementsByClassName('eingabezeile', Quiz.alleQuizze." + this.name + ".eingabe)[0],"
						+ "feldnummer: 0" // null für erstes Feld
						+ "});", 300);
				}

				this.eingabe.style.display = "block";

				return false;
			},

			// Eingabefeld aktivieren
			eingabefeldAktivieren : function (werte) {
				/* "werte " hat folgende Struktur:  {
					eingabezeile: <HTMLParagraphElement>,
					feldnummer: <Number> (Wert beginnend bei 0!)
				} */
				var spans = werte.eingabezeile.getElementsByTagName("span"),
					i;

				for (i = 0; i < spans.length; i++) {
					spans[i].className = "";
				}

				if (werte.feldnummer < spans.length) {
					spans[werte.feldnummer].className = "aktiv";
				}

				Quiz.getElementsByClassName("texteingabefeld", werte.eingabezeile)[0].focus();
			},

			tasteAuswerten : function (werte) {
				// "werte" hat folgende Struktur; { obj: <input>-Element, e: event}
				var spans = werte.obj.parentNode.getElementsByTagName("span"),
					gefunden = false,
					i, j, z;

				if (!werte.e) {
					werte.e = window.event;
				}

				// aktuelles aktives Eingabefeld ermitteln
				for (i = 0; i < spans.length; i++) {
					if (spans[i].className == "aktiv")
						gefunden = i;
				}


				switch (werte.e.keyCode) {
					case 35: // End (Ende)
						// letztes Feld!
						this.eingabefeldAktivieren({
							eingabezeile: werte.obj.parentNode,
							feldnummer: spans.length -1
						});
					break;
					case 36: // Home (Pos1)
						// erstes Feld!
						this.eingabefeldAktivieren({
							eingabezeile: werte.obj.parentNode,
							feldnummer: 0
						});
					break;
					case 37: // Cursor left
					case 8: // Backspace
						// ein Feld zurück!
						if (gefunden !== false) {
							gefunden = gefunden > 0 ? gefunden -1 : 0;
						} else {
							// letztes Feld anwählen, da gerade keines aktiv war
							gefunden = spans.length -1;
							// eventuell eingegebene Zeichen im <input>-Element entfernen, da diese sonst jetzt automatisch eingetragen werden!
							werte.obj.value = "";
						}

						// bei Backspace Feld leeren!
						if (werte.e.keyCode == 8)
							spans[gefunden].innerHTML = String.fromCharCode(160);

						this.eingabefeldAktivieren({
							eingabezeile: werte.obj.parentNode,
							feldnummer: gefunden
						});
					break;
					case 39: // Cursor right
						// ein Feld vor!
						if (gefunden !== false) {
							gefunden = gefunden < spans.length -2 ? gefunden +1 : spans.length -1;

							this.eingabefeldAktivieren({
								eingabezeile: werte.obj.parentNode,
								feldnummer: gefunden
							});
						}
					break;
				}

				if (werte.obj.value.length > 0) {
					z = Quiz.wandleZeichen(werte.obj.value.substr(0, 1));
					werte.obj.value = ""; // bisherige Eingaben wieder löschen, da immer nur erster Buchstabe genommen wird

					if (z.length > 0) {
						j = false;
						for (i = 0; i < spans.length; i++) {
							if (spans[i].className && spans[i].className == "aktiv") {
								j = i;
							}
						}

						// eventuell sollen mehrere Zeichen eingetragen werden (z.B. bei Ligaturen oder Umlauten)
						for (i = 0; i < z.length; i++) {
							if (spans[j + i]) {
								spans[j + i].innerHTML = z.substr(i, 1);
							}
						}

						this.eingabefeldAktivieren({
							eingabezeile : spans[0].parentNode,
							feldnummer : j + i
						});
					}
				}
			},

			// Funktion zum Ermitteln aller HTML-Elemente (td), in die ein Lösungswort geschrieben werden muss
			findeZellen : function (werte) {
				/* "werte" hat folgende Struktur: {
					wort: <String>,
					x: <Number>,
					y: <Number>,
					richtung: "waagrecht|senkrecht"
				} */
				var zellen = new Array(),
					zelle, x, y, i;

				for (i = 0; i < werte.wort.length; i++) {
					zelle = werte.richtung == "waagrecht" ?
						this.tabelle.getElementsByTagName("tr")[werte.y] :
						this.tabelle.getElementsByTagName("tr")[werte.y + i];
					if (zelle)
						zelle = werte.richtung == "waagrecht" ?
							zelle.getElementsByTagName("td")[werte.x + i] :
							zelle.getElementsByTagName("td")[werte.x];
					if (zelle) {
						zellen.push(zelle);
					}
				}

				return zellen;
			},

			// Funktion zum Errichten der Tabelle des Kreuzwort-Quiz und zum Einrichten der Eventhandler
			init : function () {
				var kreuzwortGitter, test, i, wort, a, eingepasst, x, y, nummer, p, button;

				// Spracheinstellungen auf deutsch zurück korrigieren, falls entsprechende Sprachdaten fehlen
				if (!Quiz.meldungen[this.sprache])
					this.sprache = "de";

				// Wörtergitter erzeugen, sodass nach Möglichkeit keine alleinstehenden Wörter im Gitter enthalten sind
				kreuzwortGitter = Quiz.erstelleWoerterGitter(this.daten, true, false); // true für "alle verbunden", false für "keine diagonalen Wörter"

				// Daten und Gitter abspeichern
				this.daten = kreuzwortGitter.woerter;
				this.grid = kreuzwortGitter.gitter;

				// Tabelle befüllen
				for (y = 0; y < this.grid.length; y++) {
					test = this.tabelle.insertRow(
						this.tabelle.getElementsByTagName("tr").length <= 0 ?
							0 :
							this.tabelle.getElementsByTagName("tr").length
					);

					for (x = 0; x < this.grid[0].length; x++) {
						i = document.createElement("td");
						i.id = this.name + "_" + x + "_" + y;

						if (this.grid[y][x]) {
							i.id += "_" + this.grid[y][x];
							i.className = this.loesungsClass;
						}

						// Zelleninhalt vorbereiten
						a = document.createTextNode(String.fromCharCode(160));
						if (this.grid[y][x]) {
							a = document.createElement("span");
							a.className = this.loesungsClass2;
							a.appendChild(document.createTextNode(String.fromCharCode(160)))
						}

						i.appendChild(a);

						// Zelle in Zeile einhängen
						test.appendChild(i);
					}
				}

				// Einfügemarken und Eventhandler einrichten
				a = 1;
				for (i = 0; i < this.daten.length; i++) {
					x = this.daten[i].x;
					y = this.daten[i].y;
					nummer = a; // Nummer der aktuellen Einfügemarke merken
					test = this.tabelle.getElementsByTagName("tr")[y];

					if (test) {
						test = test.getElementsByTagName("td")[x];

						if (test) {
							// bereits eine Einfügemarke vorhanden?
							test.style.cursor = "pointer";
							eingepasst = test.getElementsByTagName("span");

							if (eingepasst.length < 2) {
								// Nein! -> Einfügemarke erstellen
								eingepasst = document.createElement("span");
								eingepasst.className = "einfuegemarke";
								eingepasst.appendChild(document.createTextNode(a));
								test.insertBefore(eingepasst, test.firstChild);
								a++; // Ziffer der Einfügemarke erhöhen
							} else {
								// Nummer der vorhandenen Einfügemarke merken
								nummer = eingepasst[0].innerHTML;
							}

							// Lösungshilfe mit Nummer der Einfügemarke versehen
							this.daten[i].hilfe = nummer + " " + this.daten[i].hilfe;

							// Eventhandler einrichten / erweitern
							if (typeof(test.onclick) == "function") {
								// weiteren Wert in die onclick-Funktion schreiben
								wort = test.onclick.toString();
								wort = wort.replace(/\(\[Quiz/, "([Quiz.alleQuizze." + this.name + ".daten[" + i + "], Quiz");
								eval ("test.onclick = " + wort);

							} else {
								eval("test.onclick = function () {"
									+ "Quiz.alleQuizze."
									+ this.name
									+ ".eintragen([Quiz.alleQuizze."
									+ this.name
									+ ".daten["
									+ i
									+ "]]);};"
								);
							}
						}
					}
				}

				// Eingabebereich erstellen
				this.eingabe.className = "eingabe " + Quiz.draggableClass; // Element wurde bereis bei der Objektgestalt erzeugt!
				x = document.createElement("span"); // "schließen"-Schaltfläche
				x.className = "schliessen-button";
				x.style.cursor = "pointer";
				x.onclick = function () {
					this.parentNode.parentNode.style.display = "";
				};

				a = document.createElement("div");
				a.className = "eingabe-header";
				a.appendChild(x);
				this.eingabe.appendChild(a);

				// Textabsatz für einen Eingabehinweis erstellen, der ein verdecktes <span>-Element enthält
				a = document.createElement("p");
				a.className = "eingabehinweis";
				// Anzeigen des verdeckten <span>-Elementes bei Hover (für IE notwendiges Vorgehen)
				a.onmouseover = function () {
					this.childNodes[0].style.display = "block";
				};
				// Verbergen des verdeckten <span>-Elementes beim Verlassen
				a.onmouseout = function () {
					this.childNodes[0].style.display = "";
				};

				x = document.createElement("span");
				x.appendChild(document.createTextNode(Quiz.meldungen[this.sprache].eingabehinweis));
				a.appendChild(x);

				this.eingabe.appendChild(a);

				this.tabelle.parentNode.insertBefore(this.eingabe, this.tabelle.nextSibling);

				// Eingabefeld durch Eventhandler für bewegliche Felder zu einem Fensterimitat machen
				this.element.onmousedown = Quiz.startDrag;
				this.element.onmouseup = Quiz.stopDrag;

				// Auswertungsbutton erstellen
				button = document.createElement("a");
				button.href = "#";
				eval("button.onclick = function () { return Quiz.alleQuizze."
					+ this.name
					+ ".auswerten('auswertungs-button');"
					+ "};"
				);
				button.appendChild(document.createTextNode(Quiz.meldungen[this.sprache].pruefen));

				this.auswertungsButton = document.createElement("p");
				this.auswertungsButton.className = "auswertungs-button";
				this.auswertungsButton.appendChild(button);

				// ID für das umgebende DIV-Element vergeben
				this.element.id = this.name;

				// Für die Druckausgabe eine Liste der Lösungshilfen ausgeben
				test = document.createElement("div");
				test.className = "uebersicht";
				this.element.appendChild(test);

				// Listen ausgeben
				nummer = 0;
				while (nummer < 2) {
					// Liste erzeugen
					x = document.createElement("dl");
					y = document.createElement("dt");
					y.richtung = (nummer == 0 ? "senkrecht" : "waagrecht");
					y.appendChild(
						document.createTextNode(
							nummer == 0 ?
								Quiz.meldungen[this.sprache].senkrecht
								: Quiz.meldungen[this.sprache].waagrecht
						)
					);
					x.appendChild(y);

					// passende Lösungshilfen ausfiltern
					for (i = 0; i < this.daten.length; i++) {
						if (this.daten[i].richtung == y.richtung) {
							a = document.createElement("dd");
							p = document.createElement("span");
							p.appendChild(document.createTextNode(this.daten[i].hilfe.replace(/^(\d+).*/, "$1")));
							a.appendChild(p);
							a.appendChild(document.createTextNode(this.daten[i].hilfe.replace(/^\d+(.*)/, "$1")));
							x.appendChild(a);
						}
					}

					test.appendChild(x);
					nummer++; // nächste Liste
				}
			}
		};

		// Laufende Nummer ermitteln -> Quiz-Name wird "quiz" + laufende Nummer
		i = 0;
		for (test in Quiz.alleQuizze)
			i++;
		quiz.name = "quiz" + i;

		// Gibt es Quiz-Daten?
		tabelle = div.getElementsByTagName("table");

		if (tabelle.length < 1)
			return false;

		// Daten sind also vorhanden? -> Auswerten
		test = tabelle[0].getElementsByTagName("tr"); // Tabellenzeilen nach Daten durchforsten
		gefunden = new Array();
		for (i = 0; i < test.length; i++) {
			daten = test[i].getElementsByTagName("td");
			if (daten.length > 1) {
				gefunden[0] = (daten[0] && daten[0].innerHTML) ? daten[0].innerHTML : "";
				gefunden[1] = (daten[1] && daten[1].innerHTML) ? daten[1].innerHTML : "";

				// "Müll" entfernen
				gefunden[0] = gefunden[0].replace(/<\/?[^>]+>/g, "");
				gefunden[0] = gefunden[0].replace(/&amp;/g, "&");
				gefunden[0] = gefunden[0].replace(/&nbsp;/g, " ");
				gefunden[0] = gefunden[0].replace(/ /g, "_");

				gefunden[1] = gefunden[1].replace(/<\/?[^>]+>/g, "");
				gefunden[1] = gefunden[1].replace(/&amp;/g, "&");
				gefunden[1] = gefunden[1].replace(/&nbsp;/g, " ");

				// Lösungswort in reine Großbuchstaben umwandeln
				gefunden[0] = Quiz.wandleZeichen(gefunden[0]).toUpperCase();

				if (gefunden[0] != "" && gefunden[1] != "") {
					quiz.daten.push({
						wort : gefunden[0].quizTrim(),
						x : -1,
						y : -1,
						hilfe : gefunden[1].quizTrim()
					});
				}
			}
		}

		// Keine brauchbare Daten? -> Verwerfen!
		if (quiz.daten.length < 1)
			return false;

		// originale Tabelle durch leere Tabelle ersetzen
		quiz.tabelle = document.createElement("table");
		quiz.tabelle.className = "gitter";
		tabelle[0].parentNode.insertBefore(quiz.tabelle, tabelle[0].nextSibling);
		tabelle[0].parentNode.removeChild(tabelle[0]);

		// Quiz in die Liste aufnehmen und initialisieren
		Quiz.alleQuizze[quiz.name] = quiz;
		quiz.element.quiz = quiz;
		Quiz.alleQuizze[quiz.name].init();

		return true;
	},

	erstelleWoerterGitter : function (woerter, alleVerbunden, diagonaleWoerter, keineFreienZwischenRaeume) {
		/* übergebene Parameter
			@woerter:
				Ein Array mit Wort-Objekten. Ein Wort-Objekt hat mindestens diese Struktur:
				wort = {
					wort : (String),
					hilfe : (String), // nur bei Aufruf aus dem Kreuzworträtsel-Quiz heraus
					wortOriginal : (String) // nur bei Aufruf aus dem Suchsel-Quiz heraus
				}
				Nach dieser Funktion kann ein Wort-Objekt dann auch so aussehen
				wort = {
					wort : (String),
					x : (Integer),
					y : (Integer),
					richtung : (String), "waagrecht|senkrecht"
					hilfe : (String), // nur bei Aufruf aus dem Kreuzworträtsel-Quiz heraus
					wortOriginal : (String) // nur bei Aufruf aus dem Suchsel-Quiz heraus
				}
			@alleVerbunden (true|false):
				Wenn true, werden bis zu 10 Versuche unternommen, ein Gitter zu erstellen,
				bei dem alle Begriffe miteinander verbunden sind.
			@diagonaleWoerter (true|false):
				Wenn true, werden Wörter auch diagonal eingepasst. Dabei ist die
				Leserichtung immer von links nach rechts, egal ob das Wort von links
				oben nach rechts unten, oder von links unten nach rechts oben verläuft.
		*/
		var fertige = new Array(); // Array mit fertigen Gittern
		var makel = 1, maxVersuche = alleVerbunden ? 10 : 1;
		var richtungen = diagonaleWoerter ?
			["waagrecht", "senkrecht", "diagonal-loru", "diagonal-luro"]
			:
			["waagrecht", "senkrecht"];
		var grid, abgelegte, erfolglose, test, zufall, i, wort, a,
			eingepasst, x, y, nummer, p, button, input, buchstaben, b, d, moeglicheRichtungen, r;

		// Gitter erzeugen, falls das nicht ohne Makel gelingt, bis zu 10x
		while (makel > 0 && fertige.length < maxVersuche) {
			makel = 0; // zuerst davon ausgehen, dass ein perfektes Gitter entstehen wird
			abgelegte = new Array(); // es wurde noch nichts abgelegt
			erfolglose = new Array(); // es gibt noch keine erfolglos eingepassten Wörter

			// Grid aufbauen
			test = 0;
			for (i = 0; i < woerter.length; i++) {
				test += woerter[i].wort.length; // Anzahl Buchstaben insgesamt
			}

			grid = new Array(test);
			for (i = 0; i < test; i++) {
				grid[i] = new Array(test);
			}

			// Wörter in zufälliger Reihenfolge ins Gitter einpassen - wenn es gelingt
			while (abgelegte.length < woerter.length) {

				test = true; // neue Zufallszahl erzwingen
				while (test) {
					zufall = Math.floor(Math.random() * woerter.length);
					test = false; // annehmen, dass die Zufallszahl noch nicht benutzt wurde

					// Wort bereits abgelegt?
					for (i = 0; i < abgelegte.length; i++) {
						if (abgelegte[i].wort == woerter[zufall].wort)
							test = true;
					}

					if (erfolglose.length > 0) {
						// bereits erfolglos probierte Wörter ausschließen
						for (i = 0; i < erfolglose.length; i++) {
							if (woerter[zufall] == erfolglose[i])
								test = true;
						}
					}
				}

				// Jetzt haben wir ein Wort zum Einpassen in das Gitter
				wort = woerter[zufall];
				wort.x = -1;
				wort.y = -1;

				// geeignete Stelle finden, um es einzupassen
				if (abgelegte.length > 0) {

					// weiteres Wort einfügen -> bereits eingesetzte Wörter der Reihe nach durchgehen
					for (a = 0; a < abgelegte.length; a++) {

						// schon eine passende Stelle zum Einpassen ermittelt?
						if (wort.x >= 0 && wort.y >= 0)
							break; // Ja! -> abbrechen!

						// zufälligen Buchstaben des Wortes nehmen und nach Übereinstimmungen mit eingepasstem Wort suchen
						buchstaben = new Array(); // benutzte Buchstaben leeren
						for (b = 0; b < wort.wort.length; b++) {

							// schon eine passende Stelle zum Einpassen ermittelt?
							if (wort.x >= 0 && wort.y >= 0)
								break; // Ja! -> abbrechen!

							test = true; // neue Zufallszahl erzwingen
							while (test) {
								zufall = Math.floor(Math.random() * wort.wort.length);
								test = buchstaben[zufall];
							}

							buchstaben[zufall] = true; // Buchstaben als benutzt markieren

							// Buchstabe in beiden Wörtern vorhanden?
							if (abgelegte[a].wort.indexOf(wort.wort.substr(zufall, 1)) >= 0) {

								// Ja! -> jeden Buchstaben des bereits eingepassten Wortes durchgehen
								for (eingepasst = 0; eingepasst < abgelegte[a].wort.length; eingepasst++) {

									// Wort bereits erfolgreich eingepasst?
									if (wort.x >= 0 && wort.y >= 0)
										break; // Ja! -> abbrechen

									if (abgelegte[a].wort.substr(eingepasst, 1) == wort.wort.substr(zufall, 1)) {
										// übereinstimmender Buchstabe ermittelt! -> Wort testweise ins Gitter einpassen
										test = true; // davon ausgehen, dass das Wort passt...

										// Position des Buchstabens im Gitter ermitteln
										if (abgelegte[a].richtung == "waagrecht") {
											x = abgelegte[a].x + eingepasst;
											y = abgelegte[a].y;
										}
										if (abgelegte[a].richtung == "senkrecht") {
											x = abgelegte[a].x;
											y = abgelegte[a].y + eingepasst;
										}
										if (abgelegte[a].richtung == "diagonal-loru") {
											x = abgelegte[a].x + eingepasst;
											y = abgelegte[a].y + eingepasst;
										}
										if (abgelegte[a].richtung == "diagonal-luro") {
											x = abgelegte[a].x + eingepasst;
											y = abgelegte[a].y - eingepasst;
										}

										// mögliche Richtungen für neu einzupassendes Wort ermitteln
										moeglicheRichtungen = [];
										for (i = 0; i < richtungen.length; i++) {
											if (richtungen[i] != abgelegte[a].richtung) {
												moeglicheRichtungen.push(richtungen[i]);
											}
										}
										moeglicheRichtungen.quizShuffle();

										while (moeglicheRichtungen.length) {
											// Richtung des einzupassenden Wortes festlegen
											wort.richtung = moeglicheRichtungen.pop();

											// im Gitter die Startposition des einzupassenden Wortes ermitteln
											if (wort.richtung == "senkrecht") {
												y = y - zufall; // "zufall" ist der Abstand des entsprechenden Buchstabens zum Wortbeginn
											}
											if (wort.richtung == "waagrecht") {
												x = x - zufall;
											}
											if (wort.richtung == "diagonal-loru") {
												x = x - zufall;
												y = y - zufall;
											}
											if (wort.richtung == "diagonal-luro") {
												x = x - zufall;
												y = y + zufall;
											}

											// zu belegende Felder im Gitter prüfen
											for (i = 0; i < wort.wort.length; i++) {

												if (wort.richtung == "waagrecht") {
													if (grid[y][x + i] && grid[y][x + i] != wort.wort.substr(i, 1)) {
														test = false;
													}

													// nebenan frei? (Kosmetik)
													if (!keineFreienZwischenRaeume) {
														/* alle bereits abgelegten Wörter daraufhin prüfen, ob sie im
														Bereich des Wortes parallel in einer Nachbarzeile verlaufen */
														for (r = 0; r < abgelegte.length; r++) {
															if (abgelegte[r].richtung == "waagrecht"
																&& (abgelegte[r].y + 1 == y
																|| abgelegte[r].y -1 == y)
															) {
																if (// Nachbarwort länger?
																	(abgelegte[r].x <= x &&
																	abgelegte[r].wort.x + abgelegte[r].wort.length >= x + wort.wort.length)
																	||
																	// Nachbarwort überlappt Anfang
																	(abgelegte[r].x <= x
																	&& abgelegte[r].x + abgelegte[r].wort.length >= x)
																	||
																	// Nachbarwort beginnt mitten im Wort
																	(abgelegte[r].x > x
																	&& abgelegte[r].x <= x + wort.wort.length)
																) {
																	test = false; // ja -> verwerfen
																}
															}
															// beginnt ein senkrechtes Wort direkt unterhalb?
															if (abgelegte[r].richtung == "senkrecht" && abgelegte[r].y - 1 == y) {
																if (abgelegte[r].x >= x && abgelegte[r].x <= x + wort.wort.length) {
																	test = false; // ja -> verwerfen
																}
															}
														}
													}
												}
												if (wort.richtung == "senkrecht") {
													if (grid[y + i][x] && grid[y + i][x] != wort.wort.substr(i, 1)) {
														test = false;
													}

													// nebenan frei? (Kosmetik)
													if (!keineFreienZwischenRaeume) {
														/* alle bereits abgelegten Wörter daraufhin prüfen, ob sie im
														Bereich des Wortes parallel in einer Nachbarspalte verlaufen */
														for (r = 0; r < abgelegte.length; r++) {
															if (abgelegte[r].richtung == "senkrecht"
																&& (abgelegte[r].x == x + 1
																|| abgelegte[r].x == x - 1)
															) {
																if (// Nachbarwort länger?
																	(abgelegte[r].y <= y &&
																	abgelegte[r].wort.y + abgelegte[r].wort.length >= y + wort.wort.length)
																	||
																	// Nachbarwort überlappt Anfang
																	(abgelegte[r].y <= y
																	&& abgelegte[r].y + abgelegte[r].wort.length >= y)
																	||
																	// Nachbarwort beginnt mitten im Wort
																	(abgelegte[r].y > y
																	&& abgelegte[r].y <= y + wort.wort.length)
																) {
																	test = false; // leider nein
																}
															}
															// verläuft ein waagrechtes Wort direkt nebenan?
															if (abgelegte[r].richtung == "waagrecht" &&
																(abgelegte[r].x == x + 1 || abgelegte[r].x == x - wort.wort.length - 1)
															) {
																if (abgelegte[r].y >= y && abgelegte[r].y <= y + wort.wort.length) {
																	test = false; // ja -> verwerfen
																}
															}
														}
													}
												}
												if (wort.richtung == "diagonal-loru") {
													if (grid[y + i][x + i] && grid[y + i][x + i] != wort.wort.substr(i, 1)) {
														test = false;
													}
												}
												if (wort.richtung == "diagonal-luro") {
													if (grid[y - i][x + i] && grid[y - i][x + i] != wort.wort.substr(i, 1)) {
														test = false;
													}
												}
											}

											// Ist vor und nach dem Wort noch Platz? (Kosmetik)
											if (wort.richtung == "waagrecht") {
												if (grid[y][x - 1] || grid[y][x + wort.wort.length])
													test = false;
											}
											if (wort.richtung == "senkrecht") {
												if (grid[y - 1][x] || grid[y + wort.wort.length][x])
													test = false;
											}
											if (wort.richtung == "diagonal-loru") {
												if (grid[y - 1][x - 1] || grid[y + wort.wort.length][x + wort.wort.length])
													test = false;
											}
											if (wort.richtung == "diagonal-luro") {
												if (grid[y + 1][x - 1] || grid[y - wort.wort.length][x + wort.wort.length])
													test = false;
											}

											if (test) {
												// hat gepasst! -> Wort übernehmen lassen!
												wort.x = x;
												wort.y = y;
												erfolglose = new Array(); // erfolglos eingepasste Wörter wieder versuchen
												break; // weitere Tests abbrechen
											}
										}

										if (test)
											break; // weitere Tests abbrechen
									}
								}
							}
						}
					}

					if (wort.x < 0 && wort.y < 0) {
						// hat nicht gepasst! -> merken
						erfolglose.push(wort);

						if (erfolglose.length == (woerter.length - abgelegte.length)) {
							// anscheinend gibt es für die restlichen Wörter überhaupt keine geeignete Stelle... -> ein freies Plätzchen für aktuelles Wort finden! -> oben (0), links(1), unten(2) oder rechts(3)
							makel ++;

							zufall = Math.floor(Math.random() * 4);

							if (zufall & 1 == 1) {
								// links / rechts
								y = Math.floor(grid.length / 2) - Math.floor(wort.wort.length / 2);
								x = (zufall & 2) == 2 ? 0 : grid[0].length; // Wert muss unter- bzw. überboten werden, daher ist er zu klein/groß

							} else {
								// oben / unten
								x = Math.floor(grid[0].length / 2);
								y = (zufall & 2) == 2 ? 0 : grid.length;
							}

							wort.richtung = (zufall & 1) == 0 ? "waagrecht" : "senkrecht";

							// Koordinaten der abgelegten Wörter durchgehen, um freie Stelle zu ermitteln
							for (i = 0; i < abgelegte.length; i++) {

								if ((zufall & 1) == 1) {
									// links / rechts einschränken
									if ((zufall & 2) == 0 && abgelegte[i].x < x)
										x = abgelegte[i].x;

									if ((zufall & 2) == 2) {
										test = abgelegte[i].x;
										if (abgelegte[i].richtung == "waagrecht")
											test += abgelegte[i].wort.length;

										if (test > x)
											x = test;
									}

								} else {
									// oben / unten einschränken
									if ((zufall & 2) == 0 && abgelegte[i].y < y)
										y = abgelegte[i].y;

									if ((zufall & 2) == 2) {
										test = abgelegte[i].y;
										if (abgelegte[i].richtung == "senkrecht")
											test += abgelegte[i].wort.length;

										if (test > y)
											y = test;
									}
								}
							}

							// geeignete Position zum Einpassen gefunden!
							wort.x = (zufall & 2) == 0 ? x - 2 : x + 2;
							wort.y = (zufall & 2) == 0 ? y - 2 : y + 2;

							erfolglose = [];
						}
					}

				} else {
					// es ist das erste Wort -> direkt (senkrecht) einpassen
					wort.x = Math.floor(grid[0].length / 2);
					wort.y = Math.floor(grid.length / 2) - Math.floor(wort.wort.length / 2);
					wort.richtung = "senkrecht";
				}

				// abspeichern wenn Wort erfolgreich eingepasst werden konnte
				if (wort && wort.x >= 0 && wort.y >= 0) {
					abgelegte.push(wort);

					// Buchstaben in das Gitter eintragen
					for (i = 0; i < wort.wort.length; i++) {
						if (wort.richtung == "waagrecht") {
							grid[wort.y][wort.x + i] = wort.wort.substr(i, 1);
						}
						if (wort.richtung == "senkrecht") {
							grid[wort.y + i][wort.x] = wort.wort.substr(i, 1);
						}
						if (wort.richtung == "diagonal-loru") {
							grid[wort.y + i][wort.x + i] = wort.wort.substr(i, 1);
						}
						if (wort.richtung == "diagonal-luro") {
							grid[wort.y - i][wort.x + i] = wort.wort.substr(i, 1);
						}
					}
				}
			}

			// fertig erstelltes und bestücktes Gitter abspeichern
			fertige.push({
				gitter : grid,
				daten : abgelegte,
				makel : makel
			});
		}

		// eventuell wurden nun mehrere Gitter erstellt
		if (makel > 0) {

			// anscheinend wurde kein perfektes Gitter erstellt -> das beste aus den maximal zehn erstellten aussuchen
			test = false;
			for (i = 0; i < fertige.length; i++) {
				if (!test || fertige[i].makel < test.makel)
					test = fertige[i];
			}

			// bester Versuch wurde ermittelt -> nehmen
			grid = test.gitter;
			abgelegte = test.daten;

		}

		// ausgewähltes Gitter beschneiden
		a = {
			x : {
				min : grid[0].length,
				max : 0
			},

			y : {
				min : grid.length,
				max : 0
			}
		};

		for (y = 0; y < grid.length; y++) {
			for (x = 0; x < grid[0].length; x++) {
				// Zelle befüllt? -> Koordinaten benutzen!
				if (grid[y][x]) {

					// min-Werte bei Bedarf verkleinern!
					a.x.min = (a.x.min > x) ? x : a.x.min;
					a.y.min = (a.y.min > y) ? y : a.y.min;

					// max-Werte  bei Bedarf erhöhen
					a.x.max = (a.x.max < x) ? x : a.x.max;
					a.y.max = (a.y.max < y) ? y : a.y.max;
				}
			}
		}

		// min/max-Maße ermittelt -> Gitterinhalt in beschnittenes Gitter übertragen
		test = new Array(a.y.max - a.y.min + 1);
		for (y = 0; y < (a.y.max - a.y.min + 1); y++) { // zeilenweise
			test[y] = new Array(a.x.max - a.x.min + 1);
			for (x = 0; x < (a.x.max - a.x.min + 1); x++) { // spaltenweise
				if (grid[y + a.y.min][x + a.x.min])
					test[y][x] = grid[y + a.y.min][x + a.x.min]; // Inhalt übertragen
			}
		}

		grid = test; // altes Gitter durch neues ersetzen

		// eingetragene Koordinaten der Wörter korrigieren
		for (i = 0; i < abgelegte.length; i++) {
			abgelegte[i].x = abgelegte[i].x - a.x.min;
			abgelegte[i].y = abgelegte[i].y - a.y.min;
		}

		return { gitter : grid, woerter : abgelegte };
	},


	/* Diese Funktion erzeugt ein Suchsel-Quiz. Dazu braucht sie ein Elternelement mit dem
	CSS-Klassen-Präfix "suchsel", z.B. "suchsel-quiz", wenn "-quiz" das Suffix der Quiz.triggerClass ist.
	Die Daten für das Quiz müssen in einer einspaltigen Tabelle stehen.
	*/

	suchselQuiz : function (div) {
		var i, tabelle, test, daten, gefunden;

		var quiz = {
			// Objekt-Gestalt eines Suchsel-Quizzes
			name : "Quiz-x", // Platzhalter - hier steht später etwas anderes.
			typ : "Suchsel-Quiz",
			element : div, // Referenz auf das DIV-Element, in welchem sich das Quiz befindet
			tabelle : null, // Referenz auf das HTML-Element, in dem das Suchsel angezeigt wird
			daten : new Array(), // Hier stehen später Objekte, die die Quiz-Daten enthalten.
			versuche : 0, // Speichert die Anzahl Versuche, die für die Lösung gebraucht wurden.
			sprache : (div.lang && div.lang != "") ? div.lang : "de", // deutsche Meldungen als Voreinstellung
			loesungsliste : null, // Referenz auf ein <ol>-Objekt, in dem bereits gefundene Wörter angezeigt werden
			markierungStart : null, // Referenz auf das erste markierte <td>-Element
			markierungEnde : null, // Referenz auf das letzte markierte <td>-Element

			// Funktion zum Auswerten der Lösungen
			auswerten : function () {
				var felder = [],
					betroffene = [],
					el = Quiz.getElementsByClassName("markiert", this.tabelle),
					erfolg, f, fx, fy;

				if (el.length > 1) {
					this.versuche++;

					// Koordinaten der markierten Felder ermitteln
					for (i = 0; i < el.length; i++) {
						fx = el[i].id.replace(/^quiz\d+_(\d+)_.*/i, "$1");
						fy = el[i].id.replace(/.*_(\d+)$/i, "$1");
						felder.push({
							buchstabe : el[i].innerHTML,
							x : fx,
							y : fy
						});
					}

					// Jedes Lösungswort prüfen, ob sein Anfangsbuchstabe markiert wurde
					for (i = 0; i < this.daten.length; i++) {
						for (f = 0; f < felder.length; f++) {
							if (this.daten[i].x == felder[f].x
								&& this.daten[i].y == felder[f].y
							) {
								// Lösungswort merken
								betroffene.push(this.daten[i]);
							}
						}
					}

					// Jedes betroffene Lösungswort prüfen, ob es vollständig markiert wurde
					for (i = 0; i < betroffene.length; i++) {
						// stimmt die Anzahl markierter Felder exakt?
						if (betroffene[i].wort.length == felder.length) {
							// prüfen, ob alle markierten Felder auch die richtigen Felder sind
							erfolg = betroffene[i]; // mal davon ausgehen, dass alles passt

							for (f = 0; f < felder.length; f++) {
								if (betroffene[i].richtung == "senkrecht") {
									// x-Werte immer identisch!
									fy = betroffene[i].y + betroffene[i].wort.length -1;
									if (felder[f].x != betroffene[i].x
										|| felder[f].y < betroffene[i].y
										|| felder[f].y > fy
									) {
										erfolg = false;
									}

								}
								if (betroffene[i].richtung == "waagrecht") {
									// y-Werte immer identisch
									fx = betroffene[i].x + betroffene[i].wort.length -1;
									if (felder[f].y != betroffene[i].y
										|| felder[f].x < betroffene[i].x
										|| felder[f].x > fx
									) {
										erfolg = false;
									}
								}
								if (betroffene[i].richtung == "diagonal-loru") {
									fx = betroffene[i].x + betroffene[i].wort.length -1;
									fy = betroffene[i].y + betroffene[i].wort.length -1;
									if (felder[f].x - felder[f].y != betroffene[i].x - betroffene[i].y
										|| felder[f].x < betroffene[i].x
										|| felder[f].x > fx
										|| felder[f].y < betroffene[i].y
										|| felder[f].y > fy
									) {
										erfolg = false;
									}
								}
								if (betroffene[i].richtung == "diagonal-luro") {
									fx = betroffene[i].x + betroffene[i].wort.length -1;
									fy = betroffene[i].y - betroffene[i].wort.length -1;

									if (Math.abs(felder[f].x) + Math.abs(felder[f].y) != betroffene[i].x + betroffene[i].y
										|| felder[f].x < betroffene[i].x
										|| felder[f].x > fx
										|| felder[f].y > betroffene[i].y
										|| felder[f].y < fy
									) {
										erfolg = false;
									}
								}
							}

							if (erfolg) {
								// OK, Wort wurde korrekt gefunden -> Markierungen in dauerhafte umwandeln
								for (f = 0; f < el.length; f++) {
									el[f].className = el[f].className.replace(/ markiert/, "") + " aufgedeckt";
								}

								// Fund in die Liste eintragen
								el = this.loesungsliste.getElementsByTagName("li");
								f = false;
								for (i = 0; i < el.length; i++) {
									// Wort bereits gefunden worden?
									if (el[i].innerHTML == erfolg.wortOriginal) {
										f = true;
									}

									if (!f &&
										(!el[i].className || el[i].className != "ausgefuellt")
									) {
										el[i].innerHTML = erfolg.wortOriginal;
										el[i].className = "ausgefuellt";

										if (i == el.length -1) {
											// letztes Wort wurde gefunden!
											this.beenden();
										}

										return true;
									}
								}
							}
						}
					}
				}

				return false;
			},

			// entferne alle Markierungen
			alleMarkierungenEntfernen : function () {
				var t = this,
					el = t.tabelle.getElementsByTagName("*"), i;

				for (i = 0; i < el.length; i++) {
					if (el[i].className && el[i].className != "")
						el[i].className = el[i].className.replace(/(^| )markiert/, "");
				}
			},

			// Felder markieren, die die gegenwärtige Auswahl darstellen
			auswahlMarkieren : function () {
				var zeilen = this.tabelle.getElementsByTagName("tr");
				var felder = new Array(zeilen.length);
				var markierte = [],
					richtung = "",
					el, ende, i, start, steigung, x, y;

				// in welche Richtung geht die Markierung denn?
				for (y = 0; y < zeilen.length; y++) {
					// zeilenweise die Tabelle durchlaufen, um X- und Y-Koordinaten der Markierungsenden zu ermitteln
					felder[y] = zeilen[y].getElementsByTagName("td");

					for (x = 0; x < felder[y].length; x++) {
						if (felder[y][x] === this.markierungStart) {
							start = { x : x, y : y };
						}

						if (felder[y][x] == this.markierungEnde) {
							ende = { x : x, y : y };
						}
					}
				}

				// Fehler passiert? -> beenden
				if (!start || !ende) {
					return false;
				}

				// Steigung bestimmen, in der die Markierung erfolgen soll
				if ((ende.y - start.y) === 0) {
					// Division by Zero!
					steigung = 2; // hier genügt ein Wert > 1.5
				} else {
					// Quotient ist "legal"
					steigung = (ende.x - start.x) / (ende.y - start.y);
				}

				// Richtung aus der Steigung und der Koordinaten bestimmen
				if (Math.abs(steigung) >= 0.5 && Math.abs(steigung) <= 1.5) {
					// diagonal
					richtung = steigung > 0 ? "nw-so" : "no-sw";
				} else {
					// waagrecht/senkrecht
					richtung = Math.abs(steigung) > 1 ? "w-o" : "n-s";
				}

				// alle zu markierenden Felder ermitteln und markieren
				x = start.x;
				y = start.y;
				el = felder[y][x];
				while (el) {
					el.className = el.className.replace(/(^| )markiert/, "") + " markiert";
					// "richtung" enthält nun einen String (n-s|w-o|nw-so|no-sw)
					switch (richtung) {
						case "n-s":
							// nur y-Wert weiterzählen
							if (start.y > ende.y && y > ende.y)
								y--;
							if (start.y < ende.y && y < ende.y)
								y++;
						break;

						case "w-o":
							// nur x-Wert weiterzählen
							if (start.x > ende.x && x > ende.x)
								x--;
							if (start.x < ende.x && x < ende.x)
								x++;
						break;

						case "nw-so":
							if (start.x > ende.x && x > ende.x
								&&
								start.y > ende.y && y > ende.y
							) {
								x--;
								y--;
							}

							if (start.x < ende.x && x < ende.x
								&&
								start.y < ende.y && y < ende.y
							) {
								x++;
								y++;
							}
						break;

						case "no-sw":
							if (start.x > ende.x && x > ende.x
								&&
								start.y < ende.y && y < ende.y
							) {
								x--;
								y++;
							}

							if (start.x < ende.x && x < ende.x
								&&
								start.y > ende.y && y > ende.y
							) {
								x++;
								y--;
							}
						break;
					}

					// aufhören, wenn kein neues Feld zu markieren ist
					el = (el !== felder[y][x]) ? felder[y][x] : false;
				}
			},

			// ermittle aktuelles Element unter dem Mauszeiger
			aktuellesElement : function (e) {
				var el;

				if (!e)
					e = window.event;

				if (e.target)
					el = e.target; // W3C DOM

				if (e.srcElement) {
					el = e.srcElement; // IE
				}

				return el;
			},

			// Quiz wurde erfolgreich gelöst -> Meldung ausgeben
			beenden : function () {
				var p, td = this.tabelle.getElementsByTagName("td");

				p = document.createElement("p");
				p.className = Quiz.bewertungsClass;
				p.appendChild(document.createTextNode(
					Quiz.meldungen[this.sprache]["lob" + (this.versuche > 2 ? 3 : this.versuche)]
					+ " "
					+ Quiz.meldungen[this.sprache]["ergebnis" + (this.versuche > 2 ? 3 : this.versuche)].replace(/%n/i, this.versuche)
				));
				this.element.appendChild(p);

				// Tabelle "deaktivieren"
				this.tabelle.className += " fertig";

				// Auswertungs-Button und alle Eventhandler entfernen
				this.tabelle.onmousedown = null;
				this.tabelle.onmousemove = null;
				this.tabelle.onmouseover = null;
				this.tabelle.onmouseup = null;
				this.solved = true;
			},

			// Funktion zum Errichten der Tabelle des Suchsel-Quiz und zum Einrichten der Eventhandler
			init : function () {
				var kreuzwortGitter, tr, td, t, i, a, x, y, zufall;

				// Spracheinstellungen auf deutsch zurück korrigieren, falls entsprechende Sprachdaten fehlen
				if (!Quiz.meldungen[this.sprache])
					this.sprache = "de";

				// Gitter erzeugen
				kreuzwortGitter = Quiz.erstelleWoerterGitter(this.daten, true, true);
				// true für "alle Wörter verbunden", true für "diagonale Wörter möglich"

				// Daten und Gitter abspeichern
				this.daten = kreuzwortGitter.woerter;
				this.grid = kreuzwortGitter.gitter;

				// Lösungsliste befüllen
				a = 0; // maximale Länge der Lösungswörter
				for (i = 0; i < this.daten.length; i++) {
					if (a < this.daten[i].wortOriginal.length) {
						a = this.daten[i].wortOriginal.length;
					}
				}

				t = "";
				for (i = 0; i < a + 2; i++) {
					t += "_";
				}

				for (i = 0; i < this.daten.length; i++) {
					x = document.createElement("li");
					x.appendChild(document.createTextNode(t));
					this.loesungsliste.appendChild(x);
				}

				// Tabelle befüllen
				for (y = 0; y < this.grid.length; y++) {
					tr = this.tabelle.insertRow(
						this.tabelle.getElementsByTagName("tr").length <= 0 ?
							0 :
							this.tabelle.getElementsByTagName("tr").length
					);

					for (x = 0; x < this.grid[0].length; x++) {
						td = document.createElement("td");
						td.id = this.name + "_" + x + "_" + y;

						// Zelleninhalt vorbereiten
						zufall = Math.floor(Math.random() * 26); // zufälligen Buchstaben erzeugen
						t = document.createTextNode(String.fromCharCode(65 + zufall).toUpperCase());

						// Zufallsbuchstabe durch vorgegebenen ersetzen
						if (this.grid[y][x]) {
							t = document.createTextNode(this.grid[y][x].toUpperCase())
						}

						td.appendChild(t);

						// Zelle in Zeile einhängen
						tr.appendChild(td);
					}
				}

				// ID für das umgebende DIV-Element vergeben
				this.element.id = this.name;

				// Markierungsmechanismus einrichten
				t = this;
				this.tabelle.onmousedown = function (e) {
					var el = t.aktuellesElement(e);

					if (el.tagName && el.tagName.toLowerCase() == "td") {
						el.className = el.className.replace(/(^| )hover/, "") + " markiert";

						// Beginn der Markierung merken
						t.markierungStart = el;

						// Markiermodus einschalten
						t.markiermodus = true;

						// Markierungseffekt im IE unterbinden
						Quiz.antiMarkierungsModusFuerIE(true);

						// Markierungseffekt in W3C-konformen Browsern unterbinden
						if (window.getSelection) {
							window.getSelection().removeAllRanges();
						}
					}

					return true;
				};

				this.tabelle.onmouseover = function (e) {
					var el = t.aktuellesElement(e);

					if (el && el.tagName && el.tagName.toLowerCase() == "td") {
						if (t.markiermodus) {
							t.markierungEnde = el;

							// bestehende Markierungen entfernen
							t.alleMarkierungenEntfernen();

							// neue Markierungen setzen
							t.auswahlMarkieren();
						}
					}

					return true;
				};

				this.tabelle.onmousemove = function (e) {
					if (!t.markiermodus) {
						var el = t.tabelle.getElementsByTagName("*"), i;

						// entferne alle hover - Markierungen
						for (i = 0; i < el.length; i++) {
							if (el[i].className && el[i].className != "")
								el[i].className = el[i].className.replace(/(^| )hover/, "");
						}

						// setze hover-Markierung für aktuelles Element
						el = t.aktuellesElement(e);

						if (el && el.tagName && el.tagName.toLowerCase() == "td") {
							el.className += " hover";
						}

					} else {
						// Markierungseffekt in W3C-konformen Browsern unterbinden
						if (window.getSelection) {
							window.getSelection().removeAllRanges();
						}
					}

					return true;
				};

				this.element.onmouseup = function (e) {
					// markierte Felder auswerten
					t.auswerten();

					// alle Markierungen entfernen
					t.alleMarkierungenEntfernen();

					// Beende Markiermodus
					t.markiermodus = false;

					// Markierungseffekt im IE wieder erlauben
					Quiz.antiMarkierungsModusFuerIE();

					return true;
				};

				this.tabelle.onmouseout = function (e) {
					if (!t.markiermodus) {
						// entferne alle hover - Markierungen
						var el = t.tabelle.getElementsByTagName("*"), i;

						for (i = 0; i < el.length; i++) {
							if (el[i].className && el[i].className != "")
								el[i].className = el[i].className.replace(/(^| )hover/, "");
						}
					}
				}
			}
		};

		// Laufende Nummer ermitteln -> Quiz-Name wird "quiz" + laufende Nummer
		i = 0;
		for (test in Quiz.alleQuizze)
			i++;
		quiz.name = "quiz" + i;

		// Gibt es Quiz-Daten?
		tabelle = div.getElementsByTagName("table");

		if (tabelle.length < 1)
			return false;

		// Daten sind also vorhanden? -> Auswerten
		test = tabelle[0].getElementsByTagName("tr"); // Tabellenzeilen nach Daten durchforsten
		gefunden = new Array();
		for (i = 0; i < test.length; i++) {
			daten = test[i].getElementsByTagName("td");
			if (daten.length > 0) {
				gefunden[0] = (daten[0] && daten[0].innerHTML) ? daten[0].innerHTML : "";

				// "Müll" entfernen
				gefunden[0] = gefunden[0].replace(/<\/?[^>]+>/g, "");
				gefunden[0] = gefunden[0].replace(/&amp;/g, "&");
				gefunden[0] = gefunden[0].replace(/&nbsp;/g, " ");
				gefunden[0] = gefunden[0].replace(/ /g, "_");
				gefunden[0] = gefunden[0].quizTrim();

				if (gefunden[0] != "") {
					quiz.daten.push({
						// Lösungswort in reine Großbuchstaben umwandeln
						wort : Quiz.wandleZeichen(gefunden[0]).toUpperCase(),
						wortOriginal : gefunden[0],
						x : -1,
						y : -1
					});
				}
			}
		}

		// Keine brauchbare Daten? -> Verwerfen!
		if (quiz.daten.length < 1)
			return false;

		// originale Tabelle durch leere Tabelle ersetzen
		quiz.tabelle = document.createElement("table");
		quiz.tabelle.className = "gitter";
		tabelle[0].parentNode.insertBefore(quiz.tabelle, tabelle[0].nextSibling);
		tabelle[0].parentNode.removeChild(tabelle[0]);

		// Liste mit gefundenen Lösungen erstellen
		quiz.loesungsliste = document.createElement("ol");
		quiz.loesungsliste.className = "liste";
		div.appendChild(quiz.loesungsliste);

		// Quiz in die Liste aufnehmen und initialisieren
		Quiz.alleQuizze[quiz.name] = quiz;
		quiz.element.quiz = quiz;
		Quiz.alleQuizze[quiz.name].init();

		return true;
	},


	/* Diese Funktion erzeugt ein Quiz, das man auch als Hangman-Quiz kennt. Es müssen die Buchstaben
	eines Wortes geraten werden, um zu einer Lösung zu geraten. Zu viele Fehlversuche führen zum Verlieren
	des Spiels. */

	buchstabenratenQuiz : function (div) {
		var i, tabelle, test, daten, gefunden;

		var quiz = {
			// Objekt-Gestalt eines Suchsel-Quizzes
			name : "Quiz-x", // Platzhalter - hier steht später etwas anderes.
			typ : "Buchstabenraten-Quiz",
			element : div, // Referenz auf das DIV-Element, in welchem sich das Quiz befindet
			feld : null, // Referenz auf das HTML-Element, in dem das Kreuzworträtsel angezeigt wird
			daten : new Array(), // Hier stehen später Objekte, die die Quiz-Daten enthalten.
			versuche : 0, // Speichert die Anzahl Versuche, die für die Lösung gebraucht wurden.
			sprache : (div.lang && div.lang != "") ? div.lang : "de", // deutsche Meldungen als Voreinstellung
			erkannteWoerter : new Array(), // speichert die bereits erratenen Wörter
			gestartet : false, // Steuert, ob Tastatureingaben überhaupt ausgewertet werden
			bilder : new Array(
				/* Hier stehen die Bilddateien für die verschiedenen Stadien der Grafik, die das drohende
				Spielende darstellt. Dabei gilt die erste Grafik als Spielende und die letzte Grafik als Spielstart. */
				"blume00.gif",
				"blume01.gif",
				"blume02.gif",
				"blume03.gif",
				"blume04.gif",
				"blume05.gif",
				"blume06.gif",
				"blume07.gif",
				"blume08.gif",
				"blume09.gif",
				"blume10.gif"
			),

			// Funktion zum Auswerten der Lösungen
			auswerten : function (keyCode) {
				var t = this,
					c = Quiz.wandleZeichen(String.fromCharCode(keyCode)),
					schonGeraten, treffer, d, i, li, u;

				if (c) {
					d = this.element.getElementsByTagName("div");
					u = Quiz.getElementsByClassName(
						"geratene-buchstaben", this.element
					)[0].getElementsByTagName("ul")[0]; // Element muss vorhanden sein

					// testen, ob dieser Buchstabe bereits geraten worden war
					li = u.getElementsByTagName("li");
					for (i = 0; i < li.length; i++) {
						if (li[i].firstChild.data == c) {
							schonGeraten = true;
						}
					}

					// noch nicht geraten worden? -> auf Treffer testen
					if (!schonGeraten) {
						li = document.createElement("li");
						li.appendChild(
							document.createTextNode(c)
						);
						u.appendChild(li);

						// Ist der Buchstabe im Lösungswort enthalten?
						d = Quiz.getElementsByClassName("ratewort", this.element)[0]; // Element ist garantiert vorhanden
						u = d.getElementsByTagName("span");
						for (i = 0; i < u.length; i++) {
							if (u[i].buchstabe == c) {
								treffer = true;
								u[i].className = "erraten";
								u[i].firstChild.data = u[i].buchstabe;
								li.className = "treffer";
							}
						}
					}

					// Ergebnis?
					if (!treffer) {
						this.versuche++;

						// Statusbild aktualisieren
						i = Quiz.getElementsByClassName("statusbild")[0].getElementsByTagName("img")[0];
						i.src = Quiz.baseURL + "/images/" + this.bilder[this.bilder.length - 1 - this.versuche];

						// Spiel zu Ende?
						if (this.versuche == this.bilder.length - 1) {
							this.solved = true;
							this.beenden();
						}

					} else {
						// Wort komplett erkannt?
						for (i = 0; i < u.length; i++) {
							// u ist noch mit den SPAN-Elementen des Lösungswortes belegt!
							if (u[i].firstChild.data == String.fromCharCode(160)) {
								treffer = false; // nicht alle Buchstaben sind schon erkannt
							}
						}

						if (treffer) {
							// nächstes Wort erraten lassen
							this.erkannteWoerter.push(this.daten[this.erkannteWoerter.length]);
							if (this.versuche > 0) {
								this.versuche--;
							}

							window.setTimeout(
								function () {
									t.wortAbfragen();
								},
								2000
							);
						}
					}
				}
			},

			// Funktion zum starten des Quiz-Vorgangs
			wortAbfragen : function () {
				var t = this, u, p, d, i, li;

				// "Spielfeld" aufbauen
				while (this.feld.firstChild) {
					this.feld.removeChild(this.feld.firstChild);
				}

				if (this.erkannteWoerter.length < this.daten.length) {
					// Statusbild
					p = document.createElement("p");
					p.className = "statusbild";
					this.feld.appendChild(p);

					i = document.createElement("img");
					i.src = Quiz.baseURL + "images/" + this.bilder[this.bilder.length - 1 - this.versuche];
					p.appendChild(i);

					// Eingabehinweis
					p = document.createElement("p");
					p.className = "eingabehinweis";
					// Anzeigen des verdeckten <span>-Elementes bei Hover (für IE notwendiges Vorgehen)
					p.onmouseover = function () {
						this.childNodes[0].style.display = "block";
					};
					// Verbergen des verdeckten <span>-Elementes beim Verlassen
					p.onmouseout = function () {
						this.childNodes[0].style.display = "";
					};
					this.feld.appendChild(p);

					i = document.createElement("span");
					i.appendChild(document.createTextNode(Quiz.meldungen[this.sprache].eingabehinweis_buchstabenraten));
					p.appendChild(i);

					// Leerfelder für das zu erratende Wort aufbauen
					p = document.createElement("p");
					p.className = "ratewort";
					p.wort = this.daten[this.erkannteWoerter.length].wort;
					this.feld.appendChild(p);

					for (i = 0; i < this.daten[this.erkannteWoerter.length].wort.length; i++) {
						li = document.createElement("span");
						li.appendChild(
							document.createTextNode(
								String.fromCharCode(160)
							)
						);
						li.buchstabe = Quiz.wandleZeichen(this.daten[this.erkannteWoerter.length].wort.substr(i, 1));
						p.appendChild(li);
					}
				}

				// Liste bereits gefundener Wörter erstellen
				d = document.createElement("div");
				d.className = "erkannte-woerter";
				this.feld.appendChild(d);

				p = document.createElement("p");
				p.appendChild(document.createTextNode(Quiz.meldungen[this.sprache].erkannteWoerter));
				d.appendChild(p);

				u = document.createElement("ol");
				d.appendChild(u);

				for (i = 0; i < this.daten.length; i++) {
					li = document.createElement("li");

					if (this.erkannteWoerter[i]) {
						li.appendChild(document.createTextNode(this.erkannteWoerter[i].wortOriginal));
						li.className = "erkannt";
					} else {
						li.appendChild(document.createTextNode("_______________"));
					}

					u.appendChild(li);
				}

				if (this.erkannteWoerter.length < this.daten.length) {
					// Liste bereits geratener Buchstaben erstellen
					d = document.createElement("div");
					d.className = "geratene-buchstaben";
					this.feld.appendChild(d);

					p = document.createElement("p");
					p.appendChild(document.createTextNode(Quiz.meldungen[this.sprache].gerateneBuchstaben));
					d.appendChild(p);

					u = document.createElement("ul");
					d.appendChild(u);

					// Tastatureingabe einschalten
					this.gestartet = true;

				} else {
					// Quiz schon zu ende gespielt?
					this.solved = true;
					this.beenden();
				}
			},

			// Meldung zu Spielende ausgeben + Neustart-Button
			beenden : function () {
				var p = document.createElement("p"),
					a = document.createElement("a"),
					t = this;

				p.className = "start-link";
				p.appendChild(document.createTextNode(
					Quiz.meldungen[this.sprache].quizEnde + " "
				));

				this.feld.appendChild(p);
				p.appendChild(a);

				a.appendChild(document.createTextNode(
					Quiz.meldungen[this.sprache].erneut
				));
				a.href = "javascript:;";

				// erneutes Spiel anbieten
				a.onclick = function () {
					t.solved = false;
					t.daten.quizShuffle();
					t.versuche = 0;
					t.erkannteWoerter = new Array();
					t.wortAbfragen();
				}

				this.solved = true;
			},

			// Quiz initialisieren
			init : function () {
				var t = this;
				var p = document.createElement("p");
				var a = document.createElement("a");

				// ID für das umgebende DIV-Element vergeben
				this.element.id = this.name;

				this.feld.appendChild(p);
				p.className = "start-link";

				a.href = "javascript:Quiz.alleQuizze." + this.name + ".wortAbfragen()";
				a.appendChild(document.createTextNode(Quiz.meldungen[this.sprache].quizStarten));
				p.appendChild(a);

				this.daten.quizShuffle();
				this.versuche = 0;
				this.erkannteWoerter = new Array();

				// Tastaturabfrage einrichten
				this.element.onkeyup = function (e) {
					if (!e)
						e = window.event;

					if (Quiz.aktivesQuiz === t && !t.solved && t.gestartet) {
						t.auswerten(e.keyCode);
					}

					return true;
				};

				this.solved = false;
			}
		};

		// Laufende Nummer ermitteln -> Quiz-Name wird "quiz" + laufende Nummer
		i = 0;
		for (test in Quiz.alleQuizze)
			i++;
		quiz.name = "quiz" + i;

		// Gibt es Quiz-Daten?
		tabelle = div.getElementsByTagName("table");

		if (tabelle.length < 1)
			return false;

		// Daten sind also vorhanden? -> Auswerten
		test = tabelle[0].getElementsByTagName("tr"); // Tabellenzeilen nach Daten durchforsten
		gefunden = new Array();
		for (i = 0; i < test.length; i++) {
			daten = test[i].getElementsByTagName("td");
			if (daten.length > 0) {
				gefunden[0] = (daten[0] && daten[0].innerHTML) ? daten[0].innerHTML : "";

				// "Müll" entfernen
				gefunden[0] = gefunden[0].replace(/<\/?[^>]+>/g, "");
				gefunden[0] = gefunden[0].replace(/&amp;/g, "&");
				gefunden[0] = gefunden[0].replace(/&nbsp;/g, " ");
				gefunden[0] = gefunden[0].replace(/ /g, "_");
				gefunden[0] = gefunden[0].quizTrim();

				if (gefunden[0] != "") {
					quiz.daten.push({
						// Lösungswort in reine Großbuchstaben umwandeln
						wort : Quiz.wandleZeichen(gefunden[0]).toUpperCase(),
						wortOriginal : gefunden[0]
					});
				}
			}
		}

		// Keine brauchbare Daten? -> Verwerfen!
		if (quiz.daten.length < 1)
			return false;

		// originale Tabelle entfernen
		tabelle[0].parentNode.removeChild(tabelle[0]);

		// "Spielfeld" erstellen und ins Dokument schreiben
		quiz.feld = document.createElement("div");
		quiz.element.appendChild(quiz.feld);

		// Quiz in die Liste aufnehmen und initialisieren
		Quiz.alleQuizze[quiz.name] = quiz;
		quiz.element.quiz = quiz;
		Quiz.alleQuizze[quiz.name].init();

		return true;
	},

	// Voreinstellungen für Mehrsprachigkeit
	meldungen : {
		de : {
			pruefen : 'prüfen!',
			lob1 : 'Ausgezeichnet!',
			lob2 : 'Gut gemacht!',
			lob3 : 'Das war nicht schlecht!',
			ergebnis1 : 'Die Aufgabe wurde gleich beim ersten Versuch erfolgreich gelöst!',
			ergebnis2 : 'Die Aufgabe wurde nach nur zwei Versuchen erfolgreich gelöst!',
			ergebnis3 : 'Die Aufgabe wurde nach %n Versuchen erfolgreich gelöst!',
			alleGefunden : 'Alle Sets gefunden!', // memo-quiz - Es können auch Triplets, Quartette und mehr gefunden werden müssen
			erneut : 'Wie wär\'s mit einer neuen Runde?',
			ergebnisProzent : 'Die Antworten sind zu %n% richtig.', // Multiple-Choice-Quiz
			senkrecht : 'Senkrecht', // Kreuzworträtsel
			waagrecht : 'Waagrecht',
			eingabehinweis : 'Klicken Sie auf ein gr\u00fcnes Feld, um einen Buchstaben einzugeben!',
			eingabehinweis_buchstabenraten : 'Benutzen Sie die Tastatur zur Eingabe! Eventuell m\u00fcssen Sie erst in das Quiz klicken, um es zu aktivieren.'
		}
	},


/*
==================
 weitere Funktionen
==================
 */
	getElementsByClassName : function (className, element) {
		element = element ? element : document;

		var muster = new RegExp("(^|\\s)" + className + "(\\s|$)");
		var alles = element.getElementsByTagName("*");
		var gefunden = new Array();
		var i;

		for (i = 0; i < alles.length; i++) {
			if (alles[i] && alles[i].className && alles[i].className != "") {
				if (alles[i].className.match(muster))
					gefunden.push(alles[i]);
			}
		}

		return gefunden;
	},

	// Zeichen in eintragbare Buchstaben umwandeln
	wandleZeichen : function (s) {
		// "s" ist ein String
		var r = "",
			z, i, j;

		for (i = 0; i < s.length; i++) {
			if (s[i] == String.fromCharCode(160) || s[i] == String.fromCharCode(32)) {
				r += String.fromCharCode(160);

			} else {
				for (z in Quiz.codeTabelle) {
					if (z.match(/^[A-Z][A-Z]?$/)) {
						for (j = 0; j < Quiz.codeTabelle[z].length; j++) {
							if (s.substr(i, 1) == Quiz.codeTabelle[z][j]) {
								r += z;
							}
						}
					}
				}
			}
		}

		return r;
	},

	initQuizze : function () {
		// prüfen, ob Code-Tabelle für UTF-8-Normalisierung und Mehrsprachenunterstützung geladen wurden
		if (!Quiz.codeTabelle || !Quiz.meldungen.en) {
			window.setTimeout(Quiz.initQuizze, 100);
			return false;
		}

		// Initialisierung der Quizze
		var i, j, a, gefunden, typ, ok, css;
		var quizBereiche = new Array();
		var muster = new RegExp(Quiz.triggerClass);
		var divs = document.getElementsByTagName("div");

		// Alle DIVs daraufhin überprüfen, ob sie eine CSS-Klasse haben, die auf ein Quiz schließen lässt
		for (i = 0; i < divs.length; i++) {
			if (divs[i] && divs[i].className && divs[i].className.match(muster)) {
				quizBereiche.push(divs[i]);
			}
		}

		// Alle Quiz-Bereiche gefunden -> Initialisieren
		if (quizBereiche.length > 0) {
			for (i = 0; i < quizBereiche.length; i++) {
				ok = false; // Initialisierung ok?
				typ = quizBereiche[i].className.replace(/([^ ,]+)-quiz/, "$1");

				if (typeof(Quiz[typ + "Quiz"]) == "function")
					ok = Quiz[typ + "Quiz"](quizBereiche[i]);

				// Initialisierung OK? -> Warnungen entfernen
				if (ok) {
					gefunden = Quiz.getElementsByClassName("js-hinweis", quizBereiche[i]);
					if (gefunden.length > 0)
						gefunden[0].parentNode.removeChild(gefunden[0]);
				}
			}
		}

		ok = false; // Wurde überhaupt ein Quiz initialisiert? Mal nicht davon ausgehen...
		for (i in Quiz.alleQuizze)
			ok = true;

		// Wenn mindestens ein Quiz initialisiert wurde, dann Seite "bestücken".
		if (ok) {
			// CSS für Quizbereiche einbinden
			css = document.createElement("link");
			css.rel = "stylesheet";
			css.type = "text/css";
			css.media = "screen, projection";
			css.href = Quiz.baseURL + "css/quiz.css";
			document.getElementsByTagName("head")[0].appendChild(css);

			// Print-CSS für Quizbereiche einbinden
			css = document.createElement("link");
			css.rel = "stylesheet";
			css.type = "text/css";
			css.media = "print";
			css.href = Quiz.baseURL + "css/quiz-print.css";
			document.getElementsByTagName("head")[0].appendChild(css);

			// IE-spezifische Stylesheets einbinden
			/*@cc_on
				@if (@_jscript_version == 5.6)
					// zusätzliches Stylesheet für IE6 einbinden
					css = document.createElement("link");
					css.rel = "stylesheet";
					css.type = "text/css";
					css.media = "screen, projection";
					css.href = Quiz.baseURL + "css/quiz-ie6.css";
					document.getElementsByTagName("head")[0].appendChild(css);
				@end

				@if (@_jscript_version == 5.7)
					// zusätzliches Stylesheet für IE7 einbinden
					css = document.createElement("link");
					css.rel = "stylesheet";
					css.type = "text/css";
					css.media = "screen, projection";
					css.href = Quiz.baseURL + "css/quiz-ie7.css";
					document.getElementsByTagName("head")[0].appendChild(css);
				@end
			@*/

			// Links innerhalb eines Quizzes solange deaktivieren, bis es gelöst ist:
			for (i in Quiz.alleQuizze) {
				if (Quiz.alleQuizze[i].felder) {
					for (j = 0; j < Quiz.alleQuizze[i].felder.length; j++) {
						gefunden = [];
						if (Quiz.alleQuizze[i].felder[j].getElementsByTagName)
							gefunden = Quiz.alleQuizze[i].felder[j].getElementsByTagName("a");
						if (Quiz.alleQuizze[i].felder[j].element
							&& Quiz.alleQuizze[i].felder[j].element.getElementsByTagName
						)
							gefunden = Quiz.alleQuizze[i].felder[j].element.getElementsByTagName("a");

						for (a = 0; a < gefunden.length; a++) {
							gefunden[a].quiz = Quiz.alleQuizze[i];
							gefunden[a].oldOnClick = gefunden[a].onclick;
							gefunden[a].onclick = Quiz.linkOnClick; // neue onclick-Funktion, die Klicks blocken kann
						}
					}
				}

				// onclick-EventHandler für jedes <div> eines Quizzes setzen
				if (typeof Quiz.alleQuizze[i].element.onclick == "function") {
					Quiz.alleQuizze[i].element.oldOnClick = Quiz.alleQuizze[i].element.onclick;
				}

				Quiz.alleQuizze[i].element.onclick = function (e) {
					Quiz.aktivesQuiz = this.quiz;
					if (typeof this.oldOnClick == "function") {
						this.oldOnClick(e);
					}
					return true;
				};
			}
		}
	},

	// neue onclick-Funktion für Links
	linkOnClick : function (e) {
		if (this.quiz.typ == "Multiple Choice - Quiz"
			|| this.quiz.typ == "Buchstabenraten-Quiz"
			|| this.quiz.solved
		) {
			if (typeof this.oldOnClick == "function") {
				this.oldOnClick(e);
			}

			return true;
		} else
			return false;
	},

	/* Funktionen für Drag&Drop-Mechanismus */
	auswahl : function (element, ziel) {
		if (!Quiz.baseURL)
			Quiz.init();

		if (ziel) {
			// Drag&Drop hat stattgefunden!
			Quiz.aktivesQuiz.dragNDropAuswerten(element, ziel);
		}

		// User-Eingabe war "nur ein Klick"...
		return false;
	},

	startDrag : function (e) {
		if (!e)
			e = window.event;

		if (e.target)
			Quiz.dragElm = e.target; // W3C DOM

		if (e.srcElement) {
			Quiz.dragElm = e.srcElement; // IE
		}

		// Nur bei Klick auf ein entsprechend ausgezeichnetes Element (oder eines seiner Nachfahren-Elemente) Drag&Drop-Verhalten zeigen!
		var muster = new RegExp("(^|\\s)" + Quiz.draggableClass + "(\\s|$)");
		var test = Quiz.dragElm;

		while (!test.className || !test.className.match(muster)) {
			test = test.parentNode;
			if (test == document.body)
				break;
		}

		if (test != document.body && test.className.match(muster)) {
			Quiz.dragElm = test;
			Quiz.dragMode = true;

			// aktives Quiz eintragen
			Quiz.aktivesQuiz = Quiz.alleQuizze[Quiz.dragElm.id.replace(/^([^_]+).+/, "$1")];
		}

		return !Quiz.dragMode;
	},

	whileDrag : function (e) {
		var top, left, dx, dy, offsetX, offsetY, element;

		if (!e)
			e = window.event;

		left = e.clientX,
		top = e.clientY

		Quiz.IE = (document.compatMode && document.compatMode == "CSS1Compat") ?
			document.documentElement : document.body || null;

		if (Quiz.IE && typeof (Quiz.IE.scrollLeft) == "number") {
			left += Quiz.IE.scrollLeft;
			top +=  Quiz.IE.scrollTop;
		}

		// Abstand zu den letzten Mauskoordinaten berechnen
		dx = Quiz.mouseLastCoords.left - left;
		dy = Quiz.mouseLastCoords.top - top;

		// Mauskoordinaten speichern
		Quiz.mouseLastCoords.left = left;
		Quiz.mouseLastCoords.top = top;

		// falls gerade kein Element gezogen wird, hier beenden
		if (!Quiz.dragElm || !Quiz.dragMode)
			return true;

		// falls das zu ziehende Element noch nicht "losgelöst" wurde, dieses beweglich machen
		if (!Quiz.dragged) {
			Quiz.dragElmOldVisibility = Quiz.dragElm.style.visibility;

			// Nur Felder neu positionieren
			if (Quiz.dragElm.className.match(Quiz.feldClass) || Quiz.dragElm.style.left == "") {
				Quiz.dragElm.style.top = "0px";
				Quiz.dragElm.style.left = "0px";
			}

			// Markierungseffekt im IE unterbinden
			Quiz.antiMarkierungsModusFuerIE(true);

			Quiz.dragElm.className += " " + Quiz.draggedClass;
		}

		if (Quiz.visibilityCount < 1)
			// Durchscheinen, damit ein mouseover-Event des unterhalb liegenden Elementes möglich wird
			Quiz.dragElm.style.visibility = "hidden";

		// zu ziehendes Element bewegen
		left = parseInt(Quiz.dragElm.style.left);
		top = parseInt(Quiz.dragElm.style.top);
		Quiz.dragElm.style.left = left - dx + "px";
		Quiz.dragElm.style.top = top - dy + "px";
		Quiz.dragged = true;

		// Zähler zurücksetzen
		Quiz.visibilityCount = Quiz.visibilityCount < 1 ? Math.ceil(Quiz.visibilityCountDefault) : Quiz.visibilityCount -1;

		return true;
	},

	// Drag&Drop beenden
	stopDrag : function (e) {
		var returnVal;
		var muster, inputs, i;

		if (!Quiz.dragElm || !Quiz.dragElm.className)
			return false;

		// Anti-Markier-Effekt in IE beenden
		Quiz.antiMarkierungsModusFuerIE();

		if (Quiz.dragged) {
			// eventuelle aktive Eingabefelder deaktivieren - aber nur wenn Drag&Drop stattgefunden hat!
			inputs = document.getElementsByTagName("input");
			for (i = 0; i < inputs.length; i++) {
				try {
					inputs[i].blur();
				} catch (e) { }

				try {
					inputs[i].onblur();
				} catch (e) { }
			}
		}

		// bewegtes Element wieder eingliedern
		muster = new RegExp(" ?" + Quiz.draggedClass);
		Quiz.dragElm.className = Quiz.dragElm.className.replace(muster, "");

		// Sichtbarkeit wurde nur verändert, wenn das Element wirklich gezogen wurde...
		if (Quiz.dragged) {
			Quiz.dragElm.style.visibility = Quiz.dragElmOldVisibility;
			Quiz.dragElmOldVisibility = "";
		}

		// Position (nur!) bei Feldern wieder zurückstellen
		muster = new RegExp("(^|\\s)" + Quiz.feldClass + "(\\s|$)");
		if (Quiz.dragElm.className.match(muster) && Quiz.dragged) {
			Quiz.dragElm.style.top = "";
			Quiz.dragElm.style.left = "";
		}

		// Rückgabewert bereitstellen
		returnVal = Quiz.dragged ?
			// für Drag&Drop
			Quiz.auswahl(Quiz.dragElm, Quiz.highlightElm) :
			// für einen simplen Klick (zweiter Parameter false!)
			Quiz.auswahl(Quiz.dragElm, false);

		// Variablen wieder löschen
		Quiz.dragElm = null;
		Quiz.dragged = false;
		Quiz.dragMode = false;

		// gehighlightetes Element wieder abstellen
		if (Quiz.highlightElm) {
			muster = new RegExp(" ?" + Quiz.highlightClass);
			Quiz.highlightElm.className = Quiz.highlightElm.className.replace(muster, "");
			Quiz.highlightElm = null;
		}

		return returnVal;
	},

	highlight : function (e) {
		var old = Quiz.highlightElm;
		var test, original, muster;

		if (!Quiz.dragMode)
			// Kein Drag&Drop-Vorgang!
			return true;

		if (!Quiz.dragElm.style.visibility || Quiz.dragElm.style.visibility != "hidden")
			// Das zu ziehende Element ist gerade nicht auf unsichtbar geschaltet! Kein Highlighting möglich!
			return true;

		if (!e)
			e = window.event;

		if (e.target)
			original = e.target; // W3C DOM

		if (e.srcElement)
			original = e.srcElement; // IE

		// tatsächliches Drag&Drop-Elements ermitteln (und nicht eines seiner Kinder akzeptieren)
		test = original;
		while (test != Quiz.dragElm && test != document.body)
			test = test.parentNode;

		// befinden wir uns innerhalb des richtigen Quizzes?
		test = original;
		while (!test.tagName || (test.tagName.toLowerCase() != "div" && test.tagName.toLowerCase() != "body"))
			test = test.parentNode;

		if (!Quiz.aktivesQuiz || test.tagName.toLowerCase() == "body" || (test.tagName.toLowerCase() == "div" && test.id != Quiz.aktivesQuiz.name))
			// Falsches Quiz! Beenden!
			return true

		// anvisiertes Lösungs-Element highlighten
		muster = new RegExp(
			"(^|\\s)("
			+ Quiz.aktivesQuiz.loesungsClass
			+ "|"
			+ Quiz.poolClass
			+ ")(\\s|$)");

		// wenn aktuelles Element nicht die benötigte CSS-Klasse hat -> Element im DOM-Baum aufwärts suchen gehen...
		test = original;
		while (!test.className || (!test.className.match(muster) && test != Quiz.aktivesQuiz.element))
			test = test.parentNode;

		// passendes Element gefunden?
		if (!test.className.match(muster))
			// Nein! -> beenden
			return true;

		Quiz.highlightElm = test;

		// Highlighten!
		if (old) {
			// altes Highlight entfernen, falls vorhanden
			muster = new RegExp(" ?" + Quiz.highlightClass, "");
			old.className = old.className.replace(muster, "");
		}

		// neues Element highlighten
		Quiz.highlightElm.className += " " + Quiz.highlightClass;

		return true;
	},

	einBlender : function (e) {
		if (Quiz.dragElm)
			Quiz.dragElm.style.visibility = Quiz.dragElmOldVisibility;

		return true;
	},

	antiMarkierungsModusFuerIE : function (schalter) {
		if (schalter) {
			// Anti-Markierungs-Effekt für IE einschalten
			Quiz.oldDocOnSelectStart = document.onselectstart;
			Quiz.oldDocOnDragStart = document.ondragstart;
			document.onselectstart = function () { return false;};
			document.ondragstart = function () { return false;};

		} else {
			// Anti-Markier-Effekt für IE beenden
			if (Quiz.oldDocOnSelectStart || typeof(document.onselectstart) == "function")
				document.onselectstart = Quiz.oldDocOnSelectStart;

			if (Quiz.oldDocOnDragStart || typeof(document.ondragstart) == "function")
				document.ondragstart = Quiz.oldDocOnDragStart;
		}
	}

};


// initialisieren
Quiz.init();
