$(document).ready(function () {
    let timer;
    let usuarioDisponible = false;

    // Validación en tiempo real del usuario
    $("input[name='usuario']").on("input", function () {
        clearTimeout(timer);
        const val = $(this).val().trim();
        
        // Limpiar estado anterior
        $("#usuario-status").text("").removeClass('error success');
        $(this).removeClass('error-border');
        usuarioDisponible = false;
        
        // Limpiar mensaje de error de jQuery Validation
        $(this).removeClass('error');
        $(this).next('.error').remove();
        
        if (!val) {
            return;
        }

        if (val.length < 3) {
            $("#usuario-status").text("Mínimo 3 caracteres").removeClass('error success').css('color', 'orange');
            return;
        }

        timer = setTimeout(() => {
            $.get("/check-usuario", { usuario: val })
                .done(res => {
                    if (res.disponible) {
                        $("#usuario-status").text("✓ Disponible").removeClass('error').addClass('success');
                        $(this).removeClass('error-border');
                        usuarioDisponible = true;
                        
                        // Limpiar cualquier error de validación
                        $(this).removeClass('error');
                        $(this).next('.error').remove();
                    } else {
                        $("#usuario-status").text("✗ No disponible").removeClass('success').addClass('error');
                        $(this).addClass('error-border');
                        usuarioDisponible = false;
                        
                        // Forzar error de jQuery Validation
                        $(this).addClass('error');
                        if (!$(this).next('.error').length) {
                            $('<label class="error">Este usuario ya existe</label>')
                                .insertAfter($(this))
                                .css({
                                    color: "#b22222",
                                    fontSize: "0.9em",
                                    marginTop: "5px",
                                    display: "block"
                                });
                        }
                    }
                })
                .fail(() => {
                    $("#usuario-status").text("Error de conexión").removeClass('success error').css('color', 'orange');
                });
        }, 500);
    });

    // Manejar el envío del formulario - prevenir si el usuario no está disponible
    $("#formRegistro").on('submit', function(e) {
        const usuarioInput = $("input[name='usuario']");
        const usuarioVal = usuarioInput.val().trim();
        
        // Si el usuario no está disponible, prevenir el envío
        if (usuarioVal && !usuarioDisponible) {
            e.preventDefault();
            
            // Forzar mostrar el error
            usuarioInput.addClass('error');
            if (!usuarioInput.next('.error').length) {
                $('<label class="error">Este usuario ya existe. Elige otro nombre.</label>')
                    .insertAfter(usuarioInput)
                    .css({
                        color: "#b22222",
                        fontSize: "0.9em",
                        marginTop: "5px",
                        display: "block"
                    });
            }
            
            // Hacer scroll al error
            $('html, body').animate({
                scrollTop: usuarioInput.offset().top - 100
            }, 500);
            
            return false;
        }
        
        // Si pasa todas las validaciones, permitir el envío normal
        // jQuery Validation se encargará del resto
        return true;
    });

    // Limpiar el estado cuando el campo pierde el foco
    $("input[name='usuario']").on('blur', function() {
        const val = $(this).val().trim();
        if (!val) {
            $("#usuario-status").text("").removeClass('error success');
            $(this).removeClass('error-border');
        }
    });
});