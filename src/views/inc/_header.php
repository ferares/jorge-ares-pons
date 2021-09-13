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
            <a class="nav-link <?php if ($uri === 'inicio') echo 'active'; ?>" <?php if ($uri === 'inicio') echo 'aria-current="page"'; ?> href="/">
              Inicio
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link <?php if ($uri === 'evaluacion-y-acreditacion-apacet') echo 'active'; ?>" <?php if ($uri === 'evaluacion-y-acreditacion-apacet') echo 'aria-current="page"'; ?> href="/evaluacion-y-acreditacion-apacet">
              Evaluación y acreditación. APACET
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link <?php if ($uri === 'libros-otros') echo 'active'; ?>" <?php if ($uri === 'libros-otros') echo 'aria-current="page"'; ?> href="/libros-otros">
              Libros/Otros
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link <?php if ($uri === 'universidad-y-pedeciba') echo 'active'; ?>" <?php if ($uri === 'universidad-y-pedeciba') echo 'aria-current="page"'; ?> href="/universidad-y-pedeciba">
              Universidad y PEDECIBA
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link <?php if ($uri === 'universidad-y-sociedad') echo 'active'; ?>" <?php if ($uri === 'universidad-y-sociedad') echo 'aria-current="page"'; ?> href="/universidad-y-sociedad">
              Universidad y Sociedad
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link <?php if ($uri === 'universidades-privadas') echo 'active'; ?>" <?php if ($uri === 'universidades-privadas') echo 'aria-current="page"'; ?> href="/universidades-privadas">
              Universidades Privadas
            </a>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</header>
