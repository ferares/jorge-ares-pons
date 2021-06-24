<?php if (!isset($active)) $active = 0; ?>

<header class="mb-4">
  <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
    <div class="container-fluid">
      <a class="navbar-brand" href="/">
        Jorge Ares Pons
      </a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#nav-main" aria-controls="nav-main" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="nav-main">
        <ul class="navbar-nav">
          <li class="nav-item">
            <a class="nav-link <?php if ($active === 0) echo 'active'; ?>" <?php if ($active === 0) echo 'aria-current="page"'; ?> href="/">
              Inicio
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link <?php if ($active === 1) echo 'active'; ?>" <?php if ($active === 1) echo 'aria-current="page"'; ?> href="/evaluación-y-acreditación-apacet">
              Evaluación y acreditación. APACET
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link <?php if ($active === 2) echo 'active'; ?>" <?php if ($active === 2) echo 'aria-current="page"'; ?> href="/libros-otros">
              Libros/Otros
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link <?php if ($active === 3) echo 'active'; ?>" <?php if ($active === 3) echo 'aria-current="page"'; ?> href="/universidad-y-pedeciba">
              Universidad y PEDECIBA
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link <?php if ($active === 4) echo 'active'; ?>" <?php if ($active === 4) echo 'aria-current="page"'; ?> href="/universidad-y-sociedad">
              Universidad y Sociedad
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link <?php if ($active === 5) echo 'active'; ?>" <?php if ($active === 5) echo 'aria-current="page"'; ?> href="/universidades-privadas">
              Universidades Privadas
            </a>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</header>
