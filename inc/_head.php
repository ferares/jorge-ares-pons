<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Jorge Ares Pons, página personal">
  <title>
    <?= 'Jorge Ares Pons'.(isset($title) ? ' | '.$title : '') ?>
  </title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,400;0,700;1,400&family=Playfair+Display:wght@500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="<?= assetPath('styles.css') ?>">
  <script src="<?= assetPath('script.js') ?>"></script>
  <!-- Global site tag (gtag.js) - Google Analytics -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-1ETL6R5H92"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-1ETL6R5H92');
  </script>
</head>
