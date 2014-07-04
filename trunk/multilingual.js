/*************************************************************************
* Mehrsprachenmodul für JavaScript-Framework für interaktive Lernaufgaben
**************************************************************************
*
* V 2.4 (2011/10/20)
*
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

/* Ersetzungen für Sonderzeichen

Ä = \u00c4
Ö = \u00d6
Ü = \u00dc
ä = \u00e4
ö = \u00f6
ü = \u00fc
ß = \u00df
¡ = \u00a1
¿ = \u00bf
é = \u00e9
è = \u00e8

*/

/*
Falls ein anderes Script die verfügbaren Sprachen ermitteln will, ohne das Quiz-Script selbst
laden zu können (oder wollen), wird das Quiz-Objekt angelegt, um das Vorhandensein des
Quiz-Scripts quasi vorzutäuschen.
*/
if (!window.Quiz)
	Quiz = new Object();

Quiz.meldungen = {
	// deutsche Meldungen (Voreinstellung)
	de : {
		pruefen : 'pr\u00fcfen!',
		lob1 : 'Ausgezeichnet!',
		lob2 : 'Gut gemacht!',
		lob3 : 'Das war nicht schlecht!',
		ergebnis1 : 'Die Aufgabe wurde gleich beim ersten Versuch erfolgreich gel\u00f6st!',
		ergebnis2 : 'Die Aufgabe wurde nach nur zwei Versuchen erfolgreich gel\u00f6st!',
		ergebnis3 : 'Die Aufgabe wurde nach %n Versuchen erfolgreich gel\u00f6st!',
		// memo-quiz - Es können auch Triplets, Quartette und mehr gefunden werden müssen
		alleGefunden : 'Alle Sets gefunden!',
		erneut : 'Wie w\u00e4r\'s mit einer neuen Runde?',
		// Multiple-Choice-Quiz
		ergebnisProzent : 'Die Antworten sind zu %n% richtig.',
		// Kreuzworträtsel
		senkrecht : 'Senkrecht',
		waagrecht : 'Waagrecht',
		eintragen : 'eintragen',
		eingabehinweis : 'Benutzen Sie zur Eingabe die Tastatur. Eventuell m\u00fcssen sie zuerst ein Eingabefeld durch Anklicken aktivieren.',
		// Buchstabenraten-Quiz
		eingabehinweis_buchstabenraten : 'Benutzen Sie die Tastatur zur Eingabe! Eventuell m\u00fcssen Sie erst in das Quiz klicken, um es zu aktivieren.',
		quizStarten : 'Quiz starten.',
		gerateneBuchstaben : 'Bereits geratene Buchstaben',
		erkannteWoerter : 'Erkannte W\u00f6rter',
		quizEnde : 'Quiz ist zuende.'
	},

	// englische Meldungen
	en : {
		pruefen : 'check it!',
		lob1 : 'Brilliant!',
		lob2 : 'Well done!',
		lob3 : 'That was nice!',
		ergebnis1 : 'You solved everything on your first try!',
		ergebnis2 : 'You solved everything with only two tries!',
		ergebnis3 : 'You solved everything after trying %n times!',
		// memo-quiz - Es können auch Triplets, Quartette und mehr gefunden werden müssen
		alleGefunden : 'You\'ve found all sets!',
		erneut : 'How about another round?',
		// Multiple-Choice-Quiz
		ergebnisProzent : 'The answers are %n% correct.',
		// Kreuzworträtsel
		senkrecht : 'Vertical',
		waagrecht : 'Horizontal',
		eintragen : 'fill in',
		eingabehinweis : 'Use the keyboard to enter letters. You may need to first activate a box by clicking it.',
		// Buchstabenraten-Quiz
		eingabehinweis_buchstabenraten : 'Use the keyboard to enter letters. You may need to first click somewhere into this quiz in oder to activate it.',
		quizStarten : 'Start quiz.',
		gerateneBuchstaben : 'Already Guessed Characters',
		erkannteWoerter : 'Found Words',
		quizEnde : 'Quiz is over.'
	},

	// spanische Meldungen; mit dankenswerter Unterstützung von Frau Ulrike Weinmann
	es : {
		pruefen : '\u00a1Chequear!',
		lob1 : '\u00a1Muy bien hecho!',
		lob2 : '\u00a1Bien hecho!',
		lob3 : '\u00a1Correcto!',
		ergebnis1 : '\u00a1Resolviste el ejercicio al primer intento!',
		ergebnis2 : '\u00a1Resolviste el ejercicio al segundo intento!',
		ergebnis3 : 'Intentaste resolver el ejercicio %n veces y \u00a1lo lograste!',
		// memo-quiz - Es können auch Triplets, Quartette und mehr gefunden werden müssen
		alleGefunden : '\u00a1Encontraste todos los juegos!',
		erneut : '\u00bfOtra vez?',
		// Multiple-Choice-Quiz
		ergebnisProzent : 'Porcentaje de respuestas correctas: %n%.',
		// Kreuzworträtsel
		senkrecht : 'Vertical',
		waagrecht : 'Horizontal',
		eintragen : 'llenar',
		eingabehinweis : 'Usa el teclado para entrar letras. Quiz\u00e1s tienes que hacer clic en una caja primero para activ\u00e1rla.',
		// Buchstabenraten-Quiz
		eingabehinweis_buchstabenraten : 'Usa el teclado para entrar letras. Quiz\u00e1s tienes que hacer clic en el quiz primero para activ\u00e1rla.',
		quizStarten : 'Empezar quiz.',
		gerateneBuchstaben : 'Letras ya probadas',
		erkannteWoerter : 'Palabras encontradas',
		quizEnde : 'Fin de juego'
	},

	// französische Meldungen; mit dankenswerter Unterstützung von Herrn Otto Ebert
	fr : {
		pruefen : 'verifier!',
		lob1 : 'Excellent! Super!',
		lob2 : 'Bien fait!',
		lob3 : 'Ce n\'\u00e9tait pas mal',
		ergebnis1 : 'Ton essai \u00e9tait tout de suite un succ\u00e8s.',
		ergebnis2 : 'Tu as r\u00e9soulu le devoir apr\u00e8s deux tentatives seulement!',
		ergebnis3 : 'Tu as r\u00e9soulu le devoir apr\u00e8s %n tentatives.',
		// memo-quiz - Es können auch Triplets, Quartette und mehr gefunden werden müssen
		alleGefunden : 'Tu as trouv\u00e9 tous les "sets".',
		erneut : 'Alors tu veux recommencer?',
		// Multiple-Choice-Quiz
		ergebnisProzent : 'Les r\u00e9ponses sont %n% correctes.',
		// Kreuzworträtsel
		senkrecht : 'V\u00e9rtical',
		waagrecht : 'Horizontal',
		eintragen : 'inscrire',
		eingabehinweis : 'Utilisez le clavier pour inscrire des lettres. Vous devez probablement d\'abord activer une bo\u00eete en le claquant.',
		// Buchstabenraten-Quiz
		eingabehinweis_buchstabenraten : 'Utilisez le clavier pour inscrire des lettres. Vous devez probablement d\'abord activer le quiz en le claquant.',
		quizStarten : 'Commencer le quiz.',
		gerateneBuchstaben : 'Lettres d\u00e9j\u00e0 essay\u00e9es',
		erkannteWoerter : 'Mots trouv\u00e9s',
		quizEnde : 'Quiz est finis.'
	},

	// lateinische Meldungen; mit dankenswerter Unterstützung von Herrn Ralf Altgeld und Frau Ulrike Weinmann
	la : {
		pruefen : 'probare',
		lob1 : 'optime!',
		lob2 : 'bene!',
		lob3 : 'Id non male fecisti.',
		ergebnis1 : 'Pensum statim in primo conatu feliciter absolutum est!',
		ergebnis2 : 'Pensum cam post duos conatus feliciter absolutum est.',
		ergebnis3 : 'Pensum cam post %n conatus feliciter absolutum est.',
		// memo-quiz - Es können auch Triplets, Quartette und mehr gefunden werden müssen
		alleGefunden : 'Omnes partes repperisti.',
		erneut : 'Ludum novum vis?',
		// Multiple-Choice-Quiz
		ergebnisProzent : '%n% centesimae responsorum rectae sunt.',
		// Kreuzworträtsel
		senkrecht : 'perpendiculariter',
		waagrecht : 'directe',
		eintragen : 'complere',
		eingabehinweis : 'Utere clavibus ad verba scribenda. Fortasse tibi capsa eligenda est.',
		// Buchstabenraten-Quiz
		eingabehinweis_buchstabenraten : 'Utere clavibus ad verba scribenda. Fortasse tibi aenigma eligendum est.',
		quizStarten : 'Incipere aenigma.',
		gerateneBuchstaben : 'Litterae iam temptatae',
		erkannteWoerter : 'Verba iam reperta',
		quizEnde : 'Factum est.'
	},
	
	// italienische Meldungen; mit dankenswerter Unterstützung von Herrn Ihor Bilaniuk
	it : {
		pruefen : 'controllare!',
		lob1 : 'Ottimo!',
		lob2 : 'Benissimo!',
		lob3 : 'Bene!',
		ergebnis1 : 'Il compito \u00e8 stato risolto al primo passo!',
		ergebnis2 : 'Il compito \u00e8 stato risolto dopo la seconda prova!',
		ergebnis3 : 'Il compito \u00e8 stato risolto dopo %n prove.',
		// memo-quiz - Es können auch Triplets, Quartette und mehr gefunden werden müssen
		alleGefunden : 'Tutti i sets sono stati risolti!',
		erneut : 'Ancora una volta?',
		// Multiple-Choice-Quiz
		ergebnisProzent : 'Le tue risposte sono il %n per cento giuste.',
		// Kreuzworträtsel
		senkrecht : 'Verticale',
		waagrecht : 'Orizontale',
		eintragen : 'inserire',
		eingabehinweis : 'Utilizzi la tastiera per entrare nelle lettere. Potete avere bisogno di in primo luogo di attivare una scatola scattandola.',
		// Buchstabenraten-Quiz
		eingabehinweis_buchstabenraten : 'Utilizzi la tastiera per entrare nelle lettere. Potete avere bisogno di in primo luogo di scattarti in qualche luogo in questo quiz per attivarlo.',
		quizStarten : 'Inizi il quiz.',
		gerateneBuchstaben : 'Lettere gi\u00e0 indovinate',
		erkannteWoerter : 'Parole trovate ',
		quizEnde : 'Il quiz \u00e8 sopra .'
	},
	
	// polnische Meldungen von Pitr Wójs www.merula.pl
	pl : {
		pruefen : 'Sprawdź!',
		lob1 : 'Celująco!',
		lob2 : 'Bardzo dobrze!',
		lob3 : 'Nieźle!',
		ergebnis1 : 'Zadanie rozwiązałaś/łeś poprawnie za pierwszym razem!',
		ergebnis2 : 'Zadanie rozwiązałaś/łeś poprawnie za drugim razem!',
		ergebnis3 : 'Zadanie zostało rozwiązane poprawnie po %n próbach !',
		// memo-quiz - Es können auch Triplets, Quartette und mehr gefunden werden müssen
		alleGefunden : 'Znalazłaś/łeś wszystkie pary!',
		erneut : 'Co powiesz na drugą rundę? Spróbuj jeszcze raz!',
		// Multiple-Choice-Quiz
		ergebnisProzent : 'Odpowiedzi są poprawne w %n procentach.',
		// Kreuzworträtsel
		senkrecht : 'Pionowo',
		waagrecht : 'Poziomo',
		eintragen : 'Wpisz',
		eingabehinweis : 'Aby wpisać rozwiązanie użyj klawiatury. Kliknij pole, aby wprowadzić text!',
		// Buchstabenraten-Quiz
		eingabehinweis_buchstabenraten : 'Aby wpisać rozwiązanie użyj klawiatury. Kliknij pole, aby wprowadzić text!',
		quizStarten : 'Start quizu.',
		gerateneBuchstaben : 'Odgadnięte litery',
		erkannteWoerter : 'Rozpoznane słówka',
		quizEnde : 'Koniec quizu.'
	}
}
