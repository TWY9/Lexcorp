$(document).ready(function() {
  // --- Método personalizado para contraseñas seguras ---
  $.validator.addMethod("strongPassword", function(value, element) {
    return this.optional(element) || 
      /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/.test(value);
  }, 
  "La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un carácter especial.");

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
      usuario: "required",
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
      usuario: "Ingresa tu nombre de usuario",
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
      error.css({
        color: "#b22222",
        fontSize: "0.9em",
        marginTop: "5px"
      });
      error.insertAfter(element);
    }
  });

  // --- Validación del formulario de servicios (admin) ---
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
