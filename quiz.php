<?php
/*
Plugin Name: HH Quizzes
Plugin URI: http://helmut.hirner.at/2012/02/test-2/
Description: Zur einfachen Verwendung des GPL JavaScript-Framewoks gleichen Namens von Felix Riesterer - es ermöglicht das Erstellen verschieder Quiz
Version: 3.0
Author: Helmut Hirner
Author URI: http://helmut.hirner.at/
License: GPLv2 or later
*/

/*
This program is free software; you can redistribute it and/or
modify it under the terms of the GNU General Public License
as published by the Free Software Foundation; either version 2
of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
*/

add_action('wp_enqueue_scripts', 'hhquizzes_script'); // For use on the Front end (ie. Theme)


function hhquizzes_script() {
wp_enqueue_script('hhquizzes', plugins_url('hh-quizzes/quiz.js'));
wp_enqueue_script('hhquizzes', plugins_url('hh-quizzes/multilingual.js'));
}    
 


add_action( 'wp_enqueue_scripts', 'add_hhquizzes_styles' );

function add_hhquizzes_styles() {
	wp_register_style( 'hh-quizzes', plugins_url( 'hh-quizzes/css/quiz.css' ) );
	wp_enqueue_style( 'hh-quizzes' );
	wp_register_style( 'hh-quizzesab', plugins_url( 'hh-quizzes/css/anzeige-blocker.css' ) );
	wp_enqueue_style( 'hh-quizzesab' );
} 


add_action( 'admin_menu', 'hh_quizzes_menu' );

function hh_quizzes_menu() {
	add_options_page( 'HH Quizzes Options', 'HH Quizzes', 'manage_options', 'hh-quizzes', 'hh_quizzes_options' );
}

function hh_quizzes_options() {
	if ( !current_user_can( 'manage_options' ) )  {
		wp_die( __( 'You do not have sufficient permissions to access this page.' ) );
	}
	echo '<div class="wrap">';
	echo '<h2>HH Quizzes</h2>';
	echo 'Please use the text mode, not the visual mode in your WP editor to paste the example code in. After that, 
you can easily adjust the code according to your wishes.</p>';
	echo '<p style="large">Please find examples how to use and also a detailed description on how you include the different types 
of quizzes in an article or a page, at <a href="http://helmut.hirner.at/2012/02/test-2/" target="_blank">HH Quizzes</a>, respectively on: </p>';
   echo '<ol>
<li><a href="http://helmut.hirner.at/2014/05/zuordnungs-quiz-paarweise-mit-dragdrop/" target="_blank">Zuordnungs-Quiz (paarweise; mit Drag&amp;Drop)</a>
Matching Quiz (match pairs)</li>
<li><a href="http://helmut.hirner.at/2014/07/zuordnungs-quiz-gruppenweise/" target="_blank">Zuordnungs-Quiz (gruppenweise)</a> 
Matching Quiz (match groups)</li>
<li><a href="http://helmut.hirner.at/2014/05/bilderpuzzle-basierend-auf-dem-lueckentext-quiz/" target="_blank">Bilderpuzzle (basierend auf dem Lückentext-Quiz)</a>
Picture Puzzle (made with the gap fill quiz mechanism)</li>
<li><a href="http://helmut.hirner.at/2014/05/memo-quiz/" target="_blank">Memo-Quiz</a></li>
<li><a href="http://helmut.hirner.at/2014/05/multiple-choice-quiz/" target="_blank">Multiple Choice - Quiz</a></li>
<li><a href="http://helmut.hirner.at/2014/05/schuettelraetsel-quiz-buchstabenweise-mit-eingabefeldern/" target="_blank">Schüttelrätsel-Quiz (buchstabenweise; mit Eingabefeldern)</a>
Word Jumble Quiz</li>
<li><a href="http://helmut.hirner.at/2014/05/kreuzwortraetsel/" target="_blank">Kreuzworträtsel</a>
Crossword Quiz</li>
<li><a href="http://helmut.hirner.at/2014/05/suchsel/" target="_blank">Suchsel</a>
Word Search Puzzle</li>
<li><a href="http://helmut.hirner.at/2014/05/buchstabenraten-hangman/" target="_blank">Buchstabenraten (Hangman)</a>
Wordfind Quiz (Hangman Quiz)</li>
</ol>';
echo 'Mulitlingual Script enabled. Use de,(Deutsch), en (English), es (Español), fr (Français), it (Italiano), 
pl (Polski), la (Latin) with lang ="xx" in the div tag to create a quiz in one of the mentioned languages.';
echo '<p>Have Fun!</p>';
	echo '</div>';
}
?>