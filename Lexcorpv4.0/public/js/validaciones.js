
$(document).ready(function() {
  
  $.validator.addMethod("strongPassword", function(value, element) {
    return this.optional(element) || 
      /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/.test(value);
  }, 
  "La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un carácter especial.");

  // ✅ NUEVA REGLA: Validar que el usuario esté disponible
  $.validator.addMethod("usuarioDisponible", function(value, element) {
    // Esta validación se maneja principalmente en registro-check.js
    // Aquí siempre retornamos true y la lógica real está en el otro archivo
    return true;
  }, "Este usuario ya existe. Por favor elige otro nombre.");

  // --- Validación de Login ---
  $("form[action='/login']").validate({
    rules: {
      usuario: "required",
      contrasena: { required: true, minlength: 4 }
    },
    messages: {
      usuario: "Ingresa tu usuario",
      contrasena: {
        required: "Ingresa tu contraseña",
        minlength: "Debe tener al menos 4 caracteres"
      }
    }
  });

  // --- Validación de Registro ---
  $("form[action='/registro']").validate({
    rules: {
      usuario: {
        required: true,
        minlength: 3,
        usuarioDisponible: true // ✅ Nuestra nueva regla
      },
      nombre: "required",
      correo: { 
        required: true, 
        email: true 
      },
      contrasena: { 
        required: true, 
        strongPassword: true 
      }
    },
    messages: {
      usuario: {
        required: "Ingresa tu nombre de usuario",
        minlength: "El usuario debe tener al menos 3 caracteres",
        usuarioDisponible: "Este usuario ya existe. Por favor elige otro nombre."
      },
      nombre: "Ingresa tu nombre completo",
      correo: {
        required: "Ingresa tu correo electrónico",
        email: "Por favor, escribe un correo válido (ejemplo@dominio.com)"
      },
      contrasena: {
        required: "Ingresa una contraseña",
        strongPassword: "Debe tener 8 caracteres, una mayúscula, un número y un caracter especial."
      }
    },
    errorPlacement: function(error, element) {
      // Para el campo usuario, manejamos el error de forma especial
      if (element.attr("name") == "usuario") {
        // Insertar después del span de estado
        error.insertAfter(element.next("#usuario-status"));
      } else {
        // Para otros campos, comportamiento normal
        error.insertAfter(element);
      }
      
      error.css({
        color: "#b22222",
        fontSize: "0.9em",
        marginTop: "5px",
        display: "block"
      });
    },
    highlight: function(element, errorClass, validClass) {
      $(element).addClass('error-border').removeClass(validClass);
    },
    unhighlight: function(element, errorClass, validClass) {
      $(element).removeClass('error-border').addClass(validClass);
    },
    submitHandler: function(form) {
      // ✅ Esto solo se ejecuta cuando TODAS las validaciones pasan
      // Incluyendo nuestra validación personalizada de usuario disponible
      
      // Mostrar estado de carga
      const submitBtn = $(form).find('button[type="submit"]');
      const btnText = submitBtn.find('.btn-text');
      const btnLoading = submitBtn.find('.btn-loading');
      
      btnText.hide();
      btnLoading.show();
      submitBtn.prop('disabled', true);
      
      // Enviar con AJAX para mantener la experiencia fluida
      $.ajax({
        type: 'POST',
        url: '/registro',
        data: $(form).serialize(),
        success: function(response) {
          if (response.success) {
            // Mostrar éxito
            $(".error-message, .success-message").remove();
            const successDiv = $('<div class="success-message"></div>')
              .html('✅ ' + response.message);
            $(".form-actions").prepend(successDiv);
            
            // Deshabilitar formulario
            $(form).find('input, button').prop('disabled', true);
            
            // Redirigir después de 2 segundos
            setTimeout(() => {
              window.location.href = response.redirect || '/';
            }, 2000);
          } else {
            // Mostrar error del servidor
            showServerError(response.message);
            resetButtonState();
          }
        },
        error: function(xhr) {
          let errorMessage = 'Error de conexión. Intenta nuevamente.';
          try {
            const response = JSON.parse(xhr.responseText);
            errorMessage = response.message || errorMessage;
          } catch (e) {
            // Usar mensaje por defecto
          }
          showServerError(errorMessage);
          resetButtonState();
        }
      });

      function resetButtonState() {
        btnText.show();
        btnLoading.hide();
        submitBtn.prop('disabled', false);
      }
      
      function showServerError(message) {
        $(".error-message, .success-message").remove();
        const errorDiv = $('<div class="error-message"></div>')
          .html('❌ ' + message);
        $(".form-actions").prepend(errorDiv);
        
        $('html, body').animate({
          scrollTop: errorDiv.offset().top - 100
        }, 500);
      }
      
      return false; // Prevenir envío normal del formulario
    }
  });

  // (admin) ---
  $("form[action='/agregar_servicio']").validate({
    rules: {
      nombre: "required",
      descripcion: "required",
      costo: { required: true, number: true, min: 1 }
    },
    messages: {
      nombre: "Ingresa un nombre",
      descripcion: "Agrega una descripción",
      costo: "Agrega un costo válido"
    },
    errorPlacement: function(error, element) {
      error.css({
        color: "#b22222",
        fontSize: "0.9em",
        marginTop: "5px"
      });
      error.insertAfter(element);
    }
  });
});