<div class="document-list content page">
  <h1 class="title-main">
    <?php echo $title ?>
  </h1>
  <ul class="document-list__list">
    <?php foreach ($sectionDocuments as $document): ?>
      <?php $documentName = $document['fileName'] ?>
      <li class="document-list__item">
        <div class="document-list__item__content">
          <img class="document-list__item__img" src="<?= assetPath('icons/document.svg') ?>" alt="">
          <div class="docuemnt-list__item__texts">
            <h2 class="document-list__item__title">
              <?php echo $document['title'] ?>
            </h2>
            <p class="document-list__item__description">
              <?php if ($document['description']): ?>
                <?php echo $document['description'] ?>
              <?php else: ?>
                <br>
              <?php endif; ?>
            </p>
          </div>
        </div>
        <a class="btn document-list__item__link" href='<?= assetPath("documents/$sectionPath/$documentName") ?>' target="_blank">
          Descargar
        </a>
      </li>
    <?php endforeach; ?>
  </ul>
</div>
