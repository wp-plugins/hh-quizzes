<?php
/*
Plugin Name: HH Quizzes
Plugin URI: http://helmut.hirner.at/2012/02/test-2/
Description: Zur einfachen Verwendung des GPL JavaScript-Framewoks gleichen Namens von Felix Riesterer - es ermöglicht das Erstellen verschieder Quiz
Version: 1.2
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
}    
 


add_action( 'wp_enqueue_scripts', 'add_hhquizzes_styles' );

function add_hhquizzes_styles() {
	wp_register_style( 'hh-quizzes', plugins_url( 'hh-quizzes/css/quiz.css' ) );
	wp_enqueue_style( 'hh-quizzes' );
} 


/** Step 2 (from text above). */
add_action( 'admin_menu', 'hh_quizzes_menu' );

/** Step 1. */
function hh_quizzes_menu() {
	add_options_page( 'HH Quizzes Options', 'HH Quizzes', 'manage_options', 'hh-quizzes', 'hh_quizzes_options' );
}

/** Step 3. */
function hh_quizzes_options() {
	if ( !current_user_can( 'manage_options' ) )  {
		wp_die( __( 'You do not have sufficient permissions to access this page.' ) );
	}
	echo '<div class="wrap">';
	echo '<h2>HH Quizzes</h2>';
	echo '<p style="large">Please find examples how to use and also a detailed description on how you include the different types 
of quizzes in an article or a page, at <a href="http://helmut.hirner.at/2012/02/test-2/" target="_blanc">HH Quizzes</a>. <br />
Please use the text mode, not the visual mode in your WP editor to paste the example code in. After that, 
you can easily adjust the code according to your wishes. <br />
Have Fun!</p>';
	echo '</div>';
}
?>
