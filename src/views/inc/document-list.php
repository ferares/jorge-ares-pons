<div class="container mb-4">
  <div class="row">
    <div class="col-12">
      <h1 class="display-1 mb-4 text-center">
        <?php echo $title ?>
      </h1>
      <div class="list-group list-group-flush">
        <?php foreach ($sectionDocuments as $document): ?>
          <?php $documentName = $document['fileName'] ?>
          <div class="list-group-item list-group-item-action">
            <h2 class="mb-1 d-flex justify-content-between">
              <?php echo $document['title'] ?>
              <div class="">
                <a class="btn btn-outline-primary" href='<?php echoDocumentPath("$sectionPath/$documentName") ?>' target="_blank">
                  Leer/Descargar
                </a>
              </div>
            </h2>
            <p>
              <?php if ($document['description']): ?>
                <?php echo $document['description'] ?>
              <?php else: ?>
                <br>
              <?php endif; ?>
            </p>
          </div>
        <?php endforeach; ?>
      </div>
    </div>
  </div>
</div>
