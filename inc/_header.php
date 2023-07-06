<header class="header">
  <nav class="nav content">
    <a class="nav__title" href="/">
      Jorge Ares Pons
    </a>

    <button type="button" class="nav__toggler" js-nav-toggle="main-nav" aria-controls="nav-main" aria-expanded="false" aria-label="Abrir/Cerrar menú">
      <div class="icon-burger">
        <span class="icon-burger__line"></span>
        <span class="icon-burger__line"></span>
        <span class="icon-burger__line"></span>
      </div>
    </button>
    <div class="nav__menu" id="nav-main" js-nav="main-nav">
      <ul class="nav__list" js-nav-content>
        <li class="nav__item">
          <a class="nav__link <?php if ($uri === 'evaluacion-y-acreditacion-apacet') echo 'active'; ?>" <?php if ($uri === 'evaluacion-y-acreditacion-apacet') echo 'aria-current="page"'; ?> href="/evaluacion-y-acreditacion-apacet">
            Evaluación y acreditación. APACET
          </a>
        </li>
        <li class="nav__item">
          <a class="nav__link <?php if ($uri === 'libros-otros') echo 'active'; ?>" <?php if ($uri === 'libros-otros') echo 'aria-current="page"'; ?> href="/libros-otros">
            Libros/Otros
          </a>
        </li>
        <li class="nav__item">
          <a class="nav__link <?php if ($uri === 'universidad-y-pedeciba') echo 'active'; ?>" <?php if ($uri === 'universidad-y-pedeciba') echo 'aria-current="page"'; ?> href="/universidad-y-pedeciba">
            Universidad y PEDECIBA
          </a>
        </li>
        <li class="nav__item">
          <a class="nav__link <?php if ($uri === 'universidad-y-sociedad') echo 'active'; ?>" <?php if ($uri === 'universidad-y-sociedad') echo 'aria-current="page"'; ?> href="/universidad-y-sociedad">
            Universidad y Sociedad
          </a>
        </li>
        <li class="nav__item">
          <a class="nav__link <?php if ($uri === 'universidades-privadas') echo 'active'; ?>" <?php if ($uri === 'universidades-privadas') echo 'aria-current="page"'; ?> href="/universidades-privadas">
            Universidades Privadas
          </a>
        </li>
      </ul>
    </div>
  </nav>
</header>
