<div class="container">
  <div class="row">
    <div class="col-12">
      <h1 class="display-1 mb-4 text-center">
        <?php echo $title ?>
      </h1>
      <div class="list-group list-group-flush">
        <?php foreach ($documents as $document): ?>
            <a href="<?php echo $document['link'] ?>" class="list-group-item list-group-item-action" target="_blank">
              <h2 class="mb-1">
                <?php echo $document['title'] ?>
              </h2>
              <p>
                <?php if ($document['description']): ?>
                  <?php echo $document['description'] ?>
                <?php else: ?>
                  <br>
                <?php endif; ?>
              </p>
            </a>
        <?php endforeach; ?>
      </div>
    </div>
  </div>
</div>
