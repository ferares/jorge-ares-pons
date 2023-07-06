<?php
/**
 * Get a path to a file with hashcode
 * 
 * @param String $filename name of the file
 * 
 * @return String path to the file including its hashcode
 */
function assetPath($filename) {
    $path = $filename;
    $manifestPath = './manifest.json';
    $manifest = json_decode(file_get_contents($manifestPath), true);
    if (($manifest) && (isset($manifest[$filename]))) {
        $path = '/public/'.$manifest[$filename];
    } else {
        $path = '/assets/'.$filename;
    }
    return $path;
}