/******************************************************
* Code-Tabelle zum Umformen eingegebener Sonderzeichen
*******************************************************
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

if (!window.Quiz) {
	window.Quiz = new Object();
}

/* Code-Tabelle für Ersetzungen */
Quiz.codeTabelle = {
	A : new Array(
		'\u0041', // a
		'\u0061', // A
		'\u00c0', // À
		'\u00c1', // Á
		'\u00c2', // Â
		'\u00c3', // Ã
		'\u00c5', // Å
		'\u00e0', // à
		'\u00e1', // á
		'\u00e2', // â
		'\u00e3', // ã
		'\u00e5' // å
	),
	AE : new Array(
		'\u00c4', // Ä
		'\u00c6', // Æ
		'\u00e4', // ä
		'\u00e6' // æ
	),
	B : new Array(
		'\u0042', // B
		'\u0062' // b
	),
	C : new Array(
		'\u0043', // C
		'\u0063', // c
		'\u00c7', // Ç
		'\u00e7' // ç
	),
	D : new Array(
		'\u0044', // D
		'\u0064' // d
	),
	E : new Array(
		'\u0045', // E
		'\u0065', // e
		'\u00c8', // È
		'\u00c9', // É
		'\u00ca', // Ê
		'\u00cb', // Ë
		'\u00e8', // è
		'\u00e9', // é
		'\u00ea', // ê
		'\u00eb' // ë
	),
	F : new Array(
		'\u0046', // F
		'\u0066' // f
	),
	G : new Array(
		'\u0047', // G
		'\u0067' // g
	),
	H : new Array(
		'\u0048', // H
		'\u0068' // h
	),
	I : new Array(
		'\u0049', // I
		'\u0069', // i
		'\u00cc', // Ì
		'\u00cd', // Í
		'\u00ce', // Î
		'\u00cf', // Ï
		'\u00ec', // ì
		'\u00ed', // í
		'\u00ee', // î
		'\u00ef' // ï
	),
	J : new Array(
		'\u004a', // J
		'\u006a' // j
	),
	K : new Array(
		'\u004b', // K
		'\u006b' // k
	),
	L : new Array(
		'\u004c', // L
		'\u006c' // l
	),
	M : new Array(
		'\u004d', // M
		'\u006d' // m
	),
	N : new Array(
		'\u004e', // N
		'\u006e', // n
		'\u00d1', // Ñ
		'\u00f1' // ñ
	),
	O : new Array(
		'\u004f', // O
		'\u006f', // o
		'\u00d2', // Ò
		'\u00d3', // Ó
		'\u00d4', // Ô
		'\u00d5', // Õ
		'\u00f2', // ò
		'\u00f3', // ó
		'\u00f4', // ô
		'\u00f5' // õ
	),
	OE : new Array(
		'\u00d6', // Ö
		'\u00f6' // ö
	),
	P : new Array(
		'\u0050', // P
		'\u0070' // p
	),
	Q : new Array(
		'\u0051', // Q
		'\u0071' // q
	),
	R : new Array(
		'\u0052', // R
		'\u0072' // r
	),
	S : new Array(
		'\u0053', // S
		'\u0073' // s
	),
	SS : new Array(
		'\u00df' // ß
	),
	T : new Array(
		'\u0054', // T
		'\u0074' // t
	),
	U : new Array(
		'\u0055', // U
		'\u0075', // u
		'\u00d9', // Ù
		'\u00da', // Ú
		'\u00db', // Û
		'\u00f9', // ù
		'\u00fa', // ú
		'\u00fb' // û
	),
	UE : new Array(
		'\u00dc', // Ü
		'\u00fc' // ü
	),
	V : new Array(
		'\u0056', // V
		'\u0076' // v
	),
	W : new Array(
		'\u0057', // W
		'\u0077' // w
	),
	X : new Array(
		'\u0058', // X
		'\u0078' // x
	),
	Y : new Array(
		'\u0059', // Y
		'\u0079', // y
		'\u00dd', // Ý
		'\u00fd' // ý
	),
	Z : new Array(
		'\u005a', // Z
		'\u007a' // z
	)
};
