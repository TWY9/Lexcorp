// Espera a que el DOM esté listo
$(document).ready(function() {
  // Animación de bienvenida
  $("header h1").hide().fadeIn(1200);

  // Efecto de desplazamiento suave
  $("nav a").on("click", function(e) {
    if (this.hash !== "") {
      e.preventDefault();
      const destino = this.hash;
      $("html, body").animate({
        scrollTop: $(destino).offset().top
      }, 800);
    }
  });

  // Mostrar servicios con efecto
  $("#servicios ul li").hover(
    function() { $(this).css("background", "#C9A227"); },
    function() { $(this).css("background", "#1B263B"); }
  );
});
