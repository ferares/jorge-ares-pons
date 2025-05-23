<div class="document-list content page">
  <h1 class="title-main">
    <?php echo $title ?>
  </h1>
  <ul class="document-list__list">
    <?php foreach ($sectionDocuments as $document): ?>
      <?php $documentName = $document['fileName'] ?>
      <li class="document-list__item">
        <?php if ($document['new']): ?>
          <span class="document-list__item__badge">
            Nuevo
          </span>
        <?php endif; ?>
        <div class="document-list__item__content">
          <img class="document-list__item__img" src="<?= assetPath('icons/document.svg') ?>" alt="">
          <div class="docuemnt-list__item__texts">
            <h2 class="document-list__item__title">
              <?php echo $document['title'] ?>
            </h2>
            <p class="document-list__item__description">
              <?php if ($document['description']): ?>
                <?php echo $document['description'] ?>
              <?php endif; ?>
            </p>
            <div class="document-list__item__date">
              <?php if ($document['date']): ?>
                <img class="document-list__date__img" src="<?= assetPath('icons/calendar.png') ?>" alt="">
                <span>
                  <?php echo $document['date'] ?>
                </span>
              <?php endif; ?>
            </div>
          </div>
        </div>
        <a class="btn document-list__item__link" href='<?= assetPath("documents/$sectionPath/$documentName") ?>' target="_blank">
          Descargar
        </a>
      </li>
    <?php endforeach; ?>
  </ul>
</div>
