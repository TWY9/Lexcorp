$(document).ready(function() {
  
  $("header h1").hide().fadeIn(1200);

  
  $("nav a").on("click", function(e) {
    if (this.hash !== "") {
      e.preventDefault();
      const destino = this.hash;
      $("html, body").animate({
        scrollTop: $(destino).offset().top
      }, 800);
    }
  });

  
  $("#servicios ul li").hover(
    function() { $(this).css("background", "#C9A227"); },
    function() { $(this).css("background", "#1B263B"); }
  );
});