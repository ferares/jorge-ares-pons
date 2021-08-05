<?php
require_once('./functions.php');

// Get the URL
$uri = $_SERVER["REQUEST_URI"];
$pos = strrpos($uri,"/");
$url = $_SERVER['DOCUMENT_ROOT'].substr_replace($uri, "/views", $pos, 0).".php";
$uri = substr($uri,$pos);
if ($uri === '/') {
  $uri = "inicio";
  $url = "views/inicio.php";
} else {
  $uri = substr($uri, 1);
}
?>

<!DOCTYPE html>
<html lang='es'>

<?php require_once("./inc/_head.php"); ?>
<body>

<?php require_once("./inc/_header.php"); ?>

<?php require_once($url); ?>

<?php require_once("./inc/_footer.php"); ?>

</body>
</html>
